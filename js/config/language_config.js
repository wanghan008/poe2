var LanguageConfig = (function() {
    const LANGUAGE_OPTIONS = {
        zh_cn: {
            name: '简体中文',
            code: 'zh_cn',
            dataPath: 'data/zh_cn/',
            description: '使用简体中文显示'
        },
        zh_tw: {
            name: '繁體中文',
            code: 'zh_tw',
            dataPath: 'data/zh_tw/',
            description: '使用繁體中文顯示'
        },
        en: {
            name: 'English',
            code: 'en',
            dataPath: null,
            description: 'Original English'
        }
    };

    const SITE_OPTIONS = {
        trade: {
            name: '国际服市集',
            sites: ['pathofexile.com/trade', 'pathofexile.com/trade2'],
            defaultLang: 'zh_tw'
        },
        ninja: {
            name: 'Ninja',
            sites: ['poe.ninja'],
            defaultLang: 'zh_cn'
        },
        filterblade: {
            name: 'FilterBlade',
            sites: ['filterblade.xyz'],
            defaultLang: 'zh_cn'
        },
        mobalytics: {
            name: 'Mobalytics',
            sites: ['mobalytics.gg/poe-2'],
            defaultLang: 'zh_cn'
        },
        maxroll: {
            name: 'Maxroll',
            sites: ['maxroll.gg/poe2'],
            defaultLang: 'zh_cn'
        }
    };

    function getLanguageOptions() {
        return LANGUAGE_OPTIONS;
    }

    function getSiteOptions() {
        return SITE_OPTIONS;
    }

    function getDefaultLanguage(siteKey) {
        if (siteKey && SITE_OPTIONS[siteKey]) {
            return SITE_OPTIONS[siteKey].defaultLang;
        }
        return 'zh_cn';
    }

    function isValidLanguage(langCode) {
        return LANGUAGE_OPTIONS.hasOwnProperty(langCode);
    }

    return {
        getLanguageOptions: getLanguageOptions,
        getSiteOptions: getSiteOptions,
        getDefaultLanguage: getDefaultLanguage,
        isValidLanguage: isValidLanguage,
        LANGUAGE_OPTIONS: LANGUAGE_OPTIONS,
        SITE_OPTIONS: SITE_OPTIONS
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageConfig;
}
