document.addEventListener('DOMContentLoaded', function() {
    const globalLangCards = document.querySelectorAll('.option-card[data-lang]');
    const globalLangRadios = document.querySelectorAll('input[name="global-lang"]');
    const resetBtn = document.getElementById('reset-btn');
    const statusMsg = document.getElementById('status-msg');

    const siteSettings = {
        trade: { lang: document.getElementById('trade-lang'), enabled: document.getElementById('trade-enabled') },
        ninja: { lang: document.getElementById('ninja-lang'), enabled: document.getElementById('ninja-enabled') },
        filterblade: { lang: document.getElementById('filterblade-lang'), enabled: document.getElementById('filterblade-enabled') },
        mobalytics: { lang: document.getElementById('mobalytics-lang'), enabled: document.getElementById('mobalytics-enabled') },
        maxroll: { lang: document.getElementById('maxroll-lang'), enabled: document.getElementById('maxroll-enabled') }
    };

    const ninjaTradeRealm = document.getElementById('ninja-trade-realm');

    function updateGlobalLangUI(lang) {
        globalLangCards.forEach(card => {
            if (card.dataset.lang === lang) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        globalLangRadios.forEach(radio => {
            radio.checked = (radio.value === lang);
        });
    }

    function updateSiteLangUI(settings) {
        Object.keys(siteSettings).forEach(site => {
            const siteData = settings[site] || {};
            if (siteSettings[site].lang) {
                siteSettings[site].lang.value = siteData.lang || '';
            }
            if (siteSettings[site].enabled) {
                siteSettings[site].enabled.checked = siteData.enabled !== false;
            }
        });
    }

    function showStatus(message, isError) {
        statusMsg.textContent = message;
        statusMsg.style.color = isError ? '#f6554e' : '#a8d9ab';
        statusMsg.classList.add('show');
        setTimeout(() => {
            statusMsg.classList.remove('show');
        }, 2000);
    }

    function loadSettings() {
        chrome.storage.local.get(['language', 'siteLanguageSettings', 'siteEnabledSettings', 'ninja_trade_realm'], function(result) {
            const globalLang = result.language || 'zh_cn';
            updateGlobalLangUI(globalLang);
            
            const siteLangSettings = result.siteLanguageSettings || {};
            const siteEnabledSettings = result.siteEnabledSettings || {
                trade: true,
                ninja: true,
                filterblade: false,
                mobalytics: false,
                maxroll: false
            };
            
            const combinedSettings = {};
            Object.keys(siteSettings).forEach(site => {
                combinedSettings[site] = {
                    lang: siteLangSettings[site] || 'zh_cn',
                    enabled: siteEnabledSettings[site]
                };
            });
            
            updateSiteLangUI(combinedSettings);
            
            if (ninjaTradeRealm) {
                ninjaTradeRealm.value = result.ninja_trade_realm || 'www';
            }
        });
    }

    function saveAllSettings() {
        let globalLang = 'zh_cn';
        globalLangRadios.forEach(radio => {
            if (radio.checked) {
                globalLang = radio.value;
            }
        });

        const siteLangSettings = {};
        const siteEnabledSettings = {};
        
        Object.keys(siteSettings).forEach(site => {
            if (siteSettings[site].lang) {
                siteLangSettings[site] = siteSettings[site].lang.value;
            }
            if (siteSettings[site].enabled) {
                siteEnabledSettings[site] = siteSettings[site].enabled.checked;
            }
        });

        const saveData = {
            language: globalLang,
            siteLanguageSettings: siteLangSettings,
            siteEnabledSettings: siteEnabledSettings,
            updated: Date.now()
        };
        
        if (ninjaTradeRealm) {
            saveData.ninja_trade_realm = ninjaTradeRealm.value;
        }

        chrome.storage.local.set(saveData, function() {
            showStatus('设置已保存！');
        });
    }

    function saveSiteSetting(site, type, value) {
        const storageKey = type === 'lang' ? 'siteLanguageSettings' : 'siteEnabledSettings';
        
        chrome.storage.local.get([storageKey], function(result) {
            const settings = result[storageKey] || {};
            settings[site] = value;
            
            chrome.storage.local.set({
                [storageKey]: settings,
                updated: Date.now()
            }, function() {
                showStatus('设置已保存！');
            });
        });
    }

    function saveGlobalLanguage(lang) {
        chrome.storage.local.set({
            language: lang,
            updated: Date.now()
        }, function() {
            showStatus('设置已保存！');
        });
    }

    function resetSettings() {
        const defaults = {
            language: 'zh_cn',
            siteLanguageSettings: {
                trade: 'zh_cn',
                ninja: 'zh_cn',
                filterblade: 'zh_cn',
                mobalytics: 'zh_cn',
                maxroll: 'zh_cn'
            },
            siteEnabledSettings: {
                trade: true,
                ninja: true,
                filterblade: false,
                mobalytics: false,
                maxroll: false
            },
            ninja_trade_realm: 'www'
        };

        chrome.storage.local.set(defaults, function() {
            updateGlobalLangUI(defaults.language);
            updateSiteLangUI({
                trade: { lang: 'zh_cn', enabled: true },
                ninja: { lang: 'zh_cn', enabled: true },
                filterblade: { lang: 'zh_cn', enabled: false },
                mobalytics: { lang: 'zh_cn', enabled: false },
                maxroll: { lang: 'zh_cn', enabled: false }
            });
            if (ninjaTradeRealm) {
                ninjaTradeRealm.value = 'www';
            }
            showStatus('已重置为默认设置！');
        });
    }

    globalLangCards.forEach(card => {
        card.addEventListener('click', function() {
            const lang = this.dataset.lang;
            updateGlobalLangUI(lang);
            saveGlobalLanguage(lang);
        });
    });

    globalLangRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateGlobalLangUI(this.value);
            saveGlobalLanguage(this.value);
        });
    });

    Object.keys(siteSettings).forEach(site => {
        if (siteSettings[site].lang) {
            siteSettings[site].lang.addEventListener('change', function() {
                saveSiteSetting(site, 'lang', this.value);
            });
        }
        if (siteSettings[site].enabled) {
            siteSettings[site].enabled.addEventListener('change', function() {
                saveSiteSetting(site, 'enabled', this.checked);
            });
        }
    });

    if (ninjaTradeRealm) {
        ninjaTradeRealm.addEventListener('change', function() {
            chrome.storage.local.set({
                ninja_trade_realm: this.value,
                updated: Date.now()
            }, function() {
                showStatus('设置已保存！');
            });
        });
    }

    resetBtn.addEventListener('click', resetSettings);

    loadSettings();
});
