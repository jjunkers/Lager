# Passkey Support — Backlog

> **Status:** Afventer — Gemt til fremtidig udvikling

## Beskrivelse

Implementering af Passkey (WebAuthn) login for at muliggøre biometric login (FaceID, TouchID) og øge sikkerheden mod phishing.

## Tekniske Krav

- **Backend**: Integration af `@simplewebauthn/server`.
- **Frontend**: Integration af `@simplewebauthn/browser`.
- **Database**: Ny tabel `user_credentials` til opbevaring af offentlige nøgler.

## TODO

- [ ] Opsæt `user_credentials` tabel i D1 (migrations).
- [ ] Implementér backend endpoints for challenge og verifikation.
- [ ] Tilføj "Registrér Passkey" i brugerindstillinger.
- [ ] Tilføj "Log ind med Passkey" på login-siden.
- [ ] Test på tværs af enheder (iOS, Android, Windows, macOS).

---
*Baseret på forslag genereret 2026-02-27.*
