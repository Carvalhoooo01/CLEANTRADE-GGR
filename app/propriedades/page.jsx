"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Btn } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { STATUS_COLORS } from "@/data/constants";

const EMPTY_FORM = { name: "", car: "", area: "", areaProd: "", region: "", coop: "", lat: "", lng: "" };

export default function PropriedadesPage() {
  const { properties, setProperties, showToast } = useApp();
  
  // Estados de Controle
  const [modalOpen, setModalOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  // Estados de Dados
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // --- FUNÇÃO 1: BUSCAR POR ENDEREÇO ---
  const searchAddress = async (query) => {
    if (!query || query.length < 3) return showToast("Digite um nome mais completo", "info");
    try {
      setLoadingLoc(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setForm(f => ({ ...f, lat: parseFloat(data[0].lat).toFixed(6), lng: parseFloat(data[0].lon).toFixed(6) }));
        showToast("Localização encontrada!", "success");
      } else {
        showToast("Local não encontrado.", "warning");
      }
    } catch (e) { 
      showToast("Erro na busca.", "error"); 
    } finally { 
      setLoadingLoc(false); 
    }
  };

  // --- FUNÇÃO 2: CAPTURAR GPS ---
  const getDeviceLocation = () => {
    setLoadingLoc(true);
    if (!navigator.geolocation) {
      showToast("GPS não disponível", "error");
      setLoadingLoc(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLoadingLoc(false);
        showToast("GPS capturado!", "success");
      },
      () => { 
        showToast("Ative o GPS do aparelho", "error"); 
        setLoadingLoc(false); 
      },
      { enableHighAccuracy: true }
    );
  };

  // --- FUNÇÃO 3: ABRIR EDIÇÃO (CORRIGIDA) ---
  const handleOpenEdit = (property) => {
    setEditingId(property.id);
    setForm(property);
    setModalOpen(true);
  };

  // --- FUNÇÃO 4: SALVAR (CRIAR OU EDITAR) ---
  const handleSave = () => {
    if (!form.name || !form.car) return showToast("Preencha o Nome e o CAR", "error");
    
    if (editingId) {
      setProperties(prev => prev.map(p => p.id === editingId ? { ...form, id: editingId } : p));
      showToast("Propriedade atualizada!", "success");
    } else {
      setProperties(prev => [...prev, { ...form, id: Date.now(), status: "ativo" }]);
      showToast("Propriedade cadastrada!", "success");
    }
    
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Header */}
      <div style={{ background: "#fff", padding: "20px", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#111827" }}>🌳 Minhas Propriedades</h2>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>Gerenciamento de áreas e georreferenciamento.</p>
          </div>
          <Btn onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); }}>
             Novo Cadastro
          </Btn>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "16px" }}>
        {properties.map((p) => (
          <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: "16px", padding: "20px", background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{p.name}</h3>
              <Badge label={p.status} color={STATUS_COLORS[p.status]} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "10px" }}>
                <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>COORDENADAS</p>
                <p style={{ fontSize: "12px", fontWeight: "600" }}>{p.lat ? `${p.lat}, ${p.lng}` : "Não definida"}</p>
              </div>
              <div style={{ background: "#f9fafb", padding: "12px", borderRadius: "10px" }}>
                <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>ÁREA</p>
                <p style={{ fontSize: "12px", fontWeight: "600" }}>{p.area || 0} ha</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                disabled={!p.lat}
                onClick={() => { setSelectedProperty(p); setMapOpen(true); }}
                style={{ 
                  flex: 2, background: p.lat ? "#111827" : "#f3f4f6", color: p.lat ? "#fff" : "#9ca3af", 
                  border: "none", borderRadius: "10px", padding: "12px", cursor: p.lat ? "pointer" : "not-allowed", fontWeight: "700" 
                }}
              >
                📍 Ver no Mapa
              </button>
              {/* CHAMADA DA FUNÇÃO CORRIGIDA ABAIXO */}
              <Btn variant="outline" onClick={() => handleOpenEdit(p)} style={{ flex: 1 }}>{Icons.edit} Editar</Btn>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL (CADASTRO/EDIÇÃO) */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", padding: "28px", borderRadius: "20px", width: "100%", maxWidth: "480px" }}>
            <h2 style={{ marginBottom: "15px", fontWeight: "800" }}>{editingId ? "Editar Propriedade" : "Nova Propriedade"}</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nome da Fazenda" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
              
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <label style={{ fontSize: "10px", fontWeight: "800" }}>BUSCA RÁPIDA (CIDADE/UF)</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <input id="addr_in" placeholder="Ex: Sorriso, MT" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => searchAddress(document.getElementById('addr_in').value)} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: "8px", padding: "0 12px", cursor: "pointer" }}>🔎</button>
                </div>
              </div>

              <div style={{ background: "#f0fdf4", padding: "15px", borderRadius: "12px", border: "1px dashed #22c55e" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: "9px" }}>LAT</label><input value={form.lat} readOnly style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: "9px" }}>LNG</label><input value={form.lng} readOnly style={inputStyle} /></div>
                </div>
                <button onClick={getDeviceLocation} style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>🎯 Usar GPS Atual</button>
              </div>

              <input placeholder="Código CAR" value={form.car} onChange={e => setForm({...form, car: e.target.value})} style={inputStyle} />
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                 <Btn variant="outline" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancelar</Btn>
                 <Btn style={{ flex: 1 }} onClick={handleSave}>Salvar</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO MAPA */}
      {mapOpen && selectedProperty && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "900px", borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "15px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: "800" }}>Vista Satélite: {selectedProperty.name}</h3>
              <button onClick={() => setMapOpen(false)} style={{ border: "none", background: "#f3f4f6", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer" }}>✕</button>
            </div>
            <iframe
              width="100%"
              height="450"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${selectedProperty.lat},${selectedProperty.lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: "100%", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px", fontSize: "14px", outline: "none" };