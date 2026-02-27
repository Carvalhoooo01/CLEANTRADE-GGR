"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Btn, Badge } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2 } from "@/data/constants";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function NovaOfertaPage() {
  const { user, setLotes, publicarLote, showToast } = useApp();
  const router = useRouter();
  const [tipo,  setTipo]  = useState("Florestal");
  const [cert,  setCert]  = useState("Verra");
  const [nome,  setNome]  = useState("FLOR-VER-2026");
  const [qty,   setQty]   = useState("10");
  const [preco, setPreco] = useState("40");
  const [pub,   setPub]   = useState(true);
  const [desc,  setDesc]  = useState("");
  const [loading, setLoading] = useState(false);

  const receita = (parseFloat(qty) || 0) * (parseFloat(preco) || 0);
  const chartData = [
    { l: "25%",  v: receita * 0.25 },
    { l: "50%",  v: receita * 0.5  },
    { l: "100%", v: receita        },
  ];

  const handleSubmit = async () => {
    if (!nome || !qty || !preco) {
      showToast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    setLoading(true);

    // Objeto com campos no padrão que o AppContext/API esperam
    const novoLote = {
      // campos UI (para o estado local)
      name:       nome,
      type:       tipo,
      cert,
      // campos DB (para publicarLote → /api/lotes)
      nome,
      tipo,
      certificadora: cert,
      descricao:  desc || `Crédito ${tipo}`,
      quantidade: parseInt(qty),
      preco:      parseFloat(preco),
      status:     "ativo",
      vendidos:   0,
    };

    if (pub) {
      // Publica no banco; AppContext devolve lote com id real do DB
      const salvo = await publicarLote(novoLote);
      if (salvo) {
        showToast("Lote criado e publicado no Marketplace! 🎉", "success");
      }
    } else {
      // Apenas estado local (rascunho)
      setLotes(ls => [...ls, { ...novoLote, id: Date.now() }]);
      showToast("Lote salvo como rascunho!", "success");
    }

    setLoading(false);
    router.push("/meus-lotes");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, alignItems: "start" }}>
      {/* Formulário */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Criar Novo Lote</p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>Preencha os dados do crédito que deseja anunciar</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Código / Nome *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} style={fieldStyle} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tipo de Crédito *</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Florestal", "Energia", "Biodiversidade", "Rec. Hídricos"].map(t => (
                <button key={t} onClick={() => setTipo(t)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: tipo === t ? "1px solid #0ea5e9" : "1px solid #e5e7eb", background: tipo === t ? "#f0f9ff" : "white", color: tipo === t ? "#0ea5e9" : "#6b7280", fontFamily: "inherit" }}>{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Certificadora *</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Verra", "Gold Standard", "Biofilica"].map(c => (
                <button key={c} onClick={() => setCert(c)} style={{ padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: cert === c ? "1px solid #16a34a" : "1px solid #e5e7eb", background: cert === c ? "#f0fdf4" : "white", color: cert === c ? "#16a34a" : "#6b7280", fontFamily: "inherit" }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Quantidade (tCO₂) *</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Preço por tCO₂ (R$) *</label>
              <input type="number" value={preco} onChange={e => setPreco(e.target.value)} style={fieldStyle} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Descrição</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Descreva o projeto..." style={{ ...fieldStyle, resize: "vertical" }} />
          </div>

          <div style={{ background: "#f0f9ff", borderRadius: 10, padding: "10px 14px", border: "1px solid #bae6fd", fontSize: 12, color: "#0369a1" }}>
            💡 <strong>Créditos são indivisíveis</strong> — cada unidade = 1 tCO₂ com ID único no Verra Registry.
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
            <input type="checkbox" checked={pub} onChange={e => setPub(e.target.checked)} style={{ width: 15, height: 15, accentColor: "#0ea5e9" }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0c4a6e" }}>Publicar no Marketplace agora</p>
              <p style={{ fontSize: 11, color: "#6b7280" }}>Se desmarcado, salva como rascunho</p>
            </div>
          </label>

          <Btn
            style={{ justifyContent: "center", width: "100%", background: "linear-gradient(135deg,#0ea5e9,#38bdf8)", boxShadow: "0 3px 12px rgba(14,165,233,0.3)" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {Icons.check} {loading ? "Salvando..." : (pub ? "Criar e Publicar" : "Salvar Rascunho")}
          </Btn>
        </div>
      </div>

      {/* Preview + estimativa */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 14 }}>Preview do Anúncio</p>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{nome || "—"}</p>
                <p style={{ fontSize: 11, color: "#6b7280" }}>{tipo} · {cert}</p>
              </div>
              <Badge label="ATIVO" color="#16a34a" />
            </div>
            {[
              ["Certificadora", cert],
              ["Disponível", fmtCO2(parseInt(qty) || 0)],
              ["Preço", fmt(parseFloat(preco) || 0) + "/tCO₂"],
              ["IDs Verra", `${parseInt(qty) || 0} créditos únicos`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{k}:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {receita > 0 && (
          <div style={{ background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)", borderRadius: 14, padding: 18, border: "1px solid #bae6fd" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0c4a6e", marginBottom: 12 }}>💰 Receita Estimada</p>
            {chartData.map(({ l, v }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(255,255,255,0.6)", borderRadius: 7, marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Se vender {l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0c4a6e" }}>{fmt(v)}</span>
              </div>
            ))}
            <ResponsiveContainer width="100%" height={60} style={{ marginTop: 10 }}>
              <BarChart data={chartData} barSize={22}>
                <Bar dataKey="v" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <XAxis dataKey="l" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => fmt(v)} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

const fieldStyle = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#111827" };
