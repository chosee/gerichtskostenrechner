/**
 * Shared Utilities for Swiss Legal Tools
 * - URL Parameters
 * - Copy to Clipboard
 * - Dark Mode
 */

// ============================================
// URL PARAMETERS
// ============================================

const UrlParams = {
    /**
     * Get all URL parameters as object
     */
    getAll() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    /**
     * Get single URL parameter
     */
    get(key) {
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
    },

    /**
     * Set URL parameters without page reload
     */
    set(paramsObj) {
        const params = new URLSearchParams(window.location.search);
        for (const [key, value] of Object.entries(paramsObj)) {
            if (value !== null && value !== undefined && value !== '') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        }
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
    },

    /**
     * Generate shareable URL with current parameters
     */
    getShareUrl(paramsObj) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(paramsObj)) {
            if (value !== null && value !== undefined && value !== '') {
                params.set(key, value);
            }
        }
        return window.location.origin + window.location.pathname + '?' + params.toString();
    },

    /**
     * Load form values from URL parameters
     */
    loadToForm(mappings) {
        const params = this.getAll();
        for (const [paramKey, elementId] of Object.entries(mappings)) {
            if (params[paramKey]) {
                const element = document.getElementById(elementId);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = params[paramKey] === 'true' || params[paramKey] === '1';
                    } else {
                        element.value = params[paramKey];
                    }
                    // Trigger change event
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    }
};

// ============================================
// COPY TO CLIPBOARD
// ============================================

const ClipboardUtils = {
    /**
     * Copy text to clipboard with fallback
     */
    async copy(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (e) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    },

    /**
     * Show copy feedback on button
     */
    showFeedback(button, success = true) {
        const originalHTML = button.innerHTML;
        const lang = document.documentElement.lang || 'de';

        if (success) {
            button.innerHTML = lang === 'fr'
                ? '<i class="fas fa-check"></i> Copié!'
                : '<i class="fas fa-check"></i> Kopiert!';
            button.classList.add('copy-success');
        } else {
            button.innerHTML = lang === 'fr'
                ? '<i class="fas fa-times"></i> Erreur'
                : '<i class="fas fa-times"></i> Fehler';
            button.classList.add('copy-error');
        }

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copy-success', 'copy-error');
        }, 2000);
    },

    /**
     * Create copy button element
     */
    createButton(getText, lang = 'de') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary copy-btn';
        button.innerHTML = lang === 'fr'
            ? '<i class="fas fa-copy"></i> Copier'
            : '<i class="fas fa-copy"></i> Kopieren';

        button.addEventListener('click', async () => {
            const text = typeof getText === 'function' ? getText() : getText;
            const success = await this.copy(text);
            this.showFeedback(button, success);
        });

        return button;
    }
};

// ============================================
// DARK MODE
// ============================================

const DarkMode = {
    STORAGE_KEY: 'darkMode',

    /**
     * Initialize dark mode (call on page load)
     */
    init() {
        // Check saved preference or system preference
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved === 'true' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.enable(false);
        }

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem(this.STORAGE_KEY) === null) {
                if (e.matches) {
                    this.enable(false);
                } else {
                    this.disable(false);
                }
            }
        });
    },

    /**
     * Enable dark mode
     */
    enable(save = true) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, 'true');
        }
        this.updateToggleButton();
    },

    /**
     * Disable dark mode
     */
    disable(save = true) {
        document.documentElement.removeAttribute('data-theme');
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, 'false');
        }
        this.updateToggleButton();
    },

    /**
     * Toggle dark mode
     */
    toggle() {
        if (this.isEnabled()) {
            this.disable();
        } else {
            this.enable();
        }
    },

    /**
     * Check if dark mode is enabled
     */
    isEnabled() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    },

    /**
     * Update toggle button icon
     */
    updateToggleButton() {
        const buttons = document.querySelectorAll('.dark-mode-toggle');
        buttons.forEach(button => {
            const icon = button.querySelector('i');
            if (icon) {
                if (this.isEnabled()) {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        });
    },

    /**
     * Create toggle button element
     */
    createButton() {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dark-mode-toggle';
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.innerHTML = this.isEnabled()
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';

        button.addEventListener('click', () => this.toggle());

        return button;
    }
};

// ============================================
// SHARE URL
// ============================================

const ShareUtils = {
    /**
     * Copy share URL to clipboard
     */
    async shareUrl(paramsObj, button) {
        const url = UrlParams.getShareUrl(paramsObj);
        const success = await ClipboardUtils.copy(url);

        if (button) {
            const originalHTML = button.innerHTML;
            const lang = document.documentElement.lang || 'de';

            if (success) {
                button.innerHTML = lang === 'fr'
                    ? '<i class="fas fa-check"></i> Lien copié!'
                    : '<i class="fas fa-check"></i> Link kopiert!';
            }

            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 2000);
        }

        return success;
    },

    /**
     * Create share button element
     */
    createButton(getParams, lang = 'de') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary share-btn';
        button.innerHTML = lang === 'fr'
            ? '<i class="fas fa-link"></i> Partager'
            : '<i class="fas fa-link"></i> Link teilen';

        button.addEventListener('click', async () => {
            const params = typeof getParams === 'function' ? getParams() : getParams;
            await this.shareUrl(params, button);
        });

        return button;
    }
};

// Auto-initialize dark mode when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DarkMode.init());
} else {
    DarkMode.init();
}
