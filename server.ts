import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback message generator for offline / without key
const fallbackMessages: Record<string, string[]> = {
  romance: [
    "Cada pétala deste arranjo carrega um pedacinho do meu amor por você. Que o seu dia seja tão radiante e especial quanto o seu sorriso.",
    "Para a pessoa que transforma meus dias comuns em momentos inesquecíveis. Amo você mais a cada dia!",
    "Flores para a flor mais linda do meu jardim. Você é o meu maior presente e minha inspiração constante.",
  ],
  aniversario: [
    "Que este novo ciclo floresça em saúde, realizações e muita felicidade! Parabéns pelo seu dia especial!",
    "Celebrar a sua vida é um privilégio. Que seu novo ano seja repleto de momentos doces e cheios de cor!",
    "Desejo que a vida te reserve sempre os caminhos mais floridos e alegres. Feliz Aniversário com todo carinho!",
  ],
  agradecimento: [
    "Minha sincera gratidão por todo apoio, carinho e dedicação. Sua gentileza faz toda a diferença no mundo!",
    "Um gesto de carinho para expressar o quanto sua ajuda foi essencial. Muito obrigado por ser tão incrível!",
    "Agradecer é pouco perto de tudo que você fez. Receba estas flores como símbolo do meu mais profundo respeito e apreço.",
  ],
  condolencias: [
    "Nossos sinceros sentimentos e votos de conforto e paz para você e toda a família neste momento delicado.",
    "Que as memórias de amor e afeto tragam consolo ao seu coração. Estamos com você em oração e pensamento.",
    "Com nosso profundo pesar e respeito. Que o tempo traga serenidade para superar essa perda irreparável.",
  ],
  maternidade: [
    "Bem-vindo(a) ao mundo, pequeno anjo! Que a vida dessa nova família seja abençoada com saúde, amor e muita doçura.",
    "Parabéns aos novos papais! Que a chegada deste bebê ilumine ainda mais o lar e o coração de vocês.",
  ],
  desculpas: [
    "Errar faz parte, mas reconhecer e pedir seu perdão é o que meu coração mais deseja. Me perdoe com carinho?",
    "Não suporto ficar distante de você. Que estas flores abram caminho para nossa reconciliação com muito afeto.",
  ],
};

