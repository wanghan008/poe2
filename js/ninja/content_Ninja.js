// POE Ninja 汉化脚本 - Content Script
// 负责在页面加载后动态替换文本

/* ============================================================================================================
 * [SECTION 1] 全局变量与配置 (Global Variables & Config)
 * ============================================================================================================ */

console.log(
    '%c PoE2 Ninja 汉化插件 %c QQ群：1084591169 ', 
    'background: #333; color: #bada55; border-radius: 3px 0 0 3px; padding: 2px 5px;', 
    'background: #000; color: #fff; border-radius: 0 3px 3px 0; padding: 2px 5px;'
);

let currentLanguage = 'en';
let isDebug = false;

let simpleDictionary = {};
let itemDictionary = {};
let passiveDictionary = {};
let affixDictionary = {};
let prefixDictionary = {};
let suffixDictionary = {};
let sortedItemKeys = [];

let reverseSimpleDictionary = {};
let reverseDict_zh = {};
let reverseDict_zh_tw = {};
let uniqueItemSet = new Set();
let skillItemSet = new Set();

let complexTemplates = [];

let isDictionaryLoaded = false;
const translatedNodes = new WeakSet();

let configFiles = null;

const reverseBlacklistFiles = [
    "data/zh_cn/ninja/simple/1.Ninja_Ui.json",
    "data/zh_tw/ninja/simple/1.Ninja_Ui.json"
];

function isFileInReverseBlacklist(path) {
    try {
        if (!path) return false;
        return reverseBlacklistFiles.some(blacklistPath => 
            path.includes('1.Ninja_Ui.json') || path === blacklistPath
        );
    } catch (e) {
        return false;
    }
}

/* ============================================================================================================
 * [SECTION 2] 资源加载与预处理 (Resource Loading & Preprocessing)
 * ============================================================================================================ */

async function loadConfigurations() {
    if (isDebug) console.log("[汉化] 开始加载汉化文件...");
    
    try {
        if (!configFiles) {
            configFiles = NinjaTranslationConfig.getConfigFiles(currentLanguage);
        }
        
        const simplePromises = configFiles.simple.map(file => 
            fetch(chrome.runtime.getURL(file))
                .then(res => res.json())
                .then(data => {
                    let targetDict = simpleDictionary;
                    const buildReverseAllowed = !isFileInReverseBlacklist(file);
                    if (file.includes('Item Name')) {
                        targetDict = itemDictionary;
                    } else if (file.includes('Passive') || file.includes('Ascendancy')) {
                        targetDict = passiveDictionary;
                    } else if (file.includes('Prefix and Suffix')) {
                        targetDict = affixDictionary;
                    }

                    if (Array.isArray(data)) {
                        mergeSimpleGroupArray(data, targetDict, buildReverseAllowed);
                        return;
                    }
                    Object.keys(data).forEach(key => {
                        const value = data[key];
                        if (Array.isArray(value)) {
                            const shouldBuildReverse = buildReverseAllowed && key.includes('_group');
                            mergeSimpleGroupArray(value, targetDict, shouldBuildReverse);
                            return;
                        }

                        if (key === 'Prefix_group' && typeof value === 'object' && !Array.isArray(value)) {
                            Object.keys(value).forEach(pKey => {
                                const pVal = value[pKey];
                                let trans = "";
                                if (typeof pVal === 'string') trans = pVal;
                                else if (typeof pVal === 'object') trans = pVal[currentLanguage] || pVal['zh_cn'] || pVal['zh_tw'] || "";
                                
                                if (trans) {
                                    prefixDictionary[pKey.trim()] = trans;
                                    affixDictionary[pKey.trim()] = trans;
                                }
                            });
                            return;
                        }

                        if (key === 'Suffix_group' && typeof value === 'object' && !Array.isArray(value)) {
                            Object.keys(value).forEach(sKey => {
                                const sVal = value[sKey];
                                let trans = "";
                                if (typeof sVal === 'string') trans = sVal;
                                else if (typeof sVal === 'object') trans = sVal[currentLanguage] || sVal['zh_cn'] || sVal['zh_tw'] || "";

                                if (trans) {
                                    suffixDictionary[sKey.trim()] = trans;
                                    affixDictionary[sKey.trim()] = trans;
                                }
                            });
                            return;
                        }

                        if (file.includes('Prefix and Suffix') && value && value['Type']) {
                            const translation = value[currentLanguage] || value['zh_cn'] || value['zh_tw'] || "";
                            if (translation) {
                                targetDict[key.trim()] = translation;
                            }
                            return;
                        }

                        if (data[key] && data[key][currentLanguage]) {
                            const translation = data[key][currentLanguage];
                            const keys = key.split('|');
                            const transParts = translation.includes('|') ? translation.split('|') : [translation];

                            if (keys.length > 1 && keys.length === transParts.length) {
                                keys.forEach((k, index) => {
                                    targetDict[k.trim()] = transParts[index].trim();
                                });
                            } else {
                                keys.forEach(k => {
                                    targetDict[k.trim()] = translation;
                                });
                            }
                        }
                        const entry = value;
                        if (entry && (entry['zh_cn'] || entry['zh_tw'])) {
                            const enKeys = key.split('|').map(s => s.trim()).filter(Boolean);
                            const addReverse = (zh, targetReverseDict) => {
                                if (!zh) return;
                                const zhParts = zh.includes('|') ? zh.split('|') : [zh];
                                if (enKeys.length > 1 && zhParts.length === enKeys.length) {
                                    zhParts.forEach((p, i) => {
                                        const zhTerm = p.trim();
                                        const enTerm = enKeys[i];
                                        if (zhTerm && enTerm) {
                                            if (buildReverseAllowed) {
                                                if (!reverseSimpleDictionary[zhTerm]) reverseSimpleDictionary[zhTerm] = enTerm;
                                                if (targetReverseDict && !targetReverseDict[zhTerm]) targetReverseDict[zhTerm] = enTerm;
                                            }
                                        }
                                    });
                                } else {
                                    const baseEn = enKeys[0];
                                    zhParts.forEach(p => {
                                        const zhTerm = p.trim();
                                        if (zhTerm && baseEn) {
                                            if (buildReverseAllowed) {
                                                if (!reverseSimpleDictionary[zhTerm]) reverseSimpleDictionary[zhTerm] = baseEn;
                                                if (targetReverseDict && !targetReverseDict[zhTerm]) targetReverseDict[zhTerm] = baseEn;
                                            }
                                        }
                                    });
                                }
                            };
                            if (buildReverseAllowed && key.includes('_group')) {
                                addReverse(entry['zh_cn'], reverseDict_zh);
                                addReverse(entry['zh_tw'], reverseDict_zh_tw);
                            }

                            if (file.includes('2.Armour unique.json') || 
                                file.includes('2.Other unique.json') || 
                                file.includes('2.Weapon unique.json')) {
                                const enKeys = key.split('|').map(s => s.trim()).filter(Boolean);
                                enKeys.forEach(k => uniqueItemSet.add(k));
                            }
                            
                            if (file.includes('4.Support Gems List.json') || 
                                file.includes('4.Spirit Gems List.json') || 
                                file.includes('4.Skill Gems List.json') || 
                                file.includes('4.Lineage Supports List.json') || 
                                file.includes('4.Item Skills List.json')) {
                                const enKeys = key.split('|').map(s => s.trim()).filter(Boolean);
                                enKeys.forEach(k => skillItemSet.add(k));
                            }
                        }
                    });
                })
                .catch(err => console.error(`[汉化] 加载 ${file} 失败:`, err))
        );

        const complexPromises = configFiles.complex.map(file => 
            fetch(chrome.runtime.getURL(file))
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        complexTemplates.push(...data);
                    }
                })
                .catch(err => console.error(`[汉化] 加载 ${file} 失败:`, err))
        );

        const uniqueIndexPromise = (async () => {
            try {
                const indexCandidates = [
                    `data/${currentLanguage}/ninja/modifiers/Unique Modifiers/Unique Modifiers_index.json`
                ];
                for (const idx of indexCandidates) {
                    const url = chrome.runtime.getURL(idx);
                    const res = await fetch(url);
                    if (!res.ok) continue;
                    const files = await res.json();
                    if (!Array.isArray(files)) continue;
                    let loadedCount = 0;
                    await Promise.all(files.map(f => 
                        fetch(chrome.runtime.getURL(f))
                            .then(r => r.json())
                            .then(d => {
                                if (Array.isArray(d)) {
                                    complexTemplates.push(...d);
                                    loadedCount += d.length;
                                } else if (d) {
                                    complexTemplates.push(d);
                                    loadedCount += 1;
                                }
                            })
                            .catch(err => console.error(`[汉化] 加载 ${f} 失败:`, err))
                    ));
                    if (isDebug) console.log(`[汉化] 已从索引 ${idx} 加载规则数量: ${loadedCount}`);
                }
            } catch (e) {
            }
        })();

        await Promise.all([...simplePromises, ...complexPromises, uniqueIndexPromise]);
        
        processComplexRules();
        
        sortedItemKeys = Object.keys(itemDictionary).sort((a, b) => b.length - a.length);

        isDictionaryLoaded = true;
        if (isDebug) console.log(`[汉化] 加载完成! 简单词条: ${Object.keys(simpleDictionary).length}, 复杂规则: ${complexTemplates.length}`);
        
        pendingNodes.add(document.body);
        scheduleProcessing();

    } catch (err) {
    console.error("[汉化] 初始化失败:", err);
}
}

