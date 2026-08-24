/**
 * Utilitário para envio de mensagens para o WhatsApp com suporte perfeito a emojis
 * Evita que caracteres especiais e emojis virem ponto de interrogação (?)
 */

/**
 * Normaliza e sanitiza o texto para envio via WhatsApp,
 * removendo seletores de variação invisíveis (como \uFE0F e \u200D) que causam '?'
 * em navegadores e no WhatsApp Web ao codificar via URL.
 */
export function sanitizeWhatsAppText(text: string): string {
  if (!text) return "";

  // Remove seletores de variação (VS16: \uFE0F, VS15: \uFE0E) e Zero Width Joiner (\u200D)
  // que frequentemente quebram emojis em '?' ao passarem por redirecionamento de URL
  let cleaned = text
    .replace(/\uFE0F/g, "")
    .replace(/\uFE0E/g, "")
    .replace(/\u200D/g, "");

  // Substitui emojis complexos compostos que costumam bugar
  cleaned = cleaned
    .replace(/🕵️‍♂️|🕵‍♂️|🕵/g, "🕵")
    .replace(/🏷️|🏷/g, "🏷")
    .replace(/✉️|✉/g, "💌")
    .replace(/☕️|☕/g, "☕")
    .replace(/▶️|▶/g, "👉");

  return cleaned;
}

/**
 * Gera a URL oficial do WhatsApp (api.whatsapp.com) que não passa por redirecionamento 302 do wa.me,
 * preservando 100% dos emojis e caracteres acentuados (UTF-8).
 */
export function buildWhatsAppUrl(phone: string, text: string = ""): string {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  // Adiciona o DDI 55 (Brasil) se tiver 10 ou 11 dígitos
  const fullPhone =
    cleanPhone.length === 10 || cleanPhone.length === 11
      ? `55${cleanPhone}`
      : cleanPhone.startsWith("55")
      ? cleanPhone
      : cleanPhone
      ? `55${cleanPhone}`
      : "5538988512855";

  const sanitized = sanitizeWhatsAppText(text);
  const encodedText = encodeURIComponent(sanitized);

  if (!encodedText) {
    return `https://api.whatsapp.com/send?phone=${fullPhone}`;
  }

  return `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;
}

/**
 * Abre a conversa do WhatsApp em uma nova aba com o texto codificado corretamente
 */
export function openWhatsApp(phone: string, text: string = ""): void {
  const url = buildWhatsAppUrl(phone, text);
  window.open(url, "_blank", "noopener,noreferrer");
}
