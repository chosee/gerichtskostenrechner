#!/usr/bin/env node
/**
 * Build script for creating offline HTML bundles for gerichtskostenrechner.ch tools
 * Usage: node build-all-offline.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUNDLE_DIR = __dirname;
const PROJECT_DIR = path.dirname(BUNDLE_DIR);
const OUTPUT_DIR = path.join(PROJECT_DIR, 'downloads');

// Tool configurations
const TOOLS = [
    {
        id: 'gerichtskostenrechner',
        name: { de: 'Gerichtskostenrechner', fr: 'Calculateur de frais judiciaires' },
        htmlFile: { de: 'de/index.html', fr: 'fr/index.html' },
        scripts: ['scripts/utils.js', 'scripts/calculations.js', 'scripts/app.js', 'scripts/pdf-export.js'],
        title: { de: 'Schweizer Gerichtskostenrechner (Offline-Version)', fr: 'Calculateur de frais judiciaires suisse (Version hors ligne)' }
    },
    {
        id: 'betreibungsrechner',
        name: { de: 'Betreibungsrechner', fr: 'Calculateur de poursuite' },
        htmlFile: { de: 'de/betreibung.html', fr: 'fr/betreibung.html' },
        scripts: ['scripts/utils.js', 'scripts/pdf-export.js'],
        title: { de: 'Schweizer Betreibungsrechner (Offline-Version)', fr: 'Calculateur de poursuite suisse (Version hors ligne)' }
    },
    {
        id: 'prozesskostenrisiko',
        name: { de: 'Prozesskostenrisiko', fr: 'Risque de frais de procès' },
        htmlFile: { de: 'de/prozesskostenrisiko.html', fr: 'fr/prozesskostenrisiko.html' },
        scripts: ['scripts/calculations.js', 'scripts/utils.js'],
        title: { de: 'Prozesskostenrisiko-Rechner (Offline-Version)', fr: 'Calculateur de risque de frais (Version hors ligne)' }
    },
    {
        id: 'cap-tool',
        name: { de: 'CAP-Tool', fr: 'Outil CAP' },
        htmlFile: { de: 'de/cap-tool.html', fr: 'fr/cap-tool.html' },
        scripts: ['scripts/cap-data.js', 'scripts/cap-calculator.js', 'scripts/cap-pdf.js'],
        title: { de: 'CAP Schadentool (Offline-Version)', fr: 'Outil CAP dommages (Version hors ligne)' }
    }
];

const LANGUAGES = ['de', 'fr'];

// Read and convert fonts to base64
function getFontBase64(fontFile) {
    const fontPath = path.join(BUNDLE_DIR, fontFile);
    if (!fs.existsSync(fontPath)) {
        console.warn(`  Warning: Font file not found: ${fontFile}`);
        return null;
    }
    return fs.readFileSync(fontPath).toString('base64');
}

function readFile(relativePath) {
    const filePath = path.join(PROJECT_DIR, relativePath);
    if (!fs.existsSync(filePath)) {
        console.warn(`  Warning: File not found: ${relativePath}`);
        return '';
    }
    return fs.readFileSync(filePath, 'utf8');
}

function readBundleFile(filename) {
    const filePath = path.join(BUNDLE_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`  Warning: Bundle file not found: ${filename}`);
        return '';
    }
    return fs.readFileSync(filePath, 'utf8');
}

function generateFontCSS() {
    const regularBase64 = getFontBase64('economica-regular.ttf');
    const boldBase64 = getFontBase64('economica-bold.ttf');
    if (!regularBase64 || !boldBase64) return '/* Fonts not available */';
    return `
        @font-face {
            font-family: 'Economica';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('data:font/truetype;base64,${regularBase64}') format('truetype');
        }
        @font-face {
            font-family: 'Economica';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('data:font/truetype;base64,${boldBase64}') format('truetype');
        }
    `;
}

