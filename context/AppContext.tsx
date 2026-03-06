"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { INIT_MARKET, NOTIFICATIONS_INIT } from "@/data/constants";

const AppContext = createContext(null);

// Constante de tempo: 5000ms = 5 segundos
const REFRESH_INTERVAL = 5000; 

function mapLote(l: any) {
  return { ...l, name: l.nome, type: l.tipo, cert: l.certificadora };
}

function mapTransacao(t: any) {
  return {
    ...t,
    date: t.createdAt
      ? new Date(t.createdAt).toLocaleDateString("pt-BR") + " " + new Date(t.createdAt).toLocaleTimeString("pt-BR").slice(0, 5)
      : t.date || "",
  };
}

function mapVenda(v: any) {
  return {
    ...v,
    date: v.data
      ? new Date(v.data).toLocaleDateString("pt-BR") + " " + new Date(v.data).toLocaleTimeString("pt-BR").slice(0, 5)
      : v.date || "",
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<any>(null);
  const [role, setRole]               = useState("comprador");
  const [balance, setBalance]         = useState(0);
  const [ready, setReady]             = useState(false);
  const [transactions, setTx]         = useState<any[]>([]);
  const [market, setMarket]           = useState(INIT_MARKET);
  const [properties, setProperties]   = useState<any[]>([]);
  const [lotes, setLotes]             = useState<any[]>([]);
  const [vendas, setVendas]           = useState<any[]>([]);
  const [cooperativa, setCooperativa] = useState<any>(null);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_INIT);
  const [certs, setCerts]             = useState<any[]>([]);
  const [projetos, setProjetos]       = useState<any[]>([]);
  const [cotacao, setCotacao]         = useState(88.42);
  const [toast, setToast]             = useState<any>(null);

  // 1. Hidrata sessão
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("cleantrade_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setRole(parsed.role || "comprador");
        setBalance(parsed.saldo || 0);
      }
    } catch {
    } finally {
      setReady(true);
    }
  }, []);

  // 2. Sincroniza saldo no sessionStorage
  useEffect(() => {
    if (!user) return;
    try {
      const saved = sessionStorage.getItem("cleantrade_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.saldo = balance;
        sessionStorage.setItem("cleantrade_user", JSON.stringify(parsed));
      }
    } catch {}
  }, [balance, user]);

  // --- NOVA FUNÇÃO FETCH MARKET OTIMIZADA ---
  const fetchMarket = async () => {
    try {
      // Usamos a rota de marketplace que já filtra ativos
      const response = await fetch("/api/marketplace"); 
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Só atualizamos se houver mudança para evitar re-renders desnecessários
        setMarket(data);
      }
    } catch (error) {
      console.error("Erro no polling do mercado:", error);
    }
  };

  // --- LOGICA DE AUTO-REFRESH (POLLING) ---
  useEffect(() => {
    if (!ready || !user) return;

    // Busca imediata ao carregar
    fetchMarket();

    // Define o intervalo para buscar novos lotes a cada X segundos
    const interval = setInterval(() => {
      fetchMarket();
    }, REFRESH_INTERVAL);

    // Limpa o intervalo quando o componente desmonta ou o usuário desloga
    return () => clearInterval(interval);
  }, [ready, user]);

  // 3. Carrega demais dados ao logar (uma única vez)
  useEffect(() => {
    if (!ready || !user) return;
    const uid = user.id;
    const r   = user.role || role;

    fetch(`/api/usuarios?id=${uid}`).then(res => res.json()).then(data => {
        if (data?.saldo !== undefined) setBalance(data.saldo);
    }).catch(() => {});

    fetch(`/api/transacoes?userId=${uid}`).then(res => res.json()).then(data => { 
        if (Array.isArray(data)) setTx(data.map(mapTransacao)); 
    }).catch(() => {});

    fetch(`/api/properties?userId=${uid}`).then(res => res.json()).then(data => { 
        if (Array.isArray(data)) setProperties(data); 
    }).catch(() => {});

    fetch(`/api/lotes?userId=${uid}`).then(res => res.json()).then(data => { 
        if (Array.isArray(data)) setLotes(data.map(mapLote)); 
    }).catch(() => {});

    fetch(`/api/vendas?userId=${uid}&role=${r}`).then(res => res.json()).then(data => { 
        if (Array.isArray(data)) setVendas(data.map(mapVenda)); 
    }).catch(() => {});

    fetch(`/api/certificados?userId=${uid}`).then(res => res.json()).then(data => { 
        if (Array.isArray(data)) setCerts(data); 
    }).catch(() => {});

    fetch("/api/cooperativa").then(res => res.json()).then(data => { 
        if (data?.id) setCooperativa(data); 
    }).catch(() => {});

    fetch(`/api/projetos?userId=${uid}`).then(res => res.json()).then(data => { 
        if (Array.isArray(data)) setProjetos(data); 
    }).catch(() => {});

  }, [ready, user]);

  const showToast = (msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const login = async (email: string, senha: string) => {
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
        sessionStorage.setItem("cleantrade_user", JSON.stringify(data));
        return data;
      } else {
        showToast(data.error || "Erro ao fazer login", "error");
        return null;
      }
    } catch {
      showToast("Erro de conexao com o servidor", "error");
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
    setCerts([]);
    setMarket(INIT_MARKET);
    sessionStorage.removeItem("cleantrade_user");
  };

  const publicarLote = async (novoLote: any) => {
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
          status:        novoLote.status || "ativo",
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setLotes(prev => {
          const filtered = prev.filter((l: any) => l.id !== novoLote.id);
          return [...filtered, mapLote(data)];
        });
        
        // Dispara a atualização do mercado IMEDIATAMENTE após postar
        fetchMarket();
        
        showToast(data.status === "ativo" ? "Lote publicado no Marketplace!" : "Rascunho salvo!");
        return data;
      }
    } catch {
      showToast("Erro de comunicacao com o banco", "error");
    }
  };

  const aderirCooperativa = async (plano = "basico") => {
    try {
      const response = await fetch("/api/cooperativa/aderir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plano }),
      });
      const data = await response.json();
      if (response.ok) {
        const taxa = ({ basico: 300, premium: 800, enterprise: 2000 } as any)[plano] || 300;
        setBalance((prev: number) => prev - taxa);
        showToast(`Plano ${plano} ativado.`, "success");
        fetch("/api/cooperativa").then(r => r.json()).then(d => { if (d?.id) setCooperativa(d); });
        return data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const markNotifRead = (id: string) => setNotifications((ns: any[]) => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead   = ()          => setNotifications((ns: any[]) => ns.map(n => ({ ...n, read: true })));

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
      certs, setCerts,
      notifications, markNotifRead, markAllRead,
      projetos, setProjetos,
      cotacao, setCotacao,
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