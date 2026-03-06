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
    email: "", password: "", nome: "", documento: "", empresa: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
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
      } catch {
        showToast("Erro de conexão", "error");
      } finally {
        setLoading(false);
      }
    } else {
      const success = await login(formData.email, formData.password);
      if (success) {
        showToast(`Bem-vindo, ${success.nome}!`, "success");
        router.push("/");
      } else {
        setLoading(false);
      }
    }
  };

  const BG = "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80')";

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">

      {/* ── LADO VISUAL — oculto no mobile ── */}
      <div
        className="hidden lg:flex flex-1 relative items-end p-16 text-white"
        style={{ backgroundImage: BG, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(14,83,45,0.9), transparent)" }} />
        <div className="relative z-10 max-w-[450px]">
          <div className="w-[50px] h-[50px] bg-green-600 rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg">🌱</div>
          <h1 className="text-[42px] font-extrabold mb-4" style={{ fontFamily: "Playfair Display, serif" }}>CleanTrade</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            {isRegistering
              ? "Junte-se a centenas de produtores que já monetizam sua preservação ambiental."
              : "Acesse sua conta e acompanhe a valorização dos seus ativos verdes."}
          </p>
        </div>
      </div>

      {/* ── LADO DO FORMULÁRIO ── */}
      {/* Mobile: tela cheia com imagem de fundo | Desktop: painel branco fixo */}
      <div
        className="relative flex-1 lg:flex-none lg:w-[550px] flex items-center justify-center p-6 lg:p-10 bg-white"
        style={{
          // Só aplica o background no mobile (lg sobrescreve com bg-white)
        }}
      >
        {/* Overlay de fundo — só aparece no mobile */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            backgroundImage: BG,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{ background: "linear-gradient(to top, rgba(5,46,22,0.82) 60%, rgba(14,83,45,0.55))" }}
        />

        {/* Card do formulário */}
        <div
          className="relative z-10 w-full max-w-[360px] rounded-3xl p-7 lg:p-0 lg:rounded-none"
          style={{
            // No mobile: card com vidro fosco. No desktop: sem background extra.
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-xl shadow-lg">🌱</div>
            <span className="text-white text-xl font-extrabold" style={{ fontFamily: "Playfair Display, serif" }}>CleanTrade</span>
          </div>

          <div className="mb-6">
            <h2
              className="text-2xl lg:text-3xl font-extrabold text-white lg:text-gray-900"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {isRegistering ? "Criar nova conta" : "Acessar plataforma"}
            </h2>
            <p className="text-white/70 lg:hidden text-sm mt-1">
              {isRegistering ? "Preencha os dados abaixo" : "Bem-vindo de volta"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-[11px] font-extrabold text-white/60 lg:text-slate-400 mb-1.5 tracking-[0.5px]">NOME COMPLETO</label>
                  <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu nome"
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                               bg-white/15 border-white/25 text-white placeholder-white/40
                               lg:bg-slate-50 lg:border-slate-200 lg:text-gray-900 lg:placeholder-slate-400"
                    required />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-white/60 lg:text-slate-400 mb-1.5 tracking-[0.5px]">EMPRESA / FAZENDA</label>
                  <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Nome da propriedade"
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                               bg-white/15 border-white/25 text-white placeholder-white/40
                               lg:bg-slate-50 lg:border-slate-200 lg:text-gray-900 lg:placeholder-slate-400" />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-extrabold text-white/60 lg:text-slate-400 mb-1.5 tracking-[0.5px]">E-MAIL</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ex: gustavo@cleantrade.com"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                           bg-white/15 border-white/25 text-white placeholder-white/40
                           lg:bg-slate-50 lg:border-slate-200 lg:text-gray-900 lg:placeholder-slate-400"
                required />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-white/60 lg:text-slate-400 mb-1.5 tracking-[0.5px]">SENHA</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                           bg-white/15 border-white/25 text-white placeholder-white/40
                           lg:bg-slate-50 lg:border-slate-200 lg:text-gray-900 lg:placeholder-slate-400"
                required />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-[15px] cursor-pointer mt-1 transition-opacity disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", boxShadow: "0 4px 16px rgba(22,163,74,0.4)" }}
            >
              {loading ? "Processando..." : (isRegistering ? "Concluir Cadastro" : "Entrar na Conta")}
            </button>
          </form>

          <div className="text-center mt-5">
            <p className="text-sm text-white/70 lg:text-slate-500">
              {isRegistering ? "Já possui uma conta?" : "Ainda não tem acesso?"}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="bg-transparent border-none font-bold cursor-pointer ml-1 text-green-400 lg:text-green-600"
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