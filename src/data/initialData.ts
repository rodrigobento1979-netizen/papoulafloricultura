import { Category, Customer, KanbanOrder } from "../types";

export const INITIAL_CATEGORIES: Category[] = [];

export const OFFICIAL_PDF_CATEGORIES: Category[] = [
  {
    id: "buques-de-rosas",
    name: "Buquês de Rosas",
    slug: "buques-de-rosas",
    icon: "🌹",
    description: "Buquês artesanais de 1 a 18 rosas vermelhas, rosas, amarelas e variadas.",
    active: true,
  },
  {
    id: "girassois",
    name: "Girassóis & Combinações",
    slug: "girassois",
    icon: "🌻",
    description: "Buquês luminosos de girassóis e combinações marcantes com rosas.",
    active: true,
  },
  {
    id: "rosas-azuis",
    name: "Rosas Azuis Especiais",
    slug: "rosas-azuis",
    icon: "💙",
    description: "Buquês exclusivos de rosas azuis com acabamento nobre.",
    active: true,
  },
  {
    id: "buques-com-pelucia",
    name: "Buquês com Urso / Pelúcia",
    slug: "buques-com-pelucia",
    icon: "🧸",
    description: "Presentes inesquecíveis combinando rosas nobres e bichinhos de pelúcia.",
    active: true,
  },
  {
    id: "flores-do-campo",
    name: "Gérberas, Lírios & Flores do Campo",
    slug: "flores-do-campo",
    icon: "💐",
    description: "Composições exuberantes de gérberas, lírios, astromélias e folhagens.",
    active: true,
  },
  {
    id: "buques-tradicionais",
    name: "Buquês Tradicionais de Luxo",
    slug: "buques-tradicionais",
    icon: "✨",
    description: "Montagens clássicas abertas e estruturadas com 6 e 12 rosas nobres.",
    active: true,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_KANBAN_ORDERS: KanbanOrder[] = [];


