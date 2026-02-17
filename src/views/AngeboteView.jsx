import { useState, useCallback, useMemo } from "react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import FilterBar from "../components/FilterBar";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro } from "../utils/format";
import { triggerWebhook } from "../api/baserow";

const WEBHOOK_ERSTELLEN = import.meta.env.VITE_N8N_WEBHOOK_ANGEBOT_ERSTELLEN;
const WEBHOOK_ABLEHNEN = import.meta.env.VITE_N8N_WEBHOOK_ANGEBOT_ABLEHNEN;

function statusBadge(val) {
  switch (val) {
    case "offen": return <Badge color="orange">Offen</Badge>;
    case "versendet": return <Badge color="blue">Versendet</Badge>;
    case "angenommen": return <Badge color="green">Angenommen</Badge>;
    case "abgelehnt": return <Badge color="red">Abgelehnt</Badge>;
    case "abgelaufen": return <Badge color="gray">Abgelaufen</Badge>;
    default: return <Badge color="gray">{val || "–"}</Badge>;
  }
}

function AngebotCard({ angebot, kunde, onAccept, onReject, loadingId }) {
  const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
  const isOffen = angebot.Status?.value === "offen";
  const isLoading = loadingId === angebot.Angebot_ID;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{kundeName}</div>
          <div className="text-sm text-gray-500 mt-0.5">{angebot.Produkte || "–"}</div>
        </div>
        {statusBadge(angebot.Status?.value)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <DetailRow label="Angebotsnr." value={angebot.Angebotsnummer || "–"} mono />
        <DetailRow label="Datum" value={formatDate(angebot.Angebotsdatum)} />
        <DetailRow label="Gültig bis" value={formatDate(angebot.Gueltig_bis)} />
        <DetailRow label="Monatspreis" value={formatEuro(angebot.Preis_monat_EUR)} mono />
        <DetailRow label="Gesamt + Kaution" value={formatEuro(angebot.Gesamtpreis_mit_Kaution)} mono />
        <DetailRow label="Laufzeit" value={`${angebot.Laufzeit_Monate || 6} Monate`} />
      </div>

      <div className="flex items-center gap-2 mt-4">
        {angebot.Angebot_URL && (
          <a
            href={angebot.Angebot_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            PDF anzeigen &rarr;
          </a>
        )}

        {isOffen && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => onAccept(angebot)}
              disabled={isLoading}
              className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                  Wird gesendet...
                </span>
              ) : (
                "✓ Annehmen"
              )}
            </button>
            <button
              onClick={() => onReject(angebot)}
              disabled={isLoading}
              className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-50"
            >
              ✗ Ablehnen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AngeboteView({ data, reload }) {
  const { angebote, kundenMap } = data;

  const [confirmAngebot, setConfirmAngebot] = useState(null);
  const [rejectAngebot, setRejectAngebot] = useState(null);
  const [rejectGrund, setRejectGrund] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const handleAcceptConfirm = async () => {
    if (!confirmAngebot) return;
    const angebotId = confirmAngebot.Angebot_ID;
    setConfirmAngebot(null);
    setLoadingId(angebotId);

    try {
      await triggerWebhook(WEBHOOK_ERSTELLEN, { angebot_id: angebotId });
      showToast(`Angebot #${angebotId} wurde erstellt und versendet.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectAngebot) return;
    const angebotId = rejectAngebot.Angebot_ID;
    const grund = rejectGrund;
    setRejectAngebot(null);
    setRejectGrund("");
    setLoadingId(angebotId);

    try {
      await triggerWebhook(WEBHOOK_ABLEHNEN, { angebot_id: angebotId, grund });
      showToast(`Angebot #${angebotId} wurde abgelehnt.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  const filterSortConfig = useMemo(() => ({
    filters: [
      { key: "status", label: "Status", accessor: (a) => a.Status?.value || "–",
        options: ["offen", "versendet", "angenommen", "abgelehnt", "abgelaufen"] },
    ],
    sorts: [
      { key: "datum", label: "Datum", compareFn: (a, b) => (b.Angebotsdatum || "").localeCompare(a.Angebotsdatum || "") },
      { key: "gueltig", label: "Gültig bis", compareFn: (a, b) => (a.Gueltig_bis || "9999").localeCompare(b.Gueltig_bis || "9999") },
      { key: "preis", label: "Monatspreis", compareFn: (a, b) => (parseFloat(b.Preis_monat_EUR) || 0) - (parseFloat(a.Preis_monat_EUR) || 0) },
    ],
  }), []);

  const fs = useFilterSort(angebote, filterSortConfig);

  const offen = fs.items.filter((a) => ["offen", "versendet"].includes(a.Status?.value));
  const angenommen = fs.items.filter((a) => a.Status?.value === "angenommen");
  const abgelehnt = fs.items.filter((a) => ["abgelehnt", "abgelaufen"].includes(a.Status?.value));

  const confirmKunde = confirmAngebot ? kundenMap[confirmAngebot.Kunden_ID?.[0]?.id] : null;
  const confirmName = confirmKunde
    ? [confirmKunde.Vorname, confirmKunde.Nachname].filter(Boolean).join(" ")
    : "Unbekannt";

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Offen" value={offen.length} color="orange" />
        <StatCard label="Angenommen" value={angenommen.length} color="green" />
        <StatCard label="Abgelehnt" value={abgelehnt.length} color="red" />
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
        Offene Angebote
      </div>
      {offen.length === 0 ? (
        <div className="text-center py-8 text-gray-600">Keine offenen Angebote.</div>
      ) : (
        offen.map((a) => (
          <AngebotCard
            key={a.id}
            angebot={a}
            kunde={kundenMap[a.Kunden_ID?.[0]?.id]}
            onAccept={setConfirmAngebot}
            onReject={(ang) => { setRejectAngebot(ang); setRejectGrund(""); }}
            loadingId={loadingId}
          />
        ))
      )}

      {angenommen.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">
            Angenommen
          </div>
          {angenommen.map((a) => (
            <AngebotCard
              key={a.id}
              angebot={a}
              kunde={kundenMap[a.Kunden_ID?.[0]?.id]}
              onAccept={() => {}}
              onReject={() => {}}
              loadingId={loadingId}
            />
          ))}
        </>
      )}

      {abgelehnt.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">
            Abgelehnt / Abgelaufen
          </div>
          <div className="opacity-50">
            {abgelehnt.map((a) => (
              <AngebotCard
                key={a.id}
                angebot={a}
                kunde={kundenMap[a.Kunden_ID?.[0]?.id]}
                onAccept={() => {}}
                onReject={() => {}}
                loadingId={loadingId}
              />
            ))}
          </div>
        </>
      )}

      {/* Bestätigungs-Modal: Annehmen */}
      <Modal
        open={!!confirmAngebot}
        onClose={() => setConfirmAngebot(null)}
        title="Angebot annehmen?"
        footer={
          <>
            <button
              onClick={() => setConfirmAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAcceptConfirm}
              className="bg-green-500/15 text-green-400 border border-green-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-500/25 transition-all"
            >
              ✓ Annehmen & PDF erstellen
            </button>
          </>
        }
      >
        {confirmAngebot && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Angebot <span className="font-mono text-orange-400">#{confirmAngebot.Angebot_ID}</span> für{" "}
              <span className="font-semibold">{confirmName}</span> annehmen und PDF erstellen?
            </p>
            <p className="text-gray-500">
              {confirmAngebot.Produkte}
            </p>
            <p className="text-gray-500">
              {formatEuro(confirmAngebot.Preis_monat_EUR)}/Monat · {confirmAngebot.Laufzeit_Monate || 6} Monate
            </p>
          </div>
        )}
      </Modal>

      {/* Ablehnungs-Modal */}
      <Modal
        open={!!rejectAngebot}
        onClose={() => setRejectAngebot(null)}
        title="Angebot ablehnen"
        footer={
          <>
            <button
              onClick={() => setRejectAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleRejectConfirm}
              className="bg-red-500/15 text-red-400 border border-red-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-500/25 transition-all"
            >
              ✗ Ablehnen & Absage senden
            </button>
          </>
        }
      >
        {rejectAngebot && (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              Angebot <span className="font-mono text-orange-400">#{rejectAngebot.Angebot_ID}</span> ablehnen?
            </p>
            <textarea
              value={rejectGrund}
              onChange={(e) => setRejectGrund(e.target.value)}
              placeholder="Grund (optional)"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-orange-500 transition-colors resize-none"
            />
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
