import { useState, useMemo, useRef, useEffect } from "react";
import { Phone, MessageCircle, Mail, MoreVertical } from "lucide-react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import FilterBar from "../components/FilterBar";
import KundeForm from "../components/KundeForm";
import { useFilterSort } from "../hooks/useFilterSort";
import { selectValue, normalizeWhatsApp } from "../utils/format";
import { updateRow, createRow, TABLE_IDS } from "../api/baserow";

/* ── Klickbare Kontakt-Links ── */
function ContactLink({ type, value }) {
  if (!value) return null;
  let href;
  if (type === "email") href = `mailto:${value}`;
  else if (type === "tel") href = `tel:${value}`;
  else if (type === "whatsapp") href = `https://wa.me/${normalizeWhatsApp(value)}`;
  return (
    <a
      href={href}
      {...(type === "whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-sm text-accent hover:underline transition-colors"
    >
      {value}
    </a>
  );
}

/* ── Kanal-Feld mit Kontextmenü ── */
function KanalLink({ kunde }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const kanal = kunde.Bevorzugter_Kanal?.value;

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  if (!kanal) return <span className="text-sm text-gray-400 mt-0.5">–</span>;

  const hasTel = !!kunde.Telefon;
  const hasWA = !!kunde.WhatsApp;
  const hasEmail = !!kunde.EMail;

  // Show context menu when both tel + WA available and kanal is one of them
  const showMenu = (kanal === "Telefon" || kanal === "Whatsapp") && hasTel && hasWA;

  if (!showMenu) {
    let link = null;
    if (kanal === "Telefon" && hasTel) link = `tel:${kunde.Telefon}`;
    else if (kanal === "Whatsapp" && hasWA) link = `https://wa.me/${normalizeWhatsApp(kunde.WhatsApp)}`;
    else if (kanal === "E-Mail" && hasEmail) link = `mailto:${kunde.EMail}`;

    if (!link) return <span className="text-sm text-gray-400 mt-0.5">{kanal}</span>;
    return (
      <a
        href={link}
        {...(kanal === "Whatsapp" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-sm text-accent hover:underline transition-colors cursor-pointer"
      >
        {kanal}
      </a>
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-accent hover:underline transition-colors cursor-pointer"
      >
        {kanal}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg py-1 min-w-[150px] z-30 shadow-xl">
          <a
            href={`tel:${kunde.Telefon}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Anrufen
          </a>
          <a
            href={`https://wa.me/${normalizeWhatsApp(kunde.WhatsApp)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

const EMPTY_KUNDE = {
  Vorname: "", Nachname: "", Telefon: "", WhatsApp: "", EMail: "",
  Adresse_Strasse: "", Adresse_PLZ: "", Adresse_Ort: "",
  Kunde_Typ: "Privat", Firma: "", Bevorzugter_Kanal: "", Notizen: "",
};

function initEditValues(kunde) {
  return {
    Vorname: kunde.Vorname || "",
    Nachname: kunde.Nachname || "",
    Telefon: kunde.Telefon || "",
    WhatsApp: kunde.WhatsApp || "",
    EMail: kunde.EMail || "",
    Adresse_Strasse: kunde.Adresse_Strasse || "",
    Adresse_PLZ: kunde.Adresse_PLZ || "",
    Adresse_Ort: kunde.Adresse_Ort || "",
    Kunde_Typ: kunde.Kunde_Typ?.value || "Privat",
    Firma: kunde.Firma || "",
    Bevorzugter_Kanal: kunde.Bevorzugter_Kanal?.value || "",
    Notizen: kunde.Notizen || "",
  };
}

function KundeCard({ kunde, mietenCount, aktivCount, editingId, onEdit, onSave, onCancel, editValues, setEditValues, saving, isHighlighted }) {
  const name = [kunde.Vorname, kunde.Nachname].filter(Boolean).join(" ") || "Unbekannt";
  const isEditing = editingId === kunde.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div ref={cardRef} className={`bg-gray-900 border rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-accent/50 ${isHighlighted ? "border-accent ring-1 ring-accent/30" : "border-gray-800"}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{name}</div>
          {kunde.Firma && <div className="text-sm text-gray-500">{kunde.Firma}</div>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {/* Kontakt-Icons + Drei-Punkte-Menü */}
          <div className="flex gap-2.5 items-center">
            {kunde.Telefon && (
              <a href={`tel:${kunde.Telefon}`} title="Anrufen"
                className="text-gray-500 hover:text-green-400 transition-colors">
                <Phone className="w-4 h-4" />
              </a>
            )}
            {kunde.WhatsApp && (
              <a href={`https://wa.me/${normalizeWhatsApp(kunde.WhatsApp)}`}
                target="_blank" rel="noopener noreferrer" title="WhatsApp"
                className="text-gray-500 hover:text-green-400 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {kunde.EMail && (
              <a href={`mailto:${kunde.EMail}`} title="E-Mail"
                className="text-gray-500 hover:text-blue-400 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            )}
            {!isEditing && (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} title="Optionen"
                  className="text-gray-500 hover:text-accent transition-colors ml-1">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg py-1 min-w-[140px] z-30 shadow-xl">
                    <button
                      onClick={() => { onEdit(kunde); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
                    >
                      Bearbeiten
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Badge */}
          <div className="flex gap-1.5">
            {aktivCount > 0 ? (
              <Badge color="green">{aktivCount} aktiv</Badge>
            ) : mietenCount > 0 ? (
              <Badge color="gray">{mietenCount} Miete{mietenCount > 1 ? "n" : ""}</Badge>
            ) : (
              <Badge color="blue">Lead</Badge>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <div>
          <KundeForm values={editValues} onChange={(field, val) => setEditValues((prev) => ({ ...prev, [field]: val }))} />
          <div className="flex gap-3 justify-end mt-4">
            <button onClick={onCancel}
              className="text-xs text-gray-400 hover:text-gray-200 px-3.5 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
              Abbrechen
            </button>
            <button onClick={() => onSave(kunde.id)} disabled={saving}
              className="text-xs font-semibold text-green-400 bg-green-500/15 border border-green-500/30 px-3.5 py-2 rounded-lg hover:bg-green-500/25 transition-all disabled:opacity-50">
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {kunde.EMail && (
            <DetailRow label="E-Mail">
              <ContactLink type="email" value={kunde.EMail} />
            </DetailRow>
          )}
          {kunde.Telefon && (
            <DetailRow label="Telefon">
              <ContactLink type="tel" value={kunde.Telefon} />
            </DetailRow>
          )}
          {kunde.WhatsApp && kunde.WhatsApp !== kunde.Telefon && (
            <DetailRow label="WhatsApp">
              <ContactLink type="whatsapp" value={kunde.WhatsApp} />
            </DetailRow>
          )}
          <DetailRow label="Kanal">
            <KanalLink kunde={kunde} />
          </DetailRow>
          <DetailRow label="Typ" value={selectValue(kunde.Kunde_Typ)} />
          {kunde.Notizen && <DetailRow label="Notizen" value={kunde.Notizen} />}
        </div>
      )}
    </div>
  );
}

export default function KundenView({ data, reload, selectedId, onSelectedClear }) {
  const { kunden, mieten } = data;

  /* ── State ── */
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newValues, setNewValues] = useState({ ...EMPTY_KUNDE });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  /* ── Clear selectedId after highlight animation ── */
  useEffect(() => {
    if (selectedId && onSelectedClear) {
      const timer = setTimeout(() => onSelectedClear(), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedId, onSelectedClear]);

  /* ── Miet-Maps ── */
  const mietCountMap = {};
  const aktivCountMap = {};
  mieten.forEach((m) => {
    const kid = m.Kunde_ID?.[0]?.id;
    if (!kid) return;
    mietCountMap[kid] = (mietCountMap[kid] || 0) + 1;
    if (["Aktiv", "Verlängert", "unbefristet"].includes(m.Status?.value)) {
      aktivCountMap[kid] = (aktivCountMap[kid] || 0) + 1;
    }
  });

  const mitMiete = kunden.filter((k) => mietCountMap[k.id] > 0).length;
  const leads = kunden.length - mitMiete;

  /* ── Filter & Sort ── */
  const filterSortConfig = useMemo(() => ({
    filters: [
      { key: "hatMiete", label: "Hat Miete", accessor: (k) => mietCountMap[k.id] > 0 ? "Ja" : "Nein",
        options: ["Ja", "Nein"] },
      { key: "typ", label: "Typ", accessor: (k) => k.Kunde_Typ?.value || "–",
        options: ["Privat", "Firma"] },
    ],
    sorts: [
      { key: "name_az", label: "Name A-Z", compareFn: (a, b) =>
        ((a.Nachname || "") + (a.Vorname || "")).localeCompare((b.Nachname || "") + (b.Vorname || "")) },
      { key: "mieten", label: "Anzahl Mieten", compareFn: (a, b) =>
        (mietCountMap[b.id] || 0) - (mietCountMap[a.id] || 0) },
      { key: "ort", label: "Ort", compareFn: (a, b) =>
        (a.Adresse_Ort || "").localeCompare(b.Adresse_Ort || "") },
    ],
  }), [mietCountMap]);

  const fs = useFilterSort(kunden, filterSortConfig);

  /* ── Edit Handlers ── */
  const handleEdit = (kunde) => {
    setEditingId(kunde.id);
    setEditValues(initEditValues(kunde));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSave = async (rowId) => {
    setSaving(true);
    try {
      const payload = { ...editValues };
      if (payload.Kunde_Typ !== "Firma") payload.Firma = "";
      await updateRow(TABLE_IDS.kunden, rowId, payload);
      setEditingId(null);
      setToast({ message: "Kunde gespeichert ✓", type: "success" });
      reload();
    } catch (e) {
      setToast({ message: `Fehler: ${e.message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  /* ── Create Handler ── */
  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = { ...newValues };
      if (payload.Kunde_Typ !== "Firma") payload.Firma = "";
      if (!payload.Bevorzugter_Kanal) delete payload.Bevorzugter_Kanal;
      await createRow(TABLE_IDS.kunden, payload);
      setShowNewModal(false);
      setNewValues({ ...EMPTY_KUNDE });
      setToast({ message: "Kunde angelegt ✓", type: "success" });
      reload();
    } catch (e) {
      setToast({ message: `Fehler: ${e.message}`, type: "error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Gesamt" value={kunden.length} color="white" />
        <StatCard label="Mit Miete" value={mitMiete} color="green" />
        <StatCard label="Leads" value={leads} color="blue" />
      </div>

      <FilterBar
        filterConfigs={fs.filterConfigs}
        activeFilters={fs.activeFilters}
        onToggleFilter={fs.toggleFilter}
        sortConfigs={fs.sortConfigs}
        activeSort={fs.activeSort}
        onSortChange={fs.setActiveSort}
        hasActiveFilters={fs.hasActiveFilters}
        onClearFilters={fs.clearFilters}
      />

      <div className="flex justify-between items-center mb-3">
        <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold">
          Kundenliste
        </div>
        <button onClick={() => setShowNewModal(true)}
          className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-green-500/25 transition-all">
          + Neuer Kunde
        </button>
      </div>

      {fs.items.length === 0 ? (
        <div className="text-center py-12 text-gray-600">Keine Kunden.</div>
      ) : (
        fs.items.map((k) => (
          <KundeCard
            key={k.id}
            kunde={k}
            mietenCount={mietCountMap[k.id] || 0}
            aktivCount={aktivCountMap[k.id] || 0}
            editingId={editingId}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            editValues={editValues}
            setEditValues={setEditValues}
            saving={saving}
            isHighlighted={selectedId === k.id}
          />
        ))
      )}

      {/* Neuer Kunde Modal */}
      <Modal open={showNewModal} onClose={() => { setShowNewModal(false); setNewValues({ ...EMPTY_KUNDE }); }} title="Neuen Kunden anlegen"
        footer={
          <>
            <button onClick={() => { setShowNewModal(false); setNewValues({ ...EMPTY_KUNDE }); }}
              className="text-xs text-gray-400 hover:text-gray-200 px-3.5 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
              Abbrechen
            </button>
            <button onClick={handleCreate} disabled={creating}
              className="text-xs font-semibold text-green-400 bg-green-500/15 border border-green-500/30 px-3.5 py-2 rounded-lg hover:bg-green-500/25 transition-all disabled:opacity-50">
              {creating ? "Anlegen…" : "Anlegen"}
            </button>
          </>
        }
      >
        <KundeForm values={newValues} onChange={(field, val) => setNewValues((prev) => ({ ...prev, [field]: val }))} />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
