import { useMemo, useState, useCallback } from "react";
import { Check, X, Mail } from "lucide-react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import ProgressBar from "../components/ProgressBar";
import FilterBar from "../components/FilterBar";
import Toast from "../components/Toast";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro, daysUntil, progressPercent, selectValue } from "../utils/format";
import { updateRow, TABLE_IDS } from "../api/baserow";

function MietCard({ miete, kunde, instrument, showProgress = false, navigateTo, emailLogs = [], onBeantwortet }) {
  const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
  const instrName = instrument?.Modellname || "Unbekannt";
  const instrTyp = instrument?.Typ || "";
  const kundeId = miete.Kunde_ID?.[0]?.id;
  const instrId = miete.Instrument_ID?.[0]?.id;

  const mietende = miete.Mietende_berechnet;
  const days = daysUntil(mietende);
  const pct = progressPercent(miete.Mietbeginn, mietende);

  const status = miete.Status?.value || "–";
  let badgeColor = "green";
  let badgeText = status;

  if (status === "Beendet") { badgeColor = "gray"; }
  else if (status === "Reserviert") { badgeColor = "blue"; badgeText = "Reserviert"; }
  else if (status === "Bestellt") { badgeColor = "blue"; badgeText = "Bestellt"; }
  else if (status === "Bereit") { badgeColor = "blue"; badgeText = "Bereit"; }
  else if (status === "Anfrage") { badgeColor = "blue"; badgeText = "Anfrage"; }
  else if (days <= 0) { badgeColor = "red"; badgeText = "Überfällig"; }
  else if (days <= 30) { badgeColor = "yellow"; badgeText = `${days}d`; }

  const kautionGezahlt = miete.Kaution_gezahlt?.value === "Ja";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-accent/50">
      <div className="flex justify-between items-start mb-3.5">
        <div>
          <button
            onClick={() => navigateTo && kundeId && navigateTo("kunden", kundeId)}
            className="text-[1.05rem] font-semibold text-left text-accent hover:underline transition-colors"
          >
            {kundeName}
          </button>
          <div className="text-sm mt-0.5">
            <button
              onClick={() => navigateTo && instrId && navigateTo("instrumente", instrId)}
              className="text-gray-400 hover:text-accent hover:underline transition-colors"
            >
              {instrName}
            </button>
            <span className="text-gray-500"> &middot; {instrTyp}</span>
          </div>
        </div>
        <Badge color={badgeColor}>{badgeText}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <DetailRow label="Mietbeginn" value={formatDate(miete.Mietbeginn)} />
        <DetailRow label="Mietende" value={formatDate(mietende)} />
        <DetailRow label="Monatspreis" value={formatEuro(miete.Preis_monat_EUR)} mono />
        <DetailRow label="Kaution">
          <Badge color={kautionGezahlt ? "green" : "red"}>
            {kautionGezahlt ? <Check className="w-3 h-3 inline mr-0.5" /> : <X className="w-3 h-3 inline mr-0.5" />}
            {formatEuro(miete.Kaution_EUR)}
          </Badge>
        </DetailRow>
        <DetailRow label="Zahlungsart" value={selectValue(miete.Zahlungsart)} />
        <DetailRow label="Laufzeit" value={`${miete.Laufzeit_Monate || "–"} Monate`} />
      </div>

      {showProgress && <ProgressBar percent={pct} />}

      {/* Follow-Up Emails mit Beantwortet-Button */}
      {emailLogs.length > 0 && (
        <div className="mt-3 border-t border-gray-800 pt-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Follow-Up Mails
          </div>
          {emailLogs.map((log) => {
            const beantwortet = log.Beantwortet?.value === "Ja";
            return (
              <div key={log.id} className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span>{log.Email_Type?.value || "–"}</span>
                  <span className="text-gray-600">{formatDate(log.Sent_at)}</span>
                </div>
                <button
                  onClick={() => onBeantwortet && onBeantwortet(log.id, !beantwortet)}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                    beantwortet
                      ? "bg-green-500/15 text-green-400 border border-green-500/30"
                      : "bg-gray-800 text-gray-500 border border-gray-700 hover:text-accent hover:border-accent/30"
                  }`}
                >
                  {beantwortet ? <Check className="w-3 h-3" /> : null}
                  {beantwortet ? "Beantwortet" : "Als beantwortet markieren"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MietenView({ data, reload, navigateTo }) {
  const { mieten, kundenMap, instrumenteMap, emailLog = [] } = data;
  const [toast, setToast] = useState(null);

  // EmailLogs pro Miete gruppieren (nur Follow-Up-Typen: Woche 1, Pre_end_14d, Pre_end_2d)
  const emailLogsByMiete = useMemo(() => {
    const map = {};
    for (const log of emailLog) {
      const mietIds = (log.Miet_ID || []).map((m) => m.id);
      for (const mid of mietIds) {
        if (!map[mid]) map[mid] = [];
        map[mid].push(log);
      }
    }
    return map;
  }, [emailLog]);

  const handleBeantwortet = useCallback(async (logId, value) => {
    try {
      await updateRow(TABLE_IDS.emailLog, logId, {
        Beantwortet: value ? "Ja" : "Nein",
      });
      setToast({ message: value ? "Als beantwortet markiert." : "Markierung entfernt.", type: "success" });
      reload();
    } catch (e) {
      setToast({ message: `Fehler: ${e.message}`, type: "error" });
    }
  }, [reload]);

  const filterSortConfig = useMemo(() => ({
    filters: [
      { key: "status", label: "Status", accessor: (m) => m.Status?.value || "–",
        options: ["Anfrage", "Reserviert", "Bestellt", "Bereit", "Aktiv", "Verlängert", "unbefristet", "Beendet"] },
      { key: "zahlungsart", label: "Zahlungsart", accessor: (m) => m.Zahlungsart?.value || "–",
        options: ["Überweisung", "Dauerauftrag", "Paypal", "Bar"] },
      { key: "kaution", label: "Kaution", accessor: (m) => m.Kaution_gezahlt?.value === "Ja" ? "Gezahlt" : "Offen",
        options: ["Offen", "Gezahlt"] },
    ],
    sorts: [
      { key: "mietende", label: "Mietende", compareFn: (a, b) => (a.Mietende_berechnet || "9999").localeCompare(b.Mietende_berechnet || "9999") },
      { key: "preis", label: "Monatspreis", compareFn: (a, b) => (parseFloat(b.Preis_monat_EUR) || 0) - (parseFloat(a.Preis_monat_EUR) || 0) },
      { key: "kunde_az", label: "Kunde A-Z", compareFn: (a, b) => {
        const na = [kundenMap[a.Kunde_ID?.[0]?.id]?.Nachname, kundenMap[a.Kunde_ID?.[0]?.id]?.Vorname].filter(Boolean).join(" ");
        const nb = [kundenMap[b.Kunde_ID?.[0]?.id]?.Nachname, kundenMap[b.Kunde_ID?.[0]?.id]?.Vorname].filter(Boolean).join(" ");
        return na.localeCompare(nb);
      }},
    ],
  }), [kundenMap]);

  const fs = useFilterSort(mieten, filterSortConfig);

  const pipeline = fs.items.filter((m) => ["Reserviert", "Bestellt", "Bereit"].includes(m.Status?.value));
  const aktiv = fs.items
    .filter((m) => ["Aktiv", "Verlängert", "unbefristet"].includes(m.Status?.value))
    .sort((a, b) => (a.Mietende_berechnet || "9999").localeCompare(b.Mietende_berechnet || "9999"));
  const beendet = fs.items.filter((m) => m.Status?.value === "Beendet");

  const aktivAll = mieten.filter((m) => ["Aktiv", "Verlängert", "unbefristet"].includes(m.Status?.value));
  const totalRevenue = aktivAll.reduce((s, m) => s + (parseFloat(m.Preis_monat_EUR) || 0), 0);
  const nextEnd = aktivAll.map((m) => m.Mietende_berechnet).filter(Boolean).sort()[0];
  const kautionOffen = aktivAll.filter((m) => m.Kaution_gezahlt?.value !== "Ja").length;

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Aktive Mieten" value={aktivAll.length} color="green" />
        <StatCard label="Monatl. Einnahmen" value={formatEuro(totalRevenue)} color="accent" />
        <StatCard label="Nächstes Ende" value={nextEnd ? formatDate(nextEnd) : "–"} color="blue" />
        <StatCard label="Kaution offen" value={kautionOffen} color={kautionOffen > 0 ? "red" : "green"} />
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

      {pipeline.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">Pipeline</div>
          {pipeline.map((m) => (
            <MietCard key={m.id} miete={m} kunde={kundenMap[m.Kunde_ID?.[0]?.id]} instrument={instrumenteMap[m.Instrument_ID?.[0]?.id]} navigateTo={navigateTo} emailLogs={emailLogsByMiete[m.id] || []} onBeantwortet={handleBeantwortet} />
          ))}
        </>
      )}

      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">
        Aktive Mietverträge
      </div>
      {aktiv.length === 0 ? (
        <div className="text-center py-12 text-gray-600">Keine aktiven Mieten.</div>
      ) : (
        aktiv.map((m) => (
          <MietCard key={m.id} miete={m} kunde={kundenMap[m.Kunde_ID?.[0]?.id]} instrument={instrumenteMap[m.Instrument_ID?.[0]?.id]} showProgress navigateTo={navigateTo} emailLogs={emailLogsByMiete[m.id] || []} onBeantwortet={handleBeantwortet} />
        ))
      )}

      {beendet.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">Beendet</div>
          <div className="opacity-50">
            {beendet.map((m) => (
              <MietCard key={m.id} miete={m} kunde={kundenMap[m.Kunde_ID?.[0]?.id]} instrument={instrumenteMap[m.Instrument_ID?.[0]?.id]} navigateTo={navigateTo} />
            ))}
          </div>
        </>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
