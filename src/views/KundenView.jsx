import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import { selectValue } from "../utils/format";

function KundeCard({ kunde, mietenCount, aktivCount }) {
  const name = [kunde.Vorname, kunde.Nachname].filter(Boolean).join(" ") || "Unbekannt";
  const adresse = [kunde.Adresse_Strasse, [kunde.Adresse_PLZ, kunde.Adresse_Ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{name}</div>
          {kunde.Firma && <div className="text-sm text-gray-500">{kunde.Firma}</div>}
        </div>
        <div className="flex gap-1.5">
          {aktivCount > 0 ? (
            <Badge color="green">{aktivCount} aktiv</Badge>
          ) : mietenCount > 0 ? (
            <Badge color="gray">{mietenCount} Miete{mietenCount > 1 ? "n" : ""}</Badge>
          ) : (
            <Badge color="blue">Lead</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {kunde.EMail && <DetailRow label="E-Mail" value={kunde.EMail} />}
        {kunde.Telefon && <DetailRow label="Telefon" value={kunde.Telefon} />}
        {adresse && <DetailRow label="Adresse" value={adresse} />}
        <DetailRow label="Kanal" value={selectValue(kunde.Bevorzugter_Kanal)} />
        <DetailRow label="Typ" value={selectValue(kunde.Kunde_Typ)} />
      </div>
    </div>
  );
}

export default function KundenView({ data }) {
  const { kunden, mieten } = data;

  const mietCountMap = {};
  const aktivCountMap = {};
  mieten.forEach((m) => {
    const kid = m.Kunde_ID?.[0]?.id;
    if (!kid) return;
    mietCountMap[kid] = (mietCountMap[kid] || 0) + 1;
    if (["Aktiv", "Verlängert", "unbefristet"].includes(m.Status?.value)) {
      aktivCountMap[kid] = (aktivCountMap[kid] || 0) + 1;
    }
  });

  const mitMiete = kunden.filter((k) => mietCountMap[k.id] > 0).length;
  const leads = kunden.length - mitMiete;

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Gesamt" value={kunden.length} color="white" />
        <StatCard label="Mit Miete" value={mitMiete} color="green" />
        <StatCard label="Leads" value={leads} color="blue" />
      </div>

      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Kundenliste
      </div>
      {kunden.length === 0 ? (
        <div className="text-center py-12 text-gray-600">Keine Kunden.</div>
      ) : (
        kunden.map((k) => (
          <KundeCard
            key={k.id}
            kunde={k}
            mietenCount={mietCountMap[k.id] || 0}
            aktivCount={aktivCountMap[k.id] || 0}
          />
        ))
      )}
    </div>
  );
}
