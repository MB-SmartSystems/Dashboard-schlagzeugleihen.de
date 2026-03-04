import { createRow, updateRow, TABLE_IDS } from "../api/baserow";

const TABLE = TABLE_IDS.aufgaben; // 852

const OPT = {
  TYP_BESTELLEN: 3382,
  TYP_VORBEREITEN: 3383,
  TYP_ZUBEHOER: 3384,
  TYP_MANUELL: 3385,
  PRIO_HOCH: 3386,
  PRIO_MITTEL: 3387,
  STATUS_OFFEN: 3389,
  STATUS_ERLEDIGT: 3391,
  QUELLE_AUTO: 3392,
};

function linkIds(arr) {
  return (arr || []).map((l) => (typeof l === "object" ? l.id : l));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function computeExpectedTasks(data) {
  const { angebote, mieten, instrumente, preismodelle } = data;
  const expected = [];

  const mietAngebotIds = new Set();
  mieten.forEach((m) => {
    (m.Angebot_ID || []).forEach((a) => mietAngebotIds.add(a.id));
  });

  const preismodellByName = {};
  (preismodelle || []).forEach((pm) => {
    if (pm.Modellname) preismodellByName[pm.Modellname.toLowerCase().trim()] = pm;
  });

  /* ── Trigger 1: Defektes Instrument ── */
  instrumente.forEach((i) => {
    if (i.Zustand?.value === "Defekt" && i.Verfügbar?.value !== "Inaktiv") {
      expected.push({
        deriveKey: `defekt-${i.id}`,
        matchExisting: (a) =>
          a.Typ?.id === OPT.TYP_VORBEREITEN &&
          linkIds(a["Verknüpfung_Instrument"] || a.Verknuepfung_Instrument).includes(i.id) &&
          a.Quelle?.id === OPT.QUELLE_AUTO &&
          a.Status?.id !== OPT.STATUS_ERLEDIGT,
        payload: {
          Titel: `Defektes Instrument: ${i.Modellname || "Unbekannt"}`,
          Typ: OPT.TYP_VORBEREITEN,
          Priorität: OPT.PRIO_HOCH,
          Status: OPT.STATUS_OFFEN,
          Quelle: OPT.QUELLE_AUTO,
          Verknüpfung_Instrument: [i.id],
        },
      });
    }
  });

  /* ── Trigger 2: Fehlendes Zubehör ── */
  instrumente.forEach((i) => {
    if (i.Zubehoer_fehlend && i.Zubehoer_fehlend.trim() !== "" && i.Verfügbar?.value !== "Inaktiv") {
      expected.push({
        deriveKey: `zubehoer-${i.id}`,
        matchExisting: (a) =>
          a.Typ?.id === OPT.TYP_ZUBEHOER &&
          linkIds(a["Verknüpfung_Instrument"] || a.Verknuepfung_Instrument).includes(i.id) &&
          a.Quelle?.id === OPT.QUELLE_AUTO &&
          a.Status?.id !== OPT.STATUS_ERLEDIGT,
        payload: {
          Titel: `Zubehör fehlt: ${i.Zubehoer_fehlend} für ${i.Modellname || "Unbekannt"}`,
          Typ: OPT.TYP_ZUBEHOER,
          Priorität: OPT.PRIO_MITTEL,
          Status: OPT.STATUS_OFFEN,
          Quelle: OPT.QUELLE_AUTO,
          Verknüpfung_Instrument: [i.id],
        },
      });
    }
  });

  /* ── Trigger 3: Angebot angenommen, kein passendes Instrument lagernd ── */
  angebote.forEach((a) => {
    if (a.Status?.value !== "angenommen") return;
    const hasMiete = (a.Mieten || []).length > 0 || mietAngebotIds.has(a.id);
    if (hasMiete) return;

    const produktText = (a.Produkte || "").trim();
    const kundeId = a.Kunden_ID?.[0]?.id || null;
    const kundeLink = kundeId ? { Verknüpfung_Kunde: [kundeId] } : {};

    if (!produktText) {
      expected.push({
        deriveKey: `angebot-${a.id}`,
        matchExisting: (t) =>
          t.Typ?.id === OPT.TYP_VORBEREITEN &&
          linkIds(t["Verknüpfung_Angebot"] || t.Verknuepfung_Angebot).includes(a.id) &&
          t.Quelle?.id === OPT.QUELLE_AUTO &&
          t.Status?.id !== OPT.STATUS_ERLEDIGT,
        payload: {
          Titel: `Instrument vorbereiten für Angebot ${a.Angebotsnummer || a.id}`,
          Typ: OPT.TYP_VORBEREITEN,
          Priorität: OPT.PRIO_HOCH,
          Status: OPT.STATUS_OFFEN,
          Quelle: OPT.QUELLE_AUTO,
          Verknüpfung_Angebot: [a.id],
          ...kundeLink,
        },
      });
      return;
    }

    let matched = false;
    for (const [pmName, pm] of Object.entries(preismodellByName)) {
      if (!produktText.toLowerCase().includes(pmName)) continue;
      matched = true;

      const linkedInstrIds = (pm.Instrumente || []).map((link) => link.id);
      const hasLagernd = linkedInstrIds.some((id) => {
        const instr = instrumente.find((i) => i.id === id);
        return instr && instr.Verfügbar?.value === "Lagernd";
      });

      if (!hasLagernd) {
        expected.push({
          deriveKey: `bestellen-${a.id}-${pm.id}`,
          matchExisting: (t) =>
            t.Typ?.id === OPT.TYP_BESTELLEN &&
            linkIds(t["Verknüpfung_Angebot"] || t.Verknuepfung_Angebot).includes(a.id) &&
            t.Quelle?.id === OPT.QUELLE_AUTO &&
            t.Status?.id !== OPT.STATUS_ERLEDIGT,
          payload: {
            Titel: `Bestellen: ${pm.Modellname} für Angebot ${a.Angebotsnummer || a.id}`,
            Typ: OPT.TYP_BESTELLEN,
            Priorität: OPT.PRIO_HOCH,
            Status: OPT.STATUS_OFFEN,
            Quelle: OPT.QUELLE_AUTO,
            Verknüpfung_Angebot: [a.id],
            ...kundeLink,
          },
        });
      }
    }

    if (!matched) {
      expected.push({
        deriveKey: `angebot-${a.id}`,
        matchExisting: (t) =>
          t.Typ?.id === OPT.TYP_VORBEREITEN &&
          linkIds(t["Verknüpfung_Angebot"] || t.Verknuepfung_Angebot).includes(a.id) &&
          t.Quelle?.id === OPT.QUELLE_AUTO &&
          t.Status?.id !== OPT.STATUS_ERLEDIGT,
        payload: {
          Titel: `Instrument vorbereiten: ${produktText} für Angebot ${a.Angebotsnummer || a.id}`,
          Typ: OPT.TYP_VORBEREITEN,
          Priorität: OPT.PRIO_HOCH,
          Status: OPT.STATUS_OFFEN,
          Quelle: OPT.QUELLE_AUTO,
          Verknüpfung_Angebot: [a.id],
          ...kundeLink,
        },
      });
    }
  });

  /* ── Trigger 4: Offenes Angebot noch nicht versendet ── */
  angebote.forEach((a) => {
    if (a.Status?.value !== "offen") return;
    const kundeId = a.Kunden_ID?.[0]?.id || null;
    const kundeLink = kundeId ? { Verknüpfung_Kunde: [kundeId] } : {};
    expected.push({
      deriveKey: `versenden-${a.id}`,
      matchExisting: (t) =>
        t.Typ?.id === OPT.TYP_MANUELL &&
        linkIds(t["Verknüpfung_Angebot"] || t.Verknuepfung_Angebot).includes(a.id) &&
        (t.Titel || "").includes("Angebot versenden") &&
        t.Quelle?.id === OPT.QUELLE_AUTO &&
        t.Status?.id !== OPT.STATUS_ERLEDIGT,
      payload: {
        Titel: `Angebot versenden: ${a.Angebotsnummer || a.id}`,
        Typ: OPT.TYP_MANUELL,
        Priorität: OPT.PRIO_HOCH,
        Status: OPT.STATUS_OFFEN,
        Quelle: OPT.QUELLE_AUTO,
        Verknüpfung_Angebot: [a.id],
        ...kundeLink,
      },
    });
  });

  /* ── Trigger 5: Versendetes Angebot ohne Reaktion ── */
  angebote.forEach((a) => {
    if (a.Status?.value !== "versendet") return;
    const hasMiete = (a.Mieten || []).length > 0 || mietAngebotIds.has(a.id);
    if (hasMiete) return;

    const kundeId = a.Kunden_ID?.[0]?.id || null;
    const kundeLink = kundeId ? { Verknüpfung_Kunde: [kundeId] } : {};

    let prio = OPT.PRIO_MITTEL;
    if (a.Gueltig_bis) {
      const gueltigBis = new Date(a.Gueltig_bis);
      const heute = new Date();
      heute.setHours(0, 0, 0, 0);
      if (Math.ceil((gueltigBis - heute) / (1000 * 60 * 60 * 24)) < 3) prio = OPT.PRIO_HOCH;
    }

    expected.push({
      deriveKey: `nachfassen-${a.id}`,
      matchExisting: (t) =>
        t.Typ?.id === OPT.TYP_MANUELL &&
        linkIds(t["Verknüpfung_Angebot"] || t.Verknuepfung_Angebot).includes(a.id) &&
        (t.Titel || "").includes("Angebot nachfassen") &&
        t.Quelle?.id === OPT.QUELLE_AUTO &&
        t.Status?.id !== OPT.STATUS_ERLEDIGT,
      payload: {
        Titel: `Angebot nachfassen: ${a.Angebotsnummer || a.id}`,
        Typ: OPT.TYP_MANUELL,
        Priorität: prio,
        Status: OPT.STATUS_OFFEN,
        Quelle: OPT.QUELLE_AUTO,
        Verknüpfung_Angebot: [a.id],
        ...kundeLink,
      },
    });
  });

  return expected;
}

export async function syncTasksToBaserow(data, existingAufgaben) {
  if (!TABLE) return;

  const expected = computeExpectedTasks(data);
  const autoOpen = (existingAufgaben || []).filter(
    (a) => a.Quelle?.id === OPT.QUELLE_AUTO && a.Status?.id !== OPT.STATUS_ERLEDIGT
  );

  const ops = [];

  // POST missing tasks
  for (const task of expected) {
    const exists = autoOpen.some((a) => task.matchExisting(a));
    if (!exists) {
      ops.push(createRow(TABLE, task.payload).catch(() => {}));
    }
  }

  // Auto-close tasks whose trigger no longer fires
  for (const a of autoOpen) {
    const stillExpected = expected.some((task) => task.matchExisting(a));
    if (!stillExpected) {
      ops.push(
        updateRow(TABLE, a.id, {
          Status: OPT.STATUS_ERLEDIGT,
          Erledigt_am: todayStr(),
        }).catch(() => {})
      );
    }
  }

  await Promise.all(ops);
}
