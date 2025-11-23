# CLAUDE.md - Gerichtskostenrechner

## Projektübersicht

Schweizer Gerichtskostenrechner für Zivilverfahren. Bilingual (DE/FR), keine Backend-Abhängigkeit.

**Live:** https://gerichtskostenrechner.ch

## Projektstruktur

```
gerichtskostenrechner/
├── index.html              # Spracherkennung → Redirect zu /de/ oder /fr/
├── de/
│   ├── index.html          # Deutsche Hauptseite (Rechner)
│   └── kosten.html         # Kantonale Kostenübersicht (DE)
├── fr/
│   ├── index.html          # Französische Hauptseite (Rechner)
│   └── kosten.html         # Kantonale Kostenübersicht (FR)
├── css/
│   └── styles.css          # Gemeinsame Styles
├── scripts/
│   ├── calculations.js     # Berechnungslogik + Kantonsfaktoren
│   └── app.js              # UI-Logik
├── test.js                 # Tests (node test.js)
├── KOSTEN.md               # Detaillierte Kostenübersicht (alle 26 Kantone)
└── README.md               # Dokumentation
```

## Berechnungslogik

### Kantonsfaktoren (Stand: November 2025)

Die Gebühren werden berechnet als:
```
Kantonale Gebühr = Zürcher Basisgebühr × Kantonsfaktor
```

**Wichtige Faktoren:**
| Kanton | Faktor | Bemerkung |
|--------|--------|-----------|
| TG | 0.50 | Günstigster Kanton |
| LU | 0.65 | Moderat |
| VD | 0.80 | Günstig für hohe Streitwerte |
| AG | 0.96 | Moderat |
| ZH | 1.00 | Referenzkanton |
| SG | 1.00 | Wie Zürich |
| ZG | 1.25 | Teurer |
| GE | 1.30 | Teuer |
| BE | 1.50 | Teuer |
| UR | 1.50 | Teuer (überraschend!) |
| GR | 2.50 | Teuerster Kanton! |

**Achtung:** Die ursprünglichen Schätzungen waren teilweise falsch:
- Uri wurde als günstig angenommen → ist teuer
- Graubünden wurde als moderat angenommen → ist sehr teuer
- Thurgau ist viel günstiger als gedacht

### Verfahrensarten

1. **Schlichtung** - Vor jedem Zivilverfahren obligatorisch
2. **Vereinfacht** - Bis CHF 30'000 Streitwert
3. **Ordentlich** - Über CHF 30'000 Streitwert
4. **Summarisch** - Schnellverfahren (Rechtsschutz, Besitz, etc.)

### Kostenlose Verfahren (Art. 114 ZPO)

- Arbeitsrecht bis CHF 30'000
- Mietrecht (unbegrenzt)
- Gleichstellungsgesetz
- Mitwirkungsgesetz

## Wichtige Dateien

### scripts/calculations.js

Enthält:
- `CANTONS` - Alle 26 Kantone mit DE/FR Namen
- `CANTON_FEE_MULTIPLIERS` - Faktoren pro Kanton
- `BASE_FEE_TABLES` - Basisgebühren (Zürich als Referenz)
- `calculateCourtFees()` - Hauptberechnungsfunktion
- `calculateTotalProcessCosts()` - Inkl. Anwaltskosten-Schätzung

### scripts/app.js

UI-Logik:
- Formularverarbeitung
- Kantonauswahl
- Ergebnisanzeige
- Disclaimer-Modal
- Druckfunktion

### KOSTEN.md

Detaillierte Dokumentation aller Kantone mit:
- Offiziellen Rechtsgrundlagen
- Links zu Gebührenverordnungen
- Konkrete Gebührenbeträge

## Tests

```bash
node test.js
```

Erwartet: 33/33 Tests bestanden

Testet:
- Grundlegende Gebührenberechnung
- Verfahrensart-Grenzen (vereinfacht max 30k)
- Fehlerbehandlung
- Formatierungsfunktionen
- Kantonsauswahl
- Alle 26 Kantone vorhanden

## Datenquellen

### Offizielle kantonale Quellen

- **ZH:** [GebV OG](https://www.gerichte-zh.ch/themen/zivilprozess/prozesskosten.html)
- **BE:** [VBRS-Richtlinien](https://www.zsg.justice.be.ch/de/start/themen/zivilrecht/kosten/verfahrenskosten.html)
- **LU:** [Justiz-Kostenverordnung](https://gerichte.lu.ch/rechtsgebiete/prozesskosten/zivilprozess/gerichtskosten)
- **TG:** [RB 638.1](https://www.rechtsbuch.tg.ch/app/de/texts_of_law/638.1)
- **GR:** [BR 320.210](https://www.gr-lex.gr.ch/app/de/texts_of_law/320.210)
- **ZG:** [BGS 161.7](https://bgs.zg.ch/app/de/texts_of_law/161.7)

Vollständige Liste in KOSTEN.md

### Weitere Quellen

- [NZZ: Kostspielige Justiz](https://www.nzz.ch/schweiz/kostspielige-justiz-in-der-schweiz-wer-soll-das-bezahlen-ld.1681569)
- [Justis.ch](https://www.justis.ch/de/rechtstipps/artikel/versicherungen/wie-viel-kostet-ein-gerichtsverfahren-in-der-schweiz)

## Deployment

Statische Seite, gehostet auf GitHub Pages oder ähnlich.

Kein Build-Prozess nötig - direkt HTML/CSS/JS.

## Bekannte Einschränkungen

1. **Kantonsfaktoren sind Schätzungen** - Die echten Gebührenstrukturen sind komplex (Staffeln, Rahmen, etc.)
2. **Anwaltskosten sind grobe Schätzungen** - Variieren stark nach Anwalt und Fall
3. **Keine Berücksichtigung von:**
   - Beweisführungskosten
   - Übersetzungskosten
   - Gutachterkosten
   - Rechtsmittelverfahren

## Zusammengehörige Projekte

Dieses Projekt ist Teil einer Suite von Schweizer Rechtstools:

| Projekt | Beschreibung | URL |
|---------|--------------|-----|
| **gerichtskostenrechner** | Gerichtskosten für Zivilverfahren | [github.com/durchblick-nl/gerichtskostenrechner](https://github.com/durchblick-nl/gerichtskostenrechner) |
| **verzugszinsrechner** | Verzugszinsen nach OR 104 | [github.com/durchblick-nl/verzugszinsrechner](https://github.com/durchblick-nl/verzugszinsrechner) |
| **frist** | Fristenrechner (ZPO, OR, etc.) | [github.com/durchblick-nl/frist](https://github.com/durchblick-nl/frist) |

Alle drei Projekte:
- Bilingual (DE/FR)
- Vanilla HTML/CSS/JS (kein Framework)
- Client-side Berechnungen (kein Backend)
- Open Source

## Kontakt

[Durchblick Consultancy BV](https://durchblick.nl)
