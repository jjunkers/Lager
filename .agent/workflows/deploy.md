---
description: Workflow for local development and production deployment
---

Dette er vores standard arbejdsgang for at sikre stabilitet og hurtig feedback:

1. **Lokal Udvikling**: 
   - Alle kodeændringer foretages først i de lokale filer.
   - Ændringerne kan ses lokalt via `npm run dev`.

2. **Preview Udrulning**:
   // turbo
   - For hver ændring opretter jeg et test-link, så du kan verificere det:
     ```bash
     npm run build && npx wrangler pages deploy dist --project-name lager-app --branch preview --commit-dirty=true
     ```
   - Test-linket vil altid være: [https://preview.lager-app.pages.dev](https://preview.lager-app.pages.dev)

3. **Gennemgang og Godkendelse**:
   - Jeg sender dig test-linket og dokumenterer ændringerne.
   - Du tester og bekræfter at alt er korrekt.

4. **Udrulning til Produktion**:
   // turbo
   - Når du skriver "Godkendt", "Kør", eller giver grønt lys, udruller jeg til den rigtige side:
     ```bash
     npm run build && npx wrangler pages deploy dist --project-name lager-app --branch main --commit-dirty=true
     ```
   - Live-link: [https://lager.junkerne.dk](https://lager.junkerne.dk)
