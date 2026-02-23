"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { INIT_MARKET, NOTIFICATIONS_INIT } from "@/data/constants";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("comprador");
  const [balance, setBalance] = useState(0);
  const [ready, setReady] = useState(false);

  // Todos os dados começam vazios — só carregam do banco
  const [transactions, setTx] = useState([]);
  const [market, setMarket] = useState(INIT_MARKET);
  const [properties, setProperties] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [certsSeller, setCertsSeller] = useState([]);
  const [certsBuyer, setCertsBuyer] = useState([]);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_INIT);
  const [toast, setToast] = useState(null);

  // 1. Carrega localStorage após montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cleantrade_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setRole(parsed.role || "comprador");
        setBalance(parsed.saldo || 0);
      }
      const savedMarket = localStorage.getItem("cleantrade_market");
      if (savedMarket) setMarket(JSON.parse(savedMarket));
    } catch {
    } finally {
      setReady(true);
    }
  }, []);

  // 2. Sincroniza saldo no localStorage sempre que mudar
  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem("cleantrade_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.saldo = balance;
        localStorage.setItem("cleantrade_user", JSON.stringify(parsed));
      }
    } catch {}
  }, [balance]);

  // 3. Salva mercado no localStorage só após hidratar
  useEffect(() => {
    if (!ready) return;
    if (!market?.length) return;
    try {
      localStorage.setItem("cleantrade_market", JSON.stringify(market));
    } catch {}
  }, [market, ready]);

  // 4. Carrega todos os dados do banco quando usuário estiver pronto
  useEffect(() => {
    if (!ready || !user) return;

    // Transações
    fetch(`/api/transacoes?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setTx(data); })
      .catch(() => {});

    // Propriedades
    fetch(`/api/properties?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setProperties(data); })
      .catch(() => {});

    // Lotes do usuário
    fetch(`/api/lotes?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setLotes(data); })
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
        setBalance(data.saldo);
        localStorage.setItem("cleantrade_user", JSON.stringify(data));
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
    setCertsSeller([]);
    setCertsBuyer([]);
    setMarket(INIT_MARKET);
    localStorage.removeItem("cleantrade_user");
    localStorage.removeItem("cleantrade_market");
  };

  const publicarLote = async (novoLote) => {
    try {
      const response = await fetch("/api/lotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...novoLote, userId: user.id }),
      });
      const data = await response.json();
      if (response.ok) {
        setLotes((prev) => [...prev, data]);
        showToast("Lote publicado com sucesso!");
        return data;
      } else {
        showToast("Erro ao salvar lote no banco", "error");
      }
    } catch {
      showToast("Erro de comunicação com o banco de dados", "error");
    }
  };

  const fetchMarket = async () => {
    try {
      const response = await fetch("/api/lotes");
      const data = await response.json();
      if (response.ok) setMarket(data);
    } catch (error) {
      console.error("Erro ao carregar mercado:", error);
    }
  };

  const markNotifRead = (id) =>
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () =>
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));

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
      certsSeller, setCertsSeller,
      certsBuyer, setCertsBuyer,
      notifications, markNotifRead, markAllRead,
      publicarLote, fetchMarket,
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