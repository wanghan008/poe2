// POE2 市集汉化增强版 - Trade Module
// 完全匹配 ninja Trade zh -1.2.0 实现
// 支持国际服、台服、国服三服务器

const TradeModule = {
    leagueMap: {},
    leaguesPromise: null,

    initLeagues() {
        if (this.leaguesPromise) return this.leaguesPromise;

        this.leaguesPromise = (async () => {
            try {
                const response = await fetch('https://poe.ninja/poe2/api/data/build-index-state');
                if (response.ok) {
                    const data = await response.json();
                    const leagues = Array.isArray(data) ? data : (data.leagueBuilds || []);
                    
                    if (Array.isArray(leagues)) {
                        leagues.forEach(item => {
                            if (item.leagueUrl && item.leagueName) {
                                this.leagueMap[item.leagueUrl.toLowerCase()] = item.leagueName;
                            }
                        });
                        console.log(`[市集搜索] 动态赛季列表加载完成, 共 ${Object.keys(this.leagueMap).length} 个赛季`);
                    }
                }
            } catch (e) {
                console.warn('[市集搜索] 加载动态赛季列表出错:', e);
            }
        })();
        
        return this.leaguesPromise;
    },

    async getLeague() {
        if (this.leaguesPromise) {
            await this.leaguesPromise;
        }

        try {
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const ignoredWords = ['poe2', 'builds', 'overview', 'challenge', 'rewards', 'economy', 'profile'];
            
            let league = 'Standard';

            if (window.location.pathname.includes('/profile/')) {
                return 'Standard';
            }
            
            for (const part of pathParts) {
                if (!ignoredWords.includes(part.toLowerCase())) {
                    league = part;
                    break;
                }
            }
            
            const lowerLeague = league.toLowerCase();
            if (this.leagueMap[lowerLeague]) {
                return this.leagueMap[lowerLeague];
            }

            return league.charAt(0).toUpperCase() + league.slice(1);
        } catch (e) {
            console.error('[市集搜索] 获取赛季失败:', e);
        }
        return 'Standard';
    },

    getLeagueForRealm(league, lang) {
        if (lang === 'cn' || lang === 'zh_cn') {
            const cnMap = {
                'Standard': '永久',
                'Hardcore': '专家模式',
                'Fate of the Vaal': '瓦尔的宿命',
                'HC Fate of the Vaal': '瓦尔的宿命（专家）'
            };
            return cnMap[league] || league;
        }
        
        if (lang === 'tw' || lang === 'zh_tw') {
            const twMap = {
                'Standard': '標準',
                'Hardcore': '專家模式'
            };
            return twMap[league] || league;
        }

        return league;
    },

    async searchItem(itemName, searchName, isUnique, selectedStats = [], lang = 'en', rarity = null, category = null, ilvl = null, quality = null) {
        const rawLeague = await this.getLeague();
        const league = this.getLeagueForRealm(rawLeague, lang);

        const getSettings = () => new Promise(resolve => {
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['ninja_trade_status', 'ninja_trade_currency', 'ninja_trade_indexed'], resolve);
            } else {
                resolve({});
            }
        });
        const settings = await getSettings();
        
        let tradeStatus = settings.ninja_trade_status || 'any';
        
        if (lang === 'cn' || lang === 'zh_cn') {
            tradeStatus = 'securable';
            console.log('[市集搜索] 检测到国服环境, 强制将交易方式设置为「可直接购买」');
        }

        let nameToSearch = searchName ? searchName.trim() : '';

        console.log(`[市集搜索] 准备发起市集搜索: '${nameToSearch}' (${isUnique ? '传奇物品' : '底材/普通物品'}) 联盟: ${league} 语言: ${lang} 状态过滤: ${tradeStatus}`);
        
        const DataManager = window.DataManager;
        if ((lang === 'cn' || lang === 'zh_cn') && DataManager && DataManager.isReady) {
            let itemData = DataManager.findItem(nameToSearch);
            let cnName = null;

            if (itemData) {
                if (isUnique) {
                    cnName = itemData.name_cn || itemData.unique_name || itemData.name;
                } else {
                    cnName = itemData.type_cn || itemData.type;
                }
            }
            
            if (!cnName && window.NinjaSearch && window.NinjaSearch.getDicts) {
                const dicts = window.NinjaSearch.getDicts();
                if (dicts) {
                    if (dicts.itemDictionary && dicts.itemDictionary[nameToSearch]) {
                        cnName = dicts.itemDictionary[nameToSearch];
                    }
                    else if (dicts.simpleDictionary && dicts.simpleDictionary[nameToSearch]) {
                        cnName = dicts.simpleDictionary[nameToSearch];
                    }
                }
            }

            if (cnName) {
                console.log(`[市集搜索] 转换为中文名: ${nameToSearch} -> ${cnName}`);
                nameToSearch = cnName;
                
                if (!itemData) {
                    itemData = DataManager.findItem(cnName);
                }
            } else {
                if (!/[\u4e00-\u9fa5]/.test(nameToSearch)) {
                     console.warn(`[市集搜索] 未能为 "${nameToSearch}" 找到对应的中文名称`);
                     alert(`无法找到 "${nameToSearch}" 的中文名称，无法在国服搜索。`);
                     return null;
                }
            }
        }
        
        console.log('[市集搜索] 已收集到的选中词缀列表:', selectedStats);

        if (!nameToSearch) {
            console.error('[市集搜索] 搜索名称为空');
            return null;
        }

        const statsFilters = [];
        const extraFilters = [];
        
        if (DataManager && !DataManager.isReady) {
            console.log('[市集搜索] DataManager 尚未就绪, 正在等待...');
            try {
                await DataManager.ready();
            } catch (e) {
                console.error('[市集搜索] DataManager 加载失败:', e);
            }
        }

        if (selectedStats && selectedStats.length > 0) {
            const StatMappings = window.StatMappings;

            selectedStats.forEach(statEntry => {
                if (statEntry && typeof statEntry === 'object' && statEntry.type === 'filter') {
                    extraFilters.push(statEntry);
                    return;
                }

                let statId = null;
                let statValue = null;

                const tryFind = (text, type = null) => {
                    if (!text) return null;
                    
                    if (DataManager && DataManager.isReady) {
                        const result = DataManager.findStat(text, type);
                        if (result) {
                            console.log(`[市集搜索] 在 DataManager 中找到词缀映射: "${text}" -> ${result.stat.id}`);
                            return { id: result.stat.id, value: result.value };
                        }
                    }

                    if (StatMappings) {
                        const mapping = StatMappings.findStat(text);
                        if (mapping) {
                            return { id: mapping.id, value: StatMappings.extractValue(text) };
                        }
                    }
                    return null;
                };

                let found = null;
                if (typeof statEntry === 'string') {
                    found = tryFind(statEntry);
                } else {
                    const statType = statEntry.type || null;

                    if (!found && statEntry.visible && statEntry.visible.replace(/\s+/g, '') === '弓类攻击发射一支额外箭矢') {
                        found = {
                            id: 'explicit.stat_3885405204',
                            value: null
                        };
                    }

                    if (!found && statEntry.visible) {
                        found = tryFind(statEntry.visible, statType);
                    }
                    
                    if (!found && statEntry.original) {
                        console.log(`[市集搜索] 使用可见文本匹配失败, 尝试使用原文: "${statEntry.original}"`);
                        found = tryFind(statEntry.original, statType);
                    }
                }

                if (found) {
                    statId = found.id;
                    statValue = found.value;
                }

                if (statId) {
                    const filter = {
                        id: statId,
                        disabled: false
                    };
                    
                    if (statValue !== null) {
                        filter.value = { min: statValue };
                    }
                    
                    statsFilters.push(filter);
                } else {
                    const debugText = typeof statEntry === 'string' ? statEntry : (statEntry.visible || statEntry.original);
                    console.warn(`[市集搜索] 未找到匹配的词缀映射: ${debugText}`);
                }
            });
        }

        const query = {
            query: {
                status: { option: tradeStatus },
                stats: statsFilters.length > 0 ? [{ type: "and", filters: statsFilters }] : []
            },
            sort: { price: "asc" }
        };

        if (rarity || category || ilvl || quality) {
            if (!query.query.filters) {
                query.query.filters = {};
            }
            query.query.filters.type_filters = { filters: {} };
            
            if (rarity) {
                query.query.filters.type_filters.filters.rarity = { option: rarity };
                console.log(`[市集搜索] 应用稀有度过滤: ${rarity}`);
            }
            
            if (category) {
                query.query.filters.type_filters.filters.category = { option: category };
                console.log(`[市集搜索] 应用物品类型过滤: ${category}`);
            }

            if (ilvl) {
                query.query.filters.type_filters.filters.ilvl = { min: ilvl };
                console.log(`[市集搜索] 应用物品等级过滤: ilvl >= ${ilvl}`);
            }

            if (quality) {
                query.query.filters.type_filters.filters.quality = { min: quality };
                console.log(`[市集搜索] 应用物品品质过滤: quality >= ${quality}`);
            }
        }

        if (settings.ninja_trade_currency || settings.ninja_trade_indexed) {
            if (!query.query.filters) {
                query.query.filters = {};
            }
            if (!query.query.filters.trade_filters) {
                query.query.filters.trade_filters = { filters: {} };
            }

            if (settings.ninja_trade_currency) {
                query.query.filters.trade_filters.filters.price = { option: settings.ninja_trade_currency };
            }
            if (settings.ninja_trade_indexed) {
                query.query.filters.trade_filters.filters.indexed = { option: settings.ninja_trade_indexed };
            }
        }

        if (extraFilters.length > 0) {
            if (!query.query.filters) {
                query.query.filters = {};
            }

            const groupedExtraFilters = {};

            extraFilters.forEach(entry => {
                if (!entry || !entry.id) return;

                const group = entry.group || 'misc_filters';
                const value = entry.value || {};

                const normalizedValue = {};
                if (typeof value.min !== 'undefined') normalizedValue.min = value.min;
                if (typeof value.max !== 'undefined') normalizedValue.max = value.max;
                if (typeof value.option !== 'undefined') normalizedValue.option = value.option;

                if (Object.keys(normalizedValue).length === 0) return;

                if (!groupedExtraFilters[group]) {
                    groupedExtraFilters[group] = {};
                }

                groupedExtraFilters[group][entry.id] = normalizedValue;
            });

            Object.keys(groupedExtraFilters).forEach(group => {
                const filtersForGroup = groupedExtraFilters[group];
                if (!filtersForGroup || Object.keys(filtersForGroup).length === 0) return;

                if (!query.query.filters[group]) {
                    query.query.filters[group] = { filters: {} };
                }

                const target = query.query.filters[group].filters;
                Object.keys(filtersForGroup).forEach(id => {
                    const val = filtersForGroup[id];
                    target[id] = val;
                });
            });
        }

        if (isUnique) {
            query.query.name = nameToSearch;
        } else {
            query.query.type = nameToSearch;
        }
        
        console.log('[市集搜索] 最终生成的市集查询参数:', JSON.stringify(query));

        return new Promise((resolve, reject) => {
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                reject('Extension runtime not available');
                return;
            }

            console.log('[市集搜索] 正在向后台发送市集搜索请求...');
            chrome.runtime.sendMessage({
                type: 'createTradeSearch',
                league: league,
                query: query,
                lang: lang
            }, (response) => {
                console.log('[市集搜索] 收到后台返回的响应:', response);
                
                if (chrome.runtime.lastError) {
                    const errorMsg = chrome.runtime.lastError.message;
                    if (errorMsg && errorMsg.includes('Extension context invalidated')) {
                        console.warn('[市集搜索] 运行时警告(需要刷新页面):', errorMsg);
                    } else {
                        console.error('[市集搜索] 运行时错误:', chrome.runtime.lastError);
                    }
                    reject(errorMsg);
                    return;
                }
                if (response && response.success) {
                    resolve(response.url);
                } else {
                    if (response && response.code === 401) {
                        alert('市集搜索失败：当前未登录官方市集，请先在浏览器中打开市集页面并登录帐号。');
                    } else if (response && response.code === 429) {
                        const msg = response.message || '搜索过于频繁';
                        alert(`市集搜索失败：搜索请求过于频繁。\n\n官方提示：${msg}`);
                    }
                    reject(response ? response.error : 'Unknown error from background');
                }
            });
        });
    },

    getRarity(element) {
        if (!element) return null;
        const style = element.getAttribute('style') || '';
        if (style.includes('--item-unique') || style.includes('item-unique')) return 'unique';
        if (style.includes('--item-rare') || style.includes('item-rare')) return 'rare';
        if (style.includes('--item-magic') || style.includes('item-magic')) return 'magic';
        if (style.includes('--item-normal') || style.includes('item-normal')) return 'normal';
        if (style.includes('--item-currency') || style.includes('item-currency')) return 'currency';
        if (style.includes('--item-gem') || style.includes('item-gem')) return 'gem';
        return null;
    },

    getItemLevel(clone) {
        const ilvlRegex = /(?:Item Level|物品等级)[:\s]+(\d+)/i;
        
        const ilvlEl = clone.querySelector('[data-original-text="Item Level:"]');
        if (ilvlEl) {
            const match = ilvlEl.textContent.match(/(\d+)/);
            if (match) return parseInt(match[1], 10);
        }
        
        const textWalker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
        while(textWalker.nextNode()) {
            const node = textWalker.currentNode;
            const match = node.textContent.match(ilvlRegex);
            if (match) return parseInt(match[1], 10);
        }
        return null;
    },

    getQuality(clone) {
        const qualityRegex = /(?:Quality|品质|品質)(?:\s*\(.*?\))?[:\s]+(?:\+)?(\d+)%/i;
        
        const textWalker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
        while(textWalker.nextNode()) {
            const node = textWalker.currentNode;
            const match = node.textContent.match(qualityRegex);
            if (match) return parseInt(match[1], 10);
        }
        return null;
    }
};

if (typeof window !== 'undefined') {
    window.TradeModule = TradeModule;
    TradeModule.initLeagues();
}
