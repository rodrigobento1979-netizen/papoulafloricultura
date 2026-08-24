import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Link as LinkIcon, Trash2, Camera, Loader2, Sparkles } from "lucide-react";
import { compressImageFile, validateImageFile } from "../utils/imageUtils";

interface PresetImage {
  name: string;
  url: string;
}

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  presets?: PresetImage[];
  label?: string;
  required?: boolean;
  helpText?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  value,
  onChange,
  presets = [],
  label = "Foto / Imagem do Produto",
  required = false,
  helpText,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">(
    value && !value.startsWith("data:") && !presets.some((p) => p.url === value) ? "url" : "upload"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState(value && !value.startsWith("data:") ? value : "");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Arquivo de imagem inválido.");
      return;
    }

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.85);
      onChange(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao processar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    }
  };

  const handleCustomUrlSubmit = (urlVal: string) => {
    setCustomUrlInput(urlVal);
    if (urlVal.trim()) {
      onChange(urlVal.trim());
    }
  };

  const isDataUrl = value && value.startsWith("data:image");

  return (
    <div className="space-y-3">
      {/* Label and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Tab selection */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("upload");
              setErrorMessage(null);
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-emerald-950 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Upload do Arquivo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("url");
              setErrorMessage(null);
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "url"
                ? "bg-white text-emerald-950 shadow-2xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-stone-600" />
            <span>Colar Link (URL)</span>
          </button>

          {presets.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("presets");
                setErrorMessage(null);
              }}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "presets"
                  ? "bg-white text-emerald-950 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Fotos Prontas</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* TAB 1: FILE UPLOAD (DRAG & DROP / CAMERA / GALLERY) */}
      {activeTab === "upload" && (
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0]);
              }
            }}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
          />

          {value ? (
            /* Image Preview Card */
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-white border border-stone-300 shrink-0 shadow-2xs group">
                <img
                  src={value}
                  alt="Pré-visualização do produto"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white text-stone-900 rounded-full shadow-md hover:scale-110 transition-transform cursor-pointer"
                    title="Trocar Foto"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                    {isDataUrl ? "Foto Enviada (Upload)" : "Imagem Vinculada"}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">Pronta para o catálogo</span>
                </div>
                <p className="text-xs text-stone-600 line-clamp-2">
                  Esta foto será exibida com alta resolução na vitrine do seu cliente e no carrinho de compras.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    )}
                    <span>{isUploading ? "Processando..." : "Escolher Outra Foto"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setCustomUrlInput("");
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Foto</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Drop Area */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-emerald-600 bg-emerald-50/70 scale-101"
                  : "border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-emerald-500"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                ) : (
                  <Upload className="w-6 h-6 text-emerald-700" />
                )}
              </div>

              <div className="space-y-1">
                <p className="font-bold text-sm text-stone-900">
                  {isUploading
                    ? "Comprimindo e preparando foto..."
                    : "Clique para escolher a foto ou arraste o arquivo aqui"}
                </p>
                <p className="text-xs text-stone-500">
                  Suporta fotos do computador, galeria do celular ou câmera (JPG, PNG, WEBP)
                </p>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[11px] bg-emerald-100/70 text-emerald-900 font-bold px-2.5 py-1 rounded-lg">
                  ✨ Otimização Automática
                </span>
                <span className="text-[11px] text-stone-400">Até 25MB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: URL / LINK */}
      {activeTab === "url" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => handleCustomUrlSubmit(e.target.value)}
              placeholder="https://exemplo.com/fotos/buque-rosas.jpg"
              className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
            {customUrlInput && (
              <button
                type="button"
                onClick={() => {
                  setCustomUrlInput("");
                  onChange("");
                }}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl cursor-pointer"
                title="Limpar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {value && (
            <div className="flex items-center gap-3 p-2 bg-stone-50 border border-stone-200 rounded-xl">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-stone-300 shrink-0">
                <img
                  src={value}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex-1 truncate text-xs text-stone-600">
                <span className="font-bold text-stone-800 block">Link carregado:</span>
                <span className="font-mono text-[11px] truncate block text-stone-500">{value}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRESETS (PRONTAS) */}
      {activeTab === "presets" && presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-stone-500">Selecione uma imagem com 1 clique:</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
            {presets.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onChange(preset.url);
                  setCustomUrlInput(preset.url);
                }}
                className={`cursor-pointer rounded-xl overflow-hidden border-2 p-1.5 bg-stone-50 transition-all ${
                  value === preset.url
                    ? "border-emerald-700 ring-2 ring-emerald-500/30 scale-102"
                    : "border-stone-200 hover:border-stone-400"
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <span className="text-[10px] font-semibold text-stone-700 block truncate mt-1 text-center">
                  {preset.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {helpText && <p className="text-[11px] text-stone-500">{helpText}</p>}
    </div>
  );
};
