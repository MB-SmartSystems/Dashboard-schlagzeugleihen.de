import { useState, useMemo, useCallback } from "react";

export function useFilterSort(items, config) {
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState(null);

  const toggleFilter = useCallback((filterKey, value) => {
    setActiveFilters((prev) => {
      const current = prev[filterKey] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length === 0) {
        const { [filterKey]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [filterKey]: next };
    });
  }, []);

  const clearFilters = useCallback(() => setActiveFilters({}), []);

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  const filtered = useMemo(() => {
    let result = items;
    for (const filter of config.filters) {
      const selected = activeFilters[filter.key];
      if (selected && selected.length > 0) {
        result = result.filter((item) => {
          const val = filter.accessor(item);
          return selected.includes(val);
        });
      }
    }
    return result;
  }, [items, activeFilters, config.filters]);

  const sorted = useMemo(() => {
    if (!activeSort) return filtered;
    const sortDef = config.sorts.find((s) => s.key === activeSort);
    if (!sortDef) return filtered;
    return [...filtered].sort(sortDef.compareFn);
  }, [filtered, activeSort, config.sorts]);

  return {
    items: sorted,
    activeFilters,
    activeSort,
    toggleFilter,
    setActiveSort,
    clearFilters,
    hasActiveFilters,
    filterConfigs: config.filters,
    sortConfigs: config.sorts,
  };
}
