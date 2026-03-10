import { useState, useMemo } from "react";

const INITIAL_CONTAINERS = [
  {
    id: "CNT-001",
    containerNo: "MSCU1234567",
    chassisNo: "CHS-044",
    musteri: "Arçelik A.Ş.",
    limanCikis: "2026-03-01",
    limanGiris: null,
    durum: "aktif",
    hareketler: [
      { tarih: "2026-03-01", surucu: "Mehmet Yılmaz", konum: "Ambarlı Liman → Esenyurt Depo", aciklama: "Limandan alındı", km: 32 },
      { tarih: "2026-03-02", surucu: "Mehmet Yılmaz", konum: "Esenyurt Depo → Arçelik Fabrika", aciklama: "Müşteriye teslim", km: 48 },
      { tarih: "2026-03-05", surucu: "Ali Kaya", konum: "Arçelik Fabrika → Esenyurt Depo", aciklama: "Boşaltma tamamlandı", km: 48 },
    ],
  },
  {
    id: "CNT-002",
    containerNo: "CMAU9876543",
    chassisNo: "CHS-012",
    musteri: "Vestel Elektronik",
    limanCikis: "2026-03-03",
    limanGiris: null,
    durum: "aktif",
    hareketler: [
      { tarih: "2026-03-03", surucu: "Hasan Demir", konum: "Haydarpaşa Liman → Manisa", aciklama: "Limandan alındı", km: 310 },
    ],
  },
  {
    id: "CNT-003",
    containerNo: "HLXU4561239",
    chassisNo: "CHS-028",
    musteri: "Ford Otosan",
    limanCikis: "2026-02-20",
    limanGiris: "2026-03-04",
    durum: "kapali",
    hareketler: [
      { tarih: "2026-02-20", surucu: "Mustafa Çelik", konum: "Gebze Liman → Ford Fabrika", aciklama: "Limandan alındı", km: 65 },
      { tarih: "2026-03-04", surucu: "Mustafa Çelik", konum: "Ford Fabrika → Gebze Liman", aciklama: "Limana teslim edildi", km: 65 },
    ],
  },
];

const INITIAL_CHASSIS = [
  { id: "CH-001", chassisNo: "CHS-044", plakaNo: "34 ABC 044", fleetNo: "FL-044" },
  { id: "CH-002", chassisNo: "CHS-012", plakaNo: "34 DEF 012", fleetNo: "FL-012" },
  { id: "CH-003", chassisNo: "CHS-028", plakaNo: "34 GHJ 028", fleetNo: "FL-028" },
  { id: "CH-004", chassisNo: "CHS-007", plakaNo: "34 KLM 007", fleetNo: "FL-007" },
  { id: "CH-005", chassisNo: "CHS-019", plakaNo: "34 NOP 019", fleetNo: "FL-019" },
];

const gunFarki = (baslangic, bitis) => {
  const b = new Date(baslangic);
  const s = bitis ? new Date(bitis) : new Date();
  return Math.ceil((s - b) / (1000 * 60 * 60 * 24));
};

const today = () => new Date().toISOString().split("T")[0];

