"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Btn, Badge } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { STATUS_COLORS } from "@/data/constants";

const EMPTY_FORM = { name: "", car: "", area: "", areaProd: "", region: "", coop: "", lat: "", lng: "", status: "ativo", co2: "" };

export default function PropriedadesPage() {
  const { user, properties, setProperties, showToast } = useApp();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [mapOpen,    setMapOpen]    = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) return showToast("Digite um nome mais completo", "info");
    try {
      setLoadingLoc(true);
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setForm(f => ({ ...f, lat: parseFloat(data[0].lat).toFixed(6), lng: parseFloat(data[0].lon).toFixed(6) }));
        showToast("Localização encontrada!", "success");
      } else {
        showToast("Local não encontrado.", "warning");
      }
    } catch { showToast("Erro na busca.", "error"); }
    finally   { setLoadingLoc(false); }
  };

  const getDeviceLocation = () => {
    setLoadingLoc(true);
    if (!navigator.geolocation) { showToast("GPS não disponível", "error"); setLoadingLoc(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLoadingLoc(false);
        showToast("GPS capturado!", "success");
      },
      () => { showToast("Ative o GPS do aparelho", "error"); setLoadingLoc(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleOpenEdit = (property: any) => {
    setEditingId(property.id);
    setForm(property);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.car) return showToast("Preencha o Nome e o CAR", "error");
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/properties", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name: form.name, area: parseFloat(form.area) || 0, car: form.car || null, status: form.status || "ativo", co2: parseFloat(form.co2) || 0, lat: form.lat || null, lng: form.lng || null }),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
        const updated = await res.json();
        setProperties((prev: any[]) => prev.map(p => p.id === editingId ? { ...updated, lat: form.lat, lng: form.lng } : p));
        showToast("Propriedade atualizada!", "success");
      } else {
        const res = await fetch("/api/properties", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, area: parseFloat(form.area) || 0, car: form.car || null, status: "ativo", co2: parseFloat(form.co2) || 0, lat: form.lat || null, lng: form.lng || null, userId: user.id }),
        });
        if (!res.ok) throw new Error("Erro ao criar");
        const created = await res.json();
        setProperties((prev: any[]) => [...prev, { ...created, lat: form.lat, lng: form.lng }]);
        showToast("Propriedade cadastrada!", "success");
      }
    } catch {
      showToast("Erro ao salvar propriedade", "error");
    } finally {
      setSaving(false);
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">🌳 Minhas Propriedades</h2>
            <p className="text-sm text-gray-500">Gerenciamento de áreas e georreferenciamento.</p>
          </div>
          <Btn onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); }}>
            Novo Cadastro
          </Btn>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}>
        {properties.map((p: any) => (
          <div key={p.id} className="border border-gray-200 rounded-2xl p-5 bg-white">
            <div className="flex justify-between mb-4">
              <h3 className="text-base font-bold">{p.name}</h3>
              <Badge label={p.status} color={STATUS_COLORS[p.status]} />
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 font-extrabold">COORDENADAS</p>
                <p className="text-xs font-semibold">{p.lat ? `${p.lat}, ${p.lng}` : "Não definida"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-[10px] text-gray-400 font-extrabold">ÁREA</p>
                <p className="text-xs font-semibold">{p.area || 0} ha</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={!p.lat}
                onClick={() => { setSelectedProperty(p); setMapOpen(true); }}
                className="flex-[2] rounded-xl py-3 border-none font-bold text-sm transition-colors"
                style={{ background: p.lat ? "#111827" : "#f3f4f6", color: p.lat ? "#fff" : "#9ca3af", cursor: p.lat ? "pointer" : "not-allowed" }}
              >
                📍 Ver no Mapa
              </button>
              <Btn variant="outline" onClick={() => handleOpenEdit(p)} style={{ flex: 1 }}>{Icons.edit} Editar</Btn>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cadastro / Edição */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-5">
          <div className="bg-white p-7 rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <h2 className="font-extrabold mb-4">{editingId ? "Editar Propriedade" : "Nova Propriedade"}</h2>
            <div className="flex flex-col gap-3">
              <input placeholder="Nome da Fazenda" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none box-border" />

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-[10px] font-extrabold">BUSCA RÁPIDA (CIDADE/UF)</label>
                <div className="flex gap-2 mt-1">
                  <input id="addr_in" placeholder="Ex: Sorriso, MT"
                    className="flex-1 border border-gray-200 rounded-xl p-2.5 text-sm outline-none" />
                  <button onClick={() => {
                    const input = document.getElementById("addr_in") as HTMLInputElement;
                    searchAddress(input?.value || "");
                  }}
                    className="bg-gray-900 text-white border-none rounded-lg px-3 cursor-pointer">🔎</button>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border-2 border-dashed border-green-400">
                <div className="flex gap-2 mb-2.5">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-gray-500 block mb-1">LAT</label>
                    <input value={form.lat || ""} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="-15.123456" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none bg-white" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-gray-500 block mb-1">LNG</label>
                    <input value={form.lng || ""} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="-52.123456" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none bg-white" />
                  </div>
                </div>
                <button onClick={getDeviceLocation}
                  className="w-full bg-green-600 text-white border-none py-2.5 rounded-lg cursor-pointer font-bold hover:bg-green-700 transition-colors">
                  {loadingLoc ? "Buscando..." : "🎯 Usar GPS Atual"}
                </button>
                {form.lat && (
                  <p className="text-xs text-green-700 font-semibold text-center mt-2">
                    ✅ Coordenadas definidas: {form.lat}, {form.lng}
                  </p>
                )}
              </div>

              <input placeholder="Código CAR" value={form.car || ""} onChange={e => setForm({ ...form, car: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none box-border" />
              <input placeholder="Área (ha)" type="number" value={form.area || ""} onChange={e => setForm({ ...form, area: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none box-border" />
              <input placeholder="CO₂ estimado (t)" type="number" value={form.co2 || ""} onChange={e => setForm({ ...form, co2: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none box-border" />

              <div className="flex gap-2.5 mt-2.5">
                <Btn variant="outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancelar</Btn>
                <Btn style={{ flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mapa */}
      {mapOpen && selectedProperty && (
        <div className="fixed inset-0 bg-black/85 z-[700] flex items-center justify-center p-5">
          <div className="bg-white w-full max-w-[900px] rounded-2xl overflow-hidden">
            <div className="py-4 px-6 flex justify-between items-center">
              <h3 className="font-extrabold">Vista Satélite: {selectedProperty.name}</h3>
              <button onClick={() => setMapOpen(false)} className="border-none bg-gray-100 rounded-full w-9 h-9 cursor-pointer">✕</button>
            </div>
            <iframe
              width="100%" height="450"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${selectedProperty.lat},${selectedProperty.lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
        </div>
      )}
    </div>
  );
}