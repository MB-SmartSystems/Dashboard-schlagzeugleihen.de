# n8n Workflow Setup

## Workflow 1: Angebot-Nachfass-E-Mail (AP 9)
**Datei:** `angebot-nachfass-email.json`

### Funktion
Täglich um 09:00 prüfen ob versendete Angebote seit 10+ Tagen ohne Reaktion sind.
Sendet Erinnerung an info@schlagzeugleihen.de.

### Setup-Schritte
1. **Neuen Email_Type anlegen:** In Baserow Tabelle 793 (EmailLog) einen neuen Select-Option "Angebot_Nachfass" zum Feld `Email_Type` hinzufügen
2. **Option-ID notieren** und im Node "EmailLog-Eintrag erstellen" ersetzen (`ANGEBOT_NACHFASS_OPTION_ID`)
3. **Credentials:** Baserow HTTP Header Auth + Gmail OAuth2 konfigurieren
4. **Environment:** `BASEROW_URL` in n8n Environment-Variablen setzen
5. **Import:** JSON in n8n importieren, Credentials zuweisen, aktivieren

---

## Workflow 2: Miet-Follow-Up-E-Mails (AP 10)
**Datei:** `miet-followup-emails.json`

### Funktion
Täglich um 09:00 drei Zeitpunkte für aktive Mieten prüfen:
- **Woche 1** (Mietbeginn + 7 Tage): Zufriedenheits-Check + Google-Bewertungslink
- **14 Tage vor Mietende**: Optionen (Weitermieten/Mietkauf/Rückgabe)
- **2 Tage vor Mietende**: Letzte Erinnerung

### Setup-Schritte
1. **Google-Bewertungslink:** Im Code-Node "E-Mail-Text erstellen" die Variable `GOOGLE_BEWERTUNGS_LINK` ersetzen
2. **Credentials:** Baserow HTTP Header Auth + Gmail OAuth2 konfigurieren
3. **Environment:** `BASEROW_URL` in n8n Environment-Variablen setzen
4. **Import:** JSON in n8n importieren, Credentials zuweisen, aktivieren

---

## Dashboard Webhook-Konfiguration (Vercel Environment Variables)

| Variable | Beschreibung |
|----------|-------------|
| `N8N_WEBHOOK_ANGEBOT_ERSTELLEN` | Webhook: Anfrage annehmen → PDF erstellen |
| `N8N_WEBHOOK_ABSAGE_SENDEN` | Webhook: Anfrage ablehnen → Absage senden |
| `N8N_WEBHOOK_ANGEBOT_ANGENOMMEN` | Webhook: Kunde hat angenommen → Miete anlegen |
| `N8N_WEBHOOK_ANGEBOT_ABLEHNEN` | Legacy: Alte Ablehnung (backward compat) |
| `N8N_WEBHOOK_BELEG_ANALYSE` | Webhook: AI-Beleg-Analyse |
| `N8N_WEBHOOK_BELEG_UPLOAD` | Webhook: Beleg-Datei hochladen |

### Angebote-Status-Flow (Baserow Tabelle 787)

```
offen (3089) → Annehmen → [n8n: angebot_erstellen] → zu versenden (3313)
                  └→ Ablehnen → [n8n: absage_senden] → abgelehnt (3091)

zu versenden (3313) → Als versendet markieren → [PATCH] → versendet (3754)

versendet (3754) → Kunde angenommen → [n8n: angebot_angenommen] → Kunde angenommen (3862)
                    └→ Kunde abgelehnt → [PATCH] → Kunde abgelehnt (3863)
```
