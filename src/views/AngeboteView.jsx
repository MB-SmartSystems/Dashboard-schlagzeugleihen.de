import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import { formatDate, formatEuro } from "../utils/format";

function statusBadge(val) {
  switch (val) {
    case "offen": return <Badge color="blue">Offen</Badge>;
    case "versendet": return <Badge color="orange">Versendet</Badge>;
    case "angenommen": return <Badge color="green">Angenommen</Badge>;
    case "abgelehnt": return <Badge color="red">Abgelehnt</Badge>;
    case "abgelaufen": return <Badge color="gray">Abgelaufen</Badge>;
    default: return <Badge color="gray">{val || "\u2013"}</Badge>;
  }
}

function AngebotCard({ angebot, kunde }) {
  const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{kundeName}</div>
          <div className="text-sm text-gray-500 mt-0.5">{angebot.Produkte || "\u2013"}</div>
        </div>
        {statusBadge(angebot.Status?.value)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <DetailRow label="Angebotsnr." value={angebot.Angebotsnummer || "\u2013"} mono />
        <DetailRow label="Datum" value={formatDate(angebot.Angebotsdatum)} />
        <DetailRow label="G\u00fcltig bis" value={formatDate(angebot.Gueltig_bis)} />
        <DetailRow label="Monatspreis" value={formatEuro(angebot.Preis_monat_EUR)} mono />
        <DetailRow label="Gesamt + Kaution" value={formatEuro(angebot.Gesamtpreis_mit_Kaution)} mono />
        <DetailRow label="Laufzeit" value={`${angebot.Laufzeit_Monate || 6} Monate`} />
      </div>

      {angebot.Angebot_URL && (
        <div className="mt-3">
          <a
            href={angebot.Angebot_URL}
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

export default function AngeboteView({ data }) {
  const { angebote, kundenMap } = data;

  const offen = angebote.filter((a) => ["offen", "versendet"].includes(a.Status?.value));
  const angenommen = angebote.filter((a) => a.Status?.value === "angenommen");
  const abgelehnt = angebote.filter((a) => ["abgelehnt", "abgelaufen"].includes(a.Status?.value));

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Offen" value={offen.length} color="orange" />
        <StatCard label="Angenommen" value={angenommen.length} color="green" />
        <StatCard label="Abgelehnt" value={abgelehnt.length} color="red" />
      </div>

      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Offene Angebote
      </div>
      {offen.length === 0 ? (
        <div className="text-center py-8 text-gray-600">Keine offenen Angebote.</div>
      ) : (
        offen.map((a) => (
          <AngebotCard key={a.id} angebot={a} kunde={kundenMap[a.Kunden_ID?.[0]?.id]} />
        ))
      )}

      {angenommen.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">
            Angenommen
          </div>
          {angenommen.map((a) => (
            <AngebotCard key={a.id} angebot={a} kunde={kundenMap[a.Kunden_ID?.[0]?.id]} />
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
              <AngebotCard key={a.id} angebot={a} kunde={kundenMap[a.Kunden_ID?.[0]?.id]} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
