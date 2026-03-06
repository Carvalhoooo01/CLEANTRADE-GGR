"use client";
import { useApp } from "@/context/AppContext";
import { fmt, fmtCO2 } from "@/data/constants";

const STATUS_COR: Record<string, string> = {
  disponivel:  "#16a34a",
  reservado:   "#f59e0b",
  transferido: "#6b7280",
};

export default function InventarioPage() {
  const { certs, properties, lotes, transactions } = useApp();

  const totalCO2Certs     = certs.length;
  const totalCO2Comprado  = transactions?.filter((t: any) => t.type !== "deposito" && t.type !== "saque").reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0;
  const totalPropriedades = properties?.reduce((s: number, p: any) => s + (p.co2 || 0), 0) || 0;
  const totalLotes        = lotes?.reduce((s: number, l: any) => s + (l.quantidade || 0), 0) || 0;

  const porStatus = certs.reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header
          Mobile: KPIs em 2 colunas | Desktop: flex gap-8 (original) */}
      <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)" }}
        className="rounded-2xl px-8 py-7 text-white">
        <p className="opacity-70 text-xs font-semibold uppercase tracking-widest mb-1.5">Inventario de Carbono</p>
        <h2 className="text-2xl font-extrabold mb-4">Seus Ativos CO2</h2>

        {/* Mobile: grid 2 colunas | Desktop: flex row (original) */}
        <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-8 lg:flex-wrap">
          {[
            { label: "Certificados",       value: totalCO2Certs },
            { label: "CO2 Adquirido",      value: fmtCO2(totalCO2Comprado) },
            { label: "CO2 Propriedades",   value: fmtCO2(totalPropriedades) },
            { label: "Em Estoque (lotes)", value: fmtCO2(totalLotes) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xl font-black">{value}</p>
              <p className="text-xs opacity-65 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status dos certificados
          Mobile: 1 coluna | Desktop: 3 colunas (original) */}
      {certs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {Object.entries(porStatus).map(([status, qtd]) => (
            <div key={status} className="bg-white rounded-2xl p-5 flex items-center gap-4 lg:block"
              style={{ border: `1px solid ${STATUS_COR[status] || "#e5e7eb"}30`, borderLeft: `4px solid ${STATUS_COR[status] || "#6b7280"}` }}>
              {/* Mobile: numero à esquerda, texto à direita */}
              <p className="text-3xl font-black lg:mb-1" style={{ color: STATUS_COR[status] || "#374151" }}>{qtd as number}</p>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">{status}</p>
                <p className="text-xs text-gray-500">{(qtd as number) === 1 ? "certificado" : "certificados"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de certificados
          Mobile: scroll horizontal | Desktop: tabela normal (original) */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="font-extrabold text-sm">Certificados ({certs.length})</p>
        </div>
        {certs.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🌿</p>
            <p className="font-semibold mb-1">Nenhum certificado ainda</p>
            <p className="text-sm">Faca uma compra no marketplace para gerar seus creditos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50">
                  {["Serial", "Padrao", "Projeto", "Ano", "Status", "Emitido em"].map(h => (
                    <th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certs.map((c: any, i: number) => (
                  <tr key={c.id} className="border-t border-slate-100" style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td className="px-5 py-3 text-xs font-bold font-mono text-gray-700 whitespace-nowrap">{c.serial}</td>
                    <td className="px-5 py-3 text-xs text-gray-700">{c.standard}</td>
                    <td className="px-5 py-3 text-xs text-gray-700">{c.projectId}</td>
                    <td className="px-5 py-3 text-xs text-gray-700">{c.year}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: `${STATUS_COR[c.status] || "#6b7280"}15`, color: STATUS_COR[c.status] || "#6b7280", border: `1px solid ${STATUS_COR[c.status] || "#6b7280"}30` }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : c.date || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Propriedades — original inalterado (auto-fill ja funciona no mobile) */}
      {properties?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <p className="font-extrabold text-sm">Propriedades Registradas</p>
          </div>
          <div className="grid gap-3.5 p-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {properties.map((p: any) => (
              <div key={p.id} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="font-bold text-sm mb-2">{p.name}</p>
                <p className="text-xs text-gray-500">Area: <strong>{p.area} ha</strong></p>
                <p className="text-xs text-green-600 font-bold mt-1">CO2: {fmtCO2(p.co2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}