import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import { formatDate, formatEuro } from "../utils/format";

function statusBadge(val) {
  switch (val) {
    case "Entwurf": return <Badge color="gray">Entwurf</Badge>;
    case "gesendet": return <Badge color="blue">Gesendet</Badge>;
    case "offen": return <Badge color="yellow">Offen</Badge>;
    case "bezahlt": return <Badge color="green">Bezahlt</Badge>;
    case "Dauerauftrag läuft": return <Badge color="green">Dauerauftrag</Badge>;
    default: return <Badge color="gray">{val || "\u2013"}</Badge>;
  }
}

function RechnungCard({ rechnung, kunde }) {
  const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold font-mono">
            {rechnung.Rechnungsnummer || "\u2013"}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">{kundeName}</div>
        </div>
        <div className="flex gap-1.5">
          {rechnung.Typ?.value && <Badge color="purple">{rechnung.Typ.value}</Badge>}
          {statusBadge(rechnung.Status?.value)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <DetailRow label="Produkte" value={rechnung.Produkte || "\u2013"} />
        <DetailRow label="Datum" value={formatDate(rechnung.Rechnungsdatum)} />
        <DetailRow label="Gesamtbetrag" value={formatEuro(rechnung.Gesamtbetrag_EUR)} mono />
        {rechnung.Kaution_EUR && <DetailRow label="Kaution" value={formatEuro(rechnung.Kaution_EUR)} mono />}
        {rechnung.Mietkaufpreis_EUR && (
          <DetailRow label="Mietkaufpreis" value={formatEuro(rechnung.Mietkaufpreis_EUR)} mono />
        )}
        {rechnung.Mindestlaufzeit_bis && (
          <DetailRow label="Laufzeit bis" value={formatDate(rechnung.Mindestlaufzeit_bis)} />
        )}
      </div>

      {rechnung.Rechnung_URL && (
        <div className="mt-3">
          <a
            href={rechnung.Rechnung_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            PDF anzeigen &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

export default function RechnungenView({ data }) {
  const { rechnungen, kundenMap } = data;

  const volumen = rechnungen.reduce((s, r) => s + (parseFloat(r.Gesamtbetrag_EUR) || 0), 0);

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Rechnungen" value={rechnungen.length} color="white" />
        <StatCard label="Volumen" value={formatEuro(volumen)} color="orange" />
      </div>

      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Alle Rechnungen
      </div>
      {rechnungen.length === 0 ? (
        <div className="text-center py-12 text-gray-600">Keine Rechnungen.</div>
      ) : (
        rechnungen.map((r) => (
          <RechnungCard key={r.id} rechnung={r} kunde={kundenMap[r.Kunde_ID?.[0]?.id]} />
        ))
      )}
    </div>
  );
}
