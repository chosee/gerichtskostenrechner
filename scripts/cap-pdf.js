/**
 * CAP Schadentool - PDF Export
 * Generiert professionelle PDF-Dokumente mit jsPDF
 */

const CAPPdfExport = {
    /**
     * Generiert ein PDF mit der Kostenübersicht
     */
    generatePDF(result, params, lang = 'de') {
        // jsPDF dynamisch laden falls nicht vorhanden
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            console.error('jsPDF nicht geladen');
            window.print();
            return;
        }

        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF();
        const fmt = CAPCalculator.formatCHF;

        // Texte je nach Sprache
        const texts = this.getTexts(lang);

        // Farben
        const primaryColor = [63, 96, 111];
        const accentColor = [204, 92, 83];

        let y = 20;

        // === HEADER ===
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(texts.title, 15, 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(texts.subtitle, 15, 23);

        // Fall-Nummer und Datum rechts
        if (params.fallnummer) {
            doc.text(`${texts.caseNo}: ${params.fallnummer}`, 195, 15, { align: 'right' });
        }
        doc.text(`${texts.date}: ${this.formatDate(params.datum, lang)}`, 195, 23, { align: 'right' });

        y = 45;

        // === BASISDATEN ===
        doc.setTextColor(0, 0, 0);
        y = this.addSectionHeader(doc, texts.baseData, y, primaryColor);

        doc.setFontSize(10);
        const kantonName = result.kantonName[lang] || result.kantonName.de;

        const baseDataLines = [
            [texts.canton, kantonName],
            [texts.procedure, params.verfahrensart === 'summarisch' ? texts.summary : texts.ordinary],
            [texts.disputeValue + ' 1', fmt(params.streitwert1)],
            [texts.utilizationRate, result.ausschoepfung + '%'],
            [texts.successProspects, this.getErfolgsText(params.erfolgsaussichten, lang)]
        ];

        y = this.addTable(doc, baseDataLines, 15, y);
        y += 10;

        // === AUSSERGERICHTLICH ===
        if (result.aussergerichtlich.total > 0) {
            y = this.addSectionHeader(doc, texts.extrajudicial, y, primaryColor);

            const agLines = [
                [texts.attorneyFees, fmt(result.aussergerichtlich.honorarAnwalt)],
                [texts.expenses + ' (3%)', fmt(result.aussergerichtlich.spesen)],
                [texts.vat + ' (7.7%)', fmt(result.aussergerichtlich.mwst)],
                [texts.conciliation, fmt(result.aussergerichtlich.schlichtung)]
            ];

            if (result.aussergerichtlich.expertisen > 0) {
                agLines.push([texts.expertises, fmt(result.aussergerichtlich.expertisen)]);
            }
            if (result.aussergerichtlich.betreibung > 0) {
                agLines.push([texts.enforcement, fmt(result.aussergerichtlich.betreibung)]);
            }

            y = this.addTable(doc, agLines, 15, y);
            y = this.addTotalLine(doc, texts.subtotal, fmt(result.aussergerichtlich.total), y, accentColor);
            y += 10;
        }

        // === 1. INSTANZ ===
        if (result.instanz1.aktiv && result.instanz1.total > 0) {
            y = this.checkPageBreak(doc, y, 60);
            y = this.addSectionHeader(doc, texts.instance1, y, primaryColor);

            // Gerichtskosten mit Faktor-Hinweis (50% bei Optimistisch)
            const gk1Label = result.instanz1.gerichtskostenFaktor < 1
                ? fmt(result.instanz1.gerichtskostenEffektiv) + ' (50%)'
                : fmt(result.instanz1.gerichtskostenEffektiv);

            const i1Lines = [
                [texts.courtCosts, gk1Label],
                [texts.attorneyFeeTariff, fmt(result.instanz1.anwaltshonorar.berechnet)]
            ];

            if (result.instanz1.honorarVereinbarung > 0) {
                i1Lines.push([texts.additionalFees, fmt(result.instanz1.honorarVereinbarung)]);
            }

            i1Lines.push(
                [texts.expensesVat, fmt(result.instanz1.spesen + result.instanz1.mwst)],
                [texts.partyCompensation, fmt(result.instanz1.pke)]
            );

            y = this.addTable(doc, i1Lines, 15, y);
            y = this.addTotalLine(doc, texts.subtotal, fmt(result.instanz1.total), y, accentColor);
            y += 10;
        }

        // === 2. INSTANZ ===
        if (result.instanz2.aktiv && result.instanz2.total > 0) {
            y = this.checkPageBreak(doc, y, 50);
            y = this.addSectionHeader(doc, texts.instance2, y, primaryColor);

            // Gerichtskosten mit Faktor-Hinweis (50% bei Optimistisch)
            const gk2Label = result.instanz2.gerichtskostenFaktor < 1
                ? fmt(result.instanz2.gerichtskostenEffektiv) + ' (50%)'
                : fmt(result.instanz2.gerichtskostenEffektiv);

            const i2Lines = [
                [texts.courtCosts, gk2Label],
                [texts.attorneyFees, fmt(result.instanz2.anwaltshonorar.berechnet)],
                [texts.expensesVat, fmt(result.instanz2.spesen + result.instanz2.mwst)],
                [texts.partyCompensation, fmt(result.instanz2.pke)]
            ];

            y = this.addTable(doc, i2Lines, 15, y);
            y = this.addTotalLine(doc, texts.subtotal, fmt(result.instanz2.total), y, accentColor);
            y += 10;
        }

        // === 3. INSTANZ ===
        if (result.instanz3.aktiv && result.instanz3.total > 0) {
            y = this.checkPageBreak(doc, y, 50);
            y = this.addSectionHeader(doc, texts.instance3, y, primaryColor);

            // Gerichtskosten mit Faktor-Hinweis (50% bei Optimistisch)
            const gk3Label = result.instanz3.gerichtskostenFaktor < 1
                ? fmt(result.instanz3.gerichtskostenEffektiv) + ' (50%)'
                : fmt(result.instanz3.gerichtskostenEffektiv);

            const i3Lines = [
                [texts.courtCosts, gk3Label],
                [texts.attorneyFees, fmt(result.instanz3.anwaltshonorar.berechnet)],
                [texts.expensesVat, fmt(result.instanz3.spesen + result.instanz3.mwst)],
                [texts.partyCompensation, fmt(result.instanz3.pke)]
            ];

            y = this.addTable(doc, i3Lines, 15, y);
            y = this.addTotalLine(doc, texts.subtotal, fmt(result.instanz3.total), y, accentColor);
            y += 10;
        }

        // === GESAMTTOTAL ===
        y = this.checkPageBreak(doc, y, 30);
        y += 5;

        doc.setFillColor(...primaryColor);
        doc.roundedRect(15, y, 180, 20, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(texts.grandTotal, 25, y + 13);
        doc.setFontSize(16);
        doc.text(fmt(result.gesamtTotal), 185, y + 13, { align: 'right' });

        y += 30;

        // === FOOTER ===
        y = this.checkPageBreak(doc, y, 25);

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(texts.disclaimer, 15, y);
        doc.text(texts.dataStatus, 15, y + 5);

        // Dateiname generieren
        const filename = params.fallnummer
            ? `Kostenberechnung_${params.fallnummer}.pdf`
            : `Kostenberechnung_${this.formatDateFile(params.datum)}.pdf`;

        doc.save(filename);
    },

    /**
     * Fügt einen Sektions-Header hinzu
     */
    addSectionHeader(doc, title, y, color) {
        doc.setFillColor(...color);
        doc.rect(15, y, 3, 8, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 22, y + 6);

        return y + 12;
    },

    /**
     * Fügt eine Tabelle hinzu
     */
    addTable(doc, rows, x, y) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        rows.forEach(row => {
            doc.text(row[0], x, y);
            doc.text(row[1], 185, y, { align: 'right' });
            y += 6;
        });

        return y;
    },

    /**
     * Fügt eine Total-Zeile hinzu
     */
    addTotalLine(doc, label, amount, y, color) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y - 4, 180, 8, 'F');

        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.text(label, 17, y + 2);
        doc.text(amount, 185, y + 2, { align: 'right' });

        return y + 10;
    },

    /**
     * Prüft ob Seitenumbruch nötig
     */
    checkPageBreak(doc, y, requiredSpace) {
        if (y + requiredSpace > 280) {
            doc.addPage();
            return 20;
        }
        return y;
    },

    /**
     * Formatiert Datum
     */
    formatDate(date, lang) {
        if (!date) date = new Date();
        if (typeof date === 'string') date = new Date(date);

        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString(lang === 'fr' ? 'fr-CH' : 'de-CH', options);
    },

    /**
     * Formatiert Datum für Dateiname
     */
    formatDateFile(date) {
        if (!date) date = new Date();
        if (typeof date === 'string') date = new Date(date);

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    /**
     * Erfolgsaussichten Text
     */
    getErfolgsText(wert, lang) {
        const texts = {
            de: {
                optimistisch: 'Optimistisch (Vergleich)',
                neutral: 'Neutral',
                pessimistisch: 'Pessimistisch (Totalverlust)'
            },
            fr: {
                optimistisch: 'Optimiste (transaction)',
                neutral: 'Neutre',
                pessimistisch: 'Pessimiste (perte totale)'
            }
        };
        return texts[lang]?.[wert] || texts.de[wert] || wert;
    },

    /**
     * Texte für PDF
     */
    getTexts(lang) {
        if (lang === 'fr') {
            return {
                title: 'Calculateur de frais',
                subtitle: 'Estimation des frais de procédure civile',
                caseNo: 'Dossier',
                date: 'Date',
                baseData: 'Données de base',
                canton: 'Canton',
                procedure: 'Type de procédure',
                ordinary: 'Procédure ordinaire/simplifiée',
                summary: 'Procédure sommaire',
                disputeValue: 'Valeur litigieuse',
                utilizationRate: 'Utilisation du barème',
                successProspects: 'Chances de succès',
                extrajudicial: 'Phase extrajudiciaire',
                attorneyFees: 'Honoraires d\'avocat',
                attorneyFeeTariff: 'Honoraires (tarif)',
                additionalFees: 'Honoraires suppl.',
                expenses: 'Débours',
                expensesVat: 'Débours + TVA',
                vat: 'TVA',
                conciliation: 'Conciliation',
                expertises: 'Expertises',
                enforcement: 'Poursuite/mainlevée',
                instance1: '1ère instance - Procédure judiciaire',
                instance2: '2ème instance - Appel',
                instance3: '3ème instance - Tribunal fédéral',
                courtCosts: 'Frais judiciaires',
                partyCompensation: 'Dépens (en cas de perte)',
                subtotal: 'Sous-total',
                grandTotal: 'FRAIS TOTAUX (estimation)',
                disclaimer: 'Cet outil sert uniquement d\'orientation. Les frais réels peuvent varier.',
                dataStatus: 'État des données: 2024 | Basé sur les règlements cantonaux'
            };
        }

        return {
            title: 'Prozesskostenrechner',
            subtitle: 'Voraussichtliche Kosten für Zivilverfahren',
            caseNo: 'Fall-Nr.',
            date: 'Datum',
            baseData: 'Basisdaten',
            canton: 'Kanton',
            procedure: 'Verfahrensart',
            ordinary: 'Ordentliches/Vereinfachtes Verfahren',
            summary: 'Summarisches Verfahren',
            disputeValue: 'Streitwert',
            utilizationRate: 'Ausschöpfung',
            successProspects: 'Erfolgsaussichten',
            extrajudicial: 'Aussergerichtliche Phase',
            attorneyFees: 'Anwaltshonorar',
            attorneyFeeTariff: 'Anwaltshonorar (PKV)',
            additionalFees: 'Zusatzhonorar',
            expenses: 'Spesen',
            expensesVat: 'Spesen + MwSt',
            vat: 'MwSt',
            conciliation: 'Schlichtung',
            expertises: 'Expertisen',
            enforcement: 'Betreibung/RÖ',
            instance1: '1. Instanz - Gerichtliches Verfahren',
            instance2: '2. Instanz - Berufung',
            instance3: '3. Instanz - Bundesgericht',
            courtCosts: 'Gerichtskosten',
            partyCompensation: 'PKE (bei Verlust)',
            subtotal: 'Zwischentotal',
            grandTotal: 'GESAMTTOTAL (voraussichtlich)',
            disclaimer: 'Dieses Tool dient nur zur Orientierung. Die tatsächlichen Kosten können abweichen.',
            dataStatus: 'Datenstand: 2024 | Basierend auf kantonalen Gebührenverordnungen'
        };
    }
};

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAPPdfExport;
}
