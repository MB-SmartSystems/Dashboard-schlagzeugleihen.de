import { useState, useMemo, useRef } from "react";
import { Paperclip, ExternalLink, Plus, X as XIcon, Search, Check, Loader2, FileText, ChevronDown } from "lucide-react";
import StatCard from "../components/StatCard";
import DetailRow from "../components/DetailRow";
import FilterBar from "../components/FilterBar";
import Toast from "../components/Toast";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro } from "../utils/format";
import { updateRow, createRow, uploadBeleg, triggerWebhook, TABLE_IDS } from "../api/baserow";

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-accent transition-colors";

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-accent/50">
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
        ) : (
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
              className="inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
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
        )}
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
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-800 border border-gray-700 border-dashed rounded-lg py-3 hover:border-accent/50 hover:text-accent transition-all"
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
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

/* ── AI Beleg-Upload Modal ─────────────────────────────────────── */
function AIBelegModal({ instrumente, belege, onClose, onSaved }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1); // 1=upload, 2=analyzing, 3=confirm
  const [selectedInstrumentId, setSelectedInstrumentId] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [analyseResult, setAnalyseResult] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [instrumentStatus, setInstrumentStatus] = useState("keine");

  // Existing Händler for dropdown suggestions
  const haendlerList = useMemo(() => {
    const set = new Set();
    belege.forEach((b) => { if (b.Händler) set.add(b.Händler.trim()); });
    return [...set].sort();
  }, [belege]);

  // Active instruments for dropdown
  const activeInstrumente = useMemo(() =>
    instrumente
      .filter((i) => i.Verfügbar?.value !== "Inaktiv" && i.Zustand?.value !== "Ausgemustert / inaktiv")
      .sort((a, b) => (a.Modellname || "").localeCompare(b.Modellname || "")),
    [instrumente]
  );

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    // Create preview for images
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const handleAnalyse = async () => {
    if (!selectedInstrumentId || !file) return;
    setStep(2);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const media_type = file.type || "application/octet-stream";

      const result = await triggerWebhook("beleg_analyse", { base64, media_type, filename: file.name });

      // Expect: { haendler, kaufdatum, artikel: [{beschreibung, betrag}], gesamt_betrag }
      const parsed = result.haendler ? result : (result.data || result.result || result);

      setAnalyseResult({
        haendler: parsed.haendler || "",
        kaufdatum: parsed.kaufdatum || new Date().toISOString().split("T")[0],
        artikel: (parsed.artikel || []).map((a, idx) => ({
          id: idx,
          selected: true,
          beschreibung: a.beschreibung || "",
          betrag: String(a.betrag || "0"),
        })),
        gesamt_betrag: parsed.gesamt_betrag || null,
      });
      setStep(3);
    } catch (e) {
      setError(e.message);
      setStep(1);
    }
  };

  const updateArtikel = (idx, field, value) => {
    setAnalyseResult((prev) => ({
      ...prev,
      artikel: prev.artikel.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a
      ),
    }));
  };

  const toggleArtikel = (idx) => {
    setAnalyseResult((prev) => ({
      ...prev,
      artikel: prev.artikel.map((a, i) =>
        i === idx ? { ...a, selected: !a.selected } : a
      ),
    }));
  };

  const gesamtBerechnet = analyseResult
    ? analyseResult.artikel
        .filter((a) => a.selected)
        .reduce((s, a) => s + (parseFloat(a.betrag) || 0), 0)
    : 0;

  const handleSave = async () => {
    if (!analyseResult) return;
    setSaving(true);
    setError(null);

    try {
      const instId = Number(selectedInstrumentId);
      const selectedArtikel = analyseResult.artikel.filter((a) => a.selected);

      if (selectedArtikel.length === 0) {
        setError("Bitte mindestens einen Artikel auswählen.");
        setSaving(false);
        return;
      }

      // Step 1: Upload file once via n8n webhook → get URL
      let driveUrl = null;
      if (file) {
        const instrument = instrumente.find((i) => i.id === instId);
        const ext = file.name.split(".").pop();
        const dateiname = `Beleg_${analyseResult.haendler.replace(/\s/g, "-")}_${analyseResult.kaufdatum || "unbekannt"}.${ext}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("beleg_id", "ai-upload");
        formData.append("instrument_name", instrument?.Modellname || "Unbekannt");
        formData.append("dateiname", dateiname);

        try {
          const uploadResult = await uploadBeleg(formData);
          driveUrl = uploadResult.url || uploadResult.webViewLink;
        } catch {
          // Upload failed, continue without URL
        }
      }

      // Step 2: Create one row per selected article in table 835
      const createdRows = [];
      for (const artikel of selectedArtikel) {
        const newRow = await createRow(TABLE_IDS.belege, {
          Beschreibung: artikel.beschreibung.trim(),
          Händler: analyseResult.haendler.trim(),
          Kaufdatum: analyseResult.kaufdatum || null,
          Betrag: artikel.betrag || null,
          Instrument_ID: [instId],
        });
        createdRows.push(newRow);
      }

      // Step 3: Patch Beleg_URL for all created rows (same URL)
      if (driveUrl) {
        for (const row of createdRows) {
          await updateRow(TABLE_IDS.belege, row.id, { Beleg_URL: driveUrl });
        }
      }

      // Step 4: Optional instrument status update
      if (instrumentStatus !== "keine") {
        const statusMap = { lagernd: 3061, vermietet: 3062 };
        const statusId = statusMap[instrumentStatus];
        if (statusId) {
          await updateRow(TABLE_IDS.instrumente, instId, { Verfügbar: statusId });
        }
      }

      onSaved(`${createdRows.length} Beleg${createdRows.length > 1 ? "e" : ""} gespeichert`);
    } catch (e) {
      setError(`Fehler beim Speichern: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">
              {step === 1 && "Beleg analysieren"}
              {step === 2 && "Wird analysiert..."}
              {step === 3 && "Ergebnis prüfen"}
            </h3>
            <div className="text-sm text-gray-500 mt-0.5">
              {step === 1 && "Wähle ein Instrument und lade einen Beleg hoch"}
              {step === 2 && "Claude liest den Beleg aus"}
              {step === 3 && "Prüfe und korrigiere die erkannten Daten"}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Instrument + File Upload */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Instrument Dropdown */}
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Instrument *
              </label>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pr-8`}
                  value={selectedInstrumentId}
                  onChange={(e) => setSelectedInstrumentId(e.target.value)}
                >
                  <option value="">Instrument wählen...</option>
                  {activeInstrumente.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.Modellname} (INS-{i.Instrument_ID})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Beleg-Datei *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 text-sm text-gray-400 bg-gray-800 border border-gray-700 border-dashed rounded-lg py-6 hover:border-accent/50 hover:text-accent transition-all"
              >
                {file ? (
                  <>
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg border border-gray-700" />
                    ) : (
                      <FileText className="w-8 h-8 text-accent" />
                    )}
                    <span className="text-accent font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-6 h-6" />
                    <span>PDF, JPG oder PNG hochladen</span>
                  </>
                )}
              </button>
              {file && (
                <button
                  onClick={() => { setFile(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-xs text-red-400 hover:underline mt-1.5"
                >
                  Datei entfernen
                </button>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAnalyse}
                disabled={!selectedInstrumentId || !file}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Analysieren
              </button>
            </div>

          </div>
        )}

        {/* Step 2: Analyzing (Loading) */}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
            <div className="text-sm text-gray-400">Beleg wird von AI analysiert...</div>
            <div className="text-xs text-gray-600">Dies kann einige Sekunden dauern</div>
          </div>
        )}

        {/* Step 3: Confirm & Edit Results */}
        {step === 3 && analyseResult && (
          <div className="space-y-4">
            {/* Händler */}
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Händler
              </label>
              <input
                className={inputClass}
                value={analyseResult.haendler}
                onChange={(e) => setAnalyseResult((prev) => ({ ...prev, haendler: e.target.value }))}
                list="haendler-list"
              />
              <datalist id="haendler-list">
                {haendlerList.map((h) => <option key={h} value={h} />)}
              </datalist>
            </div>

            {/* Kaufdatum */}
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Kaufdatum
              </label>
              <input
                className={inputClass}
                type="date"
                value={analyseResult.kaufdatum}
                onChange={(e) => setAnalyseResult((prev) => ({ ...prev, kaufdatum: e.target.value }))}
              />
            </div>

            {/* Artikel-Liste */}
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Erkannte Artikel
              </label>
              <div className="space-y-2">
                {analyseResult.artikel.map((a, idx) => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      a.selected
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/30 border-gray-800 opacity-50"
                    }`}
                  >
                    <button
                      onClick={() => toggleArtikel(idx)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        a.selected
                          ? "bg-accent border-accent text-white"
                          : "border-gray-600 text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <input
                        className="w-full bg-transparent text-sm text-gray-200 outline-none placeholder-gray-600"
                        value={a.beschreibung}
                        onChange={(e) => updateArtikel(idx, "beschreibung", e.target.value)}
                        placeholder="Beschreibung"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        className="w-20 bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm text-right font-mono text-gray-200 outline-none focus:border-accent"
                        value={a.betrag}
                        onChange={(e) => updateArtikel(idx, "betrag", e.target.value)}
                        type="number"
                        step="0.01"
                      />
                      <span className="text-xs text-gray-500">€</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gesamtbetrag */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
                <span className="text-sm text-gray-500">Gesamtbetrag</span>
                <span className="text-sm font-mono font-bold text-accent">
                  {formatEuro(gesamtBerechnet)}
                </span>
              </div>
            </div>

            {/* Instrument-Status Option */}
            <div>
              <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                Instrument-Status aktualisieren
              </label>
              <div className="flex gap-2">
                {[
                  { key: "keine", label: "Keine Änderung" },
                  { key: "lagernd", label: "Lagernd" },
                  { key: "vermietet", label: "Vermietet" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setInstrumentStatus(opt.key)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      instrumentStatus === opt.key
                        ? "bg-accent/15 border-accent/30 text-accent"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setStep(1); setAnalyseResult(null); setError(null); }}
                className="flex-1 py-2.5 text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={handleSave}
                disabled={saving || analyseResult.artikel.filter((a) => a.selected).length === 0}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {analyseResult.artikel.filter((a) => a.selected).length} Beleg{analyseResult.artikel.filter((a) => a.selected).length > 1 ? "e" : ""} speichern
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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
          className="inline-flex items-center gap-1 text-xs text-accent bg-accent/10 border border-accent/30 px-2.5 py-1 rounded-lg hover:bg-accent/20 transition-all ml-auto"
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
  const [showAIModal, setShowAIModal] = useState(false);

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
      if (file) {
        const ext = file.name.split(".").pop();
        const dateiname = `Beleg-${newRow.Beleg_ID || newRow.id}_${form.Händler.trim().replace(/\s/g, "-")}_${form.Kaufdatum || "unbekannt"}.${ext}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("beleg_id", String(newRow.id));
        formData.append("instrument_name", instrument.Modellname || "Unbekannt");
        formData.append("dateiname", dateiname);

        const result = await uploadBeleg(formData);
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

      const result = await uploadBeleg(formData);
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
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-3 overflow-x-auto flex-1">
          <StatCard label="Belege" value={belege.length} color="white" />
          <StatCard label="Investiert" value={formatEuro(totalInvest)} color="red" />
        </div>
        <button
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-accent px-4 py-2.5 rounded-xl hover:bg-accent-dark transition-colors flex-shrink-0"
        >
          <Search className="w-4 h-4" />
          AI-Upload
        </button>
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

      {/* Manual Modal */}
      {modalInstrument && (
        <NeuBelegModal
          instrument={modalInstrument}
          onClose={() => setModalInstrument(null)}
          onSave={handleSaveBeleg}
          saving={saving}
        />
      )}

      {/* AI Upload Modal */}
      {showAIModal && (
        <AIBelegModal
          instrumente={instrumente}
          belege={belege}
          onClose={() => setShowAIModal(false)}
          onSaved={(msg) => {
            setShowAIModal(false);
            setToast({ message: msg + " ✓", type: "success" });
            reload();
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