export default function App() {
  const [containers, setContainers] = useState(INITIAL_CONTAINERS);
  const [chassisList, setChassisList] = useState(INITIAL_CHASSIS);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [showAddContainer, setShowAddContainer] = useState(false);
  const [showAddHareket, setShowAddHareket] = useState(false);
  const [showKapatModal, setShowKapatModal] = useState(false);
  const [showAddChassis, setShowAddChassis] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDurum, setFilterDurum] = useState("hepsi");

  const [newChassis, setNewChassis] = useState({ chassisNo: "", plakaNo: "", fleetNo: "" });

  const [newContainer, setNewContainer] = useState({
    containerNo: "", chassisNo: "", musteri: "", limanCikis: today(),
  });
  const [newHareket, setNewHareket] = useState({
    tarih: today(), surucu: "", konum: "", aciklama: "", km: "", firma: "", referans: "",
  });

  const toplamKm = (hareketler) => hareketler.reduce((s, h) => s + (Number(h.km) || 0), 0);

  // Chassis durum: otomatik hesapla - aktif container'da kullanılıyorsa "kullanımda"
  const chassisWithDurum = chassisList.map(ch => ({
    ...ch,
    durum: containers.some(c => c.durum === "aktif" && c.chassisNo === ch.chassisNo) ? "kullanımda" : "müsait",
  }));

  const musaitChassis = chassisWithDurum.filter(ch => ch.durum === "müsait");

  const handleAddChassis = () => {
    if (!newChassis.chassisNo || !newChassis.plakaNo || !newChassis.fleetNo) return;
    const id = `CH-${String(chassisList.length + 1).padStart(3, "0")}`;
    setChassisList(prev => [...prev, { ...newChassis, id }]);
    setNewChassis({ chassisNo: "", plakaNo: "", fleetNo: "" });
    setShowAddChassis(false);
  };

  const handleDeleteChassis = (id) => {
    setChassisList(prev => prev.filter(ch => ch.id !== id));
  };

  const aktifler = containers.filter(c => c.durum === "aktif");
  const kapalilar = containers.filter(c => c.durum === "kapali");

  const filteredContainers = useMemo(() => {
    return containers.filter(c => {
      const matchSearch =
        c.containerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.musteri.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.chassisNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDurum = filterDurum === "hepsi" || c.durum === filterDurum;
      return matchSearch && matchDurum;
    });
  }, [containers, searchTerm, filterDurum]);

  const handleAddContainer = () => {
    if (!newContainer.containerNo || !newContainer.chassisNo || !newContainer.musteri) return;
    const id = `CNT-${String(containers.length + 1).padStart(3, "0")}`;
    setContainers(prev => [...prev, {
      ...newContainer, id, limanGiris: null, durum: "aktif",
      hareketler: [{ tarih: newContainer.limanCikis, surucu: "-", konum: "Liman → (Rota belirlenmedi)", aciklama: "Limandan alındı" }],
    }]);
    setNewContainer({ containerNo: "", chassisNo: "", musteri: "", limanCikis: today() });
    setShowAddContainer(false);
  };

  const handleAddHareket = () => {
    if (!newHareket.surucu || !newHareket.konum) return;
    setContainers(prev => prev.map(c =>
      c.id === selectedContainer.id
        ? { ...c, hareketler: [...c.hareketler, { ...newHareket }] }
        : c
    ));
    setSelectedContainer(prev => ({ ...prev, hareketler: [...prev.hareketler, { ...newHareket }] }));
    setNewHareket({ tarih: today(), surucu: "", konum: "", aciklama: "", km: "", firma: "", referans: "" });
    setShowAddHareket(false);
  };

  const handleKapat = (limanGirisTarihi) => {
    setContainers(prev => prev.map(c =>
      c.id === selectedContainer.id
        ? { ...c, durum: "kapali", limanGiris: limanGirisTarihi,
            hareketler: [...c.hareketler, { tarih: limanGirisTarihi, surucu: "-", konum: "→ Liman Teslim", aciklama: "Limana iade edildi - İşlem kapatıldı" }] }
        : c
    ));
    setSelectedContainer(null);
    setShowKapatModal(false);
    setActiveTab("liste");
  };

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: "#0a0e17", minHeight: "100vh", color: "#e0e6f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@300;500;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0e17; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111827; } ::-webkit-scrollbar-thumb { background: #1e4d8c; border-radius: 3px; }
        .nav-btn { background: none; border: none; cursor: pointer; padding: 10px 20px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; transition: all 0.2s; }
        .nav-btn.active { background: #1a3a6b; color: #4da6ff; border-bottom: 2px solid #4da6ff; }
        .nav-btn:not(.active) { color: #6b7280; }
        .nav-btn:not(.active):hover { color: #9ca3af; }
        .card { background: #111827; border: 1px solid #1f2937; border-radius: 4px; padding: 20px; }
        .stat-card { background: #111827; border: 1px solid #1f2937; border-radius: 4px; padding: 20px 24px; }
        .btn { cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; padding: 9px 18px; border-radius: 3px; border: none; transition: all 0.2s; }
        .btn-primary { background: #1a3a6b; color: #4da6ff; border: 1px solid #1e4d8c; }
        .btn-primary:hover { background: #1e4d8c; }
        .btn-danger { background: #3b1010; color: #f87171; border: 1px solid #7f1d1d; }
        .btn-danger:hover { background: #7f1d1d; }
        .btn-success { background: #0f2d1a; color: #34d399; border: 1px solid #064e3b; }
        .btn-success:hover { background: #064e3b; }
        .btn-ghost { background: none; color: #6b7280; border: 1px solid #374151; }
        .btn-ghost:hover { background: #1f2937; color: #9ca3af; }
        .input { background: #0a0e17; border: 1px solid #1f2937; color: #e0e6f0; padding: 9px 12px; border-radius: 3px; font-family: 'Space Mono', monospace; font-size: 12px; width: 100%; outline: none; transition: border 0.2s; }
        .input:focus { border-color: #1e4d8c; }
        .input::placeholder { color: #374151; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 2px; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .badge-aktif { background: #0f2d1a; color: #34d399; border: 1px solid #064e3b; }
        .badge-kapali { background: #1f2937; color: #6b7280; border: 1px solid #374151; }
        .table-row { border-bottom: 1px solid #1f2937; transition: background 0.15s; cursor: pointer; }
        .table-row:hover { background: #151d2e; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal { background: #111827; border: 1px solid #1f2937; border-radius: 4px; padding: 28px; width: 480px; max-width: 95vw; }
        .hareket-row { border-left: 2px solid #1e4d8c; padding: 10px 14px; margin-bottom: 8px; background: #0d1420; border-radius: 0 3px 3px 0; }
        .hareket-row:last-child { border-left-color: #34d399; }
        .detail-panel { background: #0d1420; border: 1px solid #1f2937; border-radius: 4px; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#0d1420", borderBottom: "1px solid #1f2937", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ padding: "16px 0" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: 4, color: "#4da6ff", textTransform: "uppercase" }}>
              ⬡ CARGO<span style={{ color: "#e0e6f0" }}>TRACK</span>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#374151", letterSpacing: 2 }}>CONTAINER PLANLAMA SİSTEMİ</div>
          </div>
          <nav style={{ display: "flex", gap: 4, marginLeft: 16 }}>
            {[["dashboard", "Dashboard"], ["liste", "Containerlar"], ["hareketler", "Hareketler"], ["ayarlar", "⚙ Ayarlar"]].map(([key, label]) => (
              <button key={key} className={`nav-btn ${activeTab === key ? "active" : ""}`} onClick={() => { setActiveTab(key); setSelectedContainer(null); }}>{label}</button>
            ))}
          </nav>
          <div style={{ marginLeft: "auto" }}>
            <button className="btn btn-primary" onClick={() => setShowAddContainer(true)}>+ Yeni Container</button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: 3, color: "#374151", textTransform: "uppercase", marginBottom: 20 }}>
              SİSTEM DURUMU — {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Aktif Container", value: aktifler.length, color: "#4da6ff", sub: "Şu an sahada" },
                { label: "Tamamlanan", value: kapalilar.length, color: "#34d399", sub: "Bu ay" },
                { label: "Toplam Gün", value: aktifler.reduce((s, c) => s + gunFarki(c.limanCikis, null), 0), color: "#fbbf24", sub: "Aktif süreler toplamı" },
                { label: "Toplam KM", value: containers.reduce((s, c) => s + toplamKm(c.hareketler), 0).toLocaleString("tr-TR") + " km", color: "#34d399", sub: "Tüm güzergahlar" },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="stat-card">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 44, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#374151", marginTop: 6 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Aktif Containerlar */}
            <div className="card">
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, color: "#6b7280", textTransform: "uppercase", marginBottom: 16 }}>
                Aktif Containerlar
              </div>
              {aktifler.length === 0 ? (
                <div style={{ textAlign: "center", color: "#374151", padding: "30px 0", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>Aktif container bulunmuyor</div>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr 0.8fr auto", gap: 8, padding: "6px 12px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", borderBottom: "1px solid #1f2937", marginBottom: 4 }}>
                    <span>Container No</span><span>Chassis</span><span>Müşteri</span><span>Çıkış Tarihi</span><span>Gün</span><span>Son Konum</span><span></span>
                  </div>
                  {aktifler.map(c => (
                    <div key={c.id} className="table-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr 0.8fr auto", gap: 8, padding: "12px", alignItems: "center" }}
                      onClick={() => { setSelectedContainer(c); setActiveTab("detay"); }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#4da6ff" }}>{c.containerNo}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#9ca3af" }}>{c.chassisNo}</span>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 500 }}>{c.musteri}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6b7280" }}>{c.limanCikis}</span>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: gunFarki(c.limanCikis) > 14 ? "#f87171" : "#fbbf24" }}>
                        {gunFarki(c.limanCikis)}
                      </span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.hareketler[c.hareketler.length - 1]?.konum?.split("→").pop()?.trim() || "-"}
                      </span>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }}
                        onClick={e => { e.stopPropagation(); setSelectedContainer(c); setActiveTab("detay"); }}>Detay →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LISTE */}
        {activeTab === "liste" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <input className="input" placeholder="Container no, müşteri veya chassis ara..." style={{ maxWidth: 340 }}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <div style={{ display: "flex", gap: 6 }}>
                {[["hepsi", "Tümü"], ["aktif", "Aktif"], ["kapali", "Kapalı"]].map(([val, label]) => (
                  <button key={val} className={`btn ${filterDurum === val ? "btn-primary" : "btn-ghost"}`}
                    style={{ fontSize: 11, padding: "7px 14px" }} onClick={() => setFilterDurum(val)}>{label}</button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr 0.7fr 0.7fr auto", gap: 8, padding: "10px 16px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", borderBottom: "1px solid #1f2937" }}>
                <span>Container No</span><span>Chassis</span><span>Müşteri</span><span>Çıkış</span><span>Giriş</span><span>Gün</span><span>Durum</span><span></span>
              </div>
              {filteredContainers.length === 0 ? (
                <div style={{ textAlign: "center", color: "#374151", padding: "40px", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>Sonuç bulunamadı</div>
              ) : filteredContainers.map(c => (
                <div key={c.id} className="table-row" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr 1fr 1fr 0.7fr 0.7fr auto", gap: 8, padding: "13px 16px", alignItems: "center" }}
                  onClick={() => { setSelectedContainer(c); setActiveTab("detay"); }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#4da6ff" }}>{c.containerNo}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#9ca3af" }}>{c.chassisNo}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 500 }}>{c.musteri}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#6b7280" }}>{c.limanCikis}</span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#6b7280" }}>{c.limanGiris || "—"}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: c.durum === "aktif" ? "#fbbf24" : "#6b7280" }}>
                    {gunFarki(c.limanCikis, c.limanGiris)}
                  </span>
                  <span><span className={`badge badge-${c.durum}`}>{c.durum === "aktif" ? "Aktif" : "Kapalı"}</span></span>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 12px" }}
                    onClick={e => { e.stopPropagation(); setSelectedContainer(c); setActiveTab("detay"); }}>Detay →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TÜM HAREKETLER */}
        {activeTab === "hareketler" && (
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: 3, color: "#374151", textTransform: "uppercase", marginBottom: 20 }}>
              Tüm Hareket Kayıtları
            </div>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.2fr 2fr 0.8fr 1fr 1fr", gap: 8, padding: "10px 16px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", borderBottom: "1px solid #1f2937" }}>
                <span>Tarih</span><span>Container</span><span>Sürücü</span><span>Konum / Güzergah</span><span>KM</span><span>Firma</span><span>Referans</span>
              </div>
              {[...containers.flatMap(c => c.hareketler.map(h => ({ ...h, containerNo: c.containerNo, musteri: c.musteri })))]
                .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
                .map((h, i) => (
                  <div key={i} className="table-row" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.2fr 2fr 0.8fr 1fr 1fr", gap: 8, padding: "11px 16px", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#6b7280" }}>{h.tarih}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#4da6ff" }}>{h.containerNo}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13 }}>{h.surucu}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#9ca3af" }}>{h.konum}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: h.km ? "#fbbf24" : "#374151" }}>
                      {h.km ? `${Number(h.km).toLocaleString("tr-TR")} km` : "—"}
                    </span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#a78bfa" }}>{h.firma || "—"}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#6b7280" }}>{h.referans || "—"}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* DETAY */}
        {activeTab === "detay" && selectedContainer && (() => {
          const c = containers.find(x => x.id === selectedContainer.id) || selectedContainer;
          return (
            <div>
              <button className="btn btn-ghost" style={{ marginBottom: 20, fontSize: 11 }} onClick={() => { setActiveTab("liste"); setSelectedContainer(null); }}>← Geri</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>
                {/* Sol: Bilgiler */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: "#4da6ff", fontWeight: 700 }}>{c.containerNo}</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#374151", marginTop: 4 }}>{c.id}</div>
                      </div>
                      <span className={`badge badge-${c.durum}`}>{c.durum === "aktif" ? "Aktif" : "Kapalı"}</span>
                    </div>
                    {[
                      ["Müşteri", c.musteri],
                      ["Chassis No", c.chassisNo],
                      ["Liman Çıkış", c.limanCikis],
                      ["Liman Giriş", c.limanGiris || "—"],
                      ["Toplam Gün", `${gunFarki(c.limanCikis, c.limanGiris)} gün`],
                      ["Toplam KM", `${toplamKm(c.hareketler).toLocaleString("tr-TR")} km`],
                      ["Hareket Sayısı", `${c.hareketler.length} kayıt`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1f2937" }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 1.5, color: "#4b5563", textTransform: "uppercase" }}>{label}</span>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#e0e6f0" }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {c.durum === "aktif" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowAddHareket(true)}>+ Hareket Ekle</button>
                      <button className="btn btn-danger" style={{ width: "100%" }} onClick={() => setShowKapatModal(true)}>⬡ Limana İade Et / Kapat</button>
                    </div>
                  )}

                  {c.durum === "kapali" && (
                    <div className="card" style={{ background: "#0a1a12", borderColor: "#064e3b" }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 2, color: "#34d399", textTransform: "uppercase", marginBottom: 8 }}>✓ İşlem Tamamlandı</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6b7280" }}>
                        Toplam {gunFarki(c.limanCikis, c.limanGiris)} günlük işlem tamamlandı ve faturalandırıldı.
                      </div>
                    </div>
                  )}
                </div>

                {/* Sağ: Hareketler */}
                <div className="card">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: 2, color: "#6b7280", textTransform: "uppercase", marginBottom: 14 }}>Hareket Geçmişi</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(() => {
                      const reversed = [...c.hareketler].reverse();
                      const total = toplamKm(c.hareketler);
                      let cumulative = total;
                      return reversed.map((h, i) => {
                        const rowKm = Number(h.km) || 0;
                        const kmAtPoint = cumulative;
                        cumulative -= rowKm;
                        return (
                          <div key={i} className="hareket-row" style={{ borderLeftColor: i === 0 ? "#34d399" : "#1e4d8c" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4da6ff" }}>{h.tarih}</span>
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#9ca3af" }}>{h.surucu}</span>
                            </div>
                            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#e0e6f0", marginBottom: 4 }}>{h.konum}</div>
                            {(h.firma || h.referans) && (
                              <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                                {h.firma && (
                                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: "#a78bfa", background: "#1a1030", border: "1px solid #3b2a6e", padding: "1px 8px", borderRadius: 2 }}>
                                    {h.firma}
                                  </span>
                                )}
                                {h.referans && (
                                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#6b7280", background: "#0d1420", border: "1px solid #1f2937", padding: "1px 8px", borderRadius: 2 }}>
                                    REF: {h.referans}
                                  </span>
                                )}
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              {h.aciklama && <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: "#4b5563" }}>{h.aciklama}</div>}
                              {rowKm > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#374151" }}>bu güzergah</span>
                                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: "#fbbf24", background: "#1c1500", border: "1px solid #422006", padding: "1px 8px", borderRadius: 2 }}>
                                    {rowKm.toLocaleString("tr-TR")} km
                                  </span>
                                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#374151" }}>toplam</span>
                                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: "#34d399", background: "#0a1a12", border: "1px solid #064e3b", padding: "1px 8px", borderRadius: 2 }}>
                                    {kmAtPoint.toLocaleString("tr-TR")} km
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        {/* AYARLAR - CHASSIS YÖNETİMİ */}
        {activeTab === "ayarlar" && (
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: 3, color: "#374151", textTransform: "uppercase", marginBottom: 20 }}>
              Tanımlar / Chassis Yönetimi
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Toplam Chassis", value: chassisWithDurum.length, color: "#4da6ff" },
                { label: "Müsait", value: chassisWithDurum.filter(c => c.durum === "müsait").length, color: "#34d399" },
                { label: "Kullanımda", value: chassisWithDurum.filter(c => c.durum === "kullanımda").length, color: "#fbbf24" },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-card">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 44, color, lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #1f2937" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, color: "#6b7280", textTransform: "uppercase" }}>Chassis Listesi</div>
                <button className="btn btn-primary" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setShowAddChassis(true)}>+ Chassis Ekle</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr auto", gap: 8, padding: "10px 16px", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", borderBottom: "1px solid #1f2937" }}>
                <span>Chassis No</span><span>Plaka No</span><span>Fleet No</span><span>Durum</span><span></span>
              </div>
              {chassisWithDurum.length === 0 ? (
                <div style={{ textAlign: "center", color: "#374151", padding: "40px", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>Henüz chassis eklenmedi</div>
              ) : chassisWithDurum.map(ch => {
                const aktifContainer = containers.find(c => c.durum === "aktif" && c.chassisNo === ch.chassisNo);
                return (
                  <div key={ch.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr 1fr auto", gap: 8, padding: "13px 16px", alignItems: "center", borderBottom: "1px solid #111827" }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#4da6ff", fontWeight: 700 }}>{ch.chassisNo}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#9ca3af" }}>{ch.plakaNo}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: "#e0e6f0" }}>{ch.fleetNo}</span>
                    <div>
                      <span style={ch.durum === "müsait"
                        ? { background: "#0f2d1a", color: "#34d399", border: "1px solid #064e3b", display: "inline-block", padding: "3px 10px", borderRadius: 2, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }
                        : { background: "#1c1500", color: "#fbbf24", border: "1px solid #422006", display: "inline-block", padding: "3px 10px", borderRadius: 2, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                        {ch.durum === "müsait" ? "Müsait" : "Kullanımda"}
                      </span>
                      {aktifContainer && (
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#4b5563", marginTop: 3 }}>{aktifContainer.containerNo}</div>
                      )}
                    </div>
                    <button className="btn btn-danger" style={{ fontSize: 10, padding: "4px 10px", opacity: ch.durum === "kullanımda" ? 0.3 : 1, cursor: ch.durum === "kullanımda" ? "not-allowed" : "pointer" }}
                      onClick={() => ch.durum !== "kullanımda" && handleDeleteChassis(ch.id)}
                      title={ch.durum === "kullanımda" ? "Kullanımda olan chassis silinemez" : "Sil"}>Sil</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
      {showAddContainer && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#4da6ff", textTransform: "uppercase", marginBottom: 20 }}>Yeni Container Aç</div>
            {[
              ["Container No", "containerNo", "MSCU1234567"],
              ["Müşteri / Firma", "musteri", "Firma Adı"],
            ].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                <input className="input" placeholder={ph} value={newContainer[key]} onChange={e => setNewContainer(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>Chassis Seç</div>
              <select className="input" value={newContainer.chassisNo} onChange={e => setNewContainer(p => ({ ...p, chassisNo: e.target.value }))}
                style={{ cursor: "pointer" }}>
                <option value="">— Chassis seçin —</option>
                {musaitChassis.map(ch => (
                  <option key={ch.id} value={ch.chassisNo}>
                    {ch.chassisNo} · {ch.plakaNo} · {ch.fleetNo}
                  </option>
                ))}
              </select>
              {musaitChassis.length === 0 && (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#f87171", marginTop: 4 }}>⚠ Müsait chassis bulunamadı. Ayarlar'dan chassis ekleyin.</div>
              )}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>Liman Çıkış Tarihi</div>
              <input type="date" className="input" value={newContainer.limanCikis} onChange={e => setNewContainer(p => ({ ...p, limanCikis: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddContainer}>Container Aç</button>
              <button className="btn btn-ghost" onClick={() => setShowAddContainer(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Hareket Ekle */}
      {showAddHareket && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#4da6ff", textTransform: "uppercase", marginBottom: 20 }}>Hareket Ekle</div>
            {[
              ["Sürücü", "surucu", "Sürücü adı"],
              ["Konum / Güzergah", "konum", "Başlangıç → Varış"],
              ["Firma", "firma", "Firma adı"],
              ["Referans", "referans", "Referans no / kodu"],
              ["Açıklama", "aciklama", "Opsiyonel not"],
            ].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                <input className="input" placeholder={ph} value={newHareket[key]} onChange={e => setNewHareket(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>Güzergah KM</div>
                <input type="number" className="input" placeholder="örn: 120" min="0"
                  value={newHareket.km} onChange={e => setNewHareket(p => ({ ...p, km: e.target.value }))}
                  style={{ textAlign: "right" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>Tarih</div>
                <input type="date" className="input" value={newHareket.tarih} onChange={e => setNewHareket(p => ({ ...p, tarih: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddHareket}>Kaydet</button>
              <button className="btn btn-ghost" onClick={() => setShowAddHareket(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Kapat */}
      {showKapatModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#f87171", textTransform: "uppercase", marginBottom: 8 }}>Limana İade Et</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6b7280", marginBottom: 20 }}>
              Bu işlemi kapatmak istediğinize emin misiniz? Faturalama başlatılacak.
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>Liman Giriş Tarihi</div>
              <input type="date" className="input" id="kapatTarih" defaultValue={today()} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleKapat(document.getElementById("kapatTarih").value)}>Kapat ve Faturalandır</button>
              <button className="btn btn-ghost" onClick={() => setShowKapatModal(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Chassis Ekle */}
      {showAddChassis && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: 3, color: "#4da6ff", textTransform: "uppercase", marginBottom: 20 }}>Yeni Chassis Tanımla</div>
            {[
              ["Chassis No", "chassisNo", "CHS-001"],
              ["Plaka No", "plakaNo", "34 ABC 001"],
              ["Fleet No", "fleetNo", "FL-001"],
            ].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, color: "#4b5563", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                <input className="input" placeholder={ph} value={newChassis[key]} onChange={e => setNewChassis(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 20, background: "#0a0e17", border: "1px solid #1f2937", borderRadius: 3, padding: "10px 12px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#374151" }}>
                Yeni chassis otomatik olarak <span style={{ color: "#34d399" }}>Müsait</span> durumunda eklenir. Container'a atandığında <span style={{ color: "#fbbf24" }}>Kullanımda</span>'ya geçer.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddChassis}>Kaydet</button>
              <button className="btn btn-ghost" onClick={() => setShowAddChassis(false)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
