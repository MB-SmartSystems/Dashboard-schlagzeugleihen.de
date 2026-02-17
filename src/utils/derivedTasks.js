export function computeDerivedTasks(data) {
  const tasks = [];
  const { angebote, mieten, instrumente, kundenMap } = data;

  /* Regel 1: Angebot angenommen, aber keine verknüpfte Miete mit Status Aktiv/Bestellt/Bereit */
  const mietAngebotIds = new Set();
  mieten.forEach((m) => {
    if (["Aktiv", "Bestellt", "Bereit"].includes(m.Status?.value)) {
      (m.Angebot_ID || []).forEach((a) => mietAngebotIds.add(a.id));
    }
  });

  angebote.forEach((a) => {
    if (a.Status?.value === "angenommen" && !mietAngebotIds.has(a.id)) {
      const kunde = kundenMap[a.Kunden_ID?.[0]?.id];
      const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
      tasks.push({
        _derived: true,
        _deriveKey: `angebot-${a.id}`,
        titel: `Instrument vorbereiten: ${a.Produkte || "–"} für ${kundeName}`,
        typ: "Instrument vorbereiten",
        prioritaet: "Hoch",
        status: "Offen",
        quelle: "Automatisch",
        angebotId: a.id,
        kundeId: a.Kunden_ID?.[0]?.id || null,
        instrumentId: null,
      });
    }
  });

  /* Regel 2: Instrument defekt und nicht inaktiv */
  instrumente.forEach((i) => {
    if (i.Zustand?.value === "Defekt" && i.Verfügbar?.value !== "Inaktiv") {
      tasks.push({
        _derived: true,
        _deriveKey: `defekt-${i.id}`,
        titel: `Defektes Instrument: ${i.Modellname || "Unbekannt"}`,
        typ: "Manuell",
        prioritaet: "Hoch",
        status: "Offen",
        quelle: "Automatisch",
        angebotId: null,
        kundeId: null,
        instrumentId: i.id,
      });
    }
  });

  /* Regel 3: Zubehör fehlend und nicht inaktiv */
  instrumente.forEach((i) => {
    if (i.Zubehoer_fehlend && i.Zubehoer_fehlend.trim() !== "" && i.Verfügbar?.value !== "Inaktiv") {
      tasks.push({
        _derived: true,
        _deriveKey: `zubehoer-${i.id}`,
        titel: `Zubehör fehlt: ${i.Zubehoer_fehlend} bei ${i.Modellname || "Unbekannt"}`,
        typ: "Zubehör beschaffen",
        prioritaet: "Mittel",
        status: "Offen",
        quelle: "Automatisch",
        angebotId: null,
        kundeId: null,
        instrumentId: i.id,
      });
    }
  });

  return tasks;
}
