(function() {
    'use strict';

    console.log('[POE2市集汉化] Poe2db 汉化脚本已加载');

    let currentLanguage = 'zh_cn';

    chrome.storage.local.get(['language', 'siteLanguageSettings'], function(result) {
        const siteLang = result.siteLanguageSettings?.poe2db;
        currentLanguage = siteLang || result.language || 'zh_cn';

        if (currentLanguage === 'en') return;
    });
})();