function generateFontAwesomeCSS() {
    return `
        .fa, .fas, .fab { display: inline-block; font-style: normal; }
        .fa-moon::before { content: "\\1F319"; }
        .fa-sun::before { content: "\\2600\\FE0F"; }
        .fa-calculator::before { content: "\\1F9EE"; }
        .fa-gavel::before { content: "\\2696\\FE0F"; }
        .fa-exclamation-triangle::before { content: "\\26A0\\FE0F"; }
        .fa-file-pdf::before { content: "\\1F4C4"; }
        .fa-external-link-alt::before { content: "\\2197"; font-size: 0.8em; }
        .fa-check::before { content: "\\2713"; }
        .fa-times::before { content: "\\2715"; }
        .fa-info-circle::before { content: "\\2139\\FE0F"; }
        .fa-balance-scale::before { content: "\\2696"; }
        .fa-money-bill::before { content: "\\1F4B5"; }
        .fa-coins::before { content: "\\1FA99"; }
        .fa-calendar-day::before { content: "\\1F4C5"; }
        .fa-chart-line::before { content: "\\1F4C8"; }
        .fa-percent::before { content: "%"; }
        .fa-chevron-right::before { content: "\\203A"; }
        .fa-chevron-down::before { content: "\\2304"; }
        .fa-chevron-up::before { content: "\\2303"; }
        .fa-download::before { content: "\\2B07"; }
        .fa-print::before { content: "\\1F5A8"; }
        .fa-copy::before { content: "\\1F4CB"; }
        .fa-trash::before { content: "\\1F5D1"; }
        .fa-plus::before { content: "+"; }
        .fa-minus::before { content: "-"; }
        .fa-edit::before { content: "\\270F"; }
        .fa-save::before { content: "\\1F4BE"; }
    `;
}

const BANNER_TEXT = {
    de: { title: 'Offline-Version', subtitle: 'Keine Internetverbindung erforderlich', date: 'Stand' },
    fr: { title: 'Version hors ligne', subtitle: 'Aucune connexion Internet requise', date: 'État' }
};

