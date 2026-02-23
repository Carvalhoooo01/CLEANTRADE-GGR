// data/constants.js

export const fmt    = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  { id: "perf", label: "Meu Perfil", href: "/perfil", icon: "user" },
];

export const NAV_VENDEDOR = [
  { id: "vendedor",      label: "Painel Vendedor",   icon: "dashboard",  href: "/vendedor"      },
  { id: "meus-lotes",   label: "Meus Lotes",         icon: "market",     href: "/meus-lotes"    },
  { id: "nova-oferta",  label: "Nova Oferta",         icon: "plus",       href: "/nova-oferta"   },
  { id: "vendas",       label: "Hist. de Vendas",    icon: "history",    href: "/vendas"        },
  { id: "certificados", label: "Certificados",       icon: "cert",       href: "/certificados"  },
  { id: "propriedades", label: "Propriedades",       icon: "land",       href: "/propriedades"  },
  { id: "inventario",   label: "Inventário CO₂",     icon: "inventory",  href: "/inventario"    },
  { id: "monitoramento",label: "Monitoramento",       icon: "monitor",    href: "/monitoramento" },
  { id: "compliance",   label: "Compliance",          icon: "compliance", href: "/compliance"    },
  { id: "perf", label: "Meu Perfil", href: "/perfil", icon: "user" },
];

export const NAV = NAV_COMPRADOR;

// Gera IDs no padrão Verra Registry: BR-VCS-{project}-{year}-{serial8}
export const genCertIds = (country, standard, projectId, year, from, to, owner, status) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    id:            `${country}-${standard}-${projectId}-${year}-${String(from + i).padStart(8, "0")}`,
    country, standard, projectId, year,
    serial:        from + i,
    status,
    owner,
    lote:          `${standard}-${projectId}`,
    transferredTo: status === "transferido" ? "Empresa Alpha Ltda" : null,
    transferDate:  status === "transferido" ? "20/02/2026" : null,
    txId:          status === "transferido" ? `TX-${projectId}-${String(from + i).padStart(6, "0")}` : null,
  }));

export const INIT_CERTS_SELLER = [
  ...genCertIds("BR", "VCS", "1234", "2022",  1,  1, "Gustavo Carneiro", "transferido"),
  ...genCertIds("BR", "VCS", "1234", "2022",  2,  9, "Gustavo Carneiro", "disponível"),
  ...genCertIds("BR", "VCS", "1234", "2022", 10, 10, "Gustavo Carneiro", "reservado"),
  ...genCertIds("BR", "VCS", "3456", "2023",  1,  8, "Gustavo Carneiro", "disponível"),
];

export const INIT_CERTS_BUYER = [
  ...genCertIds("BR", "VCS", "1234", "2022",  1,  1, "Empresa Alpha Ltda", "recebido"),
  ...genCertIds("BR", "VCS", "3456", "2023", 15, 16, "Empresa Alpha Ltda", "recebido"),
];

export const MONTHLY_DATA = [
  { m: "Set", receita: 120, volume: 3,   compras: 60,  saldo: 1200 },
  { m: "Out", receita: 200, volume: 5,   compras: 80,  saldo: 1100 },
  { m: "Nov", receita: 160, volume: 4,   compras: 65,  saldo: 980  },
  { m: "Dez", receita: 280, volume: 7,   compras: 90,  saldo: 850  },
  { m: "Jan", receita: 220, volume: 5.5, compras: 75,  saldo: 870  },
  { m: "Fev", receita: 160, volume: 4,   compras: 100, saldo: 915  },
];

export const PIE_TIPOS = [
  { name: "Florestal",      value: 40 },
  { name: "Energia",        value: 30 },
  { name: "Biodiversidade", value: 20 },
  { name: "Rec. Hídricos",  value: 10 },
];
export const PIE_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6"];

