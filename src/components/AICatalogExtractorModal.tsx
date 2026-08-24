import React, { useState, useRef } from "react";
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  Edit3,
  Layers,
  ShoppingBag,
  FolderTree,
  ChevronRight,
  Eye,
  Check,
  RefreshCw,
  Info,
  Image as ImageIcon,
  Camera,
  Upload
} from "lucide-react";
import confetti from "canvas-confetti";
import { Product, Category } from "../types";
import { compressImageFile } from "../utils/imageUtils";

interface AICatalogExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (products: Product[], categories: Category[], replaceMode: boolean) => void;
  currentProductsCount: number;
}

export const AICatalogExtractorModal: React.FC<AICatalogExtractorModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentProductsCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [includePrices, setIncludePrices] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted Results
  const [extractedData, setExtractedData] = useState<{
    catalogTitle: string;
    products: Product[];
    categories: Category[];
  } | null>(null);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [replaceMode, setReplaceMode] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<"products" | "categories">("products");
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    price: number;
    isPriceOnDemand: boolean;
    category: string;
    imageUrl: string;
  } | null>(null);
  const [inlineUploadLoading, setInlineUploadLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  const handleInlineImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    try {
      setInlineUploadLoading(true);
      const compressed = await compressImageFile(file, 1200, 1200, 0.85);
      setEditingItem({
        ...editingItem,
        imageUrl: compressed,
      });
    } catch (err: any) {
      alert(err?.message || "Erro ao processar imagem.");
    } finally {
      setInlineUploadLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processSelectedFile(dropped);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setErrorMessage(null);
    setFile(selectedFile);
    const isFilePdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    setIsPdf(isFilePdf);

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleStartExtraction = async () => {
    if (!file || !filePreview) {
      setErrorMessage("Por favor, selecione um arquivo PDF ou imagem do catálogo.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStage(1);

    const stageTimer1 = setTimeout(() => setProcessingStage(2), 2000);
    const stageTimer2 = setTimeout(() => setProcessingStage(3), 5500);
    const stageTimer3 = setTimeout(() => setProcessingStage(4), 9000);

    try {
      const response = await fetch("/api/ai-extract-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: filePreview,
          fileMimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
          fileName: file.name,
          includePrices: includePrices,
          customInstructions: customPrompt.trim(),
        }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);

      const rawText = await response.text();
      let result: any;

      try {
        result = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error("Non-JSON response from server:", rawText.slice(0, 300));
        if (response.status === 413 || rawText.includes("Payload Too Large") || rawText.includes("entity too large")) {
          throw new Error("O arquivo anexado é muito pesado para o servidor. Tente enviar uma imagem ou um PDF com menos páginas.");
        }
        throw new Error(
          "Não foi possível processar a resposta do servidor. Se o PDF contiver muitas páginas ou alta resolução, tente enviar em partes ou formato de imagem."
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erro ao extrair dados do catálogo com IA.");
      }

      let products: Product[] = result.products || [];
      const categories: Category[] = result.categories || [];

      if (products.length === 0) {
        throw new Error("Nenhum produto foi identificado no documento. Verifique se o arquivo contém fotos ou descrições legíveis.");
      }

      // If user opted to NOT include prices, enforce zero price and on-demand status
      if (!includePrices) {
        products = products.map((p) => ({
          ...p,
          price: 0,
          isPriceOnDemand: true,
        }));
      }

      setExtractedData({
        catalogTitle: result.catalogTitle || file.name.replace(/\.[^/.]+$/, ""),
        products,
        categories,
      });

      // Select all products by default
      const allIds = new Set(products.map((p) => p.id));
      setSelectedProductIds(allIds);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorMessage(err.message || "Ocorreu um erro ao processar o arquivo.");
    } finally {
      setIsProcessing(false);
      setProcessingStage(0);
    }
  };

  const toggleSelectProduct = (id: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  const selectAllProducts = () => {
    if (!extractedData) return;
    if (selectedProductIds.size === extractedData.products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(extractedData.products.map((p) => p.id)));
    }
  };

  // Bulk toggle prices in review
  const handleBulkTogglePrices = (onDemandOnly: boolean) => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      products: extractedData.products.map((p) => ({
        ...p,
        isPriceOnDemand: onDemandOnly,
        price: onDemandOnly ? 0 : p.price || 149.9,
      })),
    });
  };

  const handleSaveInlineEdit = () => {
    if (!editingItem || !extractedData) return;
    setExtractedData({
      ...extractedData,
      products: extractedData.products.map((p) =>
        p.id === editingItem.id
          ? {
              ...p,
              name: editingItem.name,
              price: editingItem.isPriceOnDemand ? 0 : editingItem.price,
              isPriceOnDemand: editingItem.isPriceOnDemand,
              category: editingItem.category,
              imageUrl: editingItem.imageUrl || p.imageUrl,
            }
          : p
      ),
    });
    setEditingItem(null);
  };

  const handleConfirmImport = () => {
    if (!extractedData) return;

    const itemsToImport = extractedData.products.filter((p) => selectedProductIds.has(p.id));
    if (itemsToImport.length === 0) {
      alert("Selecione ao menos 1 produto para importar.");
      return;
    }

    onImportSuccess(itemsToImport, extractedData.categories, replaceMode);
    onClose();
  };

  const stagesMessages = [
    "Iniciando conexão com Agente IA...",
    "Lendo e analisando páginas do PDF com visão computacional...",
    "Identificando arranjos florais, buquês, composições e preços...",
    "Extraindo categorias temáticas e gerando descrições enriquecidas...",
    "Finalizando estrutura de dados e montando catálogo...",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="ai-catalog-extractor-modal"
        className="bg-white rounded-3xl max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#114b30] to-[#0d3b25] text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg sm:text-xl text-white">
                  Agente IA: Importador Automático de Catálogo
                </h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
                  Gemini 3.7 Vision
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Anexe seu PDF ou fotos do catálogo para extrair fotos, descrições, preços e montar tudo em segundos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-stone-50/50">
          {/* STEP 1: Upload and Configuration (when not extracted yet) */}
          {!extractedData && (
            <div className="space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  file
                    ? "border-emerald-500 bg-emerald-50/40"
                    : "border-stone-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#114b30] flex items-center justify-center mx-auto border border-emerald-200">
                      {isPdf ? <FileText className="w-7 h-7" /> : <ImageIcon className="w-7 h-7" />}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">{file.name}</h4>
                      <p className="text-xs text-stone-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {isPdf ? "Documento PDF" : "Imagem"} • Pronto para processar
                      </p>
                    </div>
                    <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
                      Clique ou arraste outro arquivo para trocar
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mx-auto border border-stone-200">
                      <UploadCloud className="w-7 h-7 text-[#114b30]" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                        Arraste e solte o seu PDF de catálogo aqui
                      </h4>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        Suporta arquivos <strong>PDF</strong>, ou imagens <strong>PNG / JPG</strong> do seu catálogo floral.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors shadow-2xs mt-2"
                    >
                      Selecionar Arquivo do Computador/Celular
                    </button>
                  </div>
                )}
              </div>

              {/* Price Option Selector */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏷️</span>
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Importar Preços / Valores do Catálogo?
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {includePrices ? "Preços Ativos" : "Apenas Fotos & Descrições"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                      includePrices
                        ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-stone-50 border-stone-200 hover:bg-stone-100/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={includePrices}
                      onChange={() => setIncludePrices(true)}
                      className="mt-0.5 accent-emerald-700 w-4 h-4"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                        <span>Sim, importar preços (R$)</span>
                      </span>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        A IA identifica os valores monetários informados no PDF e cadastra os produtos já com os preços em Reais.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                      !includePrices
                        ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-stone-50 border-stone-200 hover:bg-stone-100/70"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={!includePrices}
                      onChange={() => setIncludePrices(false)}
                      className="mt-0.5 accent-emerald-700 w-4 h-4"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                        <span>Não, apenas fotos e descrições</span>
                      </span>
                      <p className="text-[11px] text-stone-500 leading-relaxed">
                        Traz todas as fotos, títulos e descrições com status <strong>Sob Consulta</strong> (sem preço fixo), ideal para encomendas e orçamentos.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Instructions / Options */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Instruções Especiais para a IA (Opcional)
                  </label>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: 'Adicionar tag Frete Grátis em buquês de noiva', 'Agrupar em Rosas, Orquídeas e Cestas Especiais'..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
                <div className="flex items-start gap-2 text-[11px] text-stone-500">
                  <Info className="w-3.5 h-3.5 shrink-0 text-stone-400 mt-0.5" />
                  <span>
                    A IA vai analisar o documento, identificar fotos, arranjos, nomes e preços, categorizar tudo e gerar descrições ricas para seus clientes.
                  </span>
                </div>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Falha na Extração</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Processing Progress Screen */}
              {isProcessing && (
                <div className="p-6 bg-white rounded-2xl border border-emerald-200 shadow-sm space-y-4 text-center animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#114b30] flex items-center justify-center mx-auto">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-serif font-bold text-stone-900 text-base">
                      {stagesMessages[processingStage] || "Processando Catálogo..."}
                    </h5>
                    <p className="text-xs text-stone-500">
                      Nosso agente multimodal está analisando seu arquivo com inteligência artificial. Isso leva poucos segundos...
                    </p>
                  </div>
                  {/* Step bar */}
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden max-w-md mx-auto">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(15, (processingStage + 1) * 22))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Review and Confirmation (when extracted successfully) */}
          {extractedData && (
            <div className="space-y-5">
              {/* Summary Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-emerald-950 text-base">
                      Catálogo Extraído com Sucesso!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Identificados <strong>{extractedData.products.length} produtos</strong> e{" "}
                      <strong>{extractedData.categories.length} categorias</strong> em "{extractedData.catalogTitle}".
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setExtractedData(null);
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Processar Outro Arquivo</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePreviewTab("products")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      activePreviewTab === "products"
                        ? "bg-[#114b30] text-white"
                        : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Produtos ({extractedData.products.length})</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewTab("categories")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      activePreviewTab === "categories"
                        ? "bg-[#114b30] text-white"
                        : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Categorias ({extractedData.categories.length})</span>
                  </button>
                </div>

                {activePreviewTab === "products" && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleBulkTogglePrices(false)}
                        className="px-2 py-0.5 text-[11px] font-bold text-stone-700 hover:bg-white rounded cursor-pointer transition-all"
                        title="Manter preços com valor em Reais"
                      >
                        Com Preços (R$)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkTogglePrices(true)}
                        className="px-2 py-0.5 text-[11px] font-bold text-stone-700 hover:bg-white rounded cursor-pointer transition-all"
                        title="Definir todos os itens como Sob Consulta"
                      >
                        Apenas Fotos (Sob Consulta)
                      </button>
                    </div>

                    <button
                      onClick={selectAllProducts}
                      className="font-bold text-emerald-800 hover:underline cursor-pointer"
                    >
                      {selectedProductIds.size === extractedData.products.length
                        ? "Desmarcar Todos"
                        : "Selecionar Todos"}
                    </button>
                  </div>
                )}
              </div>

              {/* Products List Preview */}
              {activePreviewTab === "products" && (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {extractedData.products.map((prod) => {
                    const isSelected = selectedProductIds.has(prod.id);
                    const isEditingThis = editingItem?.id === prod.id;

                    return (
                      <div
                        key={prod.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? "bg-white border-emerald-300 shadow-xs"
                            : "bg-stone-100/70 border-stone-200 opacity-60"
                        }`}
                      >
                        {isEditingThis ? (
                          <div className="space-y-3 p-3 bg-stone-50 rounded-xl border border-emerald-400">
                            {/* Image and Name Row */}
                            <div className="flex flex-col sm:flex-row gap-3 items-start">
                              <div className="relative group shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-300">
                                <img
                                  src={editingItem.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <label
                                  title="Trocar Foto (Arquivo ou Celular)"
                                  className="absolute inset-0 bg-stone-900/60 text-white flex flex-col items-center justify-center cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                                >
                                  {inlineUploadLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                                  ) : (
                                    <>
                                      <Camera className="w-4 h-4 text-emerald-300" />
                                      <span className="text-[9px] font-bold mt-0.5">Trocar</span>
                                    </>
                                  )}
                                  <input
                                    ref={inlineImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleInlineImageFileChange}
                                  />
                                </label>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                                <div>
                                  <label className="text-[10px] font-bold text-stone-600 uppercase">Nome do Produto</label>
                                  <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-stone-600 uppercase">Categoria</label>
                                  <select
                                    value={editingItem.category}
                                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                    className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                  >
                                    {extractedData.categories.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.icon} {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap">
                              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingItem.isPriceOnDemand}
                                  onChange={(e) =>
                                    setEditingItem({ ...editingItem, isPriceOnDemand: e.target.checked })
                                  }
                                  className="accent-emerald-700"
                                />
                                <span>Sob Consulta (Sem preço fixo)</span>
                              </label>

                              {!editingItem.isPriceOnDemand && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold">R$</span>
                                  <input
                                    type="number"
                                    step="0.10"
                                    value={editingItem.price}
                                    onChange={(e) =>
                                      setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                                    }
                                    className="w-24 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-bold"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 bg-stone-200 text-stone-700 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleSaveInlineEdit}
                                className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Salvar Alteração
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectProduct(prod.id)}
                                className="w-4 h-4 mt-1 sm:mt-0 accent-emerald-700 rounded cursor-pointer shrink-0"
                              />
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-bold text-stone-900 text-sm">{prod.name}</h5>
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full border border-stone-200">
                                    {extractedData.categories.find((c) => c.id === prod.category)?.name || prod.category}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-500 line-clamp-1 max-w-md">
                                  {prod.description}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-stone-400">
                                  {prod.tags.slice(0, 3).map((t, idx) => (
                                    <span key={idx} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                              <div>
                                {prod.isPriceOnDemand ? (
                                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                    Sob Consulta
                                  </span>
                                ) : (
                                  <span className="text-sm font-extrabold text-stone-900">
                                    {prod.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() =>
                                  setEditingItem({
                                    id: prod.id,
                                    name: prod.name,
                                    price: prod.price,
                                    isPriceOnDemand: prod.isPriceOnDemand || false,
                                    category: prod.category,
                                    imageUrl: prod.imageUrl,
                                  })
                                }
                                className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer"
                                title="Editar item antes de importar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Categories Preview Tab */}
              {activePreviewTab === "categories" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {extractedData.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="bg-white p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 bg-stone-50 rounded-xl border border-stone-200">
                          {cat.icon}
                        </span>
                        <div>
                          <h5 className="font-bold text-stone-900 text-sm">{cat.name}</h5>
                          <span className="text-[11px] text-stone-400 block line-clamp-1">
                            {cat.description || "Categoria temática"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {extractedData.products.filter((p) => p.category === cat.id).length} itens
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Import Options (Replace vs Merge) */}
              <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Como deseja importar para o catálogo?
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      !replaceMode
                        ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-white/60 border-stone-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={!replaceMode}
                      onChange={() => setReplaceMode(false)}
                      className="mt-0.5 accent-emerald-700"
                    />
                    <div>
                      <span className="font-bold text-xs text-stone-900 block">
                        Adicionar ao Catálogo Atual
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Mantém os itens existentes ({currentProductsCount}) e soma os novos extraídos.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      replaceMode
                        ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
                        : "bg-white/60 border-stone-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={replaceMode}
                      onChange={() => setReplaceMode(true)}
                      className="mt-0.5 accent-emerald-700"
                    />
                    <div>
                      <span className="font-bold text-xs text-stone-900 block">
                        Substituir Todo o Catálogo Atual
                      </span>
                      <span className="text-[11px] text-stone-500 block">
                        Zera o catálogo anterior e publica exclusivamente os novos itens extraídos.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {!extractedData ? (
            <button
              onClick={handleStartExtraction}
              disabled={!file || isProcessing}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all ${
                !file || isProcessing
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-[#114b30] hover:bg-[#0c3924] text-white cursor-pointer"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Analisando com Agente IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Extrair e Montar Catálogo com IA</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirmImport}
              disabled={selectedProductIds.size === 0}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all ${
                selectedProductIds.size === 0
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-[#114b30] hover:bg-[#0c3924] text-white cursor-pointer"
              }`}
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Publicar {selectedProductIds.size} Itens no Catálogo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
