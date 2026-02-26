# CleanTrade — Next.js (App Router)

## 🚀 Como rodar

```bash
npm install
npm run dev
# acesse http://localhost:3000
```

---

## 📁 Estrutura de arquivos

```
cleantrade-v2/
│
├── app/                          ← App Router do Next.js
│   ├── layout.jsx                ← Layout raiz (importa fontes)
│   ├── ClientLayout.jsx          ← Layout client: sidebar + header + toast
│   ├── globals.css               ← Reset CSS global
│   ├── page.jsx                  ← /  → Dashboard
│   ├── marketplace/
│   │   └── page.jsx              ← /marketplace
│   ├── historico/
│   │   └── page.jsx              ← /historico
│   ├── propriedades/
│   │   └── page.jsx              ← /propriedades
│   ├── inventario/
│   │   └── page.jsx              ← /inventario
│   ├── projetos/
│   │   └── page.jsx              ← /projetos
│   ├── monitoramento/
│   │   └── page.jsx              ← /monitoramento
│   └── compliance/
│       └── page.jsx              ← /compliance
│
├── components/
│   ├── Icons.jsx                 ← Todos os ícones SVG
│   ├── ui.jsx                    ← Badge, Card, Btn, Input, Modal, Toast, Donut, Spark
│   ├── Sidebar.jsx               ← Sidebar retrátil com navegação
│   └── Header.jsx                ← Header com título dinâmico
│
├── context/
│   └── AppContext.jsx            ← Estado global: balance, transactions, market, properties
│
├── data/
│   └── constants.js              ← Dados iniciais, helpers (fmt, fmtCO2), NAV, STATUS_COLORS
│
├── jsconfig.json                 ← Alias @/ para imports limpos
├── next.config.js
└── package.json
```

---

## 🔄 Como o estado é compartilhado

O `AppContext` usa React Context para compartilhar:
- `balance` / `setBalance` — saldo da carteira
- `transactions` / `setTx` — histórico de compras
- `market` / `setMarket` — ativos disponíveis
- `properties` / `setProperties` — propriedades cadastradas
- `showToast(msg, type)` — notificações globais

Qualquer página acessa com:
```js
import { useApp } from "@/context/AppContext";
const { balance, showToast } = useApp();
```

---

## 📦 Próximos passos

- [ ] Conectar `AppContext` a uma API real (fetch/axios)
- [ ] Adicionar autenticação com NextAuth.js
- [ ] Adicionar Tailwind CSS
- [ ] Mapas com Leaflet em Propriedades
- [ ] Gráficos reais com Recharts