function mergeSimpleGroupArray(arr, targetDict = simpleDictionary, buildReverse = true) {
    if (!Array.isArray(arr)) return;
    arr.forEach(obj => {
        if (!obj || typeof obj !== 'object') return;
        Object.keys(obj).forEach(k => {
            const entry = obj[k];
            if (!entry || typeof entry !== 'object') return;
            const translation = entry[currentLanguage] || entry['zh_cn'] || entry['zh_tw'] || "";
            if (!translation) return;
            const keys = k.split('|');
            const transParts = translation.includes('|') ? translation.split('|') : [translation];
            if (keys.length > 1 && keys.length === transParts.length) {
                keys.forEach((kk, i) => {
                    targetDict[kk.trim()] = transParts[i].trim();
                });
            } else {
                keys.forEach(kk => {
                    targetDict[kk.trim()] = translation;
                });
            }
            if (buildReverse) {
                const enKeys = keys.map(s => s.trim()).filter(Boolean);
                const addReverse = (zh) => {
                    if (!zh) return;
                    const zhParts = zh.includes('|') ? zh.split('|') : [zh];
                    if (enKeys.length > 1 && zhParts.length === enKeys.length) {
                        zhParts.forEach((p, i) => {
                            const zhTerm = p.trim();
                            const enTerm = enKeys[i];
                            if (zhTerm && enTerm && !reverseSimpleDictionary[zhTerm]) {
                                reverseSimpleDictionary[zhTerm] = enTerm;
                            }
                        });
                    } else {
                        const baseEn = enKeys[0];
                        zhParts.forEach(p => {
                            const zhTerm = p.trim();
                            if (zhTerm && baseEn && !reverseSimpleDictionary[zhTerm]) {
                                reverseSimpleDictionary[zhTerm] = baseEn;
                            }
                        });
                    }
                };
                addReverse(entry['zh_cn']);
                addReverse(entry['zh_tw']);
            }
        });
    });
}

