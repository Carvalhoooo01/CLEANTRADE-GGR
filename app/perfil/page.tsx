"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Btn } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { useRouter } from "next/navigation";

function ModalSenha({ onClose, onSave }) {
  const [form, setForm] = useState({ senhaAtual: "", novaSenha: "", confirmar: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErro("");
    if (!form.senhaAtual || !form.novaSenha || !form.confirmar) return setErro("Preencha todos os campos.");
    if (form.novaSenha !== form.confirmar) return setErro("Nova senha e confirmação não coincidem.");
    if (form.novaSenha.length < 6) return setErro("Nova senha deve ter ao menos 6 caracteres.");
    setLoading(true);
    await onSave(form.senhaAtual, form.novaSenha);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-7 w-full max-w-[400px] shadow-2xl">
        <h3 className="text-lg font-extrabold mb-5">🔒 Alterar Senha</h3>
        <div className="flex flex-col gap-3.5">
          {[
            { label: "Senha Atual",          key: "senhaAtual" },
            { label: "Nova Senha",           key: "novaSenha"  },
            { label: "Confirmar Nova Senha", key: "confirmar"  },
          ].map((item) => (
            <div key={item.key}>
              <p className="text-xs font-bold text-slate-500 uppercase">{item.label}</p>
              <input type="password" value={form[item.key]} onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none box-border" />
            </div>
          ))}
        </div>
        {erro && <p className="text-red-500 text-sm mt-3 font-semibold">⚠️ {erro}</p>}
        <div className="flex gap-2.5 mt-6">
          <Btn variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn onClick={handleSubmit} style={{ flex: 1 }} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Btn>
        </div>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const { user, setUser, role, showToast, logout } = useApp();
  const router = useRouter();
  const [isEditing, setIsEditing]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [showModalSenha, setShowModalSenha] = useState(false);

  const [profile, setProfile] = useState({
    nome:        user?.nome        || "",
    fazenda:     user?.empresa     || "",
    documento:   user?.documento   || "",
    localizacao: user?.localizacao || "",
    wallet:      user?.wallet      || "0x71C2465645f92",
    email:       user?.email       || "",
  });

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(profile.wallet);
    showToast("Endereço da carteira copiado!", "success");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/usuarios/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, nome: profile.nome, email: profile.email, empresa: profile.fazenda, documento: profile.documento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setUser(prev => ({ ...prev, ...data }));
      try {
        const saved = sessionStorage.getItem("cleantrade_user");
        if (saved) sessionStorage.setItem("cleantrade_user", JSON.stringify({ ...JSON.parse(saved), ...data }));
      } catch {}
      setIsEditing(false);
      showToast("Dados atualizados com sucesso!", "success");
    } catch (err) {
      showToast(err.message || "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Deseja realmente sair da conta?")) return;
    logout();
    showToast("Sessão encerrada com sucesso.", "info");
    setTimeout(() => router.push("/login"), 800);
  };

  const handleChangePassword = async (senhaAtual, novaSenha) => {
    try {
      const res  = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, senhaAtual, novaSenha }),
      });
      const data = await res.json();
      if (res.ok) { showToast("Senha alterada com sucesso!", "success"); setShowModalSenha(false); }
      else showToast(data.error || "Erro ao alterar senha.", "error");
    } catch { showToast("Erro de conexão com o servidor.", "error"); }
  };

  return (
    <div className="flex flex-col gap-5 pb-10">

      {showModalSenha && <ModalSenha onClose={() => setShowModalSenha(false)} onSave={handleChangePassword} />}

      {/* Cabeçalho */}
      <Card style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", border: "none", color: "#fff", padding: "30px 20px" }}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl border-4 border-white/30 font-bold text-white">
            {(profile.nome || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold m-0">{profile.nome}</h2>
            <p className="text-sm opacity-90 my-1">
              {role === "vendedor" ? "Produtor Rural" : "Comprador"}{profile.fazenda ? ` • ${profile.fazenda}` : ""}
            </p>
            <div className="mt-2">
              <Badge label={role.toUpperCase()} color="rgba(255,255,255,0.2)" />
            </div>
          </div>
        </div>
      </Card>

      {/* Identidade Digital */}
      <Card>
        <p className="text-xs font-bold text-gray-400 mb-3 uppercase">Sua Identidade Digital (DID)</p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-500 font-extrabold m-0">CARTEIRA DE RECEBIMENTO</p>
            <p className="text-[15px] font-mono text-gray-900 mt-1">{profile.wallet}</p>
          </div>
          <button onClick={handleCopyWallet} className="bg-white border border-slate-200 p-2 rounded-lg cursor-pointer">
            {Icons.copy || "📋"}
          </button>
        </div>
      </Card>

      {/* Dados Cadastrais */}
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-extrabold m-0">Dados Cadastrais</h3>
          {isEditing
            ? <Btn small onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Btn>
            : <Btn small variant="outline" onClick={() => setIsEditing(true)}>Editar</Btn>
          }
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: "Nome Completo",             key: "nome"        },
            { label: "Nome da Fazenda / Empresa", key: "fazenda"     },
            { label: "CNPJ / CPF",                key: "documento"   },
            { label: "Localização",               key: "localizacao" },
            { label: "E-mail",                    key: "email"       },
          ].map((item) => (
            <div key={item.key} className="border-b border-slate-100 pb-2.5">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">{item.label}</p>
              {isEditing ? (
                <input value={profile[item.key]} onChange={(e) => setProfile({ ...profile, [item.key]: e.target.value })}
                  className="w-full p-2 rounded-md border border-gray-300 text-sm font-[inherit] box-border" />
              ) : (
                <p className="text-[15px] font-semibold text-slate-800 m-0">
                  {profile[item.key] || <span className="text-gray-300">Não informado</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Segurança */}
      <div className="flex flex-col gap-2.5">
        <Btn variant="outline" onClick={() => setShowModalSenha(true)} style={{ justifyContent: "flex-start", padding: "15px", background: "#fff" }}>
          {Icons.lock || "🔒"} Alterar Senha de Acesso
        </Btn>
        <Btn variant="outline" onClick={handleLogout} style={{ justifyContent: "flex-start", padding: "15px", color: "#ef4444", borderColor: "#fee2e2", background: "#fff" }}>
          {Icons.logout || "🚪"} Sair da Conta
        </Btn>
      </div>

      <div className="text-center mt-5">
        <p className="text-xs text-gray-400">CleanTrade v1.0.4 - Cascavel/PR</p>
      </div>
    </div>
  );
}