"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Btn, Badge } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2 } from "@/data/constants";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function NovaOfertaPage() {
  const { user, publicarLote, showToast, cotacao } = useApp();
  const router = useRouter();

  const [modalidade,   setModalidade]   = useState("A");
  const [serialVerra,  setSerialVerra]  = useState("");
  const [numeroCAR,    setNumeroCAR]    = useState(""); // Alterado de urlMapa para numeroCAR
  const [tipo,         setTipo]         = useState("Florestal");
  const [cert,         setCert]         = useState("Verra");
  const [nome,         setNome]         = useState("");
  const [qty,          setQty]          = useState("10");
  const [pub,          setPub]          = useState(true);
  const [desc,         setDesc]         = useState("");
  const [loading,      setLoading]      = useState(false);

  const receita   = (parseFloat(qty) || 0) * cotacao;
  const chartData = [
    { l: "25%",  v: receita * 0.25 },
    { l: "50%",  v: receita * 0.5  },
    { l: "100%", v: receita        },
  ];

  const handleNumericInput = (val, setter) => {
    const cleaned = val.replace(",", ".");
    if (/^\d*\.?\d*$/.test(cleaned) || cleaned === "") setter(cleaned);
  };

  const handleSubmit = async () => {
    if (!nome || !qty) {
      showToast("Preencha os campos obrigatórios", "error");
      return;
    }
    if (modalidade === "A" && !serialVerra) return showToast("Informe o Serial Verra", "error");
    if (modalidade === "B" && !numeroCAR)   return showToast("Informe o Número do CAR", "error");

    setLoading(true);

    const novoLote = {
      nome,
      tipo,
      certificadora: modalidade === "A" ? cert : "CleanTrade Coop",
      descricao:     desc || `Projeto ${modalidade === "A" ? "Verificado" : "via CAR/Originação"}`,
      quantidade:    parseFloat(qty),
      preco:         cotacao,
      userId:        user.id,
      status:        pub ? "ativo" : "rascunho",
      tipoCert:      modalidade === "A" ? "EXISTENTE" : "ORIGINACAO",
      serialVerra:   modalidade === "A" ? serialVerra : null,
      urlMapa:       modalidade === "B" ? numeroCAR : null, // Mapeado para o campo urlMapa do banco
      vendidos:      0,
    };

    try {
      const salvo = await publicarLote(novoLote);
      if (salvo) {
        showToast(pub ? "Lote publicado! 🌿" : "Rascunho salvo! 📝", "success");
        router.push("/meus-lotes");
      }
    } catch {
      showToast("Erro ao conectar com o servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, alignItems: "start" }}>

      {/* Formulário */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Nova Oferta de Ativo</p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 18 }}>Escolha como deseja certificar seu estoque de carbono</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* SELETOR MODALIDADE A/B */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 5 }}>
            <div onClick={() => setModalidade("A")} style={optionCardStyle(modalidade === "A", "#16a34a")}>
              <p style={{ fontSize: 18 }}>📜</p>
              <p style={{ fontWeight: 700, fontSize: 13 }}>Crédito Existente</p>
              <p style={{ fontSize: 10, opacity: 0.7 }}>Já possuo Serial Verra</p>
            </div>
            <div onClick={() => setModalidade("B")} style={optionCardStyle(modalidade === "B", "#0ea5e9")}>
              <p style={{ fontSize: 18 }}>🛡️</p>
              <p style={{ fontWeight: 700, fontSize: 13 }}>Originação via CAR</p>
              <p style={{ fontSize: 10, opacity: 0.7 }}>Validar área documentalmente</p>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Nome do Projeto / Fazenda *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} style={fieldStyle} placeholder="Ex: Fazenda Santa Maria" />
          </div>

          {/* CAMPOS DINÂMICOS A/B */}
          {modalidade === "A" ? (
            <div>
              <label style={labelStyle}>Número de Série Verra (VCU) *</label>
              <input value={serialVerra} onChange={e => setSerialVerra(e.target.value)} style={fieldStyle} placeholder="Ex: 1234-56789-VCU-BR-..." />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Número do Registro CAR *</label>
              <input value={numeroCAR} onChange={e => setNumeroCAR(e.target.value)} style={fieldStyle} placeholder="Ex: BR-SP-3550308-..." />
            </div>
          )}

          <div>
            <label style={labelStyle}>Quantidade Estimada (tCO₂) *</label>
            <input type="text" inputMode="decimal" value={qty} onChange={e => handleNumericInput(e.target.value, setQty)} style={fieldStyle} />
          </div>

          {/* Cotação — somente leitura */}
          <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase", marginBottom: 2 }}>Cotação de Mercado</p>
              <p style={{ fontSize: 12, color: "#6b7280" }}>Preço garantido no momento da unificação</p>
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#15803d" }}>
              {fmt(cotacao)}<span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280" }}>/t</span>
            </p>
          </div>

          <div>
            <label style={labelStyle}>Tipo de Crédito</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Florestal", "Energia", "Biodiversidade", "Rec. Hídricos"].map(t => (
                <button key={t} onClick={() => setTipo(t)} style={pillStyle(tipo === t, "#0ea5e9")}>{t}</button>
              ))}
            </div>
          </div>

          <label style={toggleCardStyle(pub)}>
            <input type="checkbox" checked={pub} onChange={e => setPub(e.target.checked)} style={checkboxStyle} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: pub ? "#0c4a6e" : "#475569" }}>
                {pub ? "Publicar no Marketplace" : "Salvar apenas como rascunho"}
              </p>
              <p style={{ fontSize: 11, color: "#6b7280" }}>Visível para todos ou apenas no seu inventário</p>
            </div>
          </label>

          <Btn
            style={{ ...btnStyle, background: pub ? "linear-gradient(135deg,#16a34a,#22c55e)" : "#64748b" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processando..." : (pub ? "Criar e Publicar" : "Salvar Rascunho")}
          </Btn>
        </div>
      </div>

      {/* Preview + estimativa */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Preview do Card</p>
          <div style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 14, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800 }}>{nome || "Nome do Projeto"}</p>
                <p style={{ fontSize: 11, color: "#64748b" }}>{tipo} · {modalidade === "A" ? cert : "Coop"}</p>
              </div>
              <Badge
                label={modalidade === "A" ? "VERIFIED" : "CAR-ORIGIN"}
                color={modalidade === "A" ? "#16a34a" : "#0ea5e9"}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Volume:</span>
              <span style={{ fontWeight: 600 }}>{fmtCO2(parseFloat(qty) || 0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>Validação:</span>
              <span style={{ fontWeight: 600 }}>{modalidade === "A" ? "Inviável" : "Documental"}</span>
            </div>
          </div>
        </div>

        {receita > 0 && (
          <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius: 14, padding: 18, border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#15803d", marginBottom: 12 }}>💰 Receita Estimada</p>
            {chartData.map(({ l, v }) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(255,255,255,0.6)", borderRadius: 7, marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Se vender {l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{fmt(v)}</span>
              </div>
            ))}
            <div style={{ width: '100%', height: 60, marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={22}>
                  <Bar dataKey="v" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="l" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => fmt(v)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const optionCardStyle = (active, color) => ({
  padding: "12px", borderRadius: "12px",
  border: `2px solid ${active ? color : "#e5e7eb"}`,
  background: active ? `${color}08` : "#fff",
  cursor: "pointer", textAlign: "center", transition: "all 0.2s"
});

const fieldStyle     = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", color: "#111827", fontFamily: "inherit", boxSizing: "border-box" };
const labelStyle     = { fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 };
const pillStyle      = (active, color) => ({ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", border: active ? `1px solid ${color}` : "1px solid #e5e7eb", background: active ? `${color}10` : "white", color: active ? color : "#6b7280", transition: "0.2s", fontFamily: "inherit" });
const toggleCardStyle = (pub) => ({ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px", background: pub ? "#f0fdf4" : "#f8fafc", borderRadius: 10, border: pub ? "1px solid #bbf7d0" : "1px solid #e2e8f0", transition: "0.2s" });
const checkboxStyle = { width: 16, height: 16, accentColor: "#16a34a" };
const btnStyle       = { justifyContent: "center", width: "100%", height: 45, fontWeight: 700, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" };