// API Endpoint for syncing orders directly from Google Sheets / Apps Script Webhook
app.post("/api/sync-sheets", async (req, res) => {
  try {
    const { url, spreadsheetId, folderUrl } = req.body;
    let target = (url || "").trim();
    const sheetId = (spreadsheetId || "").trim();
    const folder = (folderUrl || "").trim();

    // If target is empty, try folderUrl or spreadsheetId
    if (!target) {
      if (folder && folder.includes("spreadsheets")) {
        target = folder;
      } else if (sheetId) {
        target = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
    }

    if (!target && !sheetId) {
      return res.status(400).json({
        success: false,
        error: "Informe a URL do Webhook do Google Apps Script ou o Link da Planilha do Google Sheets nas configurações.",
      });
    }

    // Helper to extract Google Sheet ID
    const extractSheetId = (str: string): string | null => {
      const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    };

    const directSheetId = extractSheetId(target) || extractSheetId(folder) || (sheetId && !sheetId.startsWith("http") ? sheetId : null);

    // Strategy 1: If it is a Google Apps Script Web App URL
    if (target.includes("script.google.com")) {
      let scriptUrl = target;
      if (!scriptUrl.includes("_t=")) {
        const sep = scriptUrl.includes("?") ? "&" : "?";
        scriptUrl = `${scriptUrl}${sep}_t=${Date.now()}`;
      }

      // 1A: Try GET request
      try {
        const getRes = await fetch(scriptUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          redirect: "follow",
        });

        if (getRes.ok) {
          const text = await getRes.text();
          if (!text.includes("accounts.google.com") && !text.includes("ServiceLogin")) {
            try {
              const jsonData = JSON.parse(text);
              if (jsonData && Array.isArray(jsonData.orders)) {
                return res.json({ success: true, orders: jsonData.orders, count: jsonData.orders.length });
              } else if (Array.isArray(jsonData)) {
                return res.json({ success: true, orders: jsonData, count: jsonData.length });
              }
            } catch {
              // Not JSON, continue to POST attempt
            }
          }
        }
      } catch (getErr) {
        console.warn("GET to Apps Script failed, trying POST fallback:", getErr);
      }

      // 1B: Try POST request with action: 'getOrders'
      try {
        const postRes = await fetch(target, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          body: JSON.stringify({ action: "getOrders", method: "list" }),
          redirect: "follow",
        });

        if (postRes.ok) {
          const text = await postRes.text();
          if (!text.includes("accounts.google.com") && !text.includes("ServiceLogin")) {
            try {
              const jsonData = JSON.parse(text);
              if (jsonData && Array.isArray(jsonData.orders)) {
                return res.json({ success: true, orders: jsonData.orders, count: jsonData.orders.length });
              } else if (Array.isArray(jsonData)) {
                return res.json({ success: true, orders: jsonData, count: jsonData.length });
              }
            } catch {
              // Not JSON
            }
          }
        }
      } catch (postErr) {
        console.warn("POST to Apps Script failed:", postErr);
      }
    }

    // Strategy 2: If we have a Google Sheet ID, fetch direct CSV export (no Apps Script needed!)
    if (directSheetId) {
      const csvUrls = [
        `https://docs.google.com/spreadsheets/d/${directSheetId}/export?format=csv&id=${directSheetId}`,
        `https://docs.google.com/spreadsheets/d/${directSheetId}/gviz/tq?tqx=out:csv`,
      ];

      for (const csvUrl of csvUrls) {
        try {
          const csvRes = await fetch(csvUrl, {
            method: "GET",
            headers: {
              "Accept": "text/csv, text/plain, */*",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            redirect: "follow",
          });

          if (csvRes.ok) {
            const csvText = await csvRes.text();
            if (
              !csvText.includes("accounts.google.com") &&
              !csvText.includes("ServiceLogin") &&
              csvText.trim().length > 10
            ) {
              return res.json({
                success: true,
                rawCSV: csvText,
                source: "google_sheets_csv",
              });
            }
          }
        } catch (csvErr) {
          console.warn(`Failed fetching CSV from ${csvUrl}:`, csvErr);
        }
      }
    }

    // If target is an Apps Script and failed, return specific guidance
    if (target.includes("script.google.com")) {
      return res.json({
        success: false,
        error:
          "O Google Apps Script não retornou os dados dos pedidos. Certifique-se de que o código no Apps Script contém a função 'doGet' e 'doPost' atualizadas e que a Implantação foi criada como 'Qualquer pessoa' (Anyone). Você também pode colar o link direto da sua Planilha Google Sheets para sincronização instantânea.",
      });
    }

    return res.json({
      success: false,
      error: "Não foi possível carregar a planilha. Verifique se o link está correto e se o compartilhamento está como 'Qualquer pessoa com o link'.",
    });
  } catch (err: any) {
    console.error("Error in /api/sync-sheets:", err);
    return res.status(500).json({
      success: false,
      error: `Erro ao conectar com a planilha: ${err.message || "Erro desconhecido"}`,
    });
  }
});

