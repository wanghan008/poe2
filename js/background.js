let fetchobj = { cache: "no-cache" };

const DATA_SOURCES = {
    us: {
        items: 'https://www.pathofexile.com/api/trade2/data/items',
        stats: 'https://www.pathofexile.com/api/trade2/data/stats',
        static: 'https://www.pathofexile.com/api/trade2/data/static',
        filters: 'https://www.pathofexile.com/api/trade2/data/filters'
    },
    zh_cn: {
        stats: 'https://poe.game.qq.com/api/trade2/data/stats',
        static: 'https://poe.game.qq.com/api/trade2/data/static',
        filters: 'https://poe.game.qq.com/api/trade2/data/filters',
        backup: 'https://gitee.com/a643226422/poe2/raw/master/'
    },
    zh_tw: {
        stats: 'https://pathofexile.tw/api/trade2/data/stats',
        static: 'https://pathofexile.tw/api/trade2/data/static',
        filters: 'https://pathofexile.tw/api/trade2/data/filters',
        backup: 'https://gitee.com/a643226422/poe2tw/raw/master/'
    }
};

chrome.storage.onChanged.addListener((changes) => {
    for (let key in changes) {
        let value = changes[key].newValue;
        if (key === 'language') {
            changeLanguage(value);
        }
        if (key === 'uiLanguage') {
            changeUILanguage(value);
        }
    }
});

