export interface CityOption {
  name: string;
  state: string;
  cepDefault: string;
  leadTime: string;
  freeDelivery: boolean;
  deliveryFee: number;
  neighborhoods?: string[];
}

export const POPULAR_CITIES: CityOption[] = [
  { 
    name: "Pirapora", 
    state: "MG", 
    cepDefault: "39270-000", 
    leadTime: "Entrega Expressa Local (Até 1h30)", 
    freeDelivery: false,
    deliveryFee: 10.0,
    neighborhoods: ["Centro", "Santos Dumont", "Santa Terezinha", "Cidade Jardim", "São Geraldo", "Industrial", "Margarida", "Bom Jesus", "Nova Pirapora"]
  },
  { 
    name: "Buritizeiro", 
    state: "MG", 
    cepDefault: "39280-000", 
    leadTime: "Entrega Expressa no mesmo dia", 
    freeDelivery: false,
    deliveryFee: 15.0,
    neighborhoods: ["Centro", "Jardim dos Bandeirantes", "São José", "Novo Buritizeiro", "Alto da Boa Vista", "Industrial"]
  },
  { 
    name: "Várzea da Palma", 
    state: "MG", 
    cepDefault: "39260-000", 
    leadTime: "Entrega Agendada", 
    freeDelivery: false,
    deliveryFee: 45.0
  },
  { 
    name: "Montes Claros", 
    state: "MG", 
    cepDefault: "39400-000", 
    leadTime: "Entrega Expressa Regional", 
    freeDelivery: false,
    deliveryFee: 65.0
  },
  { 
    name: "Belo Horizonte", 
    state: "MG", 
    cepDefault: "30130-140", 
    leadTime: "Rede Conveniada", 
    freeDelivery: false,
    deliveryFee: 30.0
  },
];

