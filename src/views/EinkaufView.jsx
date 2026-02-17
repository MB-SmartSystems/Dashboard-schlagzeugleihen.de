import StatCard from "../components/StatCard";
import DetailRow from "../components/DetailRow";
import { formatDate, formatEuro } from "../utils/format";

function BelegCard({ beleg, instrument }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{beleg.Beschreibung || "\u2013"}</div>
          {instrument && (
            <div className="text-sm text-gray-500 mt-0.5">{instrument.Modellname}</div>
          )}
        </div>
        <div className="text-lg font-bold font-mono text-red-400">
          {formatEuro(beleg.Betrag)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <DetailRow label="H\u00e4ndler" value={beleg.Händler || "\u2013"} />
        <DetailRow label="Kaufdatum" value={formatDate(beleg.Kaufdatum)} />
        {beleg.Beleg_ID && <DetailRow label="Beleg-ID" value={beleg.Beleg_ID} mono />}
      </div>

      {beleg.Beleg_URL && (
        <div className="mt-3">
          <a
            href={beleg.Beleg_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline"
          >
            Beleg anzeigen &rarr;
          </a>
        </div>
      )}
    </div>
  );
}

export default function EinkaufView({ data }) {
  const { belege, instrumenteMap } = data;

  const totalInvest = belege.reduce((s, b) => s + (parseFloat(b.Betrag) || 0), 0);

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Belege" value={belege.length} color="white" />
        <StatCard label="Investiert" value={formatEuro(totalInvest)} color="red" />
      </div>

      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Einkaufsbelege
      </div>
      {belege.length === 0 ? (
        <div className="text-center py-12 text-gray-600">Keine Einkaufsbelege.</div>
      ) : (
        belege.map((b) => (
          <BelegCard
            key={b.id}
            beleg={b}
            instrument={instrumenteMap[b.Instrument_ID?.[0]?.id]}
          />
        ))
      )}
    </div>
  );
}