function isUniqueItemContainerWithImage(element, imgKey) {
    try {
        if (!imgKey) return false;
        const container = element.closest('article') || element.closest('div._item-body_dvpoe_1');
        if (!container) return false;
        const imgs = container.querySelectorAll('img');
        for (let img of imgs) {
            if (!img.src) continue;
            if (img.src.includes(imgKey)) return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function isItemTypeMatch(element, itemTypes) {
    if (!itemTypes || itemTypes.length === 0) return true;
    try {
        const container = element.closest('article') || element.closest('div._item-body_dvpoe_1');
        if (!container) return false;
        const text = container.textContent;
        return itemTypes.some(type => text.includes(type));
    } catch (e) {
        return false;
    }
}

function isSkippedTooltip(element) {
    try {
        if (!element || !element.closest) return false;
        const tip = element.closest('[role="tooltip"]');
        if (!tip) return false;
        
        const txt = tip.textContent || '';
        if (txt.includes('Unlock in the left corner to edit tree')) return true;
        
        try {
            const hasCoolGreyContainer = !!tip.querySelector('.bg-coolgrey-900');
            const hasExplicitLine = !!tip.querySelector('div.whitespace-pre-wrap[style*="item-explicit"], div[style*="item-explicit"]');
            
            if (hasCoolGreyContainer && hasExplicitLine) return true;
        } catch (e) {}
        
        return false;
    } catch (e) {
        return false;
    }
}

function translateMagicItemName(text) {
    if (!text.includes(' ')) return null;

    for (const baseItem of sortedItemKeys) {
        if (text.includes(baseItem)) {
            const parts = text.split(baseItem);
            if (parts.length !== 2) continue;

            const prefixPart = parts[0].trim();
            const suffixPart = parts[1].trim();   

            if (!prefixPart && !suffixPart) continue;

            const baseTrans = itemDictionary[baseItem];

            let prefixTrans = "";
            let prefixIsEn = false;
            if (prefixPart) {
                prefixTrans = prefixDictionary[prefixPart];
                if (!prefixTrans) {
                    prefixTrans = prefixPart;
                    prefixIsEn = true;
                }
            }

            let suffixTrans = "";
            let suffixIsEn = false;
            if (suffixPart) {
                suffixTrans = suffixDictionary[suffixPart];
                if (!suffixTrans) {
                    suffixTrans = suffixPart;
                    suffixIsEn = true;
                }
            }

            let result = "";

            if (prefixTrans) {
                result += prefixTrans;
                if (prefixIsEn) result += " ";
            }

            if (suffixTrans) {
                if (suffixIsEn) {
                    if (result && !result.endsWith(" ")) result += " ";
                    result += suffixTrans + " ";
                } else {
                    result += suffixTrans;
                }
            }

            result += baseTrans;

            return result.trim();
        }
    }
    return null;
}

let processedRules = [];
let prefixRules = [];

function generateCounterpartRule(original, translation) {
    if (!original || !translation) return null;
    
    let newOriginal = null;
    let newTranslation = translation;
    
    const hasIncreased = /\bincreased\b/i.test(original);
    const hasReduced = /\breduced\b/i.test(original);
    
    if (hasIncreased) {
        newOriginal = original.replace(/\bincreased\b/gi, "reduced");
        if (newTranslation.includes("提高") || newTranslation.includes("增加")) {
            newTranslation = newTranslation.replace(/提高/g, "降低").replace(/增加/g, "減少");
        } else {
            return null;
        }
    } else if (hasReduced) {
        newOriginal = original.replace(/\breduced\b/gi, "increased");
        if (newTranslation.includes("降低") || newTranslation.includes("減少")) {
            newTranslation = newTranslation.replace(/降低/g, "提高").replace(/減少/g, "增加");
        } else {
            return null;
        }
    }
    
    if (newOriginal && newOriginal !== original && newTranslation !== translation) {
        return { original: newOriginal, translation: newTranslation };
    }
    return null;
}

function processComplexRules() {
    complexTemplates.sort((a, b) => {
        const aHasType = !!(a.itemTypes || (a.group && a.group.some(g => g.itemTypes)));
        const bHasType = !!(b.itemTypes || (b.group && b.group.some(g => g.itemTypes)));
        if (aHasType && !bHasType) return -1;
        if (!aHasType && bHasType) return 1;

        const aHasClass = !!(a.className || (a.group && a.group.some(g => g.className)));
        const bHasClass = !!(b.className || (b.group && b.group.some(g => g.className)));
        if (aHasClass && !bHasClass) return -1;
        if (!aHasClass && bHasClass) return 1;

        const aLen = a.original ? a.original.length : 0;
        const bLen = b.original ? b.original.length : 0;
        return bLen - aLen;
    });

    processedRules = [];
    prefixRules = [];
    
    const explicitOriginals = new Set();
    complexTemplates.forEach(rule => {
        if (rule.original) explicitOriginals.add(rule.original);
        if (rule.group && Array.isArray(rule.group)) {
            rule.group.forEach(g => {
                if (g.original) explicitOriginals.add(g.original);
            });
        }
    });
    
    complexTemplates.forEach(rule => {
        const ruleNames = rule.names || rule.name;
        if (ruleNames && (rule.zh_cn || rule.zh_tw)) {
            const names = ruleNames.split('|');
            const translations = (rule[currentLanguage] || rule['zh_cn'] || "").split('|');
            
            if (names.length === translations.length) {
                names.forEach((name, index) => {
                    const trimmedName = name.trim();
                    const trimmedTrans = translations[index].trim();
                    if (trimmedName && trimmedTrans) {
                        simpleDictionary[trimmedName] = trimmedTrans;
                    }
                });
            }
        }

        if (rule.FlavourText && typeof rule.FlavourText === 'object') {
            const ft = rule.FlavourText;
            const original = ft.original;
            let translation = ft[currentLanguage] || ft['zh_cn'] || "";
            if (original && translation) {
                processedRules.push({
                    ...parsePoeTemplate(original),
                    translationTemplate: translation,
                    className: rule.className,
                    imgKey: rule.img || undefined
                });
            }
        }

        if (rule.group && Array.isArray(rule.group)) {
            rule.group.forEach(subRule => {
                const className = subRule.className || rule.className;
                
                let translation = subRule.translation;
                if (typeof translation === 'object' && translation !== null) {
                    translation = translation[currentLanguage] || translation['zh_cn'] || "";
                }

                if (subRule.original && translation) {
                    processedRules.push({
                        ...parsePoeTemplate(subRule.original),
                        translationTemplate: translation,
                        className: className,
                        imgKey: rule.img || undefined,
                        itemTypes: subRule.itemTypes || rule.itemTypes
                    });

                    const splitRegex = /^.+?[:：]\s*([\s\S]+)$/;
                    const originalMatch = subRule.original.match(splitRegex);
                    const transMatch = translation.match(splitRegex);

                    if (originalMatch && transMatch) {
                        const effectOriginal = originalMatch[1];
                        const effectTranslation = transMatch[1];
                        if (effectOriginal.length > 3) {
                            processedRules.push({
                                ...parsePoeTemplate(effectOriginal),
                                translationTemplate: effectTranslation,
                                className: className,
                                imgKey: rule.img || undefined,
                                itemTypes: subRule.itemTypes || rule.itemTypes
                            });
                        }
                    }

                    const counterpart = generateCounterpartRule(subRule.original, translation);
                    if (counterpart && !explicitOriginals.has(counterpart.original)) {
                        processedRules.push({
                            ...parsePoeTemplate(counterpart.original),
                            translationTemplate: counterpart.translation,
                            className: className,
                            imgKey: rule.img || undefined,
                            itemTypes: subRule.itemTypes || rule.itemTypes
                        });
                        explicitOriginals.add(counterpart.original);
                    }
                }
            });
            return;
        }

        let translation = rule.translation;
        if (typeof translation === 'object' && translation !== null) {
            translation = translation[currentLanguage] || translation['zh_cn'] || "";
        }

        if (rule.original && translation) {
            processedRules.push({
                ...parsePoeTemplate(rule.original),
                translationTemplate: translation,
                className: rule.className,
                imgKey: rule.img || undefined,
                itemTypes: rule.itemTypes
            });

            const splitRegex = /^.+?[:：]\s*(.+)$/;
            const originalMatch = rule.original.match(splitRegex);
            const transMatch = translation.match(splitRegex);

            if (originalMatch && transMatch) {
                const effectOriginal = originalMatch[1];
                const effectTranslation = transMatch[1];
                if (effectOriginal.length > 3) {
                    processedRules.push({
                        ...parsePoeTemplate(effectOriginal),
                        translationTemplate: effectTranslation,
                        className: rule.className,
                        imgKey: rule.img || undefined,
                        itemTypes: rule.itemTypes
                    });
                }
            }

            const counterpart = generateCounterpartRule(rule.original, translation);
            if (counterpart && !explicitOriginals.has(counterpart.original)) {
                processedRules.push({
                    ...parsePoeTemplate(counterpart.original),
                    translationTemplate: counterpart.translation,
                    className: rule.className,
                    imgKey: rule.img || undefined,
                    itemTypes: rule.itemTypes
                });
                explicitOriginals.add(counterpart.original);
            }
        }
    });

    prefixRules = processedRules.filter(r => r.isPrefixCandidate);
}

function parsePoeTemplate(template) {
    const keyToOriginalText = {};
    const placeholderIndices = [];

    const tokenRegex = /(\[[^|\]]+\|[^\]]+\]|\{[^{}]+\})/g;
    const parts = template.split(tokenRegex);

    const patternParts = parts.map(part => {
        if (!part) return '';

        const tagMatch = part.match(/^\[([^|\]]+)\|([^\]]+)\]$/);
        if (tagMatch) {
            const key = tagMatch[1];
            const text = tagMatch[2];
            keyToOriginalText[key] = text;
            return escapeRegExp(text);
        }

        const placeholderMatch = part.match(/^\{([^{}]+)\}$/);
        if (placeholderMatch) {
            const content = placeholderMatch[1];
            const numericMatch = content.match(/^(\d+)(?::.*)?$/);

            if (numericMatch) {
                placeholderIndices.push(parseInt(numericMatch[1]));
                return "([+\\-]?\\(?\\d+(?:\\.\\d+)?(?:\\s*[\\-—–]\\s*\\d+(?:\\.\\d+)?)?\\)?|#)";
            } else {
                placeholderIndices.push(content);
                return "(.+?)";
            }
        }

        if (/^\s*to\s*$/i.test(part)) {
            return "\\s*(?:to|[\\-—–])\\s*";
        }
        
        let escaped = escapeRegExp(part);
        
        escaped = escaped.replace(/([a-zA-Z]{3,})(?![a-zA-Z])/g, (match) => {
             if (/^(of|in|to|the|and|or|is|are|with|by|on|at|as)$/i.test(match)) return match;
             
             if (match.endsWith('y')) {
                 const base = match.slice(0, -1);
                 return `${base}(?:y|ies)`;
             }

             return `${match}(?:e?s)?`;
        });
        
        return escaped;
    });

    let pattern = patternParts.join('');

    pattern = pattern.replace(/\s+/g, "\\s+");
    
    let hasTrailingPunctuationGroup = false;
    if (!/[：:]\s*$/.test(template)) {
         pattern += "\\s*([:：]?)"; 
         hasTrailingPunctuationGroup = true;
    }
    
    const regex = new RegExp(`^\\s*${pattern}\\s*$`, 'i');

    return {
        regex,
        regexSource: pattern,
        isPrefixCandidate: placeholderIndices.length === 0,
        placeholderIndices,
        applyTranslation: (element, translationTemplate, matches) => {
            const reusedNodes = element.querySelectorAll('.ninja-reused');
            reusedNodes.forEach(node => {
                if (node._originalText !== undefined) {
                    node.textContent = node._originalText;
                    delete node._originalText;
                }
                node.classList.remove('ninja-reused', 'ninja-translation');
            });

            const generatedNodes = element.querySelectorAll('.ninja-translation');
            generatedNodes.forEach(node => {
                if (!node.classList.contains('ninja-reused')) {
                    node.remove();
                }
            });

            Array.from(element.childNodes).forEach(child => {
                if (child.dataset && child.dataset.ninjaHidden === "true") {
                    child.style.display = '';
                    delete child.dataset.ninjaHidden;
                }
                if (child.nodeType === Node.TEXT_NODE && child._originalText !== undefined) {
                    child.nodeValue = child._originalText;
                    delete child._originalText;
                }
            });


            const originalChildren = Array.from(element.childNodes).filter(n => {
                return !(n.classList && n.classList.contains('ninja-translation'));
            });

            if (hasTrailingPunctuationGroup && matches.length > placeholderIndices.length + 1) {
                const trailingPunctuation = matches[matches.length - 1];
                if (trailingPunctuation && !/[：:]\s*$/.test(translationTemplate)) {
                    translationTemplate += trailingPunctuation;
                }
            }

            const parts = translationTemplate.split(/(\[[^|\]]+\|[^\]]+\])/);
            
            let canPatchInPlace = true;
            const patchPlan = [];
            let childIndex = 0;

            const skipWhitespace = () => {
                while (childIndex < originalChildren.length) {
                    const node = originalChildren[childIndex];
                    if (node.nodeType === Node.TEXT_NODE && !node.nodeValue.trim()) {
                        childIndex++;
                    } else {
                        break;
                    }
                }
            };

            for (const part of parts) {
                if (!part) continue;

                skipWhitespace();

                const tagMatch = part.match(/^\[([^|\]]+)\|([^\]]+)\]$/);
                if (tagMatch) {
                    const key = tagMatch[1];
                    const translatedText = tagMatch[2];
                    
                    let originalText = keyToOriginalText[key];
                    if (!originalText) {
                        if (key.endsWith('s') && keyToOriginalText[key.slice(0, -1)]) {
                            originalText = keyToOriginalText[key.slice(0, -1)];
                        } else if (keyToOriginalText[key + 's']) {
                            originalText = keyToOriginalText[key + 's'];
                        } else {
                            originalText = key;
                        }
                    }

                    let foundNode = null;
                    if (childIndex < originalChildren.length) {
                        const node = originalChildren[childIndex];
                        if (node.nodeType === Node.ELEMENT_NODE) {
                             const nodeText = (node.textContent || "").trim();
                             if (nodeText === originalText) {
                                 foundNode = node;
                             } else if (nodeText + 's' === originalText || nodeText === originalText + 's') {
                                 foundNode = node;
                             }
                        }
                    }

                    if (foundNode) {
                        patchPlan.push({
                            node: foundNode,
                            text: translatedText,
                            isTag: true
                        });
                        childIndex++;
                    } else {
                        canPatchInPlace = false;
                        break;
                    }

                } else {
                    let text = part;
                    matches.slice(1).forEach((val, i) => {
                         const originalPlaceholderIndex = placeholderIndices[i];
                         
                         let replacement = val;
                         if (typeof originalPlaceholderIndex === 'string') {
                             replacement = simpleDictionary[val] || simpleDictionary[val.trim()] || val;
                         }

                         text = text.replace(new RegExp(`\\{${originalPlaceholderIndex}\\}`, 'g'), replacement);
                    });

                    if (childIndex < originalChildren.length) {
                        const node = originalChildren[childIndex];
                        if (node.nodeType === Node.TEXT_NODE) {
                            patchPlan.push({
                                node: node,
                                text: text,
                                isTag: false
                            });
                            childIndex++;
                        } else {
                            canPatchInPlace = false;
                            break;
                        }
                    } else {
                        canPatchInPlace = false;
                        break;
                    }
                }
            }

            skipWhitespace();
            if (childIndex < originalChildren.length) {
                canPatchInPlace = false;
            }

            if (canPatchInPlace) {
                patchPlan.forEach(step => {
                    if (step.isTag) {
                        if (step.node.textContent !== step.text) {
                            step.node._originalText = step.node.textContent;
                            step.node.textContent = step.text;
                            step.node.classList.add("ninja-reused");
                        }
                    } else {
                        if (step.node.nodeValue !== step.text) {
                            step.node._originalText = step.node.nodeValue;
                            step.node.nodeValue = step.text;
                        }
                    }
                });
                return;
            }

            const newNodes = [];
            const usedOriginalNodes = new Set();

            parts.forEach(part => {
                if (!part) return;
                
                const tagMatch = part.match(/^\[([^|\]]+)\|([^\]]+)\]$/);
                if (tagMatch) {
                    const key = tagMatch[1];
                    const translatedText = tagMatch[2];
                    
                    let originalText = keyToOriginalText[key];
                    if (!originalText) {
                        if (key.endsWith('s') && keyToOriginalText[key.slice(0, -1)]) {
                            originalText = keyToOriginalText[key.slice(0, -1)];
                        } else if (keyToOriginalText[key + 's']) {
                            originalText = keyToOriginalText[key + 's'];
                        } else {
                            originalText = key;
                        }
                    }

                    const foundNode = originalChildren.find(child => {
                        if (usedOriginalNodes.has(child)) return false;
                        if (child.nodeType !== Node.ELEMENT_NODE) return false;
                        const childText = (child.textContent || "").trim();
                        if (childText === originalText) return true;
                        if (childText + 's' === originalText || childText === originalText + 's') return true;
                        return false;
                    });

                    if (foundNode) {
                        usedOriginalNodes.add(foundNode);
                        if (foundNode.textContent !== translatedText) {
                            foundNode._originalText = foundNode.textContent;
                            foundNode.textContent = translatedText;
                            foundNode.classList.add("ninja-reused");
                        }
                        if (foundNode.dataset.ninjaHidden === "true") {
                            foundNode.style.display = '';
                            delete foundNode.dataset.ninjaHidden;
                        }
                        newNodes.push(foundNode);
                    } else {
                        const span = document.createElement('span');
                        span.className = "ninja-translation";
                        span.textContent = translatedText;
                        newNodes.push(span);
                    }
                } else {
                    let text = part;
                    matches.slice(1).forEach((val, i) => {
                         const originalPlaceholderIndex = placeholderIndices[i];
                         text = text.replace(new RegExp(`\\{${originalPlaceholderIndex}\\}`, 'g'), val);
                    });
                    
                    if (text) {
                        const span = document.createElement('span');
                        span.className = "ninja-translation";
                        span.textContent = text;
                        newNodes.push(span);
                    }
                }
            });

            originalChildren.forEach(child => {
                if (!usedOriginalNodes.has(child)) {
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        child.style.display = 'none';
                        child.dataset.ninjaHidden = "true";
                    } else if (child.nodeType === Node.TEXT_NODE) {
                        if (child.nodeValue !== '') {
                            child._originalText = child.nodeValue;
                            child.nodeValue = '';
                        }
                    }
                }
            });

            newNodes.forEach(node => element.appendChild(node));
        }
    };
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLeafLike(element) {
    if (element.classList.contains('filter-list-cell')) return false;

    if (element.children.length === 0) return true;
    const blockTags = ['DIV', 'P', 'SECTION', 'UL', 'OL', 'LI', 'TABLE', 'TR', 'TD', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV', 'ASIDE'];
    for (let i = 0; i < element.children.length; i++) {
        if (blockTags.includes(element.children[i].tagName)) {
            return false;
        }
    }
    return true;
}

function getOriginalText(element) {
    if (element.nodeType === Node.TEXT_NODE) {
        return element._originalText || element.nodeValue;
    }
    
    let text = '';
    element.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('ninja-translation')) {
            return;
        }
        
        if (node.nodeType === Node.TEXT_NODE) {
            text += (node._originalText !== undefined ? node._originalText : node.nodeValue);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node._originalText !== undefined) {
                text += node._originalText;
                return;
            }
            text += node.textContent || '';
        }
    });
    return text.trim();
}

