const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-orange-500 transition-colors";

const selectClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 outline-none focus:border-orange-500 transition-colors appearance-none";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[0.7rem] text-gray-500 uppercase tracking-wider font-semibold mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function KundeForm({ values, onChange }) {
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Vorname">
        <input className={inputClass} value={values.Vorname} onChange={set("Vorname")} placeholder="Vorname" />
      </Field>
      <Field label="Nachname">
        <input className={inputClass} value={values.Nachname} onChange={set("Nachname")} placeholder="Nachname" />
      </Field>
      <Field label="Telefon">
        <input className={inputClass} type="tel" value={values.Telefon} onChange={set("Telefon")} placeholder="+49 …" />
      </Field>
      <Field label="WhatsApp">
        <input className={inputClass} type="tel" value={values.WhatsApp} onChange={set("WhatsApp")} placeholder="+49 …" />
      </Field>
      <Field label="E-Mail">
        <input className={inputClass} type="email" value={values.EMail} onChange={set("EMail")} placeholder="email@beispiel.de" />
      </Field>
      <Field label="Straße">
        <input className={inputClass} value={values.Adresse_Strasse} onChange={set("Adresse_Strasse")} placeholder="Straße + Nr." />
      </Field>
      <Field label="PLZ">
        <input className={inputClass} value={values.Adresse_PLZ} onChange={set("Adresse_PLZ")} placeholder="PLZ" />
      </Field>
      <Field label="Ort">
        <input className={inputClass} value={values.Adresse_Ort} onChange={set("Adresse_Ort")} placeholder="Ort" />
      </Field>
      <Field label="Kunde Typ">
        <select className={selectClass} value={values.Kunde_Typ} onChange={set("Kunde_Typ")}>
          <option value="Privat">Privat</option>
          <option value="Firma">Firma</option>
        </select>
      </Field>
      {values.Kunde_Typ === "Firma" && (
        <Field label="Firma">
          <input className={inputClass} value={values.Firma} onChange={set("Firma")} placeholder="Firmenname" />
        </Field>
      )}
      <Field label="Bevorzugter Kanal">
        <select className={selectClass} value={values.Bevorzugter_Kanal} onChange={set("Bevorzugter_Kanal")}>
          <option value="">– Auswählen –</option>
          <option value="Telefon">Telefon</option>
          <option value="Whatsapp">WhatsApp</option>
          <option value="E-Mail">E-Mail</option>
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notizen">
          <textarea className={`${inputClass} min-h-[80px] resize-y`} value={values.Notizen} onChange={set("Notizen")} placeholder="Freitext…" />
        </Field>
      </div>
    </div>
  );
}
