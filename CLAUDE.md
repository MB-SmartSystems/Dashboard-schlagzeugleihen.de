# CLAUDE.md — schlagzeugleihen.de Dashboard

Dieses Projekt ist das interne Verwaltungs-Dashboard für schlagzeugleihen.de.
Betreiber: Manuel Büttner, MB SmartSystems.

---

## Stack
- **Frontend:** React + Vite, Tailwind CSS
- **Hosting:** Vercel (deployt automatisch bei Push auf `main`)
- **Repo:** https://github.com/MB-SmartSystems/Dashboard-schlagzeugleihen.de
- **Lokal:** `/home/manuel/projects/mb-smartsystems-master/own-projects/schlagzeugleihen/dashboard/`
- **n8n:** VPS `72.61.187.203`, Docker Container `root-n8n-1`
- **Baserow:** `baserow.mb-smartsystems.de`, Datenbank ID: 225

---

## Baserow Tabellen (DB 225)
| ID | Name |
|----|------|
| 783 | Instrumente |
| 784 | Kunden |
| 785 | Mieten |
| 786 | Preismodelle |
| 787 | Angebote |
| 793 | Email Log |
| 834 | Rechnungen |
| 835 | Belege |
| 852 | Aufgaben |

Vollständige Tabellen-Doku: MB SmartSystems Memory → `schlagzeugleihen-system.md`

---

## API-Regeln
- API-Proxy (`api/baserow/row.js`) nutzt `user_field_names=true`
- Status-Werte IMMER als String senden (z.B. `"Aktiv"`), NIEMALS numerische IDs
- Baserow-Operationen im Dashboard: über `src/api/baserow.js` (`updateRow`, `createRow`, `fetchRows`)

---

## n8n Workflows
| ID | Funktion |
|----|----------|
| `kIpvMbQdH1bAOqLfTyf3C` | Rechnung Generator |
| `7ISz8-i5PsdFcjyzplpw9` | Angebot angenommen |
| `flDwklNS41EeLaxY` | Angebot Nachfass |
| `fz0tpN2xTA6B83TL` | Miet Follow-Up |

---

## Wichtige Dateien
| Datei | Was |
|-------|-----|
| `src/views/AngeboteView.jsx` | Angebots-Flow, Status-Buttons |
| `src/views/MietenView.jsx` | Mieten, Follow-Up, Beantwortet-Button |
| `src/api/baserow.js` | API-Layer (updateRow, createRow, TABLE_IDS) |
| `api/baserow/row.js` | Server-Proxy → Baserow |
| `api/webhook/trigger.js` | Webhook-Map → n8n |

---

## Deploy
```
git add [dateien]
git commit -m "beschreibung"
git push
# → Vercel deployt automatisch
```

**Regel:** Nach jeder abgeschlossenen Code-Änderung in diesem Projekt immer direkt committen und pushen — ohne Rückfrage. Commit-Message kurz und beschreibend auf Deutsch.

---

## Vollständige Systemdoku
Für detaillierte Status-Mappings, Angebots-Flow, Debugging:
→ MB SmartSystems Memory: `schlagzeugleihen-system.md` + `schlagzeugleihen-debugging.md`
