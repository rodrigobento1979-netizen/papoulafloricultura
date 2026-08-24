/**
 * Utility functions for handling, optimizing and compressing image files client-side.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's not an image, reject
    if (!file.type.startsWith("image/")) {
      return reject(new Error("O arquivo selecionado não é uma imagem válida."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo de imagem."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível processar a imagem. Formato corrompido ou incompatível."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          return resolve(e.target?.result as string);
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          // Export as JPEG with 85% quality for optimal size / crispness balance
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch (err) {
          resolve(e.target?.result as string);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "Nenhum arquivo fornecido." };
  }

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "image/bmp", "image/avif"];
  const isTypeValid = validTypes.includes(file.type.toLowerCase()) || file.name.match(/\.(jpg|jpeg|png|webp|gif|avif|bmp)$/i);

  if (!isTypeValid) {
    return { valid: false, error: "Formato inválido. Por favor envie imagens JPG, PNG, WEBP ou GIF." };
  }

  // Check file size (max 25MB before compression)
  if (file.size > 25 * 1024 * 1024) {
    return { valid: false, error: "A imagem é muito pesada (limite de 25MB). Escolha uma foto menor." };
  }

  return { valid: true };
}
