import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Check, X, Send, FileText, Truck } from "lucide-react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import FilterBar from "../components/FilterBar";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro } from "../utils/format";
import { triggerWebhook, updateRow, createRow, TABLE_IDS } from "../api/baserow";

function statusBadge(val) {
  switch (val) {
    case "offen": return <Badge color="accent">Offen</Badge>;
    case "angenommen": return <Badge color="blue">Angenommen</Badge>;
    case "zu versenden": return <Badge color="yellow">Zu versenden</Badge>;
    case "versendet": return <Badge color="blue">Versendet</Badge>;
    case "Kunde angenommen": return <Badge color="green">Kunde angenommen</Badge>;
    case "abgelehnt": return <Badge color="red">Abgelehnt</Badge>;
    case "Kunde abgelehnt": return <Badge color="red">Kunde abgelehnt</Badge>;
    case "abgelaufen": return <Badge color="gray">Abgelaufen</Badge>;
    default: return <Badge color="gray">{val || "–"}</Badge>;
  }
}

function AngebotCard({
  angebot, kunde,
  onAcceptInquiry, onRejectInquiry,
  onMarkSent,
  onCustomerAccepted, onCustomerRejected,
  onRechnungErstellen,
  loadingId,
  isHighlighted,
}) {
  const cardRef = useRef(null);
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);
  const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
  const status = angebot.Status?.value;
  const isLoading = loadingId === angebot.Angebot_ID;

  // Check if versendet and expired
  const isExpired = status === "versendet" && angebot.Gueltig_bis &&
    new Date(angebot.Gueltig_bis) < new Date(new Date().toDateString());

  return (
    <div ref={cardRef} className={`bg-gray-900 border rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-accent/50 ${isHighlighted ? "border-accent ring-1 ring-accent/30" : "border-gray-800"}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{kundeName}</div>
          <div className="text-sm text-gray-500 mt-0.5">{angebot.Produkte || "–"}</div>
        </div>
        <div className="flex items-center gap-2">
          {isExpired && <Badge color="red">⚠️ Abgelaufen</Badge>}
          {statusBadge(status)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <DetailRow label="Angebotsnr." value={angebot.Angebotsnummer || "–"} mono />
        <DetailRow label="Datum" value={formatDate(angebot.Angebotsdatum)} />
        <DetailRow label="Gültig bis" value={formatDate(angebot.Gueltig_bis)} />
        <DetailRow label="Monatspreis" value={formatEuro(angebot.Preis_monat_EUR)} mono />
        <DetailRow label="Gesamt + Kaution" value={formatEuro(angebot.Gesamtpreis_mit_Kaution)} mono />
        <DetailRow label="Laufzeit" value={`${angebot.Laufzeit_Monate || 6} Monate`} />
      </div>

      {/* Anfragetext for offen status */}
      {status === "offen" && angebot.Anfragetext && (
        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Anfragetext</div>
          <div className="text-sm text-gray-300 whitespace-pre-wrap">{angebot.Anfragetext}</div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        {/* PDF Link */}
        {angebot.Angebot_URL && (
          <a
            href={angebot.Angebot_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF anzeigen &rarr;
          </a>
        )}

        {/* Phase 1: offen → Annehmen / Ablehnen */}
        {status === "offen" && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => onAcceptInquiry(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Annehmen
            </button>
            <button
              onClick={() => onRejectInquiry(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />Ablehnen
            </button>
          </div>
        )}

        {/* Phase 3: zu versenden → Als versendet markieren */}
        {status === "zu versenden" && (
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

        {/* Phase 5: Kunde angenommen → Rechnung erstellen */}
        {status === "Kunde angenommen" && onRechnungErstellen && (
          <div className="ml-auto">
            <button
              onClick={() => onRechnungErstellen(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-3 h-3 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
              ) : (
                <Truck className="w-3.5 h-3.5" />
              )}
              Abgeholt / Geliefert
            </button>
          </div>
        )}

        {/* Phase 4: versendet → Kunde angenommen / Kunde abgelehnt */}
        {status === "versendet" && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => onCustomerAccepted(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Kunde angenommen
            </button>
            <button
              onClick={() => onCustomerRejected(angebot)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500/25 transition-all disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />Kunde abgelehnt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AngeboteView({ data, reload, reloadAufgaben, selectedId, onSelectedClear }) {
  const { angebote, kundenMap } = data;

  useEffect(() => {
    if (selectedId && onSelectedClear) {
      const timer = setTimeout(() => onSelectedClear(), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedId, onSelectedClear]);

  /* ── Modal states ── */
  const [acceptInquiryAngebot, setAcceptInquiryAngebot] = useState(null);
  const [rejectInquiryAngebot, setRejectInquiryAngebot] = useState(null);
  const [rejectGrund, setRejectGrund] = useState("");
  const [markSentAngebot, setMarkSentAngebot] = useState(null);
  const [customerAcceptedAngebot, setCustomerAcceptedAngebot] = useState(null);
  const [customerRejectedAngebot, setCustomerRejectedAngebot] = useState(null);
  const [rechnungAngebot, setRechnungAngebot] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  /* Helper */
  const getKundeName = (angebot) => {
    if (!angebot) return "Unbekannt";
    const k = kundenMap[angebot.Kunden_ID?.[0]?.id];
    return k ? [k.Vorname, k.Nachname].filter(Boolean).join(" ") : "Unbekannt";
  };

  /* ── Phase 1: Annehmen → n8n Webhook "angebot_erstellen" ── */
  const handleAcceptInquiry = async () => {
    if (!acceptInquiryAngebot) return;
    const angebotId = acceptInquiryAngebot.Angebot_ID;
    setAcceptInquiryAngebot(null);
    setLoadingId(angebotId);
    try {
      await triggerWebhook("angebot_erstellen", { angebot_id: angebotId });
      showToast(`Anfrage #${angebotId} angenommen – PDF wird erstellt.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Phase 2b: Ablehnen → n8n Webhook "absage_senden" ── */
  const handleRejectInquiry = async () => {
    if (!rejectInquiryAngebot) return;
    const angebotId = rejectInquiryAngebot.Angebot_ID;
    const grund = rejectGrund;
    setRejectInquiryAngebot(null);
    setRejectGrund("");
    setLoadingId(angebotId);
    try {
      await triggerWebhook("absage_senden", { angebot_id: angebotId, grund });
      showToast(`Anfrage #${angebotId} abgelehnt – Absage wird gesendet.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Phase 3: Als versendet markieren → PATCH Status 3754 + Gueltig_bis ── */
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
        Status: 3754,              // "versendet"
        Gueltig_bis: gueltigBis,   // heute + 14 Tage
      });
      showToast(`Angebot #${angebotId} als versendet markiert.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Phase 4a: Kunde angenommen → n8n Webhook "angebot_angenommen" ── */
  const handleCustomerAccepted = async () => {
    if (!customerAcceptedAngebot) return;
    const angebotId = customerAcceptedAngebot.Angebot_ID;
    setCustomerAcceptedAngebot(null);
    setLoadingId(angebotId);
    try {
      await triggerWebhook("angebot_angenommen", { angebot_id: angebotId });
      showToast(`Angebot #${angebotId} – Kunde hat angenommen.`);
      reload();
      reloadAufgaben();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Phase 4b: Kunde abgelehnt → PATCH Status 3863 ── */
  const handleCustomerRejected = async () => {
    if (!customerRejectedAngebot) return;
    const angebotId = customerRejectedAngebot.Angebot_ID;
    const rowId = customerRejectedAngebot.id;
    setCustomerRejectedAngebot(null);
    setLoadingId(angebotId);
    try {
      await updateRow(TABLE_IDS.angebote, rowId, {
        Status: 3863,  // "Kunde abgelehnt"
      });
      showToast(`Angebot #${angebotId} – Kunde hat abgelehnt.`);
      reload();
    } catch (e) {
      showToast(`Fehler: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Phase 5: Rechnung erstellen → (Miete anlegen wenn nötig) + Webhook + PATCH Status "Abgeholt" ── */
  const handleRechnungErstellen = async () => {
    if (!rechnungAngebot) return;
    const angebotId = rechnungAngebot.Angebot_ID;
    const rowId = rechnungAngebot.id;
    setRechnungAngebot(null);
    setLoadingId(angebotId);
    try {
      let mietId = rechnungAngebot.Mieten?.[0]?.id;

      // Keine Miete vorhanden → jetzt erstellen
      if (!mietId) {
        const today = new Date().toISOString().slice(0, 10);
        const kundeId = rechnungAngebot.Kunden_ID?.[0]?.id;
        const newMiete = await createRow(TABLE_IDS.mieten, {
          Kunde_ID: kundeId ? [kundeId] : [],
          Mietbeginn: today,
          Laufzeit_Monate: rechnungAngebot.Laufzeit_Monate || 6,
          Status: "Aktiv",
          Preis_monat_EUR: parseFloat(rechnungAngebot.Preis_monat_EUR) || 0,
          Kaution_EUR: parseFloat(rechnungAngebot.Kaution) || 0,
          Angebot_ID: [rowId],
        });
        mietId = newMiete.id;
      }

      await triggerWebhook("rechnung_erstellen", { miet_id: mietId });
      await updateRow(TABLE_IDS.angebote, rowId, { Status: 3918 });
      showToast(`Rechnung für Angebot #${angebotId} wird erstellt.`);
      reload();
    } catch (e) {
      showToast(`Fehler beim Erstellen der Rechnung: ${e.message}`, "error");
    } finally {
      setLoadingId(null);
    }
  };

  /* ── Filter & Sort ── */
  const filterSortConfig = useMemo(() => ({
    filters: [
      {
        key: "status", label: "Status", accessor: (a) => a.Status?.value || "–",
        options: ["offen", "zu versenden", "versendet", "angenommen", "abgelehnt", "abgelaufen", "Kunde angenommen", "Kunde abgelehnt"],
      },
    ],
    sorts: [
      { key: "datum", label: "Datum", compareFn: (a, b) => (b.Angebotsdatum || "").localeCompare(a.Angebotsdatum || "") },
      { key: "gueltig", label: "Gültig bis", compareFn: (a, b) => (a.Gueltig_bis || "9999").localeCompare(b.Gueltig_bis || "9999") },
      { key: "preis", label: "Monatspreis", compareFn: (a, b) => (parseFloat(b.Preis_monat_EUR) || 0) - (parseFloat(a.Preis_monat_EUR) || 0) },
    ],
  }), []);

  const fs = useFilterSort(angebote, filterSortConfig);

  /* ── Grouping ── */
  const aktiv = fs.items.filter((a) =>
    ["offen", "angenommen", "zu versenden", "versendet"].includes(a.Status?.value)
  );
  const kundeAngenommen = fs.items.filter((a) => a.Status?.value === "Kunde angenommen");
  const abgeschlossen = fs.items.filter((a) =>
    ["abgelehnt", "abgelaufen", "Kunde abgelehnt", "Abgeholt"].includes(a.Status?.value)
  );

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Aktiv" value={aktiv.length} color="accent" />
        <StatCard label="Angenommen" value={kundeAngenommen.length} color="green" />
        <StatCard label="Abgeschlossen" value={abgeschlossen.length} color="red" />
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

      {/* Aktive Angebote */}
      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Aktive Angebote
      </div>
      {aktiv.length === 0 ? (
        <div className="text-center py-8 text-gray-600">Keine aktiven Angebote.</div>
      ) : (
        aktiv.map((a) => (
          <AngebotCard
            key={a.id}
            angebot={a}
            kunde={kundenMap[a.Kunden_ID?.[0]?.id]}
            onAcceptInquiry={setAcceptInquiryAngebot}
            onRejectInquiry={(ang) => { setRejectInquiryAngebot(ang); setRejectGrund(""); }}
            onMarkSent={setMarkSentAngebot}
            onCustomerAccepted={setCustomerAcceptedAngebot}
            onCustomerRejected={setCustomerRejectedAngebot}
            loadingId={loadingId}
            isHighlighted={selectedId === a.id}
          />
        ))
      )}

      {/* Kunde angenommen */}
      {kundeAngenommen.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">
            Kunde angenommen
          </div>
          {kundeAngenommen.map((a) => (
            <AngebotCard
              key={a.id}
              angebot={a}
              kunde={kundenMap[a.Kunden_ID?.[0]?.id]}
              onAcceptInquiry={() => {}}
              onRejectInquiry={() => {}}
              onMarkSent={() => {}}
              onCustomerAccepted={() => {}}
              onCustomerRejected={() => {}}
              onRechnungErstellen={setRechnungAngebot}
              loadingId={loadingId}
              isHighlighted={selectedId === a.id}
            />
          ))}
        </>
      )}

      {/* Abgeschlossen */}
      {abgeschlossen.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">
            Abgelehnt / Abgelaufen
          </div>
          <div className="opacity-50">
            {abgeschlossen.map((a) => (
              <AngebotCard
                key={a.id}
                angebot={a}
                kunde={kundenMap[a.Kunden_ID?.[0]?.id]}
                onAcceptInquiry={() => {}}
                onRejectInquiry={() => {}}
                onMarkSent={() => {}}
                onCustomerAccepted={() => {}}
                onCustomerRejected={() => {}}
                loadingId={loadingId}
                isHighlighted={selectedId === a.id}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modal: Anfrage annehmen (Phase 1) ── */}
      <Modal
        open={!!acceptInquiryAngebot}
        onClose={() => setAcceptInquiryAngebot(null)}
        title="Anfrage annehmen?"
        footer={
          <>
            <button
              onClick={() => setAcceptInquiryAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAcceptInquiry}
              className="bg-green-500/15 text-green-400 border border-green-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-500/25 transition-all inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />Annehmen & PDF erstellen
            </button>
          </>
        }
      >
        {acceptInquiryAngebot && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Anfrage <span className="font-mono text-accent">#{acceptInquiryAngebot.Angebot_ID}</span> von{" "}
              <span className="font-semibold">{getKundeName(acceptInquiryAngebot)}</span> annehmen?
            </p>
            <p className="text-gray-500">{acceptInquiryAngebot.Produkte}</p>
            <p className="text-gray-500 text-xs">
              Der n8n-Workflow erstellt das Angebots-PDF und setzt den Status auf &quot;zu versenden&quot;.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Modal: Anfrage ablehnen (Phase 2b) ── */}
      <Modal
        open={!!rejectInquiryAngebot}
        onClose={() => setRejectInquiryAngebot(null)}
        title="Anfrage ablehnen"
        footer={
          <>
            <button
              onClick={() => setRejectInquiryAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleRejectInquiry}
              className="bg-red-500/15 text-red-400 border border-red-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-500/25 transition-all inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />Ablehnen & Absage senden
            </button>
          </>
        }
      >
        {rejectInquiryAngebot && (
          <div className="space-y-3">
            <p className="text-sm text-gray-300">
              Anfrage <span className="font-mono text-accent">#{rejectInquiryAngebot.Angebot_ID}</span> von{" "}
              <span className="font-semibold">{getKundeName(rejectInquiryAngebot)}</span> ablehnen?
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

      {/* ── Modal: Als versendet markieren (Phase 3) ── */}
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
              <span className="font-semibold">{getKundeName(markSentAngebot)}</span> als versendet markieren?
            </p>
            <p className="text-gray-500">
              Gültig bis: {formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])}
            </p>
          </div>
        )}
      </Modal>

      {/* ── Modal: Kunde angenommen (Phase 4a) ── */}
      <Modal
        open={!!customerAcceptedAngebot}
        onClose={() => setCustomerAcceptedAngebot(null)}
        title="Kunde hat angenommen?"
        footer={
          <>
            <button
              onClick={() => setCustomerAcceptedAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleCustomerAccepted}
              className="bg-green-500/15 text-green-400 border border-green-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-500/25 transition-all inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />Kunde angenommen
            </button>
          </>
        }
      >
        {customerAcceptedAngebot && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Angebot <span className="font-mono text-accent">#{customerAcceptedAngebot.Angebot_ID}</span> –{" "}
              <span className="font-semibold">{getKundeName(customerAcceptedAngebot)}</span> hat das Angebot angenommen?
            </p>
            <p className="text-gray-500">{customerAcceptedAngebot.Produkte}</p>
            <p className="text-gray-500">
              {formatEuro(customerAcceptedAngebot.Preis_monat_EUR)}/Monat · {customerAcceptedAngebot.Laufzeit_Monate || 6} Monate
            </p>
            <p className="text-gray-500 text-xs">
              Der n8n-Workflow setzt den Status auf &quot;Kunde angenommen&quot; und erstellt ggf. die Miete.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Modal: Kunde abgelehnt (Phase 4b) ── */}
      <Modal
        open={!!customerRejectedAngebot}
        onClose={() => setCustomerRejectedAngebot(null)}
        title="Kunde hat abgelehnt?"
        footer={
          <>
            <button
              onClick={() => setCustomerRejectedAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleCustomerRejected}
              className="bg-red-500/15 text-red-400 border border-red-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-500/25 transition-all inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />Kunde abgelehnt
            </button>
          </>
        }
      >
        {customerRejectedAngebot && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <span className="font-semibold">{getKundeName(customerRejectedAngebot)}</span> hat{" "}
              Angebot <span className="font-mono text-accent">#{customerRejectedAngebot.Angebot_ID}</span> abgelehnt?
            </p>
            <p className="text-gray-500">
              Das Angebot wird als &quot;Kunde abgelehnt&quot; markiert.
            </p>
          </div>
        )}
      </Modal>

      {/* ── Modal: Rechnung erstellen (Phase 5) ── */}
      <Modal
        open={!!rechnungAngebot}
        onClose={() => setRechnungAngebot(null)}
        title="Rechnung erstellen?"
        footer={
          <>
            <button
              onClick={() => setRechnungAngebot(null)}
              className="text-gray-400 text-sm px-4 py-2 rounded-lg hover:text-gray-200 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleRechnungErstellen}
              className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-500/25 transition-all inline-flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />Rechnung erstellen & abschließen
            </button>
          </>
        }
      >
        {rechnungAngebot && (
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Instrument wurde abgeholt/geliefert für{" "}
              <span className="font-semibold">{getKundeName(rechnungAngebot)}</span>?
            </p>
            <p className="text-gray-500">Angebot #{rechnungAngebot.Angebot_ID} · {rechnungAngebot.Produkte}</p>
            <p className="text-gray-500 text-xs">
              Der n8n-Workflow erstellt die Rechnung. Das Angebot wird als &quot;Abgeholt&quot; markiert und aus dieser Ansicht entfernt.
            </p>
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