async function changeLanguage(language) {
    console.log('[Background] 切换语言:', language);
    
    if (language === 'en') {
        chrome.storage.local.set({
            status: 'done',
            updated: Date.now()
        });
        return;
    }

    try {
        let data = await fetchUSData();
        if (!data) {
            console.log('加载国际服数据失败');
            chrome.storage.local.set({
                language: 'en',
                status: 'done',
                updated: Date.now()
            });
            return;
        }

        let { items, stats, static: staticData, itemname, itemtwname, filters } = data;

        const passivesNotableFile = chrome.runtime.getURL('data/common/passivesNotable.json');
        let passivesNotable = await fetch(passivesNotableFile).then(res => res.json()).catch(() => ({}));

        items.result.forEach((category) => {
            let labelarr = passivesNotable[category.id];
            if (labelarr) {
                category.label = labelarr + '(' + category.label + ')';
            }
            
            const currentLangData = language === 'zh_tw' ? itemtwname : itemname;
            category.entries.forEach((item) => {
                if (currentLangData[item.text]) {
                    item.text = currentLangData[item.text] + '(' + item.text + ')';
                } else if (currentLangData[item.type]) {
                    item.text = currentLangData[item.type] + '(' + item.type + ')';
                }
            });
        });

        let zhData = await fetchLanguageData(language);
        console.log('[Background] zhData:', zhData ? '获取成功' : '获取失败');
        
        let actualLanguage = language;
        if (!zhData && language === 'zh_tw') {
            console.log('[Background] 繁体数据获取失败，尝试使用简体数据作为后备');
            zhData = await fetchLanguageData('zh_cn');
            actualLanguage = 'zh_cn';
        }
        
        if (zhData) {
            let { stats: zh_stats, static: zh_static, filters: zh_filters } = zhData;
            
            if (zh_stats?.result?.[0]?.entries) {
                let translate_stat = {};
                let affix = {};
                zh_stats.result.forEach((category) => {
                    category.entries.forEach((item) => {
                        translate_stat[item.id] = item.text;
                        if (item.option) {
                            item.option.options.forEach((optionobj) => {
                                translate_stat[item.id + "option" + optionobj.id] = optionobj.text;
                            });
                        }
                    });
                });

                affix.delvestr = {};
                affix.roomxz = {};
                
                stats.result.forEach((category) => {
                    category.entries.forEach((item) => {
                        affix[item.id] = { u: item.text };
                        let haveTranslate = passivesNotable[item.id]?.n || passivesNotable[item.id] || translate_stat[item.id] || null;
                        let str = '';
                        if (item.id.match(/stat_2954116742|stat_3459808765|stat_1898784841|stat_1422267548/) && haveTranslate) {
                            str = '涂油:';
                            haveTranslate = haveTranslate.replace('(秒)', '（第二）').replace(/ /g, '');
                        } else if (item.id.match(/stat_1190333629|stat_2460506030/)) {
                            str = '升华珠宝:';
                        } else if (item.id.match(/stat_3948993189|stat_3086156145/)) {
                            str = '星团珠宝:';
                        } else if (item.id.match(/indexable_skill/) && haveTranslate) {
                            str = "龙牙之翔(仿品):";
                            haveTranslate = haveTranslate.replace(/所有 # 宝石等级 \+(.+)/, '所有 $1 宝石等级 +#');
                        }
                        affix[item.id].z = haveTranslate;
                        if (item.option) {
                            affix[item.id].o = {};
                            item.option.options.forEach((optionobj) => {
                                let fixstr = passivesNotable[optionobj.text]?.n || passivesNotable[optionobj.text];
                                let res = translate_stat[item.id + "option" + optionobj.id];
                                if (fixstr || res) {
                                    affix[item.id].o[optionobj.text] = fixstr || res;
                                    optionobj.text = (fixstr || res) + '(' + optionobj.text + ')';
                                }
                            });
                        }
                        if (item.id.match(/pseudo_temple/)) {
                            let usname = item.text.replace("Has Room: ", "");
                            let zhname = translate_stat[item.id].replace(/内?有房间：/, '');
                            affix.roomxz[usname] = zhname;
                        }
                        if (category.label == 'Delve') {
                            if (affix[item.id]?.z) {
                                affix.delvestr[item.text] = affix[item.id].z;
                            }
                        }
                        if (haveTranslate) {
                            item.text = str + haveTranslate + '(' + item.text + ')';
                        }
                    });
                    category.label = translate_stat['label' + category.entries[0]?.type] || category.label;
                });

                const currentLangItemname = actualLanguage === 'zh_tw' ? itemtwname : itemname;
                console.log('[Background] 存储 cache_us, 语言:', actualLanguage, '词缀数量:', Object.keys(affix).length);
                chrome.storage.local.set({ cache_us: { itemname: currentLangItemname, affix, passivesNotable } });
            }

            if (zh_static?.result?.[0]?.entries) {
                let translate_static = {};
                zh_static.result.forEach((category) => {
                    category.entries.forEach((item) => {
                        translate_static[item.id] = item.text;
                    });
                    translate_static[category.id] = category.label;
                });

                staticData.result.forEach((category) => {
                    category.entries.forEach((item) => {
                        let haveTranslate = translate_static[item.id];
                        if (haveTranslate) {
                            item.text = haveTranslate;
                        }
                    });
                    category.label = passivesNotable[category.label] || translate_static[category.id] || category.label;
                });
            }

            filters = zh_filters;
            staticData = zh_static;
        }

        chrome.storage.local.set({
            translation: { items, stats, static: staticData, filters },
            status: 'done',
            updated: Date.now(),
            statusUI: 'progress'
        });

    } catch (err) {
        console.error('语言切换失败:', err);
        chrome.storage.local.set({
            language: 'en',
            status: 'done',
            updated: Date.now()
        });
    }
}

async function fetchUSData() {
    try {
        let [items, stats, staticData, filters] = await Promise.all([
            fetch(DATA_SOURCES.us.items, fetchobj).then(res => res.json()),
            fetch(DATA_SOURCES.us.stats, fetchobj).then(res => res.json()),
            fetch(DATA_SOURCES.us.static, fetchobj).then(res => res.json()),
            fetch(DATA_SOURCES.us.filters, fetchobj).then(res => res.json())
        ]);

        const itemFile = chrome.runtime.getURL('data/zh_cn/trade/item.json');
        const itemtwFile = chrome.runtime.getURL('data/zh_tw/trade/item.json');
        
        let itemname = await fetch(itemFile).then(res => res.json()).catch(() => ({}));
        let itemtwname = await fetch(itemtwFile).then(res => res.json()).catch(() => ({}));

        return { items, stats, static: staticData, itemname, itemtwname, filters };
    } catch (err) {
        console.error('获取US数据失败:', err);
        return null;
    }
}

async function fetchLanguageData(lang) {
    const source = DATA_SOURCES[lang];
    if (!source) {
        console.log('[Background] 未找到语言数据源:', lang);
        return null;
    }

    console.log('[Background] 尝试获取语言数据:', lang, source.stats);

    try {
        let stats = await fetch(source.stats, fetchobj).then(res => res.text());
        if (stats.includes('"result":')) stats = JSON.parse(stats);
        else stats = null;

        let staticData = await fetch(source.static, fetchobj).then(res => res.text());
        if (staticData.includes('"result":')) staticData = JSON.parse(staticData);
        else staticData = null;

        let filters = await fetch(source.filters, fetchobj).then(res => res.text());
        if (filters.includes('"result":')) filters = JSON.parse(filters);
        else filters = null;

        if (stats?.result && staticData?.result && filters?.result) {
            console.log('[Background] 语言数据获取成功:', lang);
            return { stats, static: staticData, filters };
        }

        console.log('[Background] 主数据源失败，尝试备用数据源');
        if (source.backup) {
            return await fetchBackupData(source.backup);
        }

        return null;
    } catch (err) {
        console.error('[Background] 获取语言数据失败:', err);
        if (source.backup) {
            return await fetchBackupData(source.backup);
        }
        return null;
    }
}

async function fetchBackupData(backupUrl) {
    try {
        let stats = await fetch(backupUrl + 'stats', fetchobj).then(res => res.text());
        if (stats.includes('"result":')) stats = JSON.parse(stats);
        else stats = null;

        let staticData = await fetch(backupUrl + 'static', fetchobj).then(res => res.text());
        if (staticData.includes('"result":')) staticData = JSON.parse(staticData);
        else staticData = null;

        let filters = await fetch(backupUrl + 'filters', fetchobj).then(res => res.text());
        if (filters.includes('"result":')) filters = JSON.parse(filters);
        else filters = null;

        if (stats?.result && staticData?.result && filters?.result) {
            return { stats, static: staticData, filters };
        }
        return null;
    } catch (err) {
        console.error('获取备份数据失败:', err);
        return null;
    }
}

async function changeUILanguage(UILanguage) {
    chrome.storage.local.get('language', async ({ language }) => {
        if (language === 'en') {
            chrome.storage.local.set({
                UILanguage: {},
                statusUI: 'done',
                updated: Date.now()
            });
            return;
        }

        try {
            const uiFile = chrome.runtime.getURL(`data/${language}/trade/interface.json`);
            let translateText = await fetch(uiFile).then(res => res.json());
            
            if (UILanguage === 'ZhUs') {
                Object.keys(translateText).forEach((key) => {
                    translateText[key] = translateText[key] + ' (' + key + ') ';
                });
            } else if (UILanguage === 'Us') {
                let temp = {};
                Object.keys(translateText).forEach((key) => {
                    temp[key] = key;
                });
                translateText = temp;
            }
            
            translateText.UILanguagestr = true;
            chrome.storage.local.set({
                UILanguage: translateText,
                statusUI: 'done',
                updated: Date.now()
            });
        } catch (err) {
            console.error('UI语言切换失败:', err);
        }
    });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['language'], (result) => {
        if (!result.language) {
            chrome.storage.local.set({
                language: 'zh_cn',
                siteLanguageSettings: {},
                siteEnabledSettings: {
                    trade: true,
                    ninja: true,
                    filterblade: false,
                    mobalytics: false,
                    maxroll: false
                }
            });
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "reloadSettings") {
        chrome.storage.local.get(['language'], ({ language }) => {
            changeLanguage(language);
        });
    }
    if (request.action === "getLanguage") {
        chrome.storage.local.get(['language', 'siteLanguageSettings'], (result) => {
            sendResponse(result);
        });
        return true;
    }
    
    if (request.type === 'createTradeSearch') {
        handleTradeSearch(request, sendResponse);
        return true;
    }
    
    if (request.type === 'fetchTradeData') {
        handleFetchTradeData(request, sendResponse);
        return true;
    }
});

async function handleFetchTradeData(request, sendResponse) {
    try {
        const { url } = request;
        console.log(`[Background] Fetching Trade Data from: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            sendResponse({ success: false, error: `${response.statusText} (${response.status}): ${errorText}`, status: response.status });
            return;
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            sendResponse({ success: true, data: data });
        } else {
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                sendResponse({ success: true, data: data });
            } catch (e) {
                sendResponse({ success: false, error: 'Invalid JSON response', raw: text.substring(0, 200) });
            }
        }

    } catch (error) {
        console.error(`[Background] Fetch Error:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleTradeSearch(request, sendResponse) {
    try {
        const { league = 'Standard', query, lang = 'en' } = request;
        
        const hosts = {
            'en': 'www.pathofexile.com',
            'www': 'www.pathofexile.com',
            'tw': 'pathofexile.tw',
            'zh_tw': 'pathofexile.tw',
            'cn': 'poe.game.qq.com',
            'zh_cn': 'poe.game.qq.com'
        };
        
        const host = hosts[lang] || hosts['www'];
        const searchUrl = `https://${host}/api/trade2/search/poe2/${encodeURIComponent(league)}`;

        console.log(`[Background] Trade Search URL: ${searchUrl} (Lang: ${lang})`);
        console.log(`[Background] Trade Search Body:`, JSON.stringify(query));

        const response = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            const text = await response.text();
            
            if (response.status === 401) {
                sendResponse({ 
                    success: false, 
                    error: `HTTP ${response.status}: ${text}`,
                    code: 401,
                    reason: 'unauthorized'
                });
            } else if (response.status === 429) {
                let waitMessage = 'Rate limit exceeded';
                try {
                    const errJson = JSON.parse(text);
                    if (errJson && errJson.error && errJson.error.message) {
                        waitMessage = errJson.error.message;
                    }
                } catch (e) {}
                sendResponse({
                    success: false,
                    error: `HTTP ${response.status}: ${waitMessage}`,
                    code: 429,
                    reason: 'rate_limit',
                    message: waitMessage
                });
            } else {
                sendResponse({ success: false, error: `HTTP ${response.status}: ${text}` });
            }
            return;
        }

        const data = await response.json();
        if (data && data.id) {
            sendResponse({ success: true, id: data.id, url: `https://${host}/trade2/search/poe2/${encodeURIComponent(league)}/${data.id}` });
        } else {
            sendResponse({ success: false, error: 'Invalid response data', data });
        }

    } catch (error) {
        console.error('Trade Search Error:', error);
        sendResponse({ success: false, error: error.message });
    }
}
