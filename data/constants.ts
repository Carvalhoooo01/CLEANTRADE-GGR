// data/constants.js

export const fmt     = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const fmtCO2 = (n) => `${Number(n).toFixed(2)} tCO₂`;

export const STATUS_COLORS = {
  ativo:       "#16a34a",
  pausado:     "#f59e0b",
  encerrado:   "#6b7280",
  pago:        "#16a34a",
  pendente:    "#f59e0b",
  cancelado:   "#ef4444",
  ACTIVE:      "#16a34a",
  PENDING:     "#f59e0b",
  RETIRED:     "#6b7280",
  disponível:  "#16a34a",
  transferido: "#6b7280",
  reservado:   "#f59e0b",
  recebido:    "#0ea5e9",
};

export const NAV_COMPRADOR = [
  { id: "dashboard",     label: "Dashboard",      icon: "dashboard",  href: "/"              },
  { id: "marketplace",   label: "Marketplace",    icon: "market",     href: "/marketplace"   },
  { id: "historico",     label: "Histórico",      icon: "history",    href: "/historico"     },
  { id: "propriedades",  label: "Propriedades",   icon: "land",       href: "/propriedades"  },
  { id: "inventario",    label: "Inventário CO₂", icon: "inventory",  href: "/inventario"    },
  { id: "certificados",  label: "Certificados",   icon: "cert",       href: "/certificados"  },
  { id: "projetos",      label: "Projetos",       icon: "projects",   href: "/projetos"      },
  { id: "monitoramento", label: "Monitoramento",  icon: "monitor",    href: "/monitoramento" },
  { id: "compliance",    label: "Compliance",     icon: "compliance", href: "/compliance"    },
  { id: "financeiro",    href: "/financeiro",     icon: "wallet",     label: "Financeiro"    },
  { id: "cooperativa",   href: "/cooperativa",    icon: "users",      label: "Cooperativa"   },
  { id: "perf",          label: "Meu Perfil",     href: "/perfil",    icon: "user"           },
];

export const NAV_VENDEDOR = [
  { id: "vendedor",      label: "Painel Vendedor",   icon: "dashboard",  href: "/vendedor"      },
  { id: "meus-lotes",    label: "Meus Lotes",         icon: "market",     href: "/meus-lotes"    },
  { id: "nova-oferta",   label: "Nova Oferta",         icon: "plus",       href: "/nova-oferta"   },
  { id: "vendas",        label: "Hist. de Vendas",    icon: "history",    href: "/vendas"        },
  { id: "certificados",  label: "Certificados",       icon: "cert",       href: "/certificados"  },
  { id: "propriedades",  label: "Propriedades",       icon: "land",       href: "/propriedades"  },
  { id: "inventario",    label: "Inventário CO₂",     icon: "inventory",  href: "/inventario"    },
  { id: "monitoramento", label: "Monitoramento",       icon: "monitor",    href: "/monitoramento" },
  { id: "compliance",    label: "Compliance",          icon: "compliance", href: "/compliance"    },
  { id: "financeiro",    href: "/financeiro",     icon: "wallet",     label: "Financeiro"    },
  { id: "cooperativa",   href: "/cooperativa",    icon: "users",      label: "Cooperativa"   },
  { id: "perf",          label: "Meu Perfil",     href: "/perfil",    icon: "user"           },
];

export const NAV = NAV_COMPRADOR;

// Auxiliar para IDs de certificados (vazio por padrão em produção)
export const genCertIds = (country, standard, projectId, year, from, to, owner, status) => [];

// --- DADOS ZERADOS PARA PRODUÇÃO (DADOS REAIS VIRÃO DA API) ---

export const INIT_CERTS_SELLER = [];
export const INIT_CERTS_BUYER  = [];
export const INIT_TRANSACTIONS = [];
export const INIT_MARKET       = []; // Marketplace vazio aguardando ofertas reais
export const INIT_PROPERTIES   = [];
export const INIT_LOTES        = [];
export const INIT_VENDAS       = [];

// Gráficos e Notificações (Pode manter ou zerar conforme preferir)
export const MONTHLY_DATA = [];
export const PIE_TIPOS    = [];
export const PIE_COLORS   = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6"];

export const NOTIFICATIONS_INIT = [];