import { useState } from "react";
import Tab from "./Tab";
import { useBaserowData } from "../hooks/useBaserowData";
import MietenView from "../views/MietenView";
import InstrumenteView from "../views/InstrumenteView";
import KundenView from "../views/KundenView";
import AngeboteView from "../views/AngeboteView";
import RechnungenView from "../views/RechnungenView";
import EinkaufView from "../views/EinkaufView";
import FinanzenView from "../views/FinanzenView";

const TABS = [
  { key: "mieten", label: "Mieten" },
  { key: "instrumente", label: "Instrumente" },
  { key: "kunden", label: "Kunden" },
  { key: "angebote", label: "Angebote" },
  { key: "rechnungen", label: "Rechnungen" },
  { key: "einkauf", label: "Einkauf" },
  { key: "finanzen", label: "Finanzen" },
];

function tabCount(key, data) {
  if (!data) return undefined;
  switch (key) {
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
  const [activeTab, setActiveTab] = useState("mieten");
  const { data, loading, error, lastUpdate, reload } = useBaserowData();

  const renderView = () => {
    if (loading) {
      return (
        <div className="text-center py-16 text-gray-500">
          <div className="w-8 h-8 border-3 border-gray-800 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
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
      case "mieten": return <MietenView data={data} />;
      case "instrumente": return <InstrumenteView data={data} />;
      case "kunden": return <KundenView data={data} />;
      case "angebote": return <AngeboteView data={data} />;
      case "rechnungen": return <RechnungenView data={data} />;
      case "einkauf": return <EinkaufView data={data} />;
      case "finanzen": return <FinanzenView data={data} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-5 py-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
        <div>
          <div className="font-mono text-base font-bold text-orange-400 tracking-tight">
            schlagzeugleihen.de
          </div>
          <div className="text-[0.8rem] text-gray-500 mt-0.5">Dashboard</div>
        </div>
        <div className="text-right">
          <button
            onClick={reload}
            className="border border-gray-800 bg-transparent text-gray-500 text-xs px-3.5 py-1.5 rounded-lg font-sans hover:border-orange-500 hover:text-orange-400 transition-all"
          >
            &#8635; Aktualisieren
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
      <div className="flex gap-1 mb-5 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <Tab
            key={t.key}
            label={t.label}
            count={tabCount(t.key, data)}
            active={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
          />
        ))}
      </div>

      {/* Content */}
      {renderView()}
    </div>
  );
}
