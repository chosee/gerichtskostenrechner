/**
 * Gerichtskostenrechner - PDF Export
 * Generiert professionelle PDF-Dokumente mit jsPDF
 */

const GerichtskostenPdfExport = {
    generatePDF(data, lang = 'de') {
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            console.error('jsPDF nicht geladen');
            window.print();
            return;
        }

        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF();
        const texts = this.getTexts(lang);

        const primaryColor = [63, 96, 111];
        const accentColor = [204, 92, 83];

        let y = 20;

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(texts.title, 15, 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(texts.subtitle, 15, 22);

        doc.text(`${texts.date}: ${this.formatDate(new Date(), lang)}`, 195, 15, { align: 'right' });

        y = 40;

        // Eingabedaten
        doc.setTextColor(0, 0, 0);
        y = this.addSectionHeader(doc, texts.inputData, y, primaryColor);

        const inputLines = [
            [texts.canton, data.cantonName],
            [texts.disputeValue, this.formatCHF(data.streitwert)],
            [texts.procedureType, data.verfahrensart]
        ];

        y = this.addTable(doc, inputLines, 15, y);
        y += 10;

        // Ergebnis
        y = this.addSectionHeader(doc, texts.result, y, primaryColor);

        // Gerichtskosten Box
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(15, y, 180, 22, 3, 3, 'F');

        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(texts.courtFees, 25, y + 8);

        doc.setFontSize(14);
        doc.setTextColor(...accentColor);
        doc.text('ca. ' + this.formatCHF(data.feesEstimated), 190, y + 8, { align: 'right' });

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`${texts.range}: ${this.formatCHF(data.feesMin)} – ${this.formatCHF(data.feesMax)}`, 25, y + 16);

        y += 28;

        // Kostenvorschuss
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(texts.deposit, 15, y);
        doc.setFont('helvetica', 'bold');
        doc.text(this.formatCHF(data.kostenvorschuss), 190, y, { align: 'right' });

        y += 10;

        // Anwaltskosten falls vorhanden
        if (data.lawyerFeesEstimated) {
            // Trennlinie
            doc.setDrawColor(200, 200, 200);
            doc.line(15, y, 195, y);
            y += 8;

            // Anwaltskosten
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(15, y, 180, 14, 2, 2, 'F');

            doc.setTextColor(...primaryColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(texts.lawyerFees, 25, y + 9);

            doc.setTextColor(0, 0, 0);
            doc.text('ca. ' + this.formatCHF(data.lawyerFeesEstimated), 190, y + 9, { align: 'right' });

            y += 18;

            // Parteientschädigung
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(15, y, 180, 14, 2, 2, 'F');

            doc.setTextColor(...primaryColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(texts.partyCompensation, 25, y + 9);

            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text('ca. ' + this.formatCHF(data.lawyerFeesEstimated), 190, y + 9, { align: 'right' });

            y += 20;

            // Trennlinie
            doc.setDrawColor(200, 200, 200);
            doc.line(15, y, 195, y);
            y += 8;

            // Gesamtkosten Box
            doc.setFillColor(240, 248, 255);
            doc.roundedRect(15, y, 180, 22, 3, 3, 'F');

            doc.setTextColor(...primaryColor);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(texts.totalCosts, 25, y + 8);

            doc.setFontSize(14);
            doc.setTextColor(...accentColor);
            doc.text('ca. ' + this.formatCHF(data.totalEstimated), 190, y + 8, { align: 'right' });

            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(`${texts.range}: ${this.formatCHF(data.totalMin)} – ${this.formatCHF(data.totalMax)}`, 25, y + 16);

            y += 28;
        }

        y += 5;

        // Rechtliche Grundlagen
        y = this.addSectionHeader(doc, texts.legalBasis, y, primaryColor);

        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);

        const legalLines = lang === 'fr' ? [
            'CPC Art. 95 ss.: Frais judiciaires',
            'CPC Art. 96: Tarif des frais de justice',
            'CPC Art. 114: Gratuité de la procédure'
        ] : [
            'ZPO Art. 95 ff.: Gerichtskosten',
            'ZPO Art. 96: Gebührentarif',
            'ZPO Art. 114: Unentgeltlichkeit des Verfahrens'
        ];

        legalLines.forEach(line => {
            doc.text(line, 15, y);
            y += 5;
        });

        y += 10;

        // Footer
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text(texts.disclaimer, 15, y);
        doc.text('gerichtskostenrechner.ch - ' + texts.footerInfo, 15, y + 4);

        const filename = `Gerichtskosten_${this.formatDateFile(new Date())}.pdf`;
        doc.save(filename);
    },

    addSectionHeader(doc, title, y, color) {
        doc.setFillColor(...color);
        doc.rect(15, y, 3, 7, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 22, y + 5);
        return y + 12;
    },

    addTable(doc, rows, x, y) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        rows.forEach(row => {
            doc.text(row[0], x, y);
            doc.setFont('helvetica', 'bold');
            doc.text(row[1], 190, y, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            y += 6;
        });
        return y;
    },

    formatCHF(amount) {
        return 'CHF ' + amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatDate(date, lang) {
        if (!date) return '-';
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString(lang === 'fr' ? 'fr-CH' : 'de-CH', options);
    },

    formatDateFile(date) {
        if (!date) date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    getTexts(lang) {
        if (lang === 'fr') {
            return {
                title: 'Estimation des frais de justice',
                subtitle: 'Calculateur selon le CPC suisse',
                date: 'Date',
                inputData: 'Données saisies',
                canton: 'Canton',
                disputeValue: 'Valeur litigieuse',
                procedureType: 'Type de procédure',
                result: 'Résultat',
                courtFees: 'Frais de justice:',
                range: 'Fourchette',
                lawyerFees: 'Frais d\'avocat (estimés):',
                partyCompensation: 'Indemnité de partie (en cas de perte):',
                totalCosts: 'Coûts totaux (en cas de perte):',
                deposit: 'Avance de frais (env. 50%):',
                legalBasis: 'Base légale',
                disclaimer: 'Ce document sert uniquement d\'orientation. Pas de conseil juridique.',
                footerInfo: 'Calculateur des frais de justice suisses'
            };
        }
        return {
            title: 'Gerichtskostenschätzung',
            subtitle: 'Rechner nach Schweizer ZPO',
            date: 'Datum',
            inputData: 'Eingabedaten',
            canton: 'Kanton',
            disputeValue: 'Streitwert',
            procedureType: 'Verfahrensart',
            result: 'Ergebnis',
            courtFees: 'Gerichtskosten:',
            range: 'Bandbreite',
            lawyerFees: 'Anwaltskosten (geschätzt):',
            partyCompensation: 'Parteientschädigung (bei Verlust):',
            totalCosts: 'Gesamtkosten (bei Verlust):',
            deposit: 'Kostenvorschuss (ca. 50%):',
            legalBasis: 'Rechtliche Grundlagen',
            disclaimer: 'Dieses Dokument dient nur zur Orientierung. Keine Rechtsberatung.',
            footerInfo: 'Schweizer Gerichtskostenrechner'
        };
    }
};

/**
 * Betreibungsrechner PDF Export
 */
const BetreibungPdfExport = {
    generatePDF(data, lang = 'de') {
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            console.error('jsPDF nicht geladen');
            window.print();
            return;
        }

        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF();
        const texts = this.getTexts(lang);

        const primaryColor = [63, 96, 111];
        const accentColor = [204, 92, 83];

        let y = 20;

        // Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(texts.title, 15, 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(texts.subtitle, 15, 22);

        doc.text(`${texts.date}: ${this.formatDate(new Date(), lang)}`, 195, 15, { align: 'right' });

        y = 40;

        // Eingabedaten
        doc.setTextColor(0, 0, 0);
        y = this.addSectionHeader(doc, texts.inputData, y, primaryColor);

        const inputLines = [
            [texts.claimAmount, this.formatCHF(data.forderung)]
        ];

        y = this.addTable(doc, inputLines, 15, y);
        y += 10;

        // Ergebnis
        y = this.addSectionHeader(doc, texts.result, y, primaryColor);

        // Gebühren-Tabelle
        const feeRows = [
            [texts.paymentOrder, this.formatCHF(data.zahlungsbefehl)],
            [texts.continuation, this.formatCHF(data.fortsetzung)],
            [texts.seizure, this.formatCHF(data.pfaendung)],
            [texts.realization, this.formatCHF(data.verwertung)]
        ];

        doc.setFontSize(9);
        feeRows.forEach(row => {
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(row[0], 15, y);
            doc.setFont('helvetica', 'bold');
            doc.text(row[1], 190, y, { align: 'right' });
            y += 7;
        });

        y += 5;

        // Total
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(15, y, 180, 20, 3, 3, 'F');

        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(texts.totalFees, 25, y + 12);

        doc.setFontSize(14);
        doc.setTextColor(...accentColor);
        doc.text(this.formatCHF(data.total), 190, y + 12, { align: 'right' });

        y += 28;

        // Hinweis Rechtsvorschlag
        doc.setFillColor(255, 248, 240);
        doc.roundedRect(15, y, 180, 12, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(150, 100, 50);
        doc.setFont('helvetica', 'italic');
        doc.text(texts.legalOppositionNote, 20, y + 8);

        y += 18;

        // Rechtliche Grundlagen
        y = this.addSectionHeader(doc, texts.legalBasis, y, primaryColor);

        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');

        const legalLines = lang === 'fr' ? [
            'OFP Art. 16: Taxe pour le commandement de payer',
            'OFP Art. 19: Taxe pour la réquisition de continuer',
            'OFP Art. 20: Taxe pour la saisie',
            'OFP Art. 21: Taxe pour la réalisation'
        ] : [
            'GebV SchKG Art. 16: Gebühr für Zahlungsbefehl',
            'GebV SchKG Art. 19: Gebühr für Fortsetzungsbegehren',
            'GebV SchKG Art. 20: Gebühr für Pfändung',
            'GebV SchKG Art. 21: Gebühr für Verwertung'
        ];

        legalLines.forEach(line => {
            doc.text(line, 15, y);
            y += 5;
        });

        y += 10;

        // Footer
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text(texts.disclaimer, 15, y);
        doc.text('gerichtskostenrechner.ch - ' + texts.footerInfo, 15, y + 4);

        const filename = `Betreibungskosten_${this.formatDateFile(new Date())}.pdf`;
        doc.save(filename);
    },

    addSectionHeader(doc, title, y, color) {
        doc.setFillColor(...color);
        doc.rect(15, y, 3, 7, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 22, y + 5);
        return y + 12;
    },

    addTable(doc, rows, x, y) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        rows.forEach(row => {
            doc.text(row[0], x, y);
            doc.setFont('helvetica', 'bold');
            doc.text(row[1], 190, y, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            y += 6;
        });
        return y;
    },

    formatCHF(amount) {
        return 'CHF ' + amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatDate(date, lang) {
        if (!date) return '-';
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString(lang === 'fr' ? 'fr-CH' : 'de-CH', options);
    },

    formatDateFile(date) {
        if (!date) date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    getTexts(lang) {
        if (lang === 'fr') {
            return {
                title: 'Calcul des frais de poursuite',
                subtitle: 'Selon l\'OFP (SR 281.35)',
                date: 'Date',
                inputData: 'Données saisies',
                claimAmount: 'Montant de la créance',
                result: 'Frais de poursuite',
                paymentOrder: 'Commandement de payer (Art. 16)',
                continuation: 'Réquisition de continuer (Art. 19)',
                seizure: 'Saisie (Art. 20)',
                realization: 'Réalisation (Art. 21)',
                totalFees: 'Total des frais:',
                legalOppositionNote: 'Note: En cas d\'opposition, des frais de mainlevée s\'ajoutent (env. CHF 150–300).',
                legalBasis: 'Base légale',
                disclaimer: 'Ce document sert uniquement d\'orientation. Pas de conseil juridique.',
                footerInfo: 'Calculateur des frais de poursuite suisses'
            };
        }
        return {
            title: 'Betreibungskostenberechnung',
            subtitle: 'Nach GebV SchKG (SR 281.35)',
            date: 'Datum',
            inputData: 'Eingabedaten',
            claimAmount: 'Forderungsbetrag',
            result: 'Betreibungskosten',
            paymentOrder: 'Zahlungsbefehl (Art. 16)',
            continuation: 'Fortsetzung (Art. 19)',
            seizure: 'Pfändung (Art. 20)',
            realization: 'Verwertung (Art. 21)',
            totalFees: 'Total Gebühren:',
            legalOppositionNote: 'Hinweis: Bei Rechtsvorschlag fallen zusätzlich Gerichtskosten für die Rechtsöffnung an (ca. CHF 150–300).',
            legalBasis: 'Rechtliche Grundlagen',
            disclaimer: 'Dieses Dokument dient nur zur Orientierung. Keine Rechtsberatung.',
            footerInfo: 'Schweizer Betreibungskostenrechner'
        };
    }
};

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GerichtskostenPdfExport, BetreibungPdfExport };
}
