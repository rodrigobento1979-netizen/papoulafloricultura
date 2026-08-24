import { StoreConfig } from "../types";

export interface StoreBusinessHours {
  isOpenNow: boolean;
  statusText: string;
  nextOpenText: string;
  details: {
    weekdays: string;
    saturdayAndHolidays: string;
    sunday: string;
  };
}

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: "Floricultura Papoula",
  phone: "(38) 98851-2855",
  whatsapp: "38988512855",
  instagram: "floricultura_papoula",
  address: "Rua Mato Grosso, 211B, Centro",
  city: "Pirapora - MG",
  operationMode: "auto",
  weekdays: {
    enabled: true,
    openTime: "07:30",
    closeTime: "18:30",
  },
  saturday: {
    enabled: true,
    openTime: "08:00",
    closeTime: "12:30",
  },
  sunday: {
    enabled: false,
    openTime: "08:00",
    closeTime: "12:00",
  },
  closedMessage: "Estamos fora do horário de atendimento neste momento. Seu pedido será recebido e preparado com todo o carinho no próximo horário de funcionamento!",
};

function parseTimeToMinutes(timeStr: string, fallback: number): number {
  if (!timeStr || !timeStr.includes(":")) return fallback;
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return fallback;
  return hours * 60 + minutes;
}

/**
 * Checks if current time is within Papoula business hours based on store config:
 */
export function getStoreBusinessHours(config: StoreConfig = DEFAULT_STORE_CONFIG, date: Date = new Date()): StoreBusinessHours {
  const currentConfig = config || DEFAULT_STORE_CONFIG;

  // Check manual force overrides
  if (currentConfig.operationMode === "forced_open") {
    return {
      isOpenNow: true,
      statusText: "Aberto agora (Plantão Especial)",
      nextOpenText: "Atendimento ativo",
      details: {
        weekdays: `Segunda a Sexta: ${currentConfig.weekdays?.openTime || "07:30"} às ${currentConfig.weekdays?.closeTime || "18:30"}`,
        saturdayAndHolidays: `Sábados e Feriados: ${currentConfig.saturday?.openTime || "08:00"} às ${currentConfig.saturday?.closeTime || "12:30"}`,
        sunday: currentConfig.sunday?.enabled ? `Domingo: ${currentConfig.sunday.openTime} às ${currentConfig.sunday.closeTime}` : "Domingo: Fechado",
      },
    };
  }

  if (currentConfig.operationMode === "forced_closed") {
    return {
      isOpenNow: false,
      statusText: "Fechado temporariamente",
      nextOpenText: "Reabertura em breve",
      details: {
        weekdays: `Segunda a Sexta: ${currentConfig.weekdays?.openTime || "07:30"} às ${currentConfig.weekdays?.closeTime || "18:30"}`,
        saturdayAndHolidays: `Sábados e Feriados: ${currentConfig.saturday?.openTime || "08:00"} às ${currentConfig.saturday?.closeTime || "12:30"}`,
        sunday: currentConfig.sunday?.enabled ? `Domingo: ${currentConfig.sunday.openTime} às ${currentConfig.sunday.closeTime}` : "Domingo: Fechado",
      },
    };
  }

  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;

  const weekdayOpenMin = parseTimeToMinutes(currentConfig.weekdays?.openTime, 7 * 60 + 30);
  const weekdayCloseMin = parseTimeToMinutes(currentConfig.weekdays?.closeTime, 18 * 60 + 30);

  const satOpenMin = parseTimeToMinutes(currentConfig.saturday?.openTime, 8 * 60 + 0);
  const satCloseMin = parseTimeToMinutes(currentConfig.saturday?.closeTime, 12 * 60 + 30);

  const sunOpenMin = parseTimeToMinutes(currentConfig.sunday?.openTime, 8 * 60 + 0);
  const sunCloseMin = parseTimeToMinutes(currentConfig.sunday?.closeTime, 12 * 60 + 0);

  let isOpen = false;
  let nextOpen = `segunda-feira às ${currentConfig.weekdays?.openTime || "07:30"}`;

  if (day >= 1 && day <= 5) {
    // Monday - Friday
    if (currentConfig.weekdays?.enabled && currentTimeInMinutes >= weekdayOpenMin && currentTimeInMinutes <= weekdayCloseMin) {
      isOpen = true;
    } else if (currentTimeInMinutes < weekdayOpenMin) {
      nextOpen = `hoje às ${currentConfig.weekdays?.openTime || "07:30"}`;
    } else {
      nextOpen = day === 5 ? `amanhã (sábado) às ${currentConfig.saturday?.openTime || "08:00"}` : `amanhã às ${currentConfig.weekdays?.openTime || "07:30"}`;
    }
  } else if (day === 6) {
    // Saturday
    if (currentConfig.saturday?.enabled && currentTimeInMinutes >= satOpenMin && currentTimeInMinutes <= satCloseMin) {
      isOpen = true;
    } else if (currentTimeInMinutes < satOpenMin) {
      nextOpen = `hoje às ${currentConfig.saturday?.openTime || "08:00"}`;
    } else {
      if (currentConfig.sunday?.enabled) {
        nextOpen = `amanhã (domingo) às ${currentConfig.sunday?.openTime || "08:00"}`;
      } else {
        nextOpen = `próxima segunda-feira às ${currentConfig.weekdays?.openTime || "07:30"}`;
      }
    }
  } else {
    // Sunday
    if (currentConfig.sunday?.enabled && currentTimeInMinutes >= sunOpenMin && currentTimeInMinutes <= sunCloseMin) {
      isOpen = true;
    } else if (currentConfig.sunday?.enabled && currentTimeInMinutes < sunOpenMin) {
      nextOpen = `hoje às ${currentConfig.sunday?.openTime || "08:00"}`;
    } else {
      isOpen = false;
      nextOpen = `amanhã (segunda-feira) às ${currentConfig.weekdays?.openTime || "07:30"}`;
    }
  }

  return {
    isOpenNow: isOpen,
    statusText: isOpen ? "Aberto agora" : "Fora do horário de atendimento",
    nextOpenText: nextOpen,
    details: {
      weekdays: `Segunda a Sexta: ${currentConfig.weekdays?.openTime || "07:30"} às ${currentConfig.weekdays?.closeTime || "18:30"}`,
      saturdayAndHolidays: `Sábados e Feriados: ${currentConfig.saturday?.openTime || "08:00"} às ${currentConfig.saturday?.closeTime || "12:30"}`,
      sunday: currentConfig.sunday?.enabled ? `Domingo: ${currentConfig.sunday.openTime} às ${currentConfig.sunday.closeTime}` : "Domingo: Fechado",
    },
  };
}

/**
 * Calculates star rating (1 to 5) dynamically based on total completed/created orders
 */
export function calculateStarRating(orderCount: number = 0, defaultBaseRating: number = 5): number {
  if (orderCount <= 0) return 4;
  if (orderCount >= 10) return 5;
  if (orderCount >= 5) return 5;
  if (orderCount >= 2) return 4.5;
  return Math.min(5, Math.max(1, defaultBaseRating));
}