function buildReverseDictionary() {
    reverseSimpleDictionary = {};
    
    const processDict = (dict) => {
        Object.keys(dict).forEach(en => {
            const trans = dict[en];
            if (!trans) return;
            const parts = trans.split('|').map(s => s.trim()).filter(Boolean);
            const enParts = en.split('|').map(s => s.trim()).filter(Boolean);
            if (parts.length > 1 && parts.length === enParts.length) {
                parts.forEach((p, i) => {
                    if (!reverseSimpleDictionary[p]) reverseSimpleDictionary[p] = enParts[i];
                });
            } else {
                parts.forEach(p => {
                    if (!reverseSimpleDictionary[p]) reverseSimpleDictionary[p] = en;
                });
            }
        });
    };

    processDict(itemDictionary);
    processDict(passiveDictionary);
    processDict(simpleDictionary);
}

function translateNode(node) {
    if (!isDictionaryLoaded) return;

    if (node.parentElement && node.parentElement.closest('.ninja-suggestion-box')) return;

    if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
         const link = node.parentElement.closest('a');
         if (link) {
             const hrefAttr = link.getAttribute('href');
             if (hrefAttr && hrefAttr.startsWith('#')) {
             } else if (link.href && link.href.includes('/Name/')) {
                 return;
             }
         }
    }
    if (window.location.href.includes('/Name/')) {
        if ((node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H1') ||
            (node.nodeType === Node.TEXT_NODE && node.parentElement && node.parentElement.closest('h1'))) {
            return;
        }
    }

    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (!text) return;

        const parent = node.parentElement;
        
        const isItemContext = parent && (
            parent.closest('article') || 
            parent.closest('[class*="item-body"]') ||
            parent.closest('.item-header') ||
            (parent.closest('h1') && parent.closest('h1').className.includes('font-semibold'))
        );

        const isPassiveContext = parent && (
            parent.closest('[role="tooltip"]') ||
            (parent.closest('[id^="_r_"]')) || 
            parent.closest('.bg-coolgrey-900')
        );

        const lookup = (key) => {
             if (isItemContext) {
                 return itemDictionary[key] || simpleDictionary[key] || passiveDictionary[key];
             }
             if (isPassiveContext) {
                 return passiveDictionary[key] || simpleDictionary[key] || itemDictionary[key];
             }
             return simpleDictionary[key] || itemDictionary[key] || passiveDictionary[key];
        };

        let dictValue = lookup(text);
        let trailingPunctuation = "";

        if (!dictValue) {
            const matchPunctuation = text.match(/^(.+?)([:：])$/);
            if (matchPunctuation) {
                const textWithoutColon = matchPunctuation[1];
                const punctuation = matchPunctuation[2];
                const val = lookup(textWithoutColon);
                if (val) {
                    dictValue = val;
                    trailingPunctuation = punctuation;
                }
            }
        }
        if (!dictValue) {
            const combined = translateSlashSeparated(text);
            if (combined) {
                dictValue = combined;
            }
        }

        if (!dictValue && isItemContext) {
            const magicName = translateMagicItemName(text);
            if (magicName) {
                dictValue = magicName;
            }
        }

        if (dictValue) {
            if (node.parentElement && !node.parentElement.dataset.originalText) {
                if (!/[\u4e00-\u9fa5]/.test(text)) {
                    node.parentElement.dataset.originalText = text;
                }
            }

            const match = node.nodeValue.match(/^(\s*)([\s\S]*?)(\s*)$/);
            if (match) {
                const prefix = match[1];
                const suffix = match[3];
                node.nodeValue = prefix + dictValue + trailingPunctuation + suffix;
            } else {
                node.nodeValue = dictValue + trailingPunctuation;
            }
        }
        return;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName;

        if (tagName === 'INPUT') {
            const ph = node.getAttribute('placeholder');
            if (ph) {
                const trans = simpleDictionary[ph] || simpleDictionary[ph.trim()];
                if (trans) {
                    node.setAttribute('placeholder', trans);
                }
            }
            return;
        }

        if (tagName === 'OPTGROUP') {
            const label = node.getAttribute('label');
            if (label) {
                const trans = simpleDictionary[label] || simpleDictionary[label.trim()];
                if (trans) {
                    node.setAttribute('label', trans);
                }
            }
        }

        if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT' || tagName === 'TEXTAREA') return;
        
        if (isLeafLike(node)) {
            const textContent = getOriginalText(node); 
            
            if (node._lastProcessedText === textContent) return;
            
             if (textContent && textContent.length >= 5 && textContent.length < 500) {

                 for (const rule of processedRules) {
                    if (rule.imgKey && !isUniqueItemContainerWithImage(node, rule.imgKey)) {
                        continue;
                    }

                    if (rule.itemTypes && !isItemTypeMatch(node, rule.itemTypes)) {
                        continue;
                    }

                    const match = textContent.match(rule.regex);
                    if (match) {
                        rule.applyTranslation(node, rule.translationTemplate, match);
                        node._lastProcessedText = textContent;
                        return;
                    }
                 }
             }
        }
        
        Array.from(node.childNodes).forEach(child => pendingNodes.add(child));
    }
}

