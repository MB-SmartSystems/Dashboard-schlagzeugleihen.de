import { useState, useMemo, useRef } from "react";
import { Paperclip, ExternalLink } from "lucide-react";
import StatCard from "../components/StatCard";
import DetailRow from "../components/DetailRow";
import FilterBar from "../components/FilterBar";
import Toast from "../components/Toast";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro } from "../utils/format";
import { updateRow, TABLE_IDS } from "../api/baserow";

const WEBHOOK_BELEG_UPLOAD = import.meta.env.VITE_N8N_WEBHOOK_BELEG_UPLOAD;

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
          {instrument && (
            <div className="text-sm text-gray-500 mt-0.5">{instrument.Modellname}</div>
          )}
        </div>
        <div className="text-lg font-bold font-mono text-red-400">
          {formatEuro(beleg.Betrag)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <DetailRow label="Händler" value={beleg.Händler || "–"} />
        <DetailRow label="Kaufdatum" value={formatDate(beleg.Kaufdatum)} />
        {beleg.Beleg_ID && <DetailRow label="Beleg-ID" value={beleg.Beleg_ID} mono />}
      </div>

      <div className="mt-3 flex items-center gap-3">
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

export default function EinkaufView({ data, reload }) {
  const { belege, instrumenteMap } = data;
  const [uploadingId, setUploadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const totalInvest = belege.reduce((s, b) => s + (parseFloat(b.Betrag) || 0), 0);

  const filterSortConfig = useMemo(() => ({
    filters: [],
    sorts: [
      { key: "kaufdatum", label: "Kaufdatum", compareFn: (a, b) => (b.Kaufdatum || "").localeCompare(a.Kaufdatum || "") },
      { key: "betrag", label: "Betrag", compareFn: (a, b) => (parseFloat(b.Betrag) || 0) - (parseFloat(a.Betrag) || 0) },
    ],
  }), []);

  const fs = useFilterSort(belege, filterSortConfig);

  const handleUpload = async (beleg, instrument, file) => {
    setUploadingId(beleg.id);
    try {
      const instrumentName = instrument?.Modellname || "Unbekannt";
      const ext = file.name.split(".").pop();
      const kaufdatum = beleg.Kaufdatum || "unbekannt";
      const dateiname = `Beleg-${beleg.Beleg_ID || beleg.id}_${(beleg.Händler || "").replace(/\s/g, "-")}_${kaufdatum}.${ext}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("beleg_id", String(beleg.id));
      formData.append("instrument_name", instrumentName);
      formData.append("dateiname", dateiname);

      const res = await fetch(WEBHOOK_BELEG_UPLOAD, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload Fehler ${res.status}`);

      const result = await res.json();
      const driveUrl = result.url || result.webViewLink;

      if (!driveUrl) throw new Error("Keine URL vom Server erhalten");

      await updateRow(TABLE_IDS.belege, beleg.id, { Beleg_URL: driveUrl });

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
            onUpload={handleUpload}
            uploadingId={uploadingId}
          />
        ))
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
