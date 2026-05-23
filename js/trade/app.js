(function() {
    'use strict';

    let currentLanguage = 'zh_cn';

    function clearTranslationCache() {
        localStorage.removeItem('lscache-trade2items');
        localStorage.removeItem('lscache-trade2stats');
        localStorage.removeItem('lscache-trade2data');
        localStorage.removeItem('lscache-trade2filters');
        localStorage.removeItem('lscache-trade2items-cacheexpiration');
        localStorage.removeItem('lscache-trade2stats-cacheexpiration');
        localStorage.removeItem('lscache-trade2data-cacheexpiration');
        localStorage.removeItem('lscache-trade2filters-cacheexpiration');
        localStorage.removeItem('local-updated');
        console.log('[POE2市集汉化] 已清除翻译缓存');
    }

    function initTranslation() {
        chrome.storage.local.get(['language', 'siteLanguageSettings', 'updated', 'UILanguage'], (result) => {
            const siteLang = result.siteLanguageSettings?.trade;
            currentLanguage = siteLang || result.language || 'zh_cn';

            console.log('[POE2市集汉化] 当前语言设置:', currentLanguage);

            if (currentLanguage === 'en') {
                clearTranslationCache();
                console.log('[POE2市集汉化] 英文模式，已禁用汉化');
                return;
            }

            if (!localStorage['lscache-trade2items']) {
                console.log('[POE2市集汉化] 无缓存数据，等待加载');
                return;
            }

            addScript();

            let localUpdated = localStorage['local-updated'] || 0;

            if (+result.updated > +localUpdated) {
                chrome.storage.local.get(['translation'], ({ translation }) => {
                    if (translation) {
                        localStorage['lscache-trade2items'] = JSON.stringify(translation.items.result);
                        localStorage['lscache-trade2stats'] = JSON.stringify(translation.stats.result);
                        localStorage['lscache-trade2data'] = JSON.stringify(translation.static.result);
                        localStorage['lscache-trade2filters'] = JSON.stringify(translation.filters.result);
                    }
                });

                localStorage.removeItem('lscache-trade2items-cacheexpiration');
                localStorage.removeItem('lscache-trade2stats-cacheexpiration');
                localStorage.removeItem('lscache-trade2data-cacheexpiration');
                localStorage.removeItem('lscache-trade2filters-cacheexpiration');

                localStorage['local-updated'] = Date.now();
            }
        });
    }

    function addScript() {
        let s = document.createElement('script');
        s.src = chrome.runtime.getURL('js/trade/interface.js');
        s.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(s);
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.language || changes.siteLanguageSettings) {
                const newLang = changes.language?.newValue;
                const newSiteLang = changes.siteLanguageSettings?.newValue?.trade;
                const effectiveLang = newSiteLang || newLang;
                
                if (effectiveLang === 'en') {
                    clearTranslationCache();
                }
                location.reload();
            }
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "reloadSettings") {
            location.reload();
        }
        if (request.action === "getLanguage") {
            sendResponse({ language: currentLanguage });
        }
    });

    initTranslation();
})();
