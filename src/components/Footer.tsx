import React, { useState } from "react";
import { Phone, Mail, MapPin, ChevronDown, ChevronUp, MessageCircle, ShieldCheck, Heart } from "lucide-react";
import { POPULAR_CITIES } from "../data/cities";
import { PapoulaLogo } from "./PapoulaLogo";
import { buildWhatsAppUrl } from "../utils/whatsapp";

export const Footer: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Como funciona a entrega em Pirapora e Buritizeiro?",
      a: "Nossa loja física está localizada na Rua Mato Grosso, 211B em Pirapora. Montamos seu arranjo ou buquê com flores frescas selecionadas e levamos com agilidade em Pirapora (até 1h30) e Buritizeiro no mesmo dia.",
    },
    {
      q: "E se a pessoa não estiver no endereço no momento da entrega?",
      a: "Nosso entregador fará contato no interfone, campainha ou portaria. Caso não haja ninguém no local, entraremos em contato imediatamente com você pelo WhatsApp para combinar a entrega com todo o cuidado.",
    },
    {
      q: "O cartão com dedicatória e mensagem personalizada é cobrado?",
      a: "Não! Em todos os pedidos da Floricultura Papoula, o cartão de presente elegante com dedicatória é 100% gratuito. Você pode escrever sua mensagem ou usar nosso assistente de IA.",
    },
    {
      q: "Posso ver a foto do arranjo pronto antes de sair para entrega?",
      a: "Sim! Pelo nosso WhatsApp (38) 98851-2855, enviamos a foto real do buquê/arranjo montado antes da saída para entrega.",
    },
  ];

  return (
    <footer className="bg-[#111814] text-stone-300 pt-12 pb-8 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* FAQ Accordion Section */}
        <div className="bg-stone-900/90 rounded-2xl p-6 border border-emerald-900/40 space-y-4">
          <h3 className="text-lg font-serif font-bold text-white text-center">
            Dúvidas Frequentes sobre Entregas em Pirapora e Região
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-stone-800/80 rounded-xl p-3.5 border border-stone-700 cursor-pointer select-none transition-colors"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-stone-100">{faq.q}</h4>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                  </div>
                  {isOpen && (
                    <p className="text-xs text-stone-400 mt-2 leading-relaxed pt-2 border-t border-stone-700/50 animate-in fade-in duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PapoulaLogo size="sm" showTextBeside={true} />
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Tradição e carinho em flores, buquês nobres de rosas e papoulas, orquídeas e cestas de café da manhã em Pirapora e Buritizeiro.
            </p>
            <div className="text-xs text-emerald-400 font-medium space-y-1.5 pt-1">
              <p className="flex items-center gap-1.5 text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Rua Mato Grosso, 211B — Pirapora, MG
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> (38) 98851-2855
              </p>
              <a
                href={buildWhatsAppUrl("5538988512855", "Olá! Vim pelo site da Floricultura Papoula")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Atendimento pelo WhatsApp
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Arranjos & Ocasiões</h4>
            <ul className="text-xs text-stone-400 space-y-1.5">
              <li className="hover:text-emerald-400 cursor-pointer">Buquês de Rosas & Papoulas</li>
              <li className="hover:text-emerald-400 cursor-pointer">Orquídeas em Vasos Decorativos</li>
              <li className="hover:text-emerald-400 cursor-pointer">Cestas de Café da Manhã & Gourmet</li>
              <li className="hover:text-emerald-400 cursor-pointer">Girassóis & Flores do Campo</li>
              <li className="hover:text-emerald-400 cursor-pointer">Flower Boxes com Chocolates Finos</li>
              <li className="hover:text-emerald-400 cursor-pointer">Coroas de Flores & Condolências</li>
            </ul>
          </div>

          {/* Cities Network */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Atendimento Local</h4>
            <div className="space-y-2">
              <div className="bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/80 text-xs">
                <span className="font-bold text-emerald-300 block">🌿 Pirapora - MG</span>
                <span className="text-[11px] text-stone-400">Entrega rápida em todos os bairros</span>
              </div>
              <div className="bg-stone-800/80 p-2.5 rounded-xl border border-stone-700/80 text-xs">
                <span className="font-bold text-emerald-300 block">🌿 Buritizeiro - MG</span>
                <span className="text-[11px] text-stone-400">Entrega expressa diária</span>
              </div>
            </div>
          </div>

          {/* Security & Payments */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Segurança & Pagamentos</h4>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Checkout Seguro & Atendimento Direto</span>
            </div>
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700 space-y-2">
              <span className="text-[11px] text-stone-400 block font-semibold">Forma de Pagamento:</span>
              <div className="flex items-center gap-2">
                <span className="bg-[#114b30] text-amber-300 px-3 py-1.5 rounded-lg border border-emerald-500/50 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Pagamento via PIX
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-tight">
                Chave PIX e confirmação direta pelo WhatsApp após a montagem do pedido.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="pt-8 border-t border-stone-800 text-center text-xs text-stone-500 space-y-2">
          <p>
            © {new Date().getFullYear()} Floricultura Papoula — Rua Mato Grosso 211B, Pirapora - MG. Tel: (38) 98851-2855.
          </p>
          <p className="text-[11px]">
            Arranjos confeccionados artesanalmente com flores naturais e frescas do dia.
          </p>
        </div>
      </div>
    </footer>
  );
};

