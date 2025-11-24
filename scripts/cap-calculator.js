/**
 * CAP Schadentool - Berechnungslogik
 * Berechnet Prozesskosten basierend auf kantonalen Gebührentabellen
 */

const CAPCalculator = {
    /**
     * Interpoliert einen Wert zwischen zwei Streitwert-Stufen
     */
    interpolate(streitwert, table, field) {
        if (!table || table.length === 0) return 0;

        // Finde die beiden relevanten Einträge
        let lower = table[0];
        let upper = table[table.length - 1];

        for (let i = 0; i < table.length; i++) {
            if (table[i].streitwert <= streitwert) {
                lower = table[i];
            }
            if (table[i].streitwert >= streitwert) {
                upper = table[i];
                break;
            }
        }

        // Wenn exakter Treffer oder gleiche Grenzen
        if (lower.streitwert === upper.streitwert || streitwert <= lower.streitwert) {
            return lower[field] || 0;
        }

        if (streitwert >= upper.streitwert) {
            return upper[field] || 0;
        }

        // Lineare Interpolation
        const ratio = (streitwert - lower.streitwert) / (upper.streitwert - lower.streitwert);
        const lowerVal = lower[field] || 0;
        const upperVal = upper[field] || 0;

        return Math.round(lowerVal + ratio * (upperVal - lowerVal));
    },

    /**
     * Berechnet die Schlichtungsgebühr
     */
    getSchlichtungsgebuehr(streitwert, kanton) {
        const kantonData = CAP_DATA.kantone[kanton];
        if (!kantonData || !kantonData.schlichtung) return 0;

        for (const stufe of kantonData.schlichtung) {
            if (stufe.bis === null || streitwert <= stufe.bis) {
                return stufe.gebuehr;
            }
        }
        return kantonData.schlichtung[kantonData.schlichtung.length - 1].gebuehr;
    },

    /**
     * Berechnet Gerichtskosten für eine Instanz
     */
    getGerichtskosten(streitwert, kanton, instanz, ausschoepfung) {
        const kantonData = CAP_DATA.kantone[kanton];
        if (!kantonData) return { min: 0, mittel: 0, max: 0 };

        const table = kantonData.gerichtskosten[instanz];
        if (!table) return { min: 0, mittel: 0, max: 0 };

        const min = this.interpolate(streitwert, table, 'min');
        const mittel = this.interpolate(streitwert, table, 'mittel');
        const max = this.interpolate(streitwert, table, 'max');

        // Ausschöpfung anwenden (0-100%)
        const faktor = ausschoepfung / 100;
        const berechnet = Math.round(min + faktor * (max - min));

        return { min, mittel, max, berechnet };
    },

    /**
     * Berechnet Anwaltshonorar für eine Instanz
     */
    getAnwaltshonorar(streitwert, kanton, instanz, ausschoepfung) {
        const kantonData = CAP_DATA.kantone[kanton];
        if (!kantonData) return { min: 0, mittel: 0, max: 0 };

        const table = kantonData.anwaltshonorare[instanz];
        if (!table) return { min: 0, mittel: 0, max: 0 };

        const min = this.interpolate(streitwert, table, 'min');
        const mittel = this.interpolate(streitwert, table, 'mittel');
        const max = this.interpolate(streitwert, table, 'max');

        const faktor = ausschoepfung / 100;
        const berechnet = Math.round(min + faktor * (max - min));

        return { min, mittel, max, berechnet };
    },

    /**
     * Berechnet Ausschöpfungsfaktor aus Bemessungskriterien
     * Zeitaufwand + Bedeutung + Schwierigkeit = 0-24 Punkte = 0-100%
     */
    berechneAusschoepfung(zeitaufwand, bedeutung, schwierigkeit) {
        const summe = (zeitaufwand || 0) + (bedeutung || 0) + (schwierigkeit || 0);
        return Math.round((summe / 24) * 100);
    },

    /**
     * Hauptberechnung - alle Kosten
     */
    berechneAlles(params) {
        const {
            kanton,
            streitwert1,
            streitwert2,
            streitwert3,
            verfahrensart,
            rechtsgebiet,
            schlichtungKostenfrei, // Art. 114 ZPO
            zeitaufwand,
            bedeutung,
            schwierigkeit,
            erfolgsaussichten,
            // Aussergerichtlich
            stundenAnwalt,
            stundenansatz,
            expertisen,
            schlichtung: inkludiereSchlichtung,
            betreibung,
            weitereKosten,
            // Instanzen aktiv
            instanz1Aktiv,
            instanz2Aktiv,
            instanz3Aktiv,
            // Zusätzliche Honorare
            honorarVereinbarung
        } = params;

        const meta = CAP_DATA.meta;
        const ausschoepfung = this.berechneAusschoepfung(zeitaufwand, bedeutung, schwierigkeit);
        const erfolg = CAP_DATA.erfolgsaussichten.find(e => e.wert === erfolgsaussichten);
        const erfolgsFaktor = erfolg ? erfolg.faktor : 1;

        const result = {
            kanton,
            kantonName: CAP_DATA.kantone[kanton]?.name || { de: kanton, fr: kanton },
            ausschoepfung,
            erfolgsFaktor,

            // Aussergerichtlich
            aussergerichtlich: {
                honorarAnwalt: 0,
                spesen: 0,
                mwst: 0,
                expertisen: expertisen || 0,
                schlichtung: 0,
                betreibung: betreibung || 0,
                weitereKosten: weitereKosten || 0,
                total: 0
            },

            // 1. Instanz
            instanz1: {
                aktiv: instanz1Aktiv,
                streitwert: streitwert1,
                gerichtskosten: { min: 0, mittel: 0, max: 0, berechnet: 0 },
                gerichtskostenEffektiv: 0,
                gerichtskostenFaktor: 1,
                anwaltshonorar: { min: 0, mittel: 0, max: 0, berechnet: 0 },
                honorarVereinbarung: honorarVereinbarung || 0,
                spesen: 0,
                mwst: 0,
                pke: 0,
                total: 0
            },

            // 2. Instanz
            instanz2: {
                aktiv: instanz2Aktiv,
                streitwert: streitwert2,
                gerichtskosten: { min: 0, mittel: 0, max: 0, berechnet: 0 },
                gerichtskostenEffektiv: 0,
                gerichtskostenFaktor: 1,
                anwaltshonorar: { min: 0, mittel: 0, max: 0, berechnet: 0 },
                spesen: 0,
                mwst: 0,
                pke: 0,
                total: 0
            },

            // 3. Instanz (Bundesgericht)
            instanz3: {
                aktiv: instanz3Aktiv,
                streitwert: streitwert3,
                gerichtskosten: { min: 0, mittel: 0, max: 0, berechnet: 0 },
                gerichtskostenEffektiv: 0,
                gerichtskostenFaktor: 1,
                anwaltshonorar: { min: 0, mittel: 0, max: 0, berechnet: 0 },
                spesen: 0,
                mwst: 0,
                pke: 0,
                total: 0
            },

            // Totale
            gesamtAussergerichtlich: 0,
            gesamtInstanz1: 0,
            gesamtInstanz2: 0,
            gesamtInstanz3: 0,
            gesamtTotal: 0
        };

        // === AUSSERGERICHTLICH ===
        if (stundenAnwalt > 0) {
            result.aussergerichtlich.honorarAnwalt = stundenAnwalt * (stundenansatz || meta.stundensatz_anwalt_default);
            result.aussergerichtlich.spesen = Math.round(result.aussergerichtlich.honorarAnwalt * meta.spesen_prozent);
            result.aussergerichtlich.mwst = Math.round((result.aussergerichtlich.honorarAnwalt + result.aussergerichtlich.spesen) * meta.mwst);
        }

        if (inkludiereSchlichtung) {
            // Art. 114 ZPO: Kostenfreies Schlichtungsverfahren bei bestimmten Rechtsgebieten
            if (schlichtungKostenfrei) {
                result.aussergerichtlich.schlichtung = 0;
            } else {
                result.aussergerichtlich.schlichtung = this.getSchlichtungsgebuehr(streitwert1, kanton);
            }
        }

        result.aussergerichtlich.total =
            result.aussergerichtlich.honorarAnwalt +
            result.aussergerichtlich.spesen +
            result.aussergerichtlich.mwst +
            result.aussergerichtlich.expertisen +
            result.aussergerichtlich.schlichtung +
            result.aussergerichtlich.betreibung +
            result.aussergerichtlich.weitereKosten;

        // Gerichtskostenfaktor basierend auf Erfolgsaussichten (gem. CAP Excel)
        // Optimistisch (Vergleich): 50% Gerichtskosten, 0% PKE
        // Neutral/Pessimistisch: 100% Gerichtskosten
        // Pessimistisch (Totalverlust): zusätzlich 100% PKE
        const gerichtskostenFaktor = erfolgsaussichten === 'optimistisch' ? 0.5 : 1.0;

        // === 1. INSTANZ ===
        if (instanz1Aktiv && streitwert1 > 0) {
            const instanzTyp = verfahrensart === 'summarisch' ? 'summarisch' : 'ordentlich_1inst';

            result.instanz1.gerichtskosten = this.getGerichtskosten(streitwert1, kanton, 'ordentlich_1inst', ausschoepfung);
            result.instanz1.anwaltshonorar = this.getAnwaltshonorar(streitwert1, kanton, instanzTyp, ausschoepfung);

            const honorarTotal = result.instanz1.anwaltshonorar.berechnet + (honorarVereinbarung || 0);
            result.instanz1.spesen = Math.round(honorarTotal * meta.spesen_prozent);
            result.instanz1.mwst = Math.round((honorarTotal + result.instanz1.spesen) * meta.mwst);

            // Parteikostenentschädigung (bei Verlust zu zahlen)
            result.instanz1.pke = result.instanz1.anwaltshonorar.berechnet;

            // Gerichtskosten mit Faktor (50% bei Optimistisch/Vergleich)
            result.instanz1.gerichtskostenEffektiv = Math.round(result.instanz1.gerichtskosten.berechnet * gerichtskostenFaktor);
            result.instanz1.gerichtskostenFaktor = gerichtskostenFaktor;

            result.instanz1.total =
                result.instanz1.gerichtskostenEffektiv +
                honorarTotal +
                result.instanz1.spesen +
                result.instanz1.mwst +
                (erfolgsFaktor === 1 ? result.instanz1.pke : 0); // PKE nur bei Totalverlust
        }

        // === 2. INSTANZ ===
        if (instanz2Aktiv && streitwert2 > 0) {
            result.instanz2.gerichtskosten = this.getGerichtskosten(streitwert2, kanton, 'berufung_2inst', ausschoepfung);
            result.instanz2.anwaltshonorar = this.getAnwaltshonorar(streitwert2, kanton, 'berufung_2inst', ausschoepfung);

            const honorarTotal = result.instanz2.anwaltshonorar.berechnet;
            result.instanz2.spesen = Math.round(honorarTotal * meta.spesen_prozent);
            result.instanz2.mwst = Math.round((honorarTotal + result.instanz2.spesen) * meta.mwst);
            result.instanz2.pke = result.instanz2.anwaltshonorar.berechnet;

            // Gerichtskosten mit Faktor (50% bei Optimistisch/Vergleich)
            result.instanz2.gerichtskostenEffektiv = Math.round(result.instanz2.gerichtskosten.berechnet * gerichtskostenFaktor);
            result.instanz2.gerichtskostenFaktor = gerichtskostenFaktor;

            result.instanz2.total =
                result.instanz2.gerichtskostenEffektiv +
                honorarTotal +
                result.instanz2.spesen +
                result.instanz2.mwst +
                (erfolgsFaktor === 1 ? result.instanz2.pke : 0);
        }

        // === 3. INSTANZ (Bundesgericht) ===
        if (instanz3Aktiv && streitwert3 > 0) {
            result.instanz3.gerichtskosten = this.getGerichtskosten(streitwert3, kanton, 'bundesgericht', ausschoepfung);
            result.instanz3.anwaltshonorar = this.getAnwaltshonorar(streitwert3, kanton, 'bundesgericht', ausschoepfung);

            const honorarTotal = result.instanz3.anwaltshonorar.berechnet;
            result.instanz3.spesen = Math.round(honorarTotal * meta.spesen_prozent);
            result.instanz3.mwst = Math.round((honorarTotal + result.instanz3.spesen) * meta.mwst);
            result.instanz3.pke = result.instanz3.anwaltshonorar.berechnet;

            // Gerichtskosten mit Faktor (50% bei Optimistisch/Vergleich)
            result.instanz3.gerichtskostenEffektiv = Math.round(result.instanz3.gerichtskosten.berechnet * gerichtskostenFaktor);
            result.instanz3.gerichtskostenFaktor = gerichtskostenFaktor;

            result.instanz3.total =
                result.instanz3.gerichtskostenEffektiv +
                honorarTotal +
                result.instanz3.spesen +
                result.instanz3.mwst +
                (erfolgsFaktor === 1 ? result.instanz3.pke : 0);
        }

        // === GESAMTTOTALE ===
        result.gesamtAussergerichtlich = result.aussergerichtlich.total;
        result.gesamtInstanz1 = result.gesamtAussergerichtlich + result.instanz1.total;
        result.gesamtInstanz2 = result.gesamtInstanz1 + result.instanz2.total;
        result.gesamtInstanz3 = result.gesamtInstanz2 + result.instanz3.total;

        // Gesamttotal je nach aktiven Instanzen
        if (instanz3Aktiv) {
            result.gesamtTotal = result.gesamtInstanz3;
        } else if (instanz2Aktiv) {
            result.gesamtTotal = result.gesamtInstanz2;
        } else if (instanz1Aktiv) {
            result.gesamtTotal = result.gesamtInstanz1;
        } else {
            result.gesamtTotal = result.gesamtAussergerichtlich;
        }

        return result;
    },

    /**
     * Formatiert einen Betrag als CHF
     */
    formatCHF(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return 'CHF 0.00';
        return 'CHF ' + amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    /**
     * Formatiert ein Datum
     */
    formatDate(date) {
        return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
};

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAPCalculator;
}
