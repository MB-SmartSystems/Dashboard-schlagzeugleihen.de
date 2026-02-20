import { useState, useCallback, useMemo } from "react";
import { Check, X, Send } from "lucide-react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import FilterBar from "../components/FilterBar";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro } from "../utils/format";
import { triggerWebhook, updateRow, TABLE_IDS } from "../api/baserow";

function statusBadge(val) {
  switch (val) {
    case "zu versenden": return <Badge color="yellow">Zu versenden</Badge>;
    case "offen": return <Badge color="accent">Offen</Badge>;
    case "versendet": return <Badge color="blue">Versendet</Badge>;
    case "angenommen": return <Badge color="green">Angenommen</Badge>;
    case "abgelehnt": return <Badge color="red">Abgelehnt</Badge>;
    case "abgelaufen": return <Badge color="gray">Abgelaufen</Badge>;
    default: return <Badge color="gray">{val || "–"}</Badge>;
  }
}

function AngebotCard({ angebot, kunde, onMarkSent, onAccept, onReject, loadingId }) {
  const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
  const status = angebot.Status?.value;
  const isZuVersenden = status === "zu versenden" || status === "offen";
  const isVersendet = status === "versendet";
  const isLoading = loadingId === angebot.Angebot_ID;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-accent/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{kundeName}</div>
          <div className="text-sm text-gray-500 mt-0.5">{angebot.Produkte || "–"}</div>
        </div>
        {statusBadge(status)}
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

        {/* Status "zu versenden" / "offen": Als versendet markieren */}
        {isZuVersenden && (
          <div className="ml-auto">
            <button
              onClick={() => onMarkSent(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 bg-accent/15 text-accent border border-accent/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-accent/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  Wird markiert...
                </>
              ) : (
                <><Send className="w-3.5 h-3.5" />Als versendet markieren</>
              )}
            </button>
          </div>
        )}

        {/* Status "versendet": Angenommen / Abgelehnt */}
        {isVersendet && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => onAccept(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <><Check className="w-3.5 h-3.5" />Angenommen</>
              )}
            </button>
            <button
              onClick={() => onReject(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />Abgelehnt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AngeboteView({ data, reload }) {
  const { angebote, kundenMap } = data;

  const [markSentAngebot, setMarkSentAngebot] = useState(null);
  const [confirmAngebot, setConfirmAngebot] = useState(null);
  const [rejectAngebot, setRejectAngebot] = useState(null);
  const [rejectGrund, setRejectGrund] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  /* AP 8: Als versendet markieren → PATCH direkt in Baserow */
  const handleMarkSentConfirm = async () => {
    if (!markSentAngebot) return;
    const angebotId = markSentAngebot.Angebot_ID;
    const rowId = markSentAngebot.id;
    setMarkSentAngebot(null);
    setLoadingId(angebotId);

    try {
      const gueltigBis = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString().split("T")[0];

      await updateRow(TABLE_IDS.angebote, rowId, {
        Status: 3313,         // "versendet"
        Gueltig_bis: gueltigBis,  // heute + 14 Tage
      });

      showToast(`Angebot #${angebotId} als versendet markiert.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* Angenommen → n8n Workflow */
  const handleAcceptConfirm = async () => {
    if (!confirmAngebot) return;
    const angebotId = confirmAngebot.Angebot_ID;
    setConfirmAngebot(null);
    setLoadingId(angebotId);

    try {
      await triggerWebhook("angebot_erstellen", { angebot_id: angebotId });
      showToast(`Angebot #${angebotId} wurde angenommen.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* Abgelehnt → n8n Workflow */
  const handleRejectConfirm = async () => {
    if (!rejectAngebot) return;
    const angebotId = rejectAngebot.Angebot_ID;
    const grund = rejectGrund;
    setRejectAngebot(null);
    setRejectGrund("");
    setLoadingId(angebotId);

    try {
      await triggerWebhook("angebot_ablehnen", { angebot_id: angebotId, grund });
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
        options: ["zu versenden", "versendet", "angenommen", "abgelehnt", "abgelaufen"] },
    ],
    sorts: [
      { key: "datum", label: "Datum", compareFn: (a, b) => (b.Angebotsdatum || "").localeCompare(a.Angebotsdatum || "") },
      { key: "gueltig", label: "Gültig bis", compareFn: (a, b) => (a.Gueltig_bis || "9999").localeCompare(b.Gueltig_bis || "9999") },
      { key: "preis", label: "Monatspreis", compareFn: (a, b) => (parseFloat(b.Preis_monat_EUR) || 0) - (parseFloat(a.Preis_monat_EUR) || 0) },
    ],
  }), []);

  const fs = useFilterSort(angebote, filterSortConfig);

  const offen = fs.items.filter((a) => ["zu versenden", "offen", "versendet"].includes(a.Status?.value));
  const angenommen = fs.items.filter((a) => a.Status?.value === "angenommen");
  const abgelehnt = fs.items.filter((a) => ["abgelehnt", "abgelaufen"].includes(a.Status?.value));

  const markSentKunde = markSentAngebot ? kundenMap[markSentAngebot.Kunden_ID?.[0]?.id] : null;
  const markSentKundeName = markSentKunde
    ? [markSentKunde.Vorname, markSentKunde.Nachname].filter(Boolean).join(" ")
    : "Unbekannt";

  const confirmKunde = confirmAngebot ? kundenMap[confirmAngebot.Kunden_ID?.[0]?.id] : null;
  const confirmName = confirmKunde
    ? [confirmKunde.Vorname, confirmKunde.Nachname].filter(Boolean).join(" ")
    : "Unbekannt";

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Offen" value={offen.length} color="accent" />
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
            onMarkSent={setMarkSentAngebot}
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
              onMarkSent={() => {}}
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
                onMarkSent={() => {}}
                onAccept={() => {}}
                onReject={() => {}}
                loadingId={loadingId}
              />
            ))}
          </div>
        </>
      )}

      {/* Bestätigungs-Modal: Als versendet markieren */}
      <Modal
        open={!!markSentAngebot}
        onClose={() => setMarkSentAngebot(null)}
        title="Angebot als versendet markieren?"
        footer={
          <>
            <button
              onClick={() => setMarkSentAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleMarkSentConfirm}
              className="bg-accent/15 text-accent border border-accent/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent/25 transition-all inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />Als versendet markieren
            </button>
          </>
        }
      >
        {markSentAngebot && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Angebot <span className="font-mono text-accent">#{markSentAngebot.Angebot_ID}</span> für{" "}
              <span className="font-semibold">{markSentKundeName}</span> als versendet markieren?
            </p>
            <p className="text-gray-500">
              Gültig bis: {formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])}
            </p>
          </div>
        )}
      </Modal>

      {/* Bestätigungs-Modal: Angenommen */}
      <Modal
        open={!!confirmAngebot}
        onClose={() => setConfirmAngebot(null)}
        title="Angebot angenommen?"
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
              className="bg-green-500/15 text-green-400 border border-green-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-500/25 transition-all inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />Angenommen
            </button>
          </>
        }
      >
        {confirmAngebot && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Angebot <span className="font-mono text-accent">#{confirmAngebot.Angebot_ID}</span> für{" "}
              <span className="font-semibold">{confirmName}</span> als angenommen markieren?
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
              <X className="w-3.5 h-3.5 inline mr-1" />Ablehnen & Absage senden
            </button>
          </>
        }
      >
        {rejectAngebot && (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              Angebot <span className="font-mono text-accent">#{rejectAngebot.Angebot_ID}</span> ablehnen?
            </p>
            <textarea
              value={rejectGrund}
              onChange={(e) => setRejectGrund(e.target.value)}
              placeholder="Grund (optional)"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-accent transition-colors resize-none"
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
