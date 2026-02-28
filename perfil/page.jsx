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
    if (!form.senhaAtual || !form.novaSenha || !form.confirmar)
      return setErro("Preencha todos os campos.");
    if (form.novaSenha !== form.confirmar)
      return setErro("Nova senha e confirmação não coincidem.");
    if (form.novaSenha.length < 6)
      return setErro("Nova senha deve ter ao menos 6 caracteres.");
    setLoading(true);
    await onSave(form.senhaAtual, form.novaSenha);
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "8px",
    border: "1px solid #e2e8f0", fontSize: "14px",
    boxSizing: "border-box", outline: "none", marginTop: "4px"
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px" }}>🔒 Alterar Senha</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { label: "Senha Atual",           key: "senhaAtual" },
            { label: "Nova Senha",            key: "novaSenha" },
            { label: "Confirmar Nova Senha",  key: "confirmar" },
          ].map((item) => (
            <div key={item.key}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>{item.label}</p>
              <input type="password" value={form[item.key]} onChange={(e) => setForm({ ...form, [item.key]: e.target.value })} style={inputStyle} />
            </div>
          ))}
        </div>
        {erro && <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "12px", fontWeight: "600" }}>⚠️ {erro}</p>}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, senhaAtual, novaSenha }),
      });
      const data = await res.json();
      if (res.ok) { showToast("Senha alterada com sucesso!", "success"); setShowModalSenha(false); }
      else showToast(data.error || "Erro ao alterar senha.", "error");
    } catch { showToast("Erro de conexão com o servidor.", "error"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "40px" }}>

      {showModalSenha && <ModalSenha onClose={() => setShowModalSenha(false)} onSave={handleChangePassword} />}

      {/* CABEÇALHO */}
      <Card style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", border: "none", color: "#fff", padding: "30px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", border: "4px solid rgba(255,255,255,0.3)", fontWeight: "bold", color: "#fff" }}>
            {(profile.nome || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}>{profile.nome}</h2>
            <p style={{ fontSize: "14px", opacity: 0.9, margin: "4px 0" }}>
              {role === "vendedor" ? "Produtor Rural" : "Comprador"}{profile.fazenda ? ` • ${profile.fazenda}` : ""}
            </p>
            <div style={{ marginTop: "8px" }}>
              <Badge label={role.toUpperCase()} color="rgba(255,255,255,0.2)" />
            </div>
          </div>
        </div>
      </Card>

      {/* IDENTIDADE DIGITAL */}
      <Card>
        <p style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", marginBottom: "12px", textTransform: "uppercase" }}>Sua Identidade Digital (DID)</p>
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", margin: 0 }}>CARTEIRA DE RECEBIMENTO</p>
            <p style={{ fontSize: "15px", fontFamily: "monospace", color: "#111827", marginTop: "4px" }}>{profile.wallet}</p>
          </div>
          <button onClick={handleCopyWallet} style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "8px", cursor: "pointer" }}>
            {Icons.copy || "📋"}
          </button>
        </div>
      </Card>

      {/* DADOS CADASTRAIS */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0 }}>Dados Cadastrais</h3>
          {isEditing
            ? <Btn small onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Btn>
            : <Btn small variant="outline" onClick={() => setIsEditing(true)}>Editar</Btn>
          }
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {[
            { label: "Nome Completo",         key: "nome" },
            { label: "Nome da Fazenda / Empresa", key: "fazenda" },
            { label: "CNPJ / CPF",            key: "documento" },
            { label: "Localização",           key: "localizacao" },
            { label: "E-mail",                key: "email" },
          ].map((item) => (
            <div key={item.key} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</p>
              {isEditing ? (
                <input value={profile[item.key]} onChange={(e) => setProfile({ ...profile, [item.key]: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }} />
              ) : (
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  {profile[item.key] || <span style={{ color: "#d1d5db" }}>Não informado</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* SEGURANÇA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Btn variant="outline" onClick={() => setShowModalSenha(true)} style={{ justifyContent: "flex-start", padding: "15px", background: "#fff" }}>
          {Icons.lock || "🔒"} Alterar Senha de Acesso
        </Btn>
        <Btn variant="outline" onClick={handleLogout} style={{ justifyContent: "flex-start", padding: "15px", color: "#ef4444", borderColor: "#fee2e2", background: "#fff" }}>
          {Icons.logout || "🚪"} Sair da Conta
        </Btn>
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>CleanTrade v1.0.4 - Cascavel/PR</p>
      </div>
    </div>
  );
}