import { useState, useEffect, useCallback } from "react";
import { fetchRows, TABLE_IDS } from "../api/baserow";
import { syncTasksToBaserow } from "../utils/syncTasks";

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

      const fullData = { ...tables, kundenMap, instrumenteMap };
      setData(fullData);
      setLastUpdate(new Date());

      // Non-blocking: sync auto-tasks → then reload only aufgaben
      syncTasksToBaserow(fullData, tables.aufgaben)
        .then(() => fetchRows(TABLE_IDS.aufgaben))
        .then((aufgaben) => setData((prev) => prev ? { ...prev, aufgaben } : prev))
        .catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reloadAufgaben = useCallback(async () => {
    try {
      const aufgaben = await fetchRows(TABLE_IDS.aufgaben);
      setData((prev) => (prev ? { ...prev, aufgaben } : prev));
    } catch (_) {}
  }, []);

  return { data, loading, error, lastUpdate, reload: load, reloadAufgaben };
}