function buildOfflineHTML(tool, lang) {
    console.log(`  Building ${tool.id} (${lang})...`);

    const htmlTemplate = readFile(tool.htmlFile[lang]);
    if (!htmlTemplate) {
        console.error(`  ERROR: Could not read HTML template for ${tool.id} (${lang})`);
        return null;
    }

    const stylesCSS = readFile('css/styles.css');
    const flatpickrCSS = readBundleFile('flatpickr.min.css');
    const flatpickrJS = readBundleFile('flatpickr.min.js');
    const jspdfJS = readBundleFile('jspdf.min.js');

    let scriptsJS = '';
    for (const script of tool.scripts) {
        scriptsJS += readFile(script) + '\n';
    }

    const fontCSS = generateFontCSS();
    const fontAwesomeCSS = generateFontAwesomeCSS();

    // Extract inline styles from template
    let inlineStyles = '';
    const styleMatches = htmlTemplate.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
        for (const match of styleMatches) {
            const content = match.replace(/<\/?style[^>]*>/gi, '');
            inlineStyles += content + '\n';
        }
    }

    const combinedCSS = `
        ${fontCSS}
        ${fontAwesomeCSS}
        ${flatpickrCSS}
        ${stylesCSS}
        ${inlineStyles}
        .offline-banner {
            background: linear-gradient(135deg, #2d5a3d 0%, #4a7c59 100%);
            color: white;
            padding: 10px 20px;
            font-size: 0.9rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            border-radius: 8px;
        }
        .offline-banner .version { opacity: 0.8; font-size: 0.8rem; }
    `;

    // Extract inline scripts from template
    let inlineScripts = '';
    const scriptMatches = htmlTemplate.match(/<script>[\s\S]*?<\/script>/gi);
    if (scriptMatches) {
        for (const match of scriptMatches) {
            const content = match.replace(/<\/?script>/gi, '');
            if (content.trim() && !content.includes('@context')) {
                inlineScripts += content + '\n';
            }
        }
    }

    const combinedJS = `
        ${jspdfJS}
        ${flatpickrJS}
        ${scriptsJS}
        ${inlineScripts}
    `;

    const banner = BANNER_TEXT[lang];
    const dateStr = new Date().toLocaleDateString(lang === 'de' ? 'de-CH' : 'fr-CH');

    let offlineHTML = `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tool.title[lang]}</title>
    <style>
${combinedCSS}
    </style>
</head>
<body>
`;

    const bodyMatch = htmlTemplate.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
        let bodyContent = bodyMatch[1];

        // Remove external scripts and links
        bodyContent = bodyContent.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/gi, '');
        bodyContent = bodyContent.replace(/<script>[\s\S]*?<\/script>/gi, '');
        bodyContent = bodyContent.replace(/<link[^>]*href="[^"]*fonts[^"]*"[^>]*>/gi, '');
        bodyContent = bodyContent.replace(/<link[^>]*href="[^"]*flatpickr[^"]*"[^>]*>/gi, '');
        bodyContent = bodyContent.replace(/<link[^>]*href="[^"]*font-awesome[^"]*"[^>]*>/gi, '');
        bodyContent = bodyContent.replace(/<link[^>]*rel="preconnect"[^>]*>/gi, '');

        // Remove language switcher and navigation
        bodyContent = bodyContent.replace(/<div class="language-switcher">[\s\S]*?<\/div>\s*<\/div>/gi, '</div>');
        bodyContent = bodyContent.replace(/<nav class="tool-nav">[\s\S]*?<\/nav>/gi, '');

        // Fix paths
        bodyContent = bodyContent.replace(/href="\.\.\/de\//g, 'href="#');
        bodyContent = bodyContent.replace(/href="\.\.\/fr\//g, 'href="#');
        bodyContent = bodyContent.replace(/src="\.\.\/favicon\.svg"/g, 'src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E%E2%9A%96%3C/text%3E%3C/svg%3E"');

        // Add offline banner at the start
        const bannerHTML = `
    <div class="offline-banner">
        <span>${banner.title} – ${banner.subtitle}</span>
        <span class="version">${banner.date}: ${dateStr}</span>
    </div>
`;
        // Insert after opening body tag or container
        if (bodyContent.includes('<div class="container">')) {
            bodyContent = bodyContent.replace('<div class="container">', '<div class="container">' + bannerHTML);
        } else if (bodyContent.includes('<div class="cap-container">')) {
            bodyContent = bodyContent.replace('<div class="cap-container">', '<div class="cap-container">' + bannerHTML);
        } else {
            bodyContent = bannerHTML + bodyContent;
        }

        offlineHTML += bodyContent;
    }

    offlineHTML += `
    <script>
${combinedJS}
    </script>
</body>
</html>`;

    return offlineHTML;
}

function createZip(htmlPath, zipPath) {
    try {
        execSync(`cd "${path.dirname(htmlPath)}" && zip -j "${zipPath}" "${path.basename(htmlPath)}"`, { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.error(`  ERROR creating ZIP: ${error.message}`);
        return false;
    }
}

function buildAll() {
    console.log('Building offline bundles for gerichtskostenrechner.ch tools...\n');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const results = [];

    for (const tool of TOOLS) {
        for (const lang of LANGUAGES) {
            const htmlFilename = `${tool.id}-offline-${lang}.html`;
            const zipFilename = `${tool.id}-offline-${lang}.zip`;
            const htmlPath = path.join(OUTPUT_DIR, htmlFilename);
            const zipPath = path.join(OUTPUT_DIR, zipFilename);

            const html = buildOfflineHTML(tool, lang);
            if (!html) {
                results.push({ tool: tool.id, lang, success: false });
                continue;
            }

            fs.writeFileSync(htmlPath, html, 'utf8');
            const zipSuccess = createZip(htmlPath, zipPath);

            if (zipSuccess) {
                const zipStats = fs.statSync(zipPath);
                console.log(`  ✅ ${zipFilename} (${(zipStats.size / 1024).toFixed(0)} KB)`);
                results.push({ tool: tool.id, lang, success: true, zipSize: zipStats.size });
                fs.unlinkSync(htmlPath);
            } else {
                results.push({ tool: tool.id, lang, success: false });
            }
        }
        console.log('');
    }

    const successful = results.filter(r => r.success);
    console.log('═'.repeat(50));
    console.log(`Build complete: ${successful.length}/${results.length} bundles created`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

    return results;
}

try {
    buildAll();
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