export const NOTIFICATIONS_INIT = [
  { id: 1, read: false, icon: "🌿", title: "Compra confirmada",   body: "1 tCO₂ FLOR-VER adquirido com sucesso", time: "há 2h" },
  { id: 2, read: false, icon: "📊", title: "Mercado em alta",     body: "ENER-GS subiu 4.2% hoje",               time: "há 4h" },
  { id: 3, read: false, icon: "🏆", title: "Certificado emitido", body: "BR-VCS-1234-2022-00000001 disponível",   time: "há 1d" },
  { id: 4, read: true,  icon: "⚠️", title: "Compliance pendente",body: "Relatório Q4/2025 vence em 3 dias",     time: "há 2d" },
];

export const INIT_TRANSACTIONS = [
  { id: 1, type: "Florestal",      cert: "Verra",         amount: 1.0,  price: 40.00, total: 40.00, date: "20/02/2026 10:09", status: "pago" },
  { id: 2, type: "Energia",        cert: "Gold Standard", amount: 1.12, price: 39.99, total: 44.80, date: "18/02/2026 15:02", status: "pago" },
  { id: 3, type: "Biodiversidade", cert: "Verra",         amount: 0.5,  price: 50.00, total: 25.00, date: "05/02/2026 09:30", status: "pago" },
];

export const INIT_MARKET = [
  { id: 1, name: "FLOR-VER", type: "Florestal",      cert: "Verra",         available: 10, price: 40.00, change: 2.5,  up: true,  status: "ACTIVE"  },
  { id: 2, name: "ENER-GS",  type: "Energia",        cert: "Gold Standard", available: 8,  price: 39.99, change: -1.2, up: false, status: "ACTIVE"  },
  { id: 3, name: "BIO-VER",  type: "Biodiversidade", cert: "Verra",         available: 5,  price: 52.00, change: 0.8,  up: true,  status: "ACTIVE"  },
  { id: 4, name: "AGUA-CAR", type: "Rec. Hídricos",  cert: "Biofilica",     available: 3,  price: 48.50, change: 1.5,  up: true,  status: "PENDING" },
];

export const INIT_PROPERTIES = [
  { id: 1, name: "Fazenda Verde",    area: 450, car: "SP-3550308-A1B2C3", status: "ativo", co2: 1.8  },
  { id: 2, name: "Sítio Esperança", area: 120, car: "MG-3106200-X9Y8Z7", status: "ativo", co2: 0.32 },
];

export const INIT_LOTES = [
  { id: 1, name: "FLOR-VER", type: "Florestal",      cert: "Verra",         quantidade: 10, preco: 40,    status: "ativo",   vendidos: 1, receita: 40,    descricao: "Créditos de reflorestamento Mata Atlântica", data: "01/01/2026" },
  { id: 2, name: "ENER-GS",  type: "Energia",        cert: "Gold Standard", quantidade: 8,  preco: 39.99, status: "ativo",   vendidos: 3, receita: 119.97, descricao: "Energia solar cooperativa Sul do Brasil",   data: "15/01/2026" },
  { id: 3, name: "BIO-VER",  type: "Biodiversidade", cert: "Verra",         quantidade: 5,  preco: 52,    status: "pausado", vendidos: 0, receita: 0,      descricao: "Preservação de biodiversidade Cerrado",      data: "20/01/2026" },
];

export const INIT_VENDAS = [
  { id: 1, lote: "FLOR-VER", comprador: "Empresa Alpha Ltda",   quantidade: 1, preco: 40,    total: 40,    data: "20/02/2026 10:09", status: "pago" },
  { id: 2, lote: "ENER-GS",  comprador: "Beta Indústrias S.A.", quantidade: 2, preco: 39.99, total: 79.98, data: "18/02/2026 15:02", status: "pago" },
  { id: 3, lote: "ENER-GS",  comprador: "Gama Energia Ltda",    quantidade: 1, preco: 39.99, total: 39.99, data: "10/02/2026 09:30", status: "pago" },
];
