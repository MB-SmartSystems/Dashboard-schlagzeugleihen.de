import { useState, useMemo } from "react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import { updateRow, createRow, TABLE_IDS } from "../api/baserow";

function priorityBadge(prio) {
  switch (prio) {
    case "Hoch": return <Badge color="red">Hoch</Badge>;
    case "Mittel": return <Badge color="yellow">Mittel</Badge>;
    case "Niedrig": return <Badge color="blue">Niedrig</Badge>;
    default: return <Badge color="gray">{prio || "–"}</Badge>;
  }
}

function TaskCard({ task, onStatusChange, savingId, setActiveTab }) {
  const isLoading = savingId === (task._derived ? task._deriveKey : task.id);
  const isDerived = task._derived;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-2 transition-all hover:bg-gray-900/80 hover:border-orange-500/50">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{task.titel}</div>
          {task.Beschreibung && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{task.Beschreibung}</div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDerived && <Badge color="purple">Auto</Badge>}
          {priorityBadge(task.prioritaet)}
          {!isDerived ? (
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task, e.target.value)}
              disabled={isLoading}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
            >
              <option value="Offen">Offen</option>
              <option value="In Arbeit">In Arbeit</option>
              <option value="Erledigt">Erledigt</option>
            </select>
          ) : (
            <Badge color="orange">Offen</Badge>
          )}
        </div>
      </div>

      {/* Quelle + Links */}
      <div className="flex items-center gap-3 mt-2.5 text-xs">
        {task.quelle === "Automatisch" && (
          <span className="text-gray-600">Quelle: Automatisch erkannt</span>
        )}
        {task.angebotId && setActiveTab && (
          <button onClick={() => setActiveTab("angebote")} className="text-blue-400 hover:underline">
            → Angebot
          </button>
        )}
        {task.kundeId && setActiveTab && (
          <button onClick={() => setActiveTab("kunden")} className="text-blue-400 hover:underline">
            → Kunde
          </button>
        )}
        {task.instrumentId && setActiveTab && (
          <button onClick={() => setActiveTab("instrumente")} className="text-blue-400 hover:underline">
            → Instrument
          </button>
        )}
      </div>
    </div>
  );
}

function PriorityGroup({ label, color, tasks, onStatusChange, savingId, setActiveTab }) {
  const dotColor = color === "red" ? "bg-red-400" : color === "yellow" ? "bg-yellow-400" : "bg-blue-400";
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-[0.75rem] text-gray-500 uppercase tracking-widest font-semibold">
          {label} ({tasks.length})
        </span>
      </div>
      {tasks.map((t) => (
        <TaskCard
          key={t._derived ? t._deriveKey : t.id}
          task={t}
          onStatusChange={onStatusChange}
          savingId={savingId}
          setActiveTab={setActiveTab}
        />
      ))}
    </div>
  );
}

