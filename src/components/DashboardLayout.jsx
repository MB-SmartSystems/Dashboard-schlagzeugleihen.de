import { useState, useMemo, useRef, useEffect } from "react";
import { Menu, RefreshCw } from "lucide-react";
import Tab from "./Tab";
import { useBaserowData } from "../hooks/useBaserowData";
import { computeDerivedTasks } from "../utils/derivedTasks";
import AufgabenView from "../views/AufgabenView";
import MietenView from "../views/MietenView";
import InstrumenteView from "../views/InstrumenteView";
import KundenView from "../views/KundenView";
import AngeboteView from "../views/AngeboteView";
import RechnungenView from "../views/RechnungenView";
import EinkaufView from "../views/EinkaufView";
import FinanzenView from "../views/FinanzenView";

const MAIN_TABS = [
  { key: "mieten", label: "Mieten" },
  { key: "aufgaben", label: "Aufgaben" },
  { key: "kunden", label: "Kunden" },
  { key: "instrumente", label: "Produkte" },
  { key: "angebote", label: "Angebote" },
];

const MORE_TABS = [
  { key: "rechnungen", label: "Rechnungen" },
  { key: "einkauf", label: "Einkauf" },
  { key: "finanzen", label: "Finanzen" },
];

function tabCount(key, data, derivedTasks) {
  if (!data) return undefined;
  switch (key) {
    case "aufgaben": {
      const baserowOpen = (data.aufgaben || []).filter(
        (a) => a.Status?.value !== "Erledigt"
      ).length;
      return baserowOpen + (derivedTasks || []).length;
    }
    case "mieten": {
      const aktiv = data.mieten.filter((m) =>
        ["Aktiv", "Verlängert", "unbefristet"].includes(m.Status?.value)
      );
      return aktiv.length;
    }
    case "instrumente":
      return data.instrumente.filter(
        (i) => !["Ausgemustert / inaktiv"].includes(i.Zustand?.value) && i.Verfügbar?.value !== "Inaktiv"
      ).length;
    case "kunden":
      return data.kunden.length;
    case "angebote":
      return data.angebote.filter((a) =>
        ["offen", "versendet"].includes(a.Status?.value)
      ).length;
    case "rechnungen":
      return data.rechnungen.length;
    case "einkauf":
      return data.belege.length;
    default:
      return undefined;
  }
}

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("aufgaben");
  const [selectedId, setSelectedId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { data, loading, error, lastUpdate, reload } = useBaserowData();

  /* Navigate to a specific tab and optionally highlight an item */
  const navigateTo = (tab, id = null) => {
    setActiveTab(tab);
    setSelectedId(id);
  };

  /* Close hamburger on outside click */
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  /* Abgeleitete Aufgaben berechnen */
  const derivedTasks = useMemo(() => {
    if (!data) return [];
    return computeDerivedTasks(data);
  }, [data]);

  /* Aufgaben-Badge rot wenn Hoch-Prio */
  const aufgabenHasHigh = useMemo(() => {
    if (!data) return false;
    const baserowHigh = (data.aufgaben || []).some(
      (a) => a.Status?.value !== "Erledigt" && (a.Priorität?.value === "Hoch" || a.Prioritaet?.value === "Hoch")
    );
    const derivedHigh = derivedTasks.some((t) => t.prioritaet === "Hoch");
    return baserowHigh || derivedHigh;
  }, [data, derivedTasks]);

  const isMoreTabActive = MORE_TABS.some((t) => t.key === activeTab);

  const renderView = () => {
    if (loading) {
      return (
        <div className="text-center py-16 text-gray-500">
          <div className="w-8 h-8 border-3 border-gray-800 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          Daten werden geladen...
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-16 text-red-400">
          Fehler: {error}
        </div>
      );
    }
    if (!data) return null;

    switch (activeTab) {
      case "aufgaben": return <AufgabenView data={data} reload={reload} setActiveTab={setActiveTab} derivedTasks={derivedTasks} />;
      case "mieten": return <MietenView data={data} navigateTo={navigateTo} />;
      case "instrumente": return <InstrumenteView data={data} selectedId={selectedId} onSelectedClear={() => setSelectedId(null)} />;
      case "kunden": return <KundenView data={data} reload={reload} selectedId={selectedId} onSelectedClear={() => setSelectedId(null)} />;
      case "angebote": return <AngeboteView data={data} reload={reload} />;
      case "rechnungen": return <RechnungenView data={data} />;
      case "einkauf": return <EinkaufView data={data} reload={reload} />;
      case "finanzen": return <FinanzenView data={data} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-5 py-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
        <div>
          <div className="font-mono text-base font-bold text-accent tracking-tight">
            schlagzeugleihen.de
          </div>
          <div className="text-[0.8rem] text-gray-500 mt-0.5">Dashboard</div>
        </div>
        <div className="text-right">
          <button
            onClick={reload}
            className="border border-gray-800 bg-transparent text-gray-500 text-xs px-3.5 py-1.5 rounded-lg font-sans hover:border-accent hover:text-accent transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Aktualisieren
          </button>
          {lastUpdate && (
            <div className="text-[0.7rem] text-gray-600 mt-1">
              Aktualisiert:{" "}
              {lastUpdate.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-900 border border-gray-800 rounded-xl p-1 items-center">
        {MAIN_TABS.map((t) => (
          <Tab
            key={t.key}
            label={t.label}
            count={tabCount(t.key, data, derivedTasks)}
            active={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            badgeColor={t.key === "aufgaben" && aufgabenHasHigh ? "red" : undefined}
          />
        ))}

        {/* Hamburger Menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`py-2.5 px-3 rounded-lg transition-all ${
              isMoreTabActive
                ? "bg-accent/20 text-accent"
                : "text-gray-500 hover:text-gray-300"
            }`}
            title="Weitere Tabs"
          >
            <Menu className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg py-1 min-w-[170px] z-30 shadow-xl">
              {MORE_TABS.map((t) => {
                const count = tabCount(t.key, data, derivedTasks);
                return (
                  <button
                    key={t.key}
                    onClick={() => { setActiveTab(t.key); setMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between ${
                      activeTab === t.key
                        ? "text-accent bg-accent/10"
                        : "text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    {t.label}
                    {count !== undefined && (
                      <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[0.7rem] font-bold ${
                        activeTab === t.key
                          ? "bg-white/20 text-accent-light"
                          : "bg-accent/15 text-accent"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {renderView()}
    </div>
  );
}
