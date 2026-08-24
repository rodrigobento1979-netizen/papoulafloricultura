import React, { useState } from "react";
import { MapPin, X, Check, Search, Sparkles, AlertCircle } from "lucide-react";
import { POPULAR_CITIES, CityOption } from "../data/cities";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: CityOption;
  onSelectCity: (city: CityOption) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  onSelectCity,
}) => {
  const [cepInput, setCepInput] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCepSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = cepInput.replace(/\D/g, "");
    if (cleanCep.length < 8) {
      setCepError("Por favor, digite um CEP válido com 8 números.");
      return;
    }

    setIsSearchingCep(true);
    setCepError(null);

    try {
      const res = await fetch("/api/check-cep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: cleanCep }),
      });
      const data = await res.json();

      if (data.success) {
        const isBuritizeiro = data.city?.toLowerCase().includes("buritizeiro");
        const newCityOption: CityOption = {
          name: `${data.city} (${data.neighborhood})`,
          state: data.state,
          cepDefault: cleanCep,
          deliveryFee: data.deliveryFee !== undefined ? data.deliveryFee : (isBuritizeiro ? 15.0 : 10.0),
          leadTime: data.sameDayAvailable ? "Entrega Hoje disponível" : "Entrega em 24h",
          freeDelivery: data.deliveryFee === 0,
        };
        onSelectCity(newCityOption);
        onClose();
      } else {
        setCepError(data.error || "Não conseguimos localizar este CEP.");
      }
    } catch (err) {
      // Fallback
      const fallback: CityOption = {
        name: `Região CEP ${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`,
        state: "MG",
        cepDefault: cleanCep,
        deliveryFee: 10.0,
        leadTime: "Entrega no mesmo dia",
        freeDelivery: false,
      };
      onSelectCity(fallback);
      onClose();
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-300" />
              <h3 className="font-serif font-bold text-lg">Onde deseja entregar seu presente?</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-emerald-200 mt-1">
            Informar o local nos permite checar estoques de flores frescas da sua região e calcular os horários de entrega no mesmo dia.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* CEP Input Form */}
          <form onSubmit={handleCepSearch} className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Consultar por CEP do Destinatário
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cepInput}
                onChange={(e) => setCepInput(e.target.value)}
                placeholder="Ex: 01310-100"
                maxLength={9}
                className="flex-1 px-4 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-medium"
              />
              <button
                type="submit"
                disabled={isSearchingCep}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSearchingCep ? (
                  <span>Checando...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Calcular</span>
                  </>
                )}
              </button>
            </div>
            {cepError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{cepError}</span>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full"></div>
            <span className="bg-white px-3 text-xs text-stone-400 font-semibold uppercase">
              Ou escolha entre as principais cidades
            </span>
          </div>

          {/* Popular Cities Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {POPULAR_CITIES.map((city) => {
              const isSelected = currentCity.name.includes(city.name);
              return (
                <button
                  key={`${city.name}-${city.state}`}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600"
                      : "border-stone-200 hover:border-emerald-300 hover:bg-stone-50 text-stone-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-stone-900">{city.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                    <span>{city.state}</span>
                    <span className="text-emerald-700 font-semibold">
                      {city.freeDelivery ? "Frete Grátis" : "Atendimento"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Entregamos em <strong>mais de 1.200 municípios brasileiros</strong> através de floriculturas locais parceiras com controle de qualidade rigoroso e garantia de frescor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
