import { useState, useMemo, useRef } from "react";
import { Paperclip, ExternalLink, Plus, X as XIcon } from "lucide-react";
import StatCard from "../components/StatCard";
import DetailRow from "../components/DetailRow";
import FilterBar from "../components/FilterBar";
import Toast from "../components/Toast";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro } from "../utils/format";
import { updateRow, createRow, TABLE_IDS } from "../api/baserow";

const WEBHOOK_BELEG_UPLOAD = import.meta.env.VITE_N8N_WEBHOOK_BELEG_UPLOAD;

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-orange-500 transition-colors";

/* ── Single Beleg Card ──────────────────────────────────────────── */
function BelegCard({ beleg, instrument, onUpload, uploadingId }) {
  const fileInputRef = useRef(null);
  const isUploading = uploadingId === beleg.id;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(beleg, instrument, file);
    e.target.value = "";
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{beleg.Beschreibung || "–"}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {beleg.Händler || "–"} · {formatDate(beleg.Kaufdatum)}
          </div>
        </div>
        <div className="text-lg font-bold font-mono text-red-400">
          {formatEuro(beleg.Betrag)}
        </div>
      </div>

      {beleg.Beleg_ID && (
        <div className="mb-2">
          <DetailRow label="Beleg-ID" value={beleg.Beleg_ID} mono />
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        {beleg.Beleg_URL ? (
          <a
            href={beleg.Beleg_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Beleg anzeigen
          </a>
        ) : WEBHOOK_BELEG_UPLOAD ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <span className="w-3 h-3 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                  Wird hochgeladen...
                </>
              ) : (
                <>
                  <Paperclip className="w-3.5 h-3.5" />
                  Beleg hinzufügen
                </>
              )}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ── Neuer Beleg Modal ──────────────────────────────────────────── */
function NeuBelegModal({ instrument, onClose, onSave, saving }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    Beschreibung: "",
    Händler: "",
    Kaufdatum: new Date().toISOString().split("T")[0],
    Betrag: "",
  });
  const [file, setFile] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!form.Beschreibung.trim()) return;
    onSave(form, file);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">Neuer Einkaufsbeleg</h3>
            <div className="text-sm text-gray-500 mt-0.5">{instrument.Modellname}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Beschreibung *
            </label>
            <input
              className={inputClass}
              value={form.Beschreibung}
              onChange={set("Beschreibung")}
              placeholder="z.B. Roland Hocker RDT-SHV"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Händler *
            </label>
            <input
              className={inputClass}
              value={form.Händler}
              onChange={set("Händler")}
              placeholder="z.B. Thomann"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Kaufdatum *
              </label>
              <input
                className={inputClass}
                type="date"
                value={form.Kaufdatum}
                onChange={set("Kaufdatum")}
              />
            </div>
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Betrag (EUR) *
              </label>
              <input
                className={inputClass}
                type="number"
                step="0.01"
                value={form.Betrag}
                onChange={set("Betrag")}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Datei-Upload */}
          {WEBHOOK_BELEG_UPLOAD && (
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Beleg-Datei (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => { setFile(e.target.files[0] || null); }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-800 border border-gray-700 border-dashed rounded-lg py-3 hover:border-orange-500/50 hover:text-orange-400 transition-all"
              >
                <Paperclip className="w-4 h-4" />
                {file ? file.name : "Datei auswählen (PDF, JPG, PNG)"}
              </button>
              {file && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Entfernen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.Beschreibung.trim()}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Speichern...
              </>
            ) : (
              "Beleg speichern"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Instrument-Gruppe ──────────────────────────────────────────── */
function InstrumentGroup({ instrument, belegeForInstrument, onAddBeleg, onUploadExisting, uploadingId }) {
  const groupTotal = belegeForInstrument.reduce((s, b) => s + (parseFloat(b.Betrag) || 0), 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-gray-300">
          {instrument.Modellname}
          <span className="text-gray-600 ml-2 font-normal">INS-{instrument.Instrument_ID}</span>
        </div>
      </div>

      {belegeForInstrument.length === 0 ? (
        <div className="text-sm text-gray-600 py-3 pl-2">Keine Belege vorhanden.</div>
      ) : (
        belegeForInstrument.map((b) => (
          <BelegCard
            key={b.id}
            beleg={b}
            instrument={instrument}
            onUpload={onUploadExisting}
            uploadingId={uploadingId}
          />
        ))
      )}

      {/* Gesamt + Beleg hinzufügen */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/50">
        {belegeForInstrument.length > 0 && (
          <div className="text-xs text-gray-500">
            Gesamt investiert: <span className="text-gray-300 font-semibold">{formatEuro(groupTotal)}</span>
          </div>
        )}
        <button
          onClick={() => onAddBeleg(instrument)}
          className="inline-flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-lg hover:bg-orange-500/20 transition-all ml-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Beleg hinzufügen
        </button>
      </div>
    </div>
  );
}

/* ── Haupt-View ─────────────────────────────────────────────────── */
export default function EinkaufView({ data, reload }) {
  const { belege, instrumente, instrumenteMap } = data;
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [modalInstrument, setModalInstrument] = useState(null);

  const totalInvest = belege.reduce((s, b) => s + (parseFloat(b.Betrag) || 0), 0);

  const filterSortConfig = useMemo(() => ({
    filters: [],
    sorts: [
      { key: "kaufdatum", label: "Kaufdatum", compareFn: (a, b) => (b.Kaufdatum || "").localeCompare(a.Kaufdatum || "") },
      { key: "betrag", label: "Betrag", compareFn: (a, b) => (parseFloat(b.Betrag) || 0) - (parseFloat(a.Betrag) || 0) },
    ],
  }), []);

  const fs = useFilterSort(belege, filterSortConfig);

  /* Instrumente mit mindestens einem Beleg + aktive Instrumente */
  const instrumentsWithBelege = useMemo(() => {
    const idsWithBelege = new Set();
    belege.forEach((b) => {
      const instId = b.Instrument_ID?.[0]?.id;
      if (instId) idsWithBelege.add(instId);
    });

    const relevantInstruments = instrumente.filter(
      (i) => idsWithBelege.has(i.id) || (i.Verfügbar?.value !== "Inaktiv" && i.Zustand?.value !== "Ausgemustert / inaktiv")
    );

    return relevantInstruments.sort((a, b) => (a.Modellname || "").localeCompare(b.Modellname || ""));
  }, [instrumente, belege]);

  /* Belege nach Instrument gruppieren */
  const belegeByInstrument = useMemo(() => {
    const map = {};
    fs.items.forEach((b) => {
      const instId = b.Instrument_ID?.[0]?.id || "none";
      if (!map[instId]) map[instId] = [];
      map[instId].push(b);
    });
    return map;
  }, [fs.items]);

  /* Flow: 1) POST neue Row → 2) Upload Datei → 3) PATCH URL in neue Row */
  const handleSaveBeleg = async (form, file) => {
    setSaving(true);
    try {
      const instrument = modalInstrument;

      // Schritt 1: Neuen Baserow-Eintrag erstellen
      const newRow = await createRow(TABLE_IDS.belege, {
        Beschreibung: form.Beschreibung.trim(),
        Händler: form.Händler.trim(),
        Kaufdatum: form.Kaufdatum || null,
        Betrag: form.Betrag || null,
        Instrument_ID: [instrument.id],
      });

      // Schritt 2: Datei hochladen (wenn vorhanden)
      if (file && WEBHOOK_BELEG_UPLOAD) {
        const ext = file.name.split(".").pop();
        const dateiname = `Beleg-${newRow.Beleg_ID || newRow.id}_${form.Händler.trim().replace(/\s/g, "-")}_${form.Kaufdatum || "unbekannt"}.${ext}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("beleg_id", String(newRow.id));
        formData.append("instrument_name", instrument.Modellname || "Unbekannt");
        formData.append("dateiname", dateiname);

        const res = await fetch(WEBHOOK_BELEG_UPLOAD, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Upload Fehler ${res.status}`);

        const result = await res.json();
        const driveUrl = result.url || result.webViewLink;

        // Schritt 3: URL in die NEUE Row schreiben (einzelner String, kein Array!)
        if (driveUrl) {
          await updateRow(TABLE_IDS.belege, newRow.id, { Beleg_URL: driveUrl });
        }
      }

      setToast({ message: "Beleg gespeichert ✓", type: "success" });
      setModalInstrument(null);
      reload();
    } catch (e) {
      setToast({ message: `Fehler: ${e.message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  /* Nachträglicher Upload für bestehenden Beleg OHNE URL */
  const handleUploadExisting = async (beleg, instrument, file) => {
    setUploadingId(beleg.id);
    try {
      const ext = file.name.split(".").pop();
      const dateiname = `Beleg-${beleg.Beleg_ID || beleg.id}_${(beleg.Händler || "").replace(/\s/g, "-")}_${beleg.Kaufdatum || "unbekannt"}.${ext}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("beleg_id", String(beleg.id));
      formData.append("instrument_name", instrument?.Modellname || "Unbekannt");
      formData.append("dateiname", dateiname);

      const res = await fetch(WEBHOOK_BELEG_UPLOAD, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload Fehler ${res.status}`);

      const result = await res.json();
      const driveUrl = result.url || result.webViewLink;

      if (driveUrl) {
        await updateRow(TABLE_IDS.belege, beleg.id, { Beleg_URL: driveUrl });
      }

      setToast({ message: "Beleg hochgeladen ✓", type: "success" });
      reload();
    } catch (e) {
      setToast({ message: `Upload fehlgeschlagen: ${e.message}`, type: "error" });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Belege" value={belege.length} color="white" />
        <StatCard label="Investiert" value={formatEuro(totalInvest)} color="red" />
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

      {/* Wenn Sort aktiv → flache Liste, sonst nach Instrument gruppiert */}
      {fs.activeSort ? (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
            Einkaufsbelege
          </div>
          {fs.items.length === 0 ? (
            <div className="text-center py-12 text-gray-600">Keine Einkaufsbelege.</div>
          ) : (
            fs.items.map((b) => (
              <BelegCard
                key={b.id}
                beleg={b}
                instrument={instrumenteMap[b.Instrument_ID?.[0]?.id]}
                onUpload={handleUploadExisting}
                uploadingId={uploadingId}
              />
            ))
          )}
        </>
      ) : (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
            Einkaufsbelege nach Instrument
          </div>
          {instrumentsWithBelege.length === 0 ? (
            <div className="text-center py-12 text-gray-600">Keine Instrumente vorhanden.</div>
          ) : (
            instrumentsWithBelege.map((inst) => (
              <InstrumentGroup
                key={inst.id}
                instrument={inst}
                belegeForInstrument={belegeByInstrument[inst.id] || []}
                onAddBeleg={setModalInstrument}
                onUploadExisting={handleUploadExisting}
                uploadingId={uploadingId}
              />
            ))
          )}
        </>
      )}

      {/* Modal */}
      {modalInstrument && (
        <NeuBelegModal
          instrument={modalInstrument}
          onClose={() => setModalInstrument(null)}
          onSave={handleSaveBeleg}
          saving={saving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
