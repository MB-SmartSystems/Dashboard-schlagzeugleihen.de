export function computeDerivedTasks(data) {
  const tasks = [];
  const { angebote, mieten, instrumente, kundenMap, preismodelle } = data;

  /* ── Trigger 3: Angebot angenommen, kein passendes Instrument lagernd ── */
  const mietAngebotIds = new Set();
  mieten.forEach((m) => {
    (m.Angebot_ID || []).forEach((a) => mietAngebotIds.add(a.id));
  });

  // Build preismodell lookup by name (lowercase) for fuzzy matching
  const preismodellByName = {};
  (preismodelle || []).forEach((pm) => {
    if (pm.Modellname) preismodellByName[pm.Modellname.toLowerCase().trim()] = pm;
  });

  angebote.forEach((a) => {
    if (a.Status?.value !== "angenommen") return;
    // Check if any Miete is linked to this Angebot (regardless of status)
    const hasMiete = (a.Mieten || []).length > 0 || mietAngebotIds.has(a.id);
    if (hasMiete) return;

    const kunde = kundenMap[a.Kunden_ID?.[0]?.id];
    const kundeName = [kunde?.Vorname, kunde?.Nachname].filter(Boolean).join(" ") || "Unbekannt";
    const produktText = (a.Produkte || "").trim();

    if (!produktText) {
      // No product text → generic task
      tasks.push({
        _derived: true,
        _deriveKey: `angebot-${a.id}`,
        titel: `Instrument vorbereiten für ${kundeName} (Angebot ${a.Angebotsnummer || a.Angebot_ID})`,
        typ: "Instrument vorbereiten",
        prioritaet: "Hoch",
        status: "Offen",
        quelle: "Automatisch",
        angebotId: a.id,
        kundeId: a.Kunden_ID?.[0]?.id || null,
        instrumentId: null,
      });
      return;
    }

    // Try to match Produkte text against Preismodell names
    let matched = false;
    for (const [pmName, pm] of Object.entries(preismodellByName)) {
      if (!produktText.toLowerCase().includes(pmName)) continue;
      matched = true;

      // Check if this Preismodell has linked instruments that are "Lagernd"
      const linkedInstrIds = (pm.Instrumente || []).map((link) => link.id);
      const hasLagernd = linkedInstrIds.some((id) => {
        const instr = instrumente.find((i) => i.id === id);
        return instr && instr.Verfügbar?.value === "Lagernd";
      });

      if (!hasLagernd) {
        tasks.push({
          _derived: true,
          _deriveKey: `bestellen-${a.id}-${pm.id}`,
          titel: `Bestellen: ${pm.Modellname} für Angebot ${a.Angebotsnummer || a.Angebot_ID}`,
          typ: linkedInstrIds.length === 0 ? "Zubehör beschaffen" : "Instrument bestellen",
          prioritaet: "Hoch",
          status: "Offen",
          quelle: "Automatisch",
          angebotId: a.id,
          kundeId: a.Kunden_ID?.[0]?.id || null,
          instrumentId: null,
        });
      }
    }

    // If no Preismodell matched, create a generic preparation task
    if (!matched) {
      tasks.push({
        _derived: true,
        _deriveKey: `angebot-${a.id}`,
        titel: `Instrument vorbereiten: ${produktText} für ${kundeName}`,
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

  /* ── Trigger 1: Instrument defekt und nicht inaktiv ── */
  instrumente.forEach((i) => {
    if (i.Zustand?.value === "Defekt" && i.Verfügbar?.value !== "Inaktiv") {
      tasks.push({
        _derived: true,
        _deriveKey: `defekt-${i.id}`,
        titel: `Defektes Instrument: ${i.Modellname || "Unbekannt"}`,
        Beschreibung: i.Beschreibung || null,
        typ: "Instrument vorbereiten",
        prioritaet: "Hoch",
        status: "Offen",
        quelle: "Automatisch",
        angebotId: null,
        kundeId: null,
        instrumentId: i.id,
      });
    }
  });

  /* ── Trigger 2: Zubehör fehlend und nicht inaktiv ── */
  instrumente.forEach((i) => {
    if (i.Zubehoer_fehlend && i.Zubehoer_fehlend.trim() !== "" && i.Verfügbar?.value !== "Inaktiv") {
      tasks.push({
        _derived: true,
        _deriveKey: `zubehoer-${i.id}`,
        titel: `Zubehör fehlt: ${i.Zubehoer_fehlend} für ${i.Modellname || "Unbekannt"}`,
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