function translateSlashSeparated(text) {
    if (!text || typeof text !== 'string') return "";
    const parts = text.split(/\s*\/\s*/);
    if (parts.length <= 1) return "";
    const translated = [];
    for (let i = 0; i < parts.length; i++) {
        const seg = parts[i].trim();
        if (!seg) return "";
        const t = simpleDictionary[seg] || "";
        if (!t) return "";
        translated.push(t);
    }
    return translated.join(' / ');
}

/* ============================================================================================================
 * [SECTION 5] 性能与调度 (Performance & Scheduling)
 * ============================================================================================================ */

let pendingNodes = new Set();
let timer = null;
let isHidden = document.hidden;

document.addEventListener('visibilitychange', () => {
    isHidden = document.hidden;
    if (!isHidden && pendingNodes.size > 0) {
        scheduleProcessing();
    }
});

const BATCH_TIME_BUDGET_VISIBLE = 16;
const BATCH_TIME_BUDGET_HIDDEN = 100;
const BATCH_CHECK_INTERVAL = 30;

function processQueueChunk() {
    if (pendingNodes.size === 0) return;
    
    const startTime = performance.now();
    let timeBudget = isHidden ? BATCH_TIME_BUDGET_HIDDEN : BATCH_TIME_BUDGET_VISIBLE;
    if (!isHidden && pendingNodes.size > 500) {
        timeBudget = 33; 
    }
    
    const iterator = pendingNodes.values();
    let processedCount = 0;
    
    while (true) {
        const next = iterator.next();
        if (next.done) break;
        
        const node = next.value;
        pendingNodes.delete(node);
        
        if (document.contains(node)) {
            translateNode(node);
        }
        
        processedCount++;
        
        if (processedCount % BATCH_CHECK_INTERVAL === 0) {
            if (performance.now() - startTime > timeBudget) {
                break;
            }
        }
    }

    if (pendingNodes.size > 0) {
        scheduleProcessing();
    }
}

