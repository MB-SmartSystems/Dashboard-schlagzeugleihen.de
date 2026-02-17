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
      const results = await Promise.all(
        Object.values(TABLE_IDS).map(fetchRows)
      );
      const keys = Object.keys(TABLE_IDS);
      const tables = {};
      keys.forEach((k, i) => (tables[k] = results[i]));

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
