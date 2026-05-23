(function() {
    'use strict';

    console.log('[POE2市集汉化] Mobalytics 汉化脚本已加载');

    let currentLanguage = 'zh_cn';
    let simpleDictionary = {};
    let isDictionaryLoaded = false;

    async function loadDictionary() {
        try {
            const response = await fetch(chrome.runtime.getURL(`data/${currentLanguage}/ninja/simple/1.Ninja_Ui.json`));
            const data = await response.json();
            
            if (Array.isArray(data)) {
                data.forEach(obj => {
                    if (!obj || typeof obj !== 'object') return;
                    Object.keys(obj).forEach(k => {
                        const entry = obj[k];
                        if (!entry || typeof entry !== 'object') return;
                        const translation = entry[currentLanguage] || entry['zh_cn'] || entry['zh_tw'] || "";
                        if (translation) {
                            simpleDictionary[k] = translation;
                        }
                    });
                });
            }
            
            isDictionaryLoaded = true;
        } catch (err) {
            console.error('[Mobalytics] 加载词典失败:', err);
        }
    }

    chrome.storage.local.get(['language', 'siteLanguageSettings', 'siteEnabledSettings'], function(result) {
        if (result.siteEnabledSettings?.mobalytics === false) return;
        
        const siteLang = result.siteLanguageSettings?.mobalytics;
        currentLanguage = siteLang || result.language || 'zh_cn';

        if (currentLanguage === 'en') return;

        loadDictionary();
    });
})();
