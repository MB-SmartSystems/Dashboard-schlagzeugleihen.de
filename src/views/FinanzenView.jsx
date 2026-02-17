import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { formatEuro, selectValue } from "../utils/format";

export default function FinanzenView({ data }) {
  const { mieten, rechnungen, belege, kundenMap } = data;

  const aktiv = mieten.filter((m) =>
    ["Aktiv", "Verlängert", "unbefristet"].includes(m.Status?.value)
  );

  // Einnahmen
  const monatlich = aktiv.reduce((s, m) => s + (parseFloat(m.Preis_monat_EUR) || 0), 0);
  const jaehrlich = monatlich * 12;
  const rechnungsVolumen = rechnungen.reduce((s, r) => s + (parseFloat(r.Gesamtbetrag_EUR) || 0), 0);

  // Kautionen
  const kautionGesamt = aktiv.reduce((s, m) => s + (parseFloat(m.Kaution_EUR) || 0), 0);
  const kautionErhalten = aktiv
    .filter((m) => m.Kaution_gezahlt?.value === "Ja")
    .reduce((s, m) => s + (parseFloat(m.Kaution_EUR) || 0), 0);
  const kautionOffen = kautionGesamt - kautionErhalten;

  // Investitionen
  const investGesamt = belege.reduce((s, b) => s + (parseFloat(b.Betrag) || 0), 0);

  return (
    <div>
      {/* Einnahmen */}
      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Einnahmen
      </div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Monatlich" value={formatEuro(monatlich)} color="green" />
        <StatCard label="Jährlich" value={formatEuro(jaehrlich)} color="green" />
        <StatCard label="Rechnungsvolumen" value={formatEuro(rechnungsVolumen)} color="orange" />
      </div>

      {/* Kautionen */}
      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Kautionen
      </div>
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Gesamt" value={formatEuro(kautionGesamt)} color="white" />
        <StatCard label="Erhalten" value={formatEuro(kautionErhalten)} color="green" />
        <StatCard label="Offen" value={formatEuro(kautionOffen)} color={kautionOffen > 0 ? "red" : "green"} />
      </div>

      {/* Investitionen */}
      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Investitionen
      </div>
      <div className="flex gap-3 mb-6 overflow-x-auto">
        <StatCard label="Einkauf gesamt" value={formatEuro(investGesamt)} color="red" />
      </div>

      {/* Tabelle: Aktive Mieten */}
      <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold mb-3">
        Aktive Mieten – Übersicht
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-[0.7rem] text-gray-500 uppercase tracking-wide px-4 py-3 font-semibold">
                  Kunde
                </th>
                <th className="text-right text-[0.7rem] text-gray-500 uppercase tracking-wide px-4 py-3 font-semibold">
                  Monatspreis
                </th>
                <th className="text-right text-[0.7rem] text-gray-500 uppercase tracking-wide px-4 py-3 font-semibold">
                  Kaution
                </th>
                <th className="text-center text-[0.7rem] text-gray-500 uppercase tracking-wide px-4 py-3 font-semibold">
                  Gezahlt
                </th>
                <th className="text-left text-[0.7rem] text-gray-500 uppercase tracking-wide px-4 py-3 font-semibold">
                  Zahlungsart
                </th>
              </tr>
            </thead>
            <tbody>
              {aktiv.map((m) => {
                const kunde = kundenMap[m.Kunde_ID?.[0]?.id];
                const name = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
                const kautionGezahlt = m.Kaution_gezahlt?.value === "Ja";

                return (
                  <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-right font-mono text-orange-400">
                      {formatEuro(m.Preis_monat_EUR)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatEuro(m.Kaution_EUR)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge color={kautionGezahlt ? "green" : "red"}>
                        {kautionGezahlt ? "✓" : "✗"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {selectValue(m.Zahlungsart)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-700">
                <td className="px-4 py-3 font-semibold text-gray-400">Summe</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-orange-400">
                  {formatEuro(monatlich)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold">
                  {formatEuro(kautionGesamt)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