function scheduleProcessing() {
    if (timer) return;
    
    if (isHidden) {
        timer = setTimeout(() => {
            timer = null;
            processQueueChunk();
        }, 1);
    } else {
        timer = requestAnimationFrame(() => {
            timer = null;
            processQueueChunk();
        });
    }
}

function processQueue() {
    if (pendingNodes.size === 0) return;
    const nodes = Array.from(pendingNodes);
    pendingNodes.clear();
    timer = null;
    nodes.forEach(node => {
        if (document.contains(node)) translateNode(node);
    });
}

const observer = new MutationObserver((mutations) => {
    if (!isDictionaryLoaded) return;

    let shouldProcess = false;

    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                    pendingNodes.add(node);
                    shouldProcess = true;
                }
            });
        } else if (mutation.type === 'characterData') {
            pendingNodes.add(mutation.target);
            shouldProcess = true;
        }
    });

    if (shouldProcess) {
        if (!isHidden && !timer) {
            processQueueChunk();
        }
        scheduleProcessing();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
});

/* ============================================================================================================
 * [SECTION 6] 模块初始化 (Initialization)
 * ============================================================================================================ */

function initIndependentFeatures() {
}

chrome.storage.local.get(['language', 'siteLanguageSettings', 'isDeveloper', 'enable_ninja_search'], function(result) {
    isDebug = result.isDeveloper || false;

    const siteLang = result.siteLanguageSettings?.ninja;
    if (siteLang) {
        currentLanguage = siteLang;
    } else if (result.language) {
        currentLanguage = result.language;
    }
    
    initIndependentFeatures();
    
    if (currentLanguage === 'en') {
        if (isDebug) console.log("[汉化] 已禁用 (设置为英文)");
        return;
    }

    if (window.NinjaSearch) {
        const dicts = {
            simpleDictionary,
            reverseSimpleDictionary,
            reverseDict_zh: reverseSimpleDictionary, 
            reverseDict_zh_tw: reverseSimpleDictionary,
            uniqueItemSet,
            skillItemSet,
            itemDictionary,
            passiveDictionary
        };
        const config = {
            currentLanguage,
            isDebug
        };
        
        window.NinjaSearch.initSearchData(dicts, config);
    }
    
    loadConfigurations();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "reloadSettings") {
        location.reload();
    }
});

/* ============================================================================================================
 * [SECTION 7] 交易功能 (Trade Features)
 * ============================================================================================================ */

const CATEGORY_MAP = {
    "Helmet": "armour.helmet",
    "Body Armour": "armour.chest",
    "Gloves": "armour.gloves",
    "Boots": "armour.boots",
    "Shield": "armour.shield",
    "Quiver": "armour.quiver",
    "Focus": "armour.focus",
    "Buckler": "armour.buckler",
    "Amulet": "accessory.amulet",
    "Belt": "accessory.belt",
    "Ring": "accessory.ring",
    "Talisman": "weapon.talisman",
    "Claw": "weapon.claw",
    "Dagger": "weapon.dagger",
    "One-Handed Sword": "weapon.onesword",
    "Two-Handed Sword": "weapon.twosword",
    "One-Handed Axe": "weapon.oneaxe",
    "Two-Handed Axe": "weapon.twoaxe",
    "One-Handed Mace": "weapon.onemace",
    "Two-Handed Mace": "weapon.twomace",
    "Spear": "weapon.spear",
    "Flail": "weapon.flail",
    "Quarterstaff": "weapon.warstaff",
    "Bow": "weapon.bow",
    "Crossbow": "weapon.crossbow",
    "Wand": "weapon.wand",
    "Sceptre": "weapon.sceptre",
    "Staff": "weapon.staff",
    "Fishing Rod": "weapon.rod",
    "Skill Gem": "gem.activegem",
    "Support Gem": "gem.supportgem",
    "Meta Gem": "gem.metagem",
    "Life Flask": "flask.life",
    "Mana Flask": "flask.mana",
    "Waystone": "map.waystone",
    "Map Fragment": "map.fragment",
    "Logbook": "map.logbook",
    "Breachstone": "map.breachstone",
    "Barya": "map.barya",
    "Pinnacle Key": "map.bosskey",
    "Ultimatum Key": "map.ultimatum",
    "Tablet": "map.tablet",
    "Divination Card": "card",
    "Relic": "sanctum.relic",
    "Omen": "currency.omen",
    "Rune": "currency.rune",
    "Soul Core": "currency.soulcore",
    "Idol": "currency.idol"
};

