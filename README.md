# Schweizer Gerichtskostenrechner | Calculateur de frais de justice suisse

🇩🇪 [Deutsch](#deutsch) | 🇫🇷 [Français](#français)

---

<a name="deutsch"></a>
## 🇩🇪 Deutsch

Berechne Gerichtskosten und Betreibungsgebühren für die Schweiz.

**[gerichtskostenrechner.ch](https://gerichtskostenrechner.ch)**

### Verfügbare Tools

| Tool | Beschreibung | Link |
|------|--------------|------|
| **Gerichtskostenrechner** | Gerichtskosten für Zivilverfahren (26 Kantone) | [/de/](https://gerichtskostenrechner.ch/de/) |
| **Betreibungsrechner** | Betreibungskosten nach GebV SchKG | [/de/betreibung.html](https://gerichtskostenrechner.ch/de/betreibung.html) |

### Was sind Prozesskosten?

Prozesskosten setzen sich zusammen aus:
- **Gerichtskosten**: Gebühren des Gerichts für das Verfahren
- **Anwaltskosten**: Honorar des eigenen Anwalts
- **Parteientschädigung**: Bei Verlust: Kosten des Gegenanwalts

### Wer trägt die Kosten?

Grundsätzlich trägt die **unterliegende Partei** die Prozesskosten (Art. 106 ZPO). Bei teilweisem Obsiegen werden die Kosten verhältnismässig verteilt.

### Kantonale Unterschiede

Die Gerichtskosten variieren **erheblich** je nach Kanton. Der Rechner berücksichtigt diese Unterschiede mit kantonsspezifischen Gebührenmultiplikatoren.

| Kanton | Kostenniveau | Faktor | Bemerkung |
|--------|--------------|--------|-----------|
| Thurgau | Günstigster | 0.50 | CHF 4'000 bei 100k Streitwert |
| Luzern, Aargau | Moderat | 0.65–0.96 | |
| Zürich | Referenz | 1.00 | CHF 8'000 bei 100k Streitwert |
| Bern, Uri | Teurer | 1.50 | CHF 12'000 bei 100k Streitwert |
| Graubünden | Teuerster | 2.50 | Bis CHF 30'000 bei 100k Streitwert! |

👉 **[Detaillierte Kostenübersicht pro Kanton](KOSTEN.md)**

### Kostenlose Verfahren (Art. 114 ZPO)

- Arbeitsrecht bis CHF 30'000 Streitwert
- Mietrecht (Wohn- und Geschäftsräume)
- Gleichstellungsgesetz
- Mitwirkungsgesetz

### Verfahrensarten

| Verfahren | Streitwert | Typische Kosten |
|-----------|------------|-----------------|
| Schlichtung | Alle | CHF 100–1'000 |
| Vereinfacht | Bis CHF 30'000 | CHF 500–2'500 |
| Ordentlich | Über CHF 30'000 | CHF 2'500–280'000+ |
| Summarisch | Schnellverfahren | CHF 300–8'000 |

---

<a name="français"></a>
## 🇫🇷 Français

Calculez les frais de justice et de poursuite pour la Suisse.

**[gerichtskostenrechner.ch](https://gerichtskostenrechner.ch)**

### Outils disponibles

| Outil | Description | Lien |
|-------|-------------|------|
| **Frais de justice** | Frais de procédure civile (26 cantons) | [/fr/](https://gerichtskostenrechner.ch/fr/) |
| **Calculateur de poursuite** | Frais de poursuite selon GebV LP | [/fr/betreibung.html](https://gerichtskostenrechner.ch/fr/betreibung.html) |

### Que sont les frais de procédure?

Les frais de procédure se composent de:
- **Frais de justice**: Émoluments du tribunal pour la procédure
- **Frais d'avocat**: Honoraires de son propre avocat
- **Dépens**: En cas de perte: frais de l'avocat adverse

### Qui supporte les frais?

En principe, la **partie qui succombe** supporte les frais de procédure (art. 106 CPC). En cas de gain partiel, les frais sont répartis proportionnellement.

### Différences cantonales

Les frais de justice varient **considérablement** selon le canton. Le calculateur tient compte de ces différences avec des multiplicateurs spécifiques à chaque canton.

| Canton | Niveau de coût | Facteur | Remarque |
|--------|----------------|---------|----------|
| Thurgovie | Le moins cher | 0.50 | CHF 4'000 pour 100k de valeur litigieuse |
| Lucerne, Argovie | Modéré | 0.65–0.96 | |
| Zurich | Référence | 1.00 | CHF 8'000 pour 100k de valeur litigieuse |
| Berne, Uri | Plus élevé | 1.50 | CHF 12'000 pour 100k de valeur litigieuse |
| Grisons | Le plus cher | 2.50 | Jusqu'à CHF 30'000 pour 100k! |

👉 **[Aperçu détaillé des frais par canton](KOSTEN.md)**

### Procédures gratuites (art. 114 CPC)

- Droit du travail jusqu'à CHF 30'000
- Droit du bail (habitations et locaux commerciaux)
- Loi sur l'égalité
- Loi sur la participation

### Types de procédure

| Procédure | Valeur litigieuse | Frais typiques |
|-----------|-------------------|----------------|
| Conciliation | Toutes | CHF 100–1'000 |
| Simplifiée | Jusqu'à CHF 30'000 | CHF 500–2'500 |
| Ordinaire | Plus de CHF 30'000 | CHF 2'500–280'000+ |
| Sommaire | Procédure rapide | CHF 300–8'000 |

---

## Technologie | Technologie

```
gerichtskostenrechner/
├── index.html           # Spracherkennung / Détection de langue
├── de/
│   ├── index.html       # Gerichtskostenrechner (DE)
│   ├── kosten.html      # Kostenübersicht (DE)
│   └── betreibung.html  # Betreibungsrechner (DE)
├── fr/
│   ├── index.html       # Frais de justice (FR)
│   ├── kosten.html      # Aperçu des frais (FR)
│   └── betreibung.html  # Calculateur de poursuite (FR)
├── css/styles.css       # Gemeinsame Styles / Styles partagés
├── scripts/
│   ├── calculations.js  # Berechnungslogik / Logique de calcul
│   └── app.js           # UI-Logik / Logique UI
├── images/              # OG-Bilder / Images OG (1200x630)
├── test.js              # Tests (node test.js)
├── KOSTEN.md            # Kostenübersicht / Aperçu des frais
└── README.md            # Dokumentation
```

- Vanilla HTML/CSS/JavaScript (kein Framework)
- Bilingue DE/FR avec détection automatique
- 26 Kantone mit spezifischen Gebühren / 26 cantons avec frais spécifiques
- Aucun backend – calculs côté client
- Open Source

## Tests

```bash
node test.js  # 33/33 Tests bestanden / tests réussis
```

## Gesetzliche Grundlagen | Base légale

- **ZPO Art. 95**: Prozesskosten / Frais
- **ZPO Art. 106**: Kostenverteilung / Répartition des frais
- **ZPO Art. 114**: Kostenlose Verfahren / Procédures gratuites

Fedlex-Links:
- [Art. 95 ZPO (DE)](https://www.fedlex.admin.ch/eli/cc/2010/262/de#art_95)
- [Art. 95 CPC (FR)](https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_95)

## Weiterführende Informationen | Informations complémentaires

- [Wie viel kostet ein Gerichtsverfahren in der Schweiz?](https://www.justis.ch/de/rechtstipps/artikel/versicherungen/wie-viel-kostet-ein-gerichtsverfahren-in-der-schweiz) (DE)
- [Combien coûte une procédure judiciaire en Suisse?](https://www.justis.ch/fr/renseignements_juridiques/artikel/assurances/combien-coute-une-proccdure-judiciaire-en-suisse) (FR)

## Datenquellen | Sources de données

Die kantonalen Gebührenunterschiede basieren auf:
- [NZZ: Kostspielige Justiz in der Schweiz](https://www.nzz.ch/schweiz/kostspielige-justiz-in-der-schweiz-wer-soll-das-bezahlen-ld.1681569)
- [Justis: Gerichtskosten in der Schweiz](https://www.justis.ch/de/rechtstipps/artikel/versicherungen/wie-viel-kostet-ein-gerichtsverfahren-in-der-schweiz)
- [Gerichte Zürich: Prozesskosten](https://www.gerichte-zh.ch/themen/zivilprozess/prozesskosten.html)
- [Gerichte Luzern: Gerichtskosten](https://gerichte.lu.ch/rechtsgebiete/prozesskosten/zivilprozess/gerichtskosten)
- [Kanton Bern: Verfahrenskosten](https://www.zsg.justice.be.ch/de/start/themen/zivilrecht/kosten/verfahrenskosten.html)

## Haftungsausschluss | Avertissement

Dieser Rechner dient nur zur Orientierung. Für verbindliche Berechnungen konsultieren Sie einen Rechtsanwalt.

Ce calculateur sert uniquement d'orientation. Pour des calculs contraignants, consultez un avocat.

## Lizenz | Licence

MIT

---

[Durchblick Consultancy BV](https://durchblick.nl) • [Source Code](https://github.com/durchblick-nl/gerichtskostenrechner)
