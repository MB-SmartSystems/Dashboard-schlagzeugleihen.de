import { useState, useEffect, useRef } from "react";

function FilterChip({ label, options, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const activeCount = selected.length;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 whitespace-nowrap text-xs px-3 py-1.5 rounded-lg border transition-all ${
          activeCount > 0
            ? "border-orange-500/50 text-orange-400 bg-orange-500/10"
            : "border-gray-700 text-gray-400 bg-gray-800 hover:border-gray-600"
        }`}
      >
        {label}
        {activeCount > 0 && (
          <span className="bg-orange-500/20 text-orange-300 text-[0.65rem] font-bold px-1.5 rounded-full">
            {activeCount}
          </span>
        )}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg py-1 min-w-[160px] z-30 shadow-xl">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="accent-orange-500 w-3.5 h-3.5"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({
  filterConfigs,
  activeFilters,
  onToggleFilter,
  sortConfigs,
  activeSort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}) {
  /* Alle aktiven Tags sammeln */
  const activeTags = [];
  for (const fc of filterConfigs) {
    const sel = activeFilters[fc.key] || [];
    for (const v of sel) {
      activeTags.push({ filterKey: fc.key, value: v, label: `${fc.label}: ${v}` });
    }
  }

  return (
    <div className="mb-4">
      {/* Filter + Sort Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterConfigs.map((fc) => (
          <FilterChip
            key={fc.key}
            label={fc.label}
            options={fc.options}
            selected={activeFilters[fc.key] || []}
            onToggle={(val) => onToggleFilter(fc.key, val)}
          />
        ))}

        {sortConfigs.length > 0 && (
          <>
            <div className="w-px h-5 bg-gray-700 mx-1 flex-shrink-0" />
            <select
              value={activeSort || ""}
              onChange={(e) => onSortChange(e.target.value || null)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 outline-none focus:border-orange-500 transition-colors appearance-none whitespace-nowrap flex-shrink-0"
            >
              <option value="">Sortierung</option>
              {sortConfigs.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Active Tags */}
      {activeTags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {activeTags.map((tag) => (
            <span
              key={`${tag.filterKey}-${tag.value}`}
              className="inline-flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[0.7rem] px-2 py-0.5 rounded-lg"
            >
              {tag.label}
              <button
                onClick={() => onToggleFilter(tag.filterKey, tag.value)}
                className="hover:text-orange-100 transition-colors ml-0.5"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            onClick={onClearFilters}
            className="text-[0.7rem] text-gray-500 hover:text-gray-300 ml-1 transition-colors"
          >
            Zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}
