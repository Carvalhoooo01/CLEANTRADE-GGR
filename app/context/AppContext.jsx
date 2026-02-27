"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { INIT_MARKET, NOTIFICATIONS_INIT, INIT_CERTS_SELLER, INIT_CERTS_BUYER } from "@/data/constants";

const AppContext = createContext(null);

// Mapeia campos do banco (português) → frontend (inglês)
function mapLote(l) {
  return {
    ...l,
    name: l.nome,
    type: l.tipo,
    cert: l.certificadora,
  };
}

function mapTransacao(t) {
  return {
    ...t,
    date: t.createdAt
      ? new Date(t.createdAt).toLocaleDateString("pt-BR") + " " +
        new Date(t.createdAt).toLocaleTimeString("pt-BR").slice(0, 5)
      : t.date || "",
  };
}

function mapVenda(v) {
  return {
    ...v,
    date: v.data
      ? new Date(v.data).toLocaleDateString("pt-BR") + " " +
        new Date(v.data).toLocaleTimeString("pt-BR").slice(0, 5)
      : v.date || "",
  };
}

export function AppProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [role, setRole]               = useState("comprador");
  const [balance, setBalance]         = useState(0);
  const [ready, setReady]             = useState(false);
  const [transactions, setTx]         = useState([]);
  const [market, setMarket]           = useState(INIT_MARKET);
  const [properties, setProperties]   = useState([]);
  const [lotes, setLotes]             = useState([]);
  const [vendas, setVendas]           = useState([]);
  const [cooperativa, setCooperativa] = useState(null);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_INIT);
  const [certsSeller, setCertsSeller] = useState(INIT_CERTS_SELLER);
  const [certsBuyer,  setCertsBuyer]  = useState(INIT_CERTS_BUYER);
  const [toast, setToast]             = useState(null);

  // 1. Apenas marca como pronto — sem restaurar sessão (login sempre exigido ao recarregar)
  useEffect(() => {
    setReady(true);
  }, []);

  // 2. (sem persistência de sessão)

  // 4. Carrega todos os dados do banco ao logar
  useEffect(() => {
    if (!ready || !user) return;
    const uid  = user.id;
    const r    = user.role || role;

    // Transações
    fetch(`/api/transacoes?userId=${uid}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTx(data.map(mapTransacao)); })
      .catch(() => {});

    // Propriedades
    fetch(`/api/properties?userId=${uid}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProperties(data); })
      .catch(() => {});

    // Lotes do usuário (mapeados)
    fetch(`/api/lotes?userId=${uid}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setLotes(data.map(mapLote)); })
      .catch(() => {});

    // Marketplace — carrega TODOS os lotes ativos com vendedorId
    fetch("/api/lotes")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const ativos = data
          .filter(l => l.status === "ativo" && (l.quantidade - (l.vendidos || 0)) > 0)
          .map(l => ({
            id:         l.id,
            name:       l.nome,
            type:       l.tipo,
            cert:       l.certificadora,
            available:  l.quantidade - (l.vendidos || 0),
            price:      l.preco,
            change:     0,
            up:         true,
            status:     "ACTIVE",
            vendedorId: l.userId,
          }));
        if (ativos.length > 0) setMarket(ativos);
      })
      .catch(() => {});

    // Vendas
    fetch(`/api/vendas?userId=${uid}&role=${r}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setVendas(data.map(mapVenda)); })
      .catch(() => {});

    // Cooperativa
    fetch("/api/cooperativa")
      .then(res => res.json())
      .then(data => { if (data?.id) setCooperativa(data); })
      .catch(() => {});

  }, [ready, user]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const login = async (email, senha) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setRole(data.role);
        setBalance(data.saldo || 0);
        return data;
      } else {
        showToast(data.error || "Erro ao fazer login", "error");
        return null;
      }
    } catch {
      showToast("Erro de conexão com o servidor", "error");
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setRole("comprador");
    setBalance(0);
    setTx([]);
    setLotes([]);
    setVendas([]);
    setProperties([]);
    setCooperativa(null);
    setCertsSeller(INIT_CERTS_SELLER);
    setCertsBuyer(INIT_CERTS_BUYER);
    setMarket(INIT_MARKET);

  };

  // Publica lote no banco — mapeia campos frontend → banco
  const publicarLote = async (novoLote) => {
    try {
      const response = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:          novoLote.name  || novoLote.nome,
          tipo:          novoLote.type  || novoLote.tipo,
          certificadora: novoLote.cert  || novoLote.certificadora || "Verra VCS",
          quantidade:    novoLote.quantidade,
          preco:         novoLote.preco,
          descricao:     novoLote.descricao || "",
          userId:        user.id,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setLotes(prev => {
          const filtered = prev.filter(l => l.id !== novoLote.id);
          return [...filtered, mapLote(data)];
        });
        showToast("Lote publicado com sucesso!");
        return data;
      } else {
        showToast("Erro ao salvar lote no banco", "error");
      }
    } catch {
      showToast("Erro de comunicação com o banco", "error");
    }
  };

  // Carrega lotes do mercado (todos os ativos)
  const fetchMarket = async () => {
    try {
      const response = await fetch("/api/lotes");
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const items = data
          .filter(l => l.status === "ativo" && l.quantidade > (l.vendidos || 0))
          .map(l => ({
            id:        l.id,
            name:      l.nome,
            type:      l.tipo,
            cert:      l.certificadora,
            available: l.quantidade - (l.vendidos || 0),
            price:     l.preco,
            change:    0,
            up:        true,
            status:    "ACTIVE",
            vendedorId: l.userId,
          }));
        if (items.length > 0) setMarket(items);
      }
    } catch (error) {
      console.error("Erro ao carregar mercado:", error);
    }
  };

  // Aderir à cooperativa
  const aderirCooperativa = async (plano = "basico") => {
    try {
      const response = await fetch("/api/cooperativa/aderir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plano }),
      });
      const data = await response.json();
      if (response.ok) {
        const taxa = { basico: 300, premium: 800, enterprise: 2000 }[plano] || 300;
        setBalance(prev => prev - taxa);
        showToast(`Bem-vindo à cooperativa! Plano ${plano} ativado.`, "success");
        // Recarrega cooperativa
        fetch("/api/cooperativa").then(r => r.json()).then(d => { if (d?.id) setCooperativa(d); });
        return data;
      } else {
        showToast(data.error || "Erro ao aderir", "error");
        return null;
      }
    } catch {
      showToast("Erro de conexão", "error");
      return null;
    }
  };

  const markNotifRead  = (id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead    = ()   => setNotifications(ns => ns.map(n => ({ ...n, read: true })));

  return (
    <AppContext.Provider value={{
      ready,
      user, setUser, login, logout,
      role, setRole,
      balance, setBalance,
      transactions, setTx,
      market, setMarket,
      properties, setProperties,
      lotes, setLotes,
      vendas, setVendas,
      cooperativa, setCooperativa,
      certsSeller, setCertsSeller,
      certsBuyer, setCertsBuyer,
      notifications, markNotifRead, markAllRead,
      publicarLote, fetchMarket, aderirCooperativa,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}