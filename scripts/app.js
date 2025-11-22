/**
 * UI Logic for Swiss Court Fee Calculator
 * With canton selection
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('kostenForm');
    const streitwertInput = document.getElementById('streitwert');
    const verfahrensartSelect = document.getElementById('verfahrensart');
    const sachgebietSelect = document.getElementById('sachgebiet');

    // Initialize form
    initializeForm();

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateAndDisplay();
    });

    // Auto-update procedure type based on Streitwert and subject
    if (streitwertInput) {
        streitwertInput.addEventListener('blur', function() {
            formatCurrencyInput(this);
            updateVerfahrensart();
        });
    }

    if (sachgebietSelect) {
        sachgebietSelect.addEventListener('change', updateVerfahrensart);
    }

    // Show disclaimer on first visit
    checkDisclaimer();
});

/**
 * Initialize form with defaults
 */
function initializeForm() {
    const verfahrensartSelect = document.getElementById('verfahrensart');
    if (verfahrensartSelect && !verfahrensartSelect.value) {
        verfahrensartSelect.value = 'vereinfacht';
    }

    // Set default canton to ZH
    const cantonSelect = document.getElementById('canton');
    if (cantonSelect && !cantonSelect.value) {
        cantonSelect.value = 'ZH';
    }
}

/**
 * Format currency input on blur
 */
function formatCurrencyInput(input) {
    const value = parseSwissNumber(input.value);
    if (!isNaN(value) && value > 0) {
        input.value = formatNumber(value);
    }
}

/**
 * Update procedure type recommendation based on Streitwert
 */
function updateVerfahrensart() {
    const streitwertInput = document.getElementById('streitwert');
    const verfahrensartSelect = document.getElementById('verfahrensart');
    const sachgebietSelect = document.getElementById('sachgebiet');

    if (!streitwertInput || !verfahrensartSelect) return;

    const streitwert = parseSwissNumber(streitwertInput.value);
    const sachgebiet = sachgebietSelect ? sachgebietSelect.value : 'allgemein';

    if (isNaN(streitwert) || streitwert <= 0) return;

    const suggested = determineVerfahrensart(streitwert, sachgebiet);

    if (!verfahrensartSelect.dataset.userSelected) {
        verfahrensartSelect.value = suggested;
    }
}

/**
 * Calculate and display results
 */
function calculateAndDisplay() {
    const streitwertInput = document.getElementById('streitwert');
    const verfahrensartSelect = document.getElementById('verfahrensart');
    const sachgebietSelect = document.getElementById('sachgebiet');
    const cantonSelect = document.getElementById('canton');
    const includeAnwaltCheckbox = document.getElementById('includeAnwalt');
    const resultDiv = document.getElementById('result');

    // Parse inputs
    const streitwert = parseSwissNumber(streitwertInput.value);
    const verfahrensart = verfahrensartSelect.value;
    const sachgebiet = sachgebietSelect ? sachgebietSelect.value : 'allgemein';
    const canton = cantonSelect ? cantonSelect.value : 'ZH';
    const includeAnwalt = includeAnwaltCheckbox ? includeAnwaltCheckbox.checked : true;

    // Validate
    if (isNaN(streitwert) || streitwert <= 0) {
        showError(getLang() === 'fr' ?
            'Veuillez entrer une valeur litigieuse valide.' :
            'Bitte geben Sie einen gültigen Streitwert ein.');
        return;
    }

    // Check for vereinfacht > 30k
    if (verfahrensart === 'vereinfacht' && streitwert > 30000) {
        showError(getLang() === 'fr' ?
            'La procédure simplifiée est limitée à CHF 30\'000. Veuillez choisir la procédure ordinaire.' :
            'Das vereinfachte Verfahren ist auf CHF 30\'000 begrenzt. Bitte wählen Sie das ordentliche Verfahren.');
        return;
    }

    // Check for free proceedings
    if (checkFreeProceedings(streitwert, sachgebiet)) {
        displayFreeResult(streitwert, sachgebiet, canton);
        return;
    }

    // Calculate with canton
    const options = { sachgebiet, canton };
    let result;
    if (includeAnwalt) {
        result = calculateTotalProcessCosts(streitwert, verfahrensart, options);
    } else {
        result = calculateCourtFees(streitwert, verfahrensart, options);
    }

    if (result.error) {
        showError(result.error);
        return;
    }

    displayResult(result, includeAnwalt);
}

