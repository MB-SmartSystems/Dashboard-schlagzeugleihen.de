import { useMemo } from "react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import ProgressBar from "../components/ProgressBar";
import FilterBar from "../components/FilterBar";
import { useFilterSort } from "../hooks/useFilterSort";
import { formatDate, formatEuro, daysUntil, progressPercent, selectValue } from "../utils/format";

function MietCard({ miete, kunde, instrument, showProgress = false }) {
  const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
  const instrName = instrument?.Modellname || "Unbekannt";
  const instrTyp = instrument?.Typ || "";

  const mietende = miete.Mietende_berechnet;
  const days = daysUntil(mietende);
  const pct = progressPercent(miete.Mietbeginn, mietende);

  const status = miete.Status?.value || "–";
  let badgeColor = "green";
  let badgeText = status;

  if (status === "Beendet") { badgeColor = "gray"; }
  else if (status === "Bestellt") { badgeColor = "blue"; badgeText = "Bestellt"; }
  else if (status === "Bereit") { badgeColor = "blue"; badgeText = "Bereit"; }
  else if (status === "Anfrage") { badgeColor = "blue"; badgeText = "Anfrage"; }
  else if (days <= 0) { badgeColor = "red"; badgeText = "Überfällig"; }
  else if (days <= 30) { badgeColor = "yellow"; badgeText = `${days}d`; }

  const kautionGezahlt = miete.Kaution_gezahlt?.value === "Ja";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3.5">
        <div>
          <div className="text-[1.05rem] font-semibold">{kundeName}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {instrName} &middot; {instrTyp}
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
            {kautionGezahlt ? "✓" : "✗"} {formatEuro(miete.Kaution_EUR)}
          </Badge>
        </DetailRow>
        <DetailRow label="Zahlungsart" value={selectValue(miete.Zahlungsart)} />
        <DetailRow label="Laufzeit" value={`${miete.Laufzeit_Monate || "–"} Monate`} />
      </div>

      {showProgress && <ProgressBar percent={pct} />}
    </div>
  );
}

export default function MietenView({ data }) {
  const { mieten, kundenMap, instrumenteMap } = data;

  const filterSortConfig = useMemo(() => ({
    filters: [
      { key: "status", label: "Status", accessor: (m) => m.Status?.value || "–",
        options: ["Anfrage", "Bestellt", "Bereit", "Aktiv", "Verlängert", "unbefristet", "Beendet"] },
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

  const pipeline = fs.items.filter((m) => ["Bestellt", "Bereit", "Anfrage"].includes(m.Status?.value));
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
        <StatCard label="Monatl. Einnahmen" value={formatEuro(totalRevenue)} color="orange" />
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
            <MietCard key={m.id} miete={m} kunde={kundenMap[m.Kunde_ID?.[0]?.id]} instrument={instrumenteMap[m.Instrument_ID?.[0]?.id]} />
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
          <MietCard key={m.id} miete={m} kunde={kundenMap[m.Kunde_ID?.[0]?.id]} instrument={instrumenteMap[m.Instrument_ID?.[0]?.id]} showProgress />
        ))
      )}

      {beendet.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">Beendet</div>
          <div className="opacity-50">
            {beendet.map((m) => (
              <MietCard key={m.id} miete={m} kunde={kundenMap[m.Kunde_ID?.[0]?.id]} instrument={instrumenteMap[m.Instrument_ID?.[0]?.id]} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