function initTradeFeatures() {
    let currentLang = 'en';
    let pinnedTooltip = null;
    
    function applyButtonStyle(el) {
        Object.assign(el.style, {
            color: '#eee',
            background: '#333',
            padding: '2px 8px',
            textDecoration: 'none',
            fontSize: '12px',
            borderRadius: '2px',
            border: '1px solid #555',
            cursor: 'pointer',
            lineHeight: '1.2'
        });
        el.onmouseenter = () => el.style.background = '#444';
        el.onmouseleave = () => el.style.background = '#333';
    }
    
    function getTopVisibleTooltip() {
        const candidates = Array.from(document.querySelectorAll('[role="tooltip"]'))
            .filter(el => el && el.nodeType === Node.ELEMENT_NODE)
            .filter(el => el.dataset && el.dataset.ninjaPinnedTooltip !== 'true');
        
        let best = null;
        let bestZ = -Infinity;
        
        for (const el of candidates) {
            const style = window.getComputedStyle(el);
            if (!style) continue;
            
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            if (parseFloat(style.opacity || '1') === 0) continue;
            if (el.getClientRects().length === 0) continue;
            
            const zIndex = Number.isFinite(parseFloat(style.zIndex)) ? parseFloat(style.zIndex) : 0;
            if (zIndex >= bestZ) {
                bestZ = zIndex;
                best = el;
            }
        }
        
        return best;
    }
    
    function makeSelectable(el) {
        if (!el) return;
        el.dataset.interactive = 'true';
        el.style.cursor = 'pointer';
        el.title = '点击选中/取消选中此条件进行搜索';
        
        el.addEventListener('mouseenter', () => {
            if (el.dataset.selected !== 'true') {
                el.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
        });
        
        el.addEventListener('mouseleave', () => {
            if (el.dataset.selected !== 'true') {
                el.style.backgroundColor = '';
            }
        });
        
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (el.dataset.selected === 'true') {
                el.dataset.selected = 'false';
                el.style.backgroundColor = '';
                el.style.border = '';
                el.style.borderRadius = '';
            } else {
                el.dataset.selected = 'true';
                el.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                el.style.border = '1px dashed #aaa';
                el.style.borderRadius = '4px';
            }
        });
    }
    
    function pinTooltip() {
        const tooltip = getTopVisibleTooltip();
        if (!tooltip) return false;
        
        if (pinnedTooltip) {
            pinnedTooltip.remove();
            pinnedTooltip = null;
        }
        
        const clone = tooltip.cloneNode(true);
        clone.dataset.ninjaPinnedTooltip = 'true';
        
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        
        clone.style.zIndex = '2147483647';
        clone.style.pointerEvents = 'auto';
        clone.style.userSelect = 'text';
        clone.style.webkitUserSelect = 'text';
        clone.style.cursor = 'auto';
        
        const toolbar = document.createElement('div');
        toolbar.className = 'ninja-tooltip-toolbar';
        Object.assign(toolbar.style, {
            position: 'absolute',
            top: '0px',
            right: '0',
            display: 'flex',
            gap: '6px',
            padding: '2px 4px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '4px',
            border: '1px solid #444',
            zIndex: '10'
        });
        
        let itemName = '';
        let originalName = '';
        const nameEl = clone.querySelector('h1') || clone.querySelector('.name') || clone.querySelector('.header');
        
        if (nameEl) {
            const subDiv = nameEl.querySelector('div');
            
            if (subDiv) {
                const styleStr = nameEl.getAttribute('style') || '';
                const isUnique = styleStr.includes('item-unique') || nameEl.classList.contains('text-unique');
                
                if (isUnique) {
                    itemName = subDiv.textContent.trim();
                    if (subDiv.dataset.originalText) originalName = subDiv.dataset.originalText;
                } else {
                    const temp = nameEl.cloneNode(true);
                    const tempDiv = temp.querySelector('div');
                    if (tempDiv) tempDiv.remove();
                    itemName = temp.textContent.trim();
                    if (nameEl.dataset.originalText) originalName = nameEl.dataset.originalText;
                }
            } else {
                itemName = nameEl.textContent.trim();
                if (nameEl.dataset.originalText) originalName = nameEl.dataset.originalText;
            }
            
            if (itemName.includes('\n')) itemName = itemName.split('\n')[0].trim();
            if (originalName && originalName.includes('\n')) originalName = originalName.split('\n')[0].trim();
        }
        
        if (!itemName) {
            clone.remove();
            return false;
        }
        
        const isModifierExplanation = itemName.includes('#%') || 
                                      /increased|reduced|more|less/i.test(itemName) ||
                                      !clone.querySelector('h1');
        
        if (isModifierExplanation) {
            clone.remove();
            return false;
        }
        
        const headerEl = clone.querySelector('header');
        const nameElForStyle = clone.querySelector('h1') || clone.querySelector('.name') || clone.querySelector('.header');
        const styleAttr = (headerEl?.getAttribute('style') || '') + (nameElForStyle?.getAttribute('style') || '');
        const isUnique = styleAttr.includes('item-unique') || styleAttr.includes('item-foil') || nameElForStyle?.classList?.contains('text-unique');
        
        let itemRarity = null;
        const getRarity = (el) => {
            if (!el) return null;
            const style = el.getAttribute('style') || '';
            if (style.includes('--item-unique') || style.includes('item-unique')) return 'unique';
            if (style.includes('--item-rare') || style.includes('item-rare')) return 'rare';
            if (style.includes('--item-magic') || style.includes('item-magic')) return 'magic';
            if (style.includes('--item-normal') || style.includes('item-normal')) return 'normal';
            return null;
        };
        itemRarity = getRarity(nameElForStyle) || getRarity(headerEl);
        if (!itemRarity && isUnique) itemRarity = 'unique';
        
        let itemCategory = null;
        const properties = clone.querySelectorAll('.property');
        for (const prop of properties) {
            const span = prop.querySelector('[data-original-text]');
            if (span) {
                const text = span.dataset.originalText;
                if (CATEGORY_MAP[text]) {
                    itemCategory = CATEGORY_MAP[text];
                    break;
                }
            }
            const text = prop.textContent.trim();
            if (CATEGORY_MAP[text]) {
                itemCategory = CATEGORY_MAP[text];
                break;
            }
        }
        
        const isGemStyle = styleAttr.includes('item-gem') || (headerEl && (headerEl.getAttribute('style') || '').includes('item-gem'));
        if (isGemStyle && !itemCategory) {
            itemCategory = 'gem';
        }
        
        let itemLevel = null;
        let ilvlContainer = null;
        const ilvlRegex = /(?:Item Level|物品等级)[:\s]+(\d+)/i;
        
        const ilvlEl = clone.querySelector('[data-original-text="Item Level:"]');
        if (ilvlEl) {
            const match = ilvlEl.textContent.match(/(\d+)/);
            if (match) {
                itemLevel = parseInt(match[1], 10);
                ilvlContainer = ilvlEl;
            }
        } else {
            const textWalker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
            while(textWalker.nextNode()) {
                const node = textWalker.currentNode;
                const match = node.textContent.match(ilvlRegex);
                if (match) {
                    itemLevel = parseInt(match[1], 10);
                    ilvlContainer = node.parentElement;
                    break;
                }
            }
        }
        if (ilvlContainer) makeSelectable(ilvlContainer);
        
        let itemQuality = null;
        let qualityContainer = null;
        const qualityRegex = /(?:Quality|品质|品質)(?:\s*\(.*?\))?[:\s]+(?:\+)?(\d+)%/i;
        
        const qualityEl = Array.from(clone.querySelectorAll('[data-original-text]'))
            .find(el => el.dataset.originalText && el.dataset.originalText.startsWith('Quality'));
        
        if (qualityEl) {
            let container = qualityEl.parentElement;
            while (container && container !== clone) {
                if (container.textContent.match(qualityRegex)) {
                    const match = container.textContent.match(qualityRegex);
                    itemQuality = parseInt(match[1], 10);
                    qualityContainer = container;
                    if (container.classList.contains('property')) break;
                }
                container = container.parentElement;
                if (container === clone) break;
            }
        } else {
            const textWalker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
            while(textWalker.nextNode()) {
                const node = textWalker.currentNode;
                const match = node.textContent.match(qualityRegex);
                if (match) {
                    itemQuality = parseInt(match[1], 10);
                    qualityContainer = node.parentElement;
                    break;
                }
            }
        }
        if (qualityContainer && !qualityContainer.classList.contains('property')) {
            makeSelectable(qualityContainer);
        }
        
        const tradeBtn = document.createElement('div');
        tradeBtn.textContent = '市集';
        tradeBtn.title = `在官方市集中搜索 ${originalName || itemName}`;
        applyButtonStyle(tradeBtn);
        
        tradeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (tradeBtn.dataset.loading === 'true') return;
            
            const originalText = tradeBtn.textContent;
            tradeBtn.textContent = '...';
            tradeBtn.dataset.loading = 'true';
            
            try {
                if (!window.TradeModule) {
                    alert('交易模块未加载');
                    return;
                }
                
                let searchName = originalName;
                
                if (!isUnique) {
                    const typeEl = clone.querySelector('.type');
                    if (typeEl) {
                        const typeOriginal = typeEl.dataset.originalText || typeEl.textContent.trim();
                        if (typeOriginal) {
                            searchName = typeOriginal;
                        }
                    }
                    
                    if (!searchName && headerEl) {
                        const divs = headerEl.querySelectorAll('div');
                        if (divs.length >= 2) {
                            const potentialType = divs[1];
                            const val = potentialType.dataset.originalText || potentialType.textContent.trim();
                            if (val) {
                                searchName = val;
                            }
                        }
                    }
                }
                
                if (!searchName) {
                    searchName = itemName;
                }
                
                if (searchName) {
                    searchName = searchName.replace(/[\r\n]+/g, ' ').trim();
                }
                
                const selectedStats = [];
                const selectedLines = clone.querySelectorAll('[data-selected="true"]');
                selectedLines.forEach(line => {
                    if (line === ilvlContainer || line === qualityContainer) return;
                    
                    const rawText = line.textContent.trim();
                    const originalTextEl = line.querySelector('[data-original-text]');
                    const originalText = originalTextEl?.dataset?.originalText || rawText;
                    
                    let statType = null;
                    const checkStyle = (el) => {
                        if (!el || !el.getAttribute) return null;
                        const style = el.getAttribute('style') || '';
                        if (style.includes('--item-enchanted')) return 'enchant';
                        if (style.includes('--item-implicit')) return 'implicit';
                        if (style.includes('--item-fractured')) return 'fractured';
                        return null;
                    };
                    
                    statType = checkStyle(line);
                    if (!statType) {
                        const children = line.querySelectorAll('*');
                        for (const child of children) {
                            const t = checkStyle(child);
                            if (t) {
                                statType = t;
                                break;
                            }
                        }
                    }
                    
                    if (rawText && rawText.length > 2) {
                        selectedStats.push({
                            visible: rawText,
                            original: originalText,
                            type: statType
                        });
                    }
                });
                
                const finalIlvl = (ilvlContainer && ilvlContainer.dataset.selected === 'true') ? itemLevel : null;
                const finalQuality = (qualityContainer && qualityContainer.dataset.selected === 'true') ? itemQuality : null;
                
                console.log('[市集搜索] 参数:', {
                    itemName,
                    searchName,
                    isUnique,
                    currentLang,
                    itemRarity,
                    itemCategory,
                    finalIlvl,
                    finalQuality,
                    selectedStatsCount: selectedStats.length
                });
                
                const url = await window.TradeModule.searchItem(
                    itemName,
                    searchName,
                    isUnique,
                    selectedStats,
                    currentLang,
                    itemRarity,
                    itemCategory,
                    finalIlvl,
                    finalQuality
                );
                
                if (url) {
                    window.open(url, '_blank');
                } else {
                    alert('未获取到搜索结果');
                }
            } catch (err) {
                console.error('[市集搜索] 失败:', err);
                alert('搜索失败: ' + (err.message || err));
            } finally {
                tradeBtn.textContent = originalText;
                tradeBtn.dataset.loading = 'false';
            }
        });
        
        toolbar.appendChild(tradeBtn);
        
        const copyBtn = document.createElement('div');
        copyBtn.textContent = '复制';
        copyBtn.title = '复制物品参数到剪贴板';
        applyButtonStyle(copyBtn);
        
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const selectedStats = [];
            const selectedLines = clone.querySelectorAll('[data-selected="true"]');
            selectedLines.forEach(line => {
                if (line === ilvlContainer || line === qualityContainer) return;
                const text = line.textContent?.trim();
                if (text && text.length > 2) {
                    selectedStats.push(text);
                }
            });
            
            const params = {
                name: originalName || itemName,
                type: isUnique ? 'unique' : 'base',
                stats: selectedStats,
                ilvl: (ilvlContainer && ilvlContainer.dataset.selected === 'true') ? itemLevel : null,
                quality: (qualityContainer && qualityContainer.dataset.selected === 'true') ? itemQuality : null,
                lang: currentLang
            };
            
            navigator.clipboard.writeText(JSON.stringify(params, null, 2))
                .then(() => {
                    const toast = document.createElement('div');
                    toast.textContent = '已复制到剪贴板';
                    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px 20px; background: #10b981; color: white; border-radius: 4px; z-index: 999999;';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2000);
                })
                .catch(() => alert('复制失败'));
        });
        
        toolbar.appendChild(copyBtn);
        clone.appendChild(toolbar);
        
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#aaa',
            zIndex: '20'
        });
        closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onmouseleave = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clone.remove();
            pinnedTooltip = null;
        });
        clone.appendChild(closeBtn);
        
        const explicitLines = Array.from(clone.querySelectorAll('.whitespace-pre-line, .property'));
        const markerSpans = clone.querySelectorAll('.ninja-translation, .ninja-reused, [data-ninja-hidden="true"], [data-original-text]');
        const contentBasedLines = Array.from(markerSpans).map(span => span.parentElement).filter(el => el && el.tagName === 'DIV');
        const statLines = [...new Set([...explicitLines, ...contentBasedLines])];
        
        statLines.forEach(line => {
            if (line.dataset.interactive === 'true') return;
            if (line.dataset.ninjaIgnore === 'true') return;
            
            const text = line.textContent.trim();
            if (text.includes('Right click to') || text.includes('点击右键以') || 
                text.includes('Used automatically') || text.includes('满足条件时自动使用') ||
                text.includes('Place into') || text.includes('放置到') ||
                text.includes('managed in the Skills Panel') || text.includes('技能面板中') || 
                text.includes('Lasts') || text.includes('持续') || 
                text.includes('Limited to') || text.includes('仅限') ||
                (text.endsWith('.') && text.length > 50)) return;
            
            if (line.classList.contains('property') && text.includes(',') && !/\d/.test(text)) return;
            
            const originalTextEl = line.querySelector('[data-original-text]');
            if (originalTextEl) {
                const ot = originalTextEl.dataset.originalText;
                if (CATEGORY_MAP[ot] || ot === 'Flask' || ot === 'Jewel' || ot === 'Charm' || ot === 'Radius') return;
            }
            
            if (originalTextEl && (originalTextEl.dataset.originalText === 'Stack Size' || originalTextEl.textContent === '堆叠数量')) return;
            if (text.startsWith('Stack Size') || text.startsWith('堆叠数量')) return;
            
            if (line.classList.contains('property')) {
                 if (text.includes('Recovers') || text.includes('回复') ||
                     text.includes('Consumes') || text.includes('消耗') ||
                     text.includes('Currently has') || text.includes('目前有')) return;
            }
            
            const header = clone.querySelector('header');
            if (header) {
                const style = header.getAttribute('style') || '';
                if (style.includes('item-currency')) return;
            }
            
            makeSelectable(line);
        });
        
        document.body.appendChild(clone);
        pinnedTooltip = clone;
        
        return true;
    }
    
    function init() {
        chrome.storage.local.get(['ninja_trade_realm'], (result) => {
            const realm = result.ninja_trade_realm || 'www';
            const realmToLang = {
                'www': 'en',
                'tw': 'zh_tw',
                'cn': 'zh_cn'
            };
            currentLang = realmToLang[realm] || 'en';
        });
        
        chrome.storage.onChanged.addListener((changes) => {
            if (changes.ninja_trade_realm) {
                const realm = changes.ninja_trade_realm.newValue;
                const realmToLang = {
                    'www': 'en',
                    'tw': 'zh_tw',
                    'cn': 'zh_cn'
                };
                currentLang = realmToLang[realm] || 'en';
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Alt' && !e.repeat) {
                pinTooltip();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (pinnedTooltip && !pinnedTooltip.contains(e.target)) {
                pinnedTooltip.remove();
                pinnedTooltip = null;
            }
        });
    }
    
    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTradeFeatures);
} else {
    setTimeout(initTradeFeatures, 500);
}