export default function AufgabenView({ data, reload, setActiveTab, derivedTasks }) {
  const [showErledigt, setShowErledigt] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitel, setNewTitel] = useState("");
  const [newBeschreibung, setNewBeschreibung] = useState("");
  const [newPrio, setNewPrio] = useState("Mittel");
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);

  /* Alle Tasks zusammenführen */
  const allTasks = useMemo(() => {
    const baserow = (data.aufgaben || []).map((t) => ({
      ...t,
      _derived: false,
      titel: t.Titel || "",
      typ: t.Typ?.value || "Manuell",
      prioritaet: t.Priorität?.value || t.Prioritaet?.value || "Mittel",
      status: t.Status?.value || "Offen",
      quelle: t.Quelle?.value || "Manuell",
      angebotId: t.Verknüpfung_Angebot?.[0]?.id || t.Verknuepfung_Angebot?.[0]?.id || null,
      kundeId: t.Verknüpfung_Kunde?.[0]?.id || t.Verknuepfung_Kunde?.[0]?.id || null,
      instrumentId: t.Verknüpfung_Instrument?.[0]?.id || t.Verknuepfung_Instrument?.[0]?.id || null,
    }));
    return [...baserow, ...(derivedTasks || [])];
  }, [data.aufgaben, derivedTasks]);

  const openTasks = allTasks.filter((t) => t.status !== "Erledigt");
  const erledigtTasks = allTasks.filter((t) => t.status === "Erledigt");

  const grouped = useMemo(() => {
    const source = showErledigt ? allTasks : openTasks;
    return {
      hoch: source.filter((t) => t.prioritaet === "Hoch"),
      mittel: source.filter((t) => t.prioritaet === "Mittel"),
      niedrig: source.filter((t) => t.prioritaet === "Niedrig"),
    };
  }, [allTasks, openTasks, showErledigt]);

  /* Stats */
  const offenCount = openTasks.filter((t) => t.status === "Offen").length;
  const inArbeitCount = openTasks.filter((t) => t.status === "In Arbeit").length;
  const heuteErledigt = erledigtTasks.filter((t) => {
    if (!t.Erledigt_am) return false;
    return t.Erledigt_am.startsWith(new Date().toISOString().slice(0, 10));
  }).length;

  /* Status ändern */
  const handleStatusChange = async (task, newStatus) => {
    if (task._derived || !TABLE_IDS.aufgaben) return;
    setSavingId(task.id);
    try {
      const fields = { Status: newStatus };
      if (newStatus === "Erledigt") {
        fields.Erledigt_am = new Date().toISOString().slice(0, 10);
      }
      await updateRow(TABLE_IDS.aufgaben, task.id, fields);
      setToast({ message: `Aufgabe → ${newStatus}`, type: "success" });
      reload();
    } catch (e) {
      setToast({ message: `Fehler: ${e.message}`, type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  /* Neue Aufgabe */
  const handleCreate = async () => {
    if (!newTitel.trim() || !TABLE_IDS.aufgaben) return;
    setCreating(true);
    try {
      await createRow(TABLE_IDS.aufgaben, {
        Titel: newTitel.trim(),
        Beschreibung: newBeschreibung.trim() || undefined,
        Priorität: newPrio,
        Typ: "Manuell",
        Quelle: "Manuell",
        Status: "Offen",
      });
      setShowNewModal(false);
      setNewTitel("");
      setNewBeschreibung("");
      setNewPrio("Mittel");
      setToast({ message: "Aufgabe erstellt ✓", type: "success" });
      reload();
    } catch (e) {
      setToast({ message: `Fehler: ${e.message}`, type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-orange-500 transition-colors";

  return (
    <div>
      {/* Stats */}
      <div className="flex gap-3 mb-5 overflow-x-auto">
        <StatCard label="Offen" value={offenCount} color="orange" />
        <StatCard label="In Arbeit" value={inArbeitCount} color="blue" />
        <StatCard label="Heute erledigt" value={heuteErledigt} color="green" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-[0.8rem] text-gray-500 uppercase tracking-widest font-semibold">
          Aufgaben
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowErledigt(!showErledigt)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showErledigt ? "Erledigte ausblenden" : "Erledigte anzeigen"}
          </button>
          {TABLE_IDS.aufgaben && (
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-orange-500/25 transition-all"
            >
              + Neue Aufgabe
            </button>
          )}
        </div>
      </div>

      {/* Prioritätsgruppen */}
      {grouped.hoch.length > 0 && (
        <PriorityGroup label="Hoch" color="red" tasks={grouped.hoch}
          onStatusChange={handleStatusChange} savingId={savingId} setActiveTab={setActiveTab} />
      )}
      {grouped.mittel.length > 0 && (
        <PriorityGroup label="Mittel" color="yellow" tasks={grouped.mittel}
          onStatusChange={handleStatusChange} savingId={savingId} setActiveTab={setActiveTab} />
      )}
      {grouped.niedrig.length > 0 && (
        <PriorityGroup label="Niedrig" color="blue" tasks={grouped.niedrig}
          onStatusChange={handleStatusChange} savingId={savingId} setActiveTab={setActiveTab} />
      )}

      {openTasks.length === 0 && !showErledigt && (
        <div className="text-center py-12 text-gray-600">Keine offenen Aufgaben 🎉</div>
      )}

      {/* Neue Aufgabe Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Neue Aufgabe"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)}
              className="text-xs text-gray-400 hover:text-gray-200 px-3.5 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
              Abbrechen
            </button>
            <button onClick={handleCreate} disabled={creating || !newTitel.trim()}
              className="text-xs font-semibold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-3.5 py-2 rounded-lg hover:bg-orange-500/25 transition-all disabled:opacity-50">
              {creating ? "Erstellen…" : "Erstellen"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">Titel *</label>
            <input className={inputClass} value={newTitel} onChange={(e) => setNewTitel(e.target.value)} placeholder="Was muss erledigt werden?" />
          </div>
          <div>
            <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">Beschreibung</label>
            <textarea className={`${inputClass} min-h-[70px] resize-y`} value={newBeschreibung} onChange={(e) => setNewBeschreibung(e.target.value)} placeholder="Details (optional)" />
          </div>
          <div>
            <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">Priorität</label>
            <select className={`${inputClass} appearance-none`} value={newPrio} onChange={(e) => setNewPrio(e.target.value)}>
              <option value="Hoch">Hoch</option>
              <option value="Mittel">Mittel</option>
              <option value="Niedrig">Niedrig</option>
            </select>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
