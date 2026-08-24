import React from "react";
import { Star, ShieldCheck, CheckCircle2, HeartHandshake, Truck, Award, Sparkles } from "lucide-react";
import { REVIEWS } from "../data/reviews";

export const TrustSection: React.FC = () => {
  return (
    <section className="bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 border-t border-stone-200">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            <span>Satisfação Garantida</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Quem recebe uma surpresa, <span className="text-emerald-800">nunca esquece</span>.
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            Mais de 45.000 buquês e cestas entregues com nota média de <strong>4.9 / 5 estrelas</strong> em todo o Brasil.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                {/* Rating stars */}
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-400 font-medium">{rev.date}</span>
                </div>

                {/* Comment */}
                <p className="text-xs text-stone-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author & Verified Tag */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">{rev.author}</h4>
                  <span className="text-[11px] text-stone-500">{rev.city}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verificada
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quality Badges Grid */}
        <div className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-800 rounded-xl text-amber-300 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Entrega no Mesmo Dia</h4>
              <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">
                Roteamento para floristas locais em mais de 1.200 cidades brasileiras.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-800 rounded-xl text-amber-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Garantia 7 Dias de Frescor</h4>
              <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">
                Flores de corte selecionadas no dia, com conservante floral incluso.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-800 rounded-xl text-amber-300 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Política de Substituição Clara</h4>
              <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">
                Caso alguma flor sazonal esteja em falta, garantimos item de valor igual ou superior.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-800 rounded-xl text-amber-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Foto Antes do Envio</h4>
              <p className="text-xs text-emerald-200 mt-0.5 leading-relaxed">
                Você recebe pelo WhatsApp o registro do arranjo confeccionado e pronto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
