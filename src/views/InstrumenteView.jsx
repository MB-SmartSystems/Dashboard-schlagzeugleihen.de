import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import DetailRow from "../components/DetailRow";
import { formatEuro } from "../utils/format";

function verfuegbarBadge(val) {
  switch (val) {
    case "Lagernd": return <Badge color="green">Lagernd</Badge>;
    case "Vermietet": return <Badge color="red">Vermietet</Badge>;
    case "Inaktiv": return <Badge color="gray">Inaktiv</Badge>;
    default: return <Badge color="gray">{val || "\u2013"}</Badge>;
  }
}

function zustandBadge(val) {
  switch (val) {
    case "Neu": return <Badge color="green">Neu</Badge>;
    case "Gut": return <Badge color="blue">Gut</Badge>;
    case "gebraucht": return <Badge color="yellow">Gebraucht</Badge>;
    case "Defekt": return <Badge color="red">Defekt</Badge>;
    case "Ausgemustert / inaktiv": return <Badge color="gray">Ausgemustert</Badge>;
    default: return <Badge color="gray">{val || "\u2013"}</Badge>;
  }
}

function InstrumentCard({ instr }) {
  const mietpreis = instr.Mietpreis_monat?.[0]?.value;
  const kaution = instr.Kaution?.[0]?.value;
  const mietkauf = instr.Mietkaufpreis?.[0]?.value;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[1.05rem] font-semibold">{instr.Modellname || "Unbekannt"}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {instr.Typ || "\u2013"} &middot; {instr.Serie || "\u2013"}
          </div>
        </div>
        <div className="flex gap-1.5">
          {zustandBadge(instr.Zustand?.value)}
          {verfuegbarBadge(instr.Verfügbar?.value)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {mietpreis && <DetailRow label="Mietpreis/Monat" value={formatEuro(mietpreis)} mono />}
        {kaution && <DetailRow label="Kaution" value={formatEuro(kaution)} mono />}
        {mietkauf && <DetailRow label="Mietkaufpreis" value={formatEuro(mietkauf)} mono />}
        {instr.Zubehör_inklusive && <DetailRow label="Zubeh\u00f6r" value={instr.Zubehör_inklusive} />}
        {instr.Zubehoer_fehlend && (
          <DetailRow label="Fehlend">
            <span className="text-sm text-red-400 mt-0.5">{instr.Zubehoer_fehlend}</span>
          </DetailRow>
        )}
      </div>
    </div>
  );
}

export default function InstrumenteView({ data }) {
  const { instrumente } = data;

  const aktiv = instrumente.filter(
    (i) => i.Zustand?.value !== "Ausgemustert / inaktiv" && i.Verfügbar?.value !== "Inaktiv"
  );
  const inaktiv = instrumente.filter(
    (i) => i.Zustand?.value === "Ausgemustert / inaktiv" || i.Verfügbar?.value === "Inaktiv"
  );
  const vermietet = aktiv.filter((i) => i.Verfügbar?.value === "Vermietet").length;
  const lagernd = aktiv.filter((i) => i.Verfügbar?.value === "Lagernd").length;

  return (
    <div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Aktiv" value={aktiv.length} color="white" />
        <StatCard label="Vermietet" value={vermietet} color="red" />
        <StatCard label="Lagernd" value={lagernd} color="green" />
      </div>

      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Aktive Instrumente
      </div>
      {aktiv.length === 0 ? (
        <div className="text-center py-12 text-gray-600">Keine Instrumente.</div>
      ) : (
        aktiv.map((i) => <InstrumentCard key={i.id} instr={i} />)
      )}

      {inaktiv.length > 0 && (
        <>
          <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3 mt-5">
            Inaktiv / Ausgemustert
          </div>
          <div className="opacity-40">
            {inaktiv.map((i) => <InstrumentCard key={i.id} instr={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