// API Endpoint for generating romantic/personalized card dedication
app.post("/api/generate-card-message", async (req, res) => {
  try {
    const { occasion, recipientName, tone, relationship, additionalNotes } = req.body;

    const ai = getAIClient();

    if (ai) {
      const prompt = `Você é um redator especialista em mensagens para cartões de floricultura e presentes de luxo.
Crie uma dedicatória tocante, emocionante e de bom gosto para acompanhar a entrega de flores.

Dados do pedido:
- Ocasião: ${occasion || "Geral"}
- Nome do Destinatário: ${recipientName || "Alguém especial"}
- Tom desejado: ${tone || "Carinhoso e Afetuoso"}
- Relação: ${relationship || "Especial"}
- Detalhes adicionais: ${additionalNotes || "Nenhum"}

Regras:
1. Retorne apenas 3 opções variadas de mensagens (curta, média e poética).
2. Não use introduções como "Aqui estão as mensagens".
3. Formate como JSON com um array chamado "messages" contendo strings.
Exemplo: {"messages": ["Opção 1...", "Opção 2...", "Opção 3..."]}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "";
      try {
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          return res.json({ success: true, messages: parsed.messages });
        }
      } catch (err) {
        console.warn("JSON parse error from Gemini, using fallback cleaner", err);
      }
    }

    // Fallback if no API key or on parse fallback
    const key = (occasion || "romance").toLowerCase();
    const matches = fallbackMessages[key] || fallbackMessages.romance;
    const personalized = matches.map((msg) =>
      recipientName ? msg.replace("você", recipientName) : msg
    );

    return res.json({
      success: true,
      messages: personalized,
      isFallback: !ai,
    });
  } catch (error: any) {
    console.error("Error generating card message:", error);
    return res.status(500).json({
      success: false,
      error: "Falha ao gerar mensagem com IA.",
      messages: fallbackMessages.romance,
    });
  }
});

// API route: Mock CEP calculator with realistic Brazilian city and shift availability
app.post("/api/check-cep", (req, res) => {
  const { cep } = req.body;
  const cleanCep = (cep || "").replace(/\D/g, "");

  if (!cleanCep || cleanCep.length < 8) {
    return res.status(400).json({ error: "CEP inválido. Digite 8 dígitos." });
  }

  // Realistic city routing
  let city = "São Paulo";
  let state = "SP";
  let neighborhood = "Centro";
  let deliveryFee = 0; // Free delivery default promotion
  let sameDayAvailable = true;

  const prefix = parseInt(cleanCep.substring(0, 2), 10);
  if (prefix >= 1 && prefix <= 19) {
    city = "São Paulo";
    state = "SP";
    neighborhood = "Jardins / Região Central";
    deliveryFee = 0;
  } else if (prefix >= 20 && prefix <= 28) {
    city = "Rio de Janeiro";
    state = "RJ";
    neighborhood = "Copacabana / Zona Sul";
    deliveryFee = 0;
  } else if (prefix >= 30 && prefix <= 39) {
    city = "Belo Horizonte";
    state = "MG";
    neighborhood = "Savassi / Centro-Sul";
    deliveryFee = 0;
  } else if (prefix >= 80 && prefix <= 87) {
    city = "Curitiba";
    state = "PR";
    neighborhood = "Batel / Centro";
    deliveryFee = 0;
  } else if (prefix >= 90 && prefix <= 99) {
    city = "Porto Alegre";
    state = "RS";
    neighborhood = "Moinhos de Vento";
    deliveryFee = 0;
  } else if (prefix >= 40 && prefix <= 48) {
    city = "Salvador";
    state = "BA";
    neighborhood = "Pituba";
    deliveryFee = 9.9;
  } else if (prefix >= 70 && prefix <= 73) {
    city = "Brasília";
    state = "DF";
    neighborhood = "Asa Sul";
    deliveryFee = 0;
  } else {
    city = "Região Metropolitana";
    state = "BR";
    neighborhood = "Atendimento Local Parceiro";
    deliveryFee = 14.9;
  }

  return res.json({
    success: true,
    cep: cleanCep,
    city,
    state,
    neighborhood,
    deliveryFee,
    sameDayAvailable,
    shifts: [
      { id: "morning", name: "Manhã (08h às 12h)", available: true, extra: 0 },
      { id: "afternoon", name: "Tarde (13h às 18h)", available: true, extra: 0 },
      { id: "night", name: "Noite (18h às 21h)", available: true, extra: 9.9 },
      { id: "express", name: "Expresso (em até 2 horas)", available: true, extra: 19.9 },
    ],
  });
});

// API Endpoint for AI Catalog Extraction from PDF / Images
app.post("/api/ai-extract-catalog", async (req, res) => {
  try {
    const { fileData, fileMimeType, fileName, customInstructions, includePrices = true } = req.body;

    if (!fileData) {
      return res.status(400).json({
        success: false,
        error: "Nenhum arquivo enviado. Por favor, anexe um PDF ou imagem do catálogo.",
      });
    }

    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({
        success: false,
        error:
          "Chave da API Gemini não configurada no servidor. Por favor, configure GEMINI_API_KEY no painel de configurações.",
      });
    }

    // Clean base64 prefix if present (e.g. data:application/pdf;base64,...)
    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
    const mimeType = fileMimeType || "application/pdf";

    const pricingDirective = includePrices
      ? "Extraia os preços fiéis informados no catálogo em Reais (BRL). Se não houver preço ou estiver sob consulta, defina price: 0 e isPriceOnDemand: true."
      : "ATENÇÃO OBRIGATÓRIA: O usuário optou por NÃO importar preços/valores (apenas fotos, títulos e descrições). Defina 'price': 0 e 'isPriceOnDemand': true para TODOS os produtos.";

    const prompt = `Você é um Agente IA especialista em catálogo digital e e-commerce para floriculturas e presentes finos.
Analise detalhadamente este arquivo de catálogo anexado (${fileName || "catálogo"}).

Sua missão:
1. Extraia e identifique TODOS os produtos, arranjos, buquês, cestas, kits de presentes e flores do documento.
2. Para cada produto:
   - "name": Nome claro, elegante e comercial do produto (ex: "Buquê Luxo 12 Rosas Vermelhas", "Cesta de Café da Manhã Supreme", "Orquídea Phalaenopsis Branca em Vaso").
   - "category": ID da categoria em minúsculas e sem acentos (ex: "buques", "rosas", "cestas", "orquideas", "arranjos", "girassois", "lirios", "kits").
   - "categoryName": Nome legível da categoria (ex: "Buquês de Rosas", "Cestas Especiais", "Orquídeas Nobres", "Arranjos").
   - "description": Descrição encantadora, detalhada e vendedora com os itens que compõem o arranjo, flores, folhagens e embalagem.
   - "price": ${includePrices ? "Preço numérico em Reais (BRL, ponto como separador decimal). Se no catálogo estiver sob consulta ou não tiver preço, retorne 0." : "0 (zero)"}
   - "isPriceOnDemand": ${includePrices ? "booleano. Verdadeiro se o item for sob consulta ou sem preço fixo declarado." : "true"}
   - "flowerType": Lista de tipos de flores presentes (ex: ["rosas", "girassol", "lirios", "orquideas", "astromelias", "gérberas", "folhagens"]).
   - "occasion": Lista de ocasiões recomendadas (ex: ["romance", "aniversario", "agradecimento", "maternidade", "condolencias", "parabens"]).
   - "tags": Tags de destaque (ex: ["Mais Vendido", "Flores Nobres", "Artesanal", "Entrega Rápida", "Vaso Incluso"]).
   - "prepTimeMinutes": Tempo estimado de preparo em minutos (ex: 30, 45, 60).
   - "itemsIncluded": Lista de itens incluídos no arranjo (ex: ["12 Rosas Vermelhas Selecionadas", "Embalagem Kraft com Laço de Cetim", "Cartão Dedicatória"]).
   - "suggestedImageKeyword": Palavra-chave em inglês para buscar uma foto perfeita de floricultura caso a foto do PDF não seja extraída (ex: "red roses bouquet luxury", "sunflowers basket", "white orchid ceramic pot", "breakfast gift basket flowers").

3. Extraia todas as categorias únicas encontradas:
   - "id": Identificador em slug (ex: "buques", "cestas", "orquideas").
   - "name": Nome de exibição da categoria.
   - "icon": Um emoji temático adequado (ex: "🌹", "🧺", "🪴", "🌻", "💐", "🌸", "🍫").
   - "description": Frase explicativa da categoria.

Diretriz de preços: ${pricingDirective}
${customInstructions ? `Instruções adicionais fornecidas pelo lojista: "${customInstructions}"` : ""}

Retorne estritamente um JSON no formato:
{
  "catalogTitle": "Nome ou título identificado do catálogo",
  "categories": [
    {
      "id": "buques",
      "name": "Buquês",
      "icon": "🌹",
      "description": "Buquês de rosas e flores nobres para encantar"
    }
  ],
  "products": [
    {
      "name": "Nome do Produto",
      "category": "buques",
      "categoryName": "Buquês",
      "description": "Descrição rica do produto...",
      "price": ${includePrices ? "149.90" : "0"},
      "isPriceOnDemand": ${includePrices ? "false" : "true"},
      "flowerType": ["rosas"],
      "occasion": ["romance", "aniversario"],
      "tags": ["Mais Vendido", "Flores Nobres"],
      "prepTimeMinutes": 30,
      "itemsIncluded": ["12 Rosas Vermelhas", "Embalagem Premium"],
      "suggestedImageKeyword": "red roses bouquet luxury"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "";
    let parsedData: any = {};

    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("JSON parse error from Gemini:", parseErr);
      return res.status(500).json({
        success: false,
        error: "Não foi possível interpretar a resposta estruturada da IA. Tente novamente.",
      });
    }

    // Process and enrich extracted products
    const defaultFlowerImages: Record<string, string> = {
      roses: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=800&auto=format&fit=crop",
      red_roses: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=800&auto=format&fit=crop",
      sunflower: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=800&auto=format&fit=crop",
      orchid: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=800&auto=format&fit=crop",
      basket: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=800&auto=format&fit=crop",
      lily: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=800&auto=format&fit=crop",
      mixed: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
      flowers: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop",
    };

    const categories = Array.isArray(parsedData.categories) ? parsedData.categories : [];
    const rawProducts = Array.isArray(parsedData.products) ? parsedData.products : [];

    const processedProducts = rawProducts.map((item: any, idx: number) => {
      const slug = (item.name || `produto-${idx + 1}`)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const catSlug = (item.category || "geral")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Select nice image based on flower type or keyword
      let chosenImage = defaultFlowerImages.flowers;
      const lowerName = (item.name || "").toLowerCase();
      const lowerKeyword = (item.suggestedImageKeyword || "").toLowerCase();

      if (lowerName.includes("rosa") || lowerKeyword.includes("rose")) {
        chosenImage = defaultFlowerImages.red_roses;
      } else if (lowerName.includes("girassol") || lowerKeyword.includes("sunflower")) {
        chosenImage = defaultFlowerImages.sunflower;
      } else if (lowerName.includes("orquídea") || lowerName.includes("orquidea") || lowerKeyword.includes("orchid")) {
        chosenImage = defaultFlowerImages.orchid;
      } else if (lowerName.includes("cesta") || lowerKeyword.includes("basket")) {
        chosenImage = defaultFlowerImages.basket;
      } else if (lowerName.includes("lírio") || lowerName.includes("lirio") || lowerKeyword.includes("lily")) {
        chosenImage = defaultFlowerImages.lily;
      } else if (lowerName.includes("buquê") || lowerName.includes("buque") || lowerKeyword.includes("bouquet")) {
        chosenImage = defaultFlowerImages.mixed;
      }

      const isPriceZeroOrOnDemand = !includePrices || Boolean(item.isPriceOnDemand || !item.price || item.price === 0);
      const calculatedPrice = !includePrices ? 0 : (typeof item.price === "number" && !isNaN(item.price) ? Math.max(0, item.price) : 0);

      return {
        id: `ai-extracted-${slug}-${Date.now()}-${idx}`,
        name: item.name || `Arranjo Especial ${idx + 1}`,
        slug: slug || `item-${idx + 1}`,
        category: catSlug || "geral",
        occasion: Array.isArray(item.occasion) && item.occasion.length > 0 ? item.occasion : ["aniversario", "romance"],
        flowerType: Array.isArray(item.flowerType) && item.flowerType.length > 0 ? item.flowerType : ["rosas"],
        price: calculatedPrice,
        isPriceOnDemand: isPriceZeroOrOnDemand,
        imageUrl: chosenImage,
        description: item.description || "Lindo arranjo floral confeccionado artesanalmente com flores frescas selecionadas.",
        details: {
          height: "35 cm",
          width: "25 cm",
          durability: "5 a 8 dias com água fresca",
          itemsIncluded: Array.isArray(item.itemsIncluded) && item.itemsIncluded.length > 0
            ? item.itemsIncluded
            : ["Flores frescas selecionadas", "Embalagem artesanal com laço"],
          careInstructions: "Mantenha em local fresco e arejado, longe do sol direto. Troque a água a cada dois dias.",
        },
        tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ["Flores Frescas", "Artesanal"],
        rating: 5,
        reviewCount: Math.floor(Math.random() * 15) + 5,
        orderCount: Math.floor(Math.random() * 20) + 1,
        inStock: true,
      };
    });

    const processedCategories = categories.map((cat: any) => {
      const slug = (cat.id || cat.name || "categoria")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      return {
        id: slug,
        name: cat.name || slug,
        slug: slug,
        icon: cat.icon || "🌸",
        description: cat.description || `Produtos e arranjos da categoria ${cat.name || slug}`,
        active: true,
      };
    });

    return res.json({
      success: true,
      catalogTitle: parsedData.catalogTitle || fileName,
      categoriesCount: processedCategories.length,
      productsCount: processedProducts.length,
      categories: processedCategories,
      products: processedProducts,
    });
  } catch (error: any) {
    console.error("Error in /api/ai-extract-catalog:", error);
    return res.status(500).json({
      success: false,
      error: `Erro ao processar catálogo com IA: ${error.message || "Erro desconhecido"}`,
    });
  }
});

// Global Express error handler ensuring JSON responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error Caught:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || "Erro interno ao processar requisição no servidor.",
  });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Floricultura e-commerce server running on http://localhost:${PORT}`);
  });
}

start();