/**
 * Check if proceedings are free
 */
function checkFreeProceedings(streitwert, sachgebiet) {
    if (sachgebiet === 'arbeitsrecht' && streitwert <= 30000) {
        return true;
    }
    if (sachgebiet === 'miete') {
        return true;
    }
    return false;
}

/**
 * Display free proceedings result
 */
function displayFreeResult(streitwert, sachgebiet, canton) {
    const resultDiv = document.getElementById('result');
    const lang = getLang();

    let reason = '';
    if (sachgebiet === 'arbeitsrecht') {
        reason = lang === 'fr' ?
            'Droit du travail jusqu\'à CHF 30\'000 (art. 114 let. c CPC)' :
            'Arbeitsrecht bis CHF 30\'000 (Art. 114 lit. c ZPO)';
    } else if (sachgebiet === 'miete') {
        reason = lang === 'fr' ?
            'Bail d\'habitations et de locaux commerciaux (art. 114 let. d CPC)' :
            'Miete und Pacht von Wohn- und Geschäftsräumen (Art. 114 lit. d ZPO)';
    }

    const cantonName = typeof CANTONS !== 'undefined' && CANTONS[canton] ?
        CANTONS[canton][lang] || CANTONS[canton].de : canton;

    const html = `
        <div class="result-summary">
            <h3>${lang === 'fr' ? 'Procédure gratuite' : 'Kostenfreies Verfahren'}</h3>
            <div class="result-grid">
                <div class="result-row">
                    <span class="result-label">${lang === 'fr' ? 'Canton' : 'Kanton'}</span>
                    <span class="result-value">${cantonName}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">${lang === 'fr' ? 'Valeur litigieuse' : 'Streitwert'}</span>
                    <span class="result-value">${formatCHF(streitwert)}</span>
                </div>
                <div class="result-row highlight free">
                    <span class="result-label">${lang === 'fr' ? 'Frais de justice' : 'Gerichtskosten'}</span>
                    <span class="result-value">${lang === 'fr' ? 'Gratuit' : 'Kostenlos'}</span>
                </div>
            </div>
            <div class="result-note success">
                <i class="fas fa-check-circle"></i>
                ${reason}
            </div>
            <div class="result-note">
                <i class="fas fa-info-circle"></i>
                ${lang === 'fr' ?
                    'Attention : Les frais d\'avocat ne sont pas couverts.' :
                    'Hinweis: Anwaltskosten sind davon nicht erfasst.'}
            </div>
        </div>
    `;

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Display calculation result
 */
function displayResult(result, includeAnwalt) {
    const resultDiv = document.getElementById('result');
    const lang = getLang();

    const labels = {
        de: {
            title: 'Geschätzte Kosten',
            canton: 'Kanton',
            streitwert: 'Streitwert',
            verfahren: 'Verfahrensart',
            gerichtskosten: 'Gerichtskosten',
            anwaltskosten: 'Anwaltskosten (geschätzt)',
            parteientschaedigung: 'Parteientschädigung bei Verlust',
            gesamtkosten: 'Gesamtkosten bei Verlust',
            vorschuss: 'Kostenvorschuss (ca. 50%)',
            bandbreite: 'Bandbreite',
            estimated: 'ca.',
            disclaimer: 'Diese Berechnung dient nur zur Orientierung. Die tatsächlichen Kosten hängen vom Aufwand, der Komplexität und weiteren Faktoren ab.',
            lawyer_note: 'Anwaltskosten sind grobe Schätzungen und können je nach Anwalt und Fall stark variieren.'
        },
        fr: {
            title: 'Frais estimés',
            canton: 'Canton',
            streitwert: 'Valeur litigieuse',
            verfahren: 'Type de procédure',
            gerichtskosten: 'Frais de justice',
            anwaltskosten: 'Frais d\'avocat (estimés)',
            parteientschaedigung: 'Indemnité de partie en cas de perte',
            gesamtkosten: 'Coûts totaux en cas de perte',
            vorschuss: 'Avance de frais (env. 50%)',
            bandbreite: 'Fourchette',
            estimated: 'env.',
            disclaimer: 'Ce calcul sert uniquement d\'orientation. Les frais effectifs dépendent de la charge de travail, de la complexité et d\'autres facteurs.',
            lawyer_note: 'Les frais d\'avocat sont des estimations approximatives et peuvent varier considérablement.'
        }
    };

    const l = labels[lang] || labels.de;
    const verfahrensLabels = getVerfahrensartLabels(lang);
    const cantonName = result.cantonName ? (result.cantonName[lang] || result.cantonName.de) : result.canton;

    let html = `
        <div class="result-actions">
            <button type="button" onclick="printResult()" class="print-button">
                <i class="fas fa-print"></i> ${lang === 'fr' ? 'Imprimer' : 'Drucken'}
            </button>
        </div>
        <div class="result-summary">
            <h3>${l.title}</h3>
            <div class="result-grid">
                <div class="result-row">
                    <span class="result-label">${l.canton}</span>
                    <span class="result-value">${cantonName}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">${l.streitwert}</span>
                    <span class="result-value">${formatCHF(result.streitwert)}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">${l.verfahren}</span>
                    <span class="result-value">${verfahrensLabels[result.verfahrensart] || result.verfahrensart}</span>
                </div>
                <div class="result-divider"></div>
                <div class="result-row highlight">
                    <span class="result-label">${l.gerichtskosten}</span>
                    <span class="result-value">${l.estimated} ${formatCHF(result.fees.estimated)}</span>
                </div>
                <div class="result-row sub">
                    <span class="result-label">${l.bandbreite}</span>
                    <span class="result-value">${formatCHF(result.fees.min)} – ${formatCHF(result.fees.max)}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">${l.vorschuss}</span>
                    <span class="result-value">${formatCHF(result.kostenvorschuss)}</span>
                </div>
    `;

    if (includeAnwalt && result.lawyerFees) {
        html += `
                <div class="result-divider"></div>
                <div class="result-row highlight">
                    <span class="result-label">${l.anwaltskosten}</span>
                    <span class="result-value">${l.estimated} ${formatCHF(result.lawyerFees.estimated)}</span>
                </div>
                <div class="result-row sub">
                    <span class="result-label">${l.parteientschaedigung}</span>
                    <span class="result-value">${l.estimated} ${formatCHF(result.lawyerFees.estimated)}</span>
                </div>
                <div class="result-divider"></div>
                <div class="result-row total">
                    <span class="result-label">${l.gesamtkosten}</span>
                    <span class="result-value">${l.estimated} ${formatCHF(result.totalCosts.estimated)}</span>
                </div>
                <div class="result-row sub">
                    <span class="result-label">${l.bandbreite}</span>
                    <span class="result-value">${formatCHF(result.totalCosts.min)} – ${formatCHF(result.totalCosts.max)}</span>
                </div>
        `;
    }

    html += `
            </div>
            <div class="result-note warning">
                <i class="fas fa-exclamation-triangle"></i>
                ${l.disclaimer}
            </div>
    `;

    if (includeAnwalt && result.lawyerFees) {
        html += `
            <div class="result-note">
                <i class="fas fa-info-circle"></i>
                ${l.lawyer_note}
            </div>
        `;
    }

    html += `</div>`;

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Show error message
 */
function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="result-error">
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        </div>
    `;
    resultDiv.style.display = 'block';
}

/**
 * Get current language
 */
function getLang() {
    const html = document.documentElement;
    return html.lang === 'fr' ? 'fr' : 'de';
}

/**
 * Print result
 */
function printResult() {
    const lang = getLang();
    const printDate = document.getElementById('printDate');
    if (printDate) {
        const now = new Date();
        const dateStr = now.toLocaleDateString(lang === 'fr' ? 'fr-CH' : 'de-CH');
        const timeStr = now.toLocaleTimeString(lang === 'fr' ? 'fr-CH' : 'de-CH', { hour: '2-digit', minute: '2-digit' });
        printDate.textContent = lang === 'fr' ?
            `Calculé le ${dateStr} à ${timeStr}` :
            `Berechnet am ${dateStr} um ${timeStr}`;
    }
    window.print();
}

/**
 * Check and show disclaimer
 */
function checkDisclaimer() {
    const accepted = localStorage.getItem('gerichtskosten-disclaimer');
    if (!accepted) {
        const modal = document.getElementById('disclaimerModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
}

/**
 * Accept disclaimer
 */
function acceptDisclaimer() {
    localStorage.setItem('gerichtskosten-disclaimer', 'accepted');
    const modal = document.getElementById('disclaimerModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Mark verfahrensart as user-selected
 */
function markVerfahrensartSelected() {
    const select = document.getElementById('verfahrensart');
    if (select) {
        select.dataset.userSelected = 'true';
    }
}
