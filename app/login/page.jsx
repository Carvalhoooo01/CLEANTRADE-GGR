"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { showToast, login } = useApp();
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nome: "",
    documento: "",
    empresa: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      // --- CADASTRO REAL NO BANCO ---
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (res.ok) {
          showToast("Conta criada com sucesso! Faça login.", "success");
          setIsRegistering(false);
        } else {
          showToast(data.error || "Erro ao cadastrar", "error");
        }
      } catch (err) {
        showToast("Erro de conexão", "error");
      } finally {
        setLoading(false);
      }
    } else {
      // --- LOGIN REAL NO BANCO ---
      const success = await login(formData.email, formData.password);

      if (success) {
        showToast(`Bem-vindo, ${success.nome}!`, "success");
        router.push("/");
      } else {
        // O showToast de erro já é disparado dentro da função login do AppContext
        setLoading(false);
      }
    }
  };

  return (
    <div style={containerStyle}>
      {/* LADO VISUAL */}
      <div style={visualSideStyle}>
        <div style={overlayStyle} />
        <div style={contentSideStyle}>
          <div style={logoBadgeStyle}>🌱</div>
          <h1 style={titleStyle}>CleanTrade</h1>
          <p style={subtitleStyle}>
            {isRegistering 
              ? "Junte-se a centenas de produtores que já monetizam sua preservação ambiental."
              : "Acesse sua conta e acompanhe a valorização dos seus ativos verdes."}
          </p>
        </div>
      </div>

      {/* LADO DO FORMULÁRIO */}
      <div style={formSideStyle}>
        <div style={formWrapperStyle}>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", fontFamily: 'Playfair Display, serif' }}>
              {isRegistering ? "Criar nova conta" : "Acessar plataforma"}
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>NOME COMPLETO</label>
                  <input 
                    type="text" name="nome" value={formData.nome}
                    onChange={handleChange} placeholder="Seu nome" 
                    style={inputStyle} required 
                  />
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>EMPRESA / FAZENDA</label>
                  <input 
                    type="text" name="empresa" value={formData.empresa}
                    onChange={handleChange} placeholder="Nome da propriedade" 
                    style={inputStyle} 
                  />
                </div>
              </>
            )}

            <div style={inputGroupStyle}>
              <label style={labelStyle}>E-MAIL</label>
              <input 
                type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="ex: gustavo@cleantrade.com" 
                style={inputStyle} required 
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>SENHA</label>
              <input 
                type="password" name="password" value={formData.password}
                onChange={handleChange} placeholder="••••••••" 
                style={inputStyle} required 
              />
            </div>

            <button type="submit" disabled={loading} style={mainBtnStyle}>
              {loading ? "Processando..." : (isRegistering ? "Concluir Cadastro" : "Entrar na Conta")}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              {isRegistering ? "Já possui uma conta?" : "Ainda não tem acesso?"}
              <button 
                onClick={() => setIsRegistering(!isRegistering)} 
                style={toggleBtnStyle}
              >
                {isRegistering ? " Faça Login" : " Criar Conta"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ESTILOS (IGUAIS AO SEU ORIGINAL) ---
const containerStyle = { display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: 'DM Sans, sans-serif' };
const visualSideStyle = { flex: 1, position: "relative", backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "flex-end", padding: "60px", color: "white" };
const overlayStyle = { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(14, 83, 45, 0.9), transparent)" };
const contentSideStyle = { position: "relative", zIndex: 2, maxWidth: "450px" };
const logoBadgeStyle = { width: "50px", height: "50px", background: "#16a34a", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "20px", boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const titleStyle = { fontSize: "42px", fontWeight: "800", marginBottom: "16px", fontFamily: 'Playfair Display, serif' };
const subtitleStyle = { fontSize: "18px", opacity: 0.9, lineHeight: "1.5" };
const formSideStyle = { width: "550px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: "40px" };
const formWrapperStyle = { width: "100%", maxWidth: "360px" };
const inputGroupStyle = { marginBottom: "18px" };
const labelStyle = { display: "block", fontSize: "11px", fontWeight: "800", color: "#94a3b8", marginBottom: "6px", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", background: "#f8fafc", transition: '0.2s' };
const mainBtnStyle = { width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontWeight: "700", fontSize: "15px", cursor: "pointer", marginTop: "10px", boxShadow: '0 4px 12px rgba(22,163,74,0.3)' };
const toggleBtnStyle = { background: "none", border: "none", color: "#16a34a", fontWeight: "700", cursor: "pointer", marginLeft: "5px" };