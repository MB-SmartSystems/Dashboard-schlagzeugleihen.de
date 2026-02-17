import { useState, useEffect, useCallback } from "react";
import { fetchRows, TABLE_IDS } from "../api/baserow";

export function useBaserowData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Nur Tabellen laden, die eine gültige ID haben (aufgaben kann null sein)
      const entries = Object.entries(TABLE_IDS).filter(([, id]) => id != null);
      const results = await Promise.all(entries.map(([, id]) => fetchRows(id)));
      const tables = {};
      entries.forEach(([key], i) => (tables[key] = results[i]));

      // aufgaben immer als Array bereitstellen, auch wenn nicht konfiguriert
      if (!tables.aufgaben) tables.aufgaben = [];

      const kundenMap = {};
      tables.kunden.forEach((k) => (kundenMap[k.id] = k));
      const instrumenteMap = {};
      tables.instrumente.forEach((i) => (instrumenteMap[i.id] = i));

      setData({ ...tables, kundenMap, instrumenteMap });
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, lastUpdate, reload: load };
}
