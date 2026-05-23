var DatabaseConfig = (function() {
    const DATA_BASE_PATH = 'data/';

    const TRADE_DATA_FILES = {
        items: {
            path: 'trade/items.json',
            description: '物品名称数据'
        },
        stats: {
            path: 'trade/stats.json',
            description: '词缀数据'
        },
        static: {
            path: 'trade/static.json',
            description: '通货/碎片等静态数据'
        },
        filters: {
            path: 'trade/filters.json',
            description: '筛选器数据'
        },
        interface: {
            path: 'trade/interface.json',
            description: '界面翻译数据'
        },
        passives: {
            path: 'trade/passivesNotable.json',
            description: '天赋数据'
        }
    };

    const NINJA_DATA_FILES = {
        simple: {
            baseFiles: [
                'ninja/simple/1.Ninja_Ui.json',
                'ninja/simple/2.Armour_unique.json',
                'ninja/simple/2.Currency_Item_name.json',
                'ninja/simple/2.Item_Name.json',
                'ninja/simple/2.Item_Type.json',
                'ninja/simple/2.Other_unique.json',
                'ninja/simple/2.Weapon_unique.json',
                'ninja/simple/2.List_of_drop_disabled_items.json',
                'ninja/simple/3.Ascendancy_passives.json',
                'ninja/simple/3.Character_Class.json',
                'ninja/simple/3.Keystone_Passive.json',
                'ninja/simple/3.Notable_Passive.json',
                'ninja/simple/4.Gem_Title_Bar.json',
                'ninja/simple/4.Item_Skills_List.json',
                'ninja/simple/4.Lineage_Supports_List.json',
                'ninja/simple/4.Passive_Tree.json',
                'ninja/simple/4.Skill_Gems_List.json',
                'ninja/simple/4.Spirit_Gems_List.json',
                'ninja/simple/4.Support_Gems_List.json',
                'ninja/simple/5.Modifiers.json',
                'ninja/simple/5.Prefix_and_Suffix.json',
                'ninja/simple/5.Quality_Modifiers.json',
                'ninja/simple/5.Underline_Modifiers.json',
                'ninja/simple/6.Monster.json',
                'ninja/simple/6.Quests.json',
                'ninja/simple/7.waystones.json',
                'ninja/simple/8.tools.json',
                'ninja/simple/9.others.json',
                'ninja/simple/10.Allocates.json'
            ],
            description: '简单翻译词典'
        },
        complex: {
            baseFiles: [
                'ninja/modifiers/Attack_Modifiers.json',
                'ninja/modifiers/Attribute_Modifiers.json',
                'ninja/modifiers/Augment_Modifiers.json',
                'ninja/modifiers/Base_Modifiers.json',
                'ninja/modifiers/Common_Modifiers.json',
                'ninja/modifiers/Critical_Modifiers.json',
                'ninja/modifiers/Damage_Modifiers.json',
                'ninja/modifiers/Defences_Modifiers.json',
                'ninja/modifiers/Desecrated_Modifiers.json',
                'ninja/modifiers/Essence_Modifiers.json',
                'ninja/modifiers/Flasks_Modifiers.json',
                'ninja/modifiers/Jewellery_Modifiers.json',
                'ninja/modifiers/Jewels_Modifiers.json',
                'ninja/modifiers/Life_Modifiers.json',
                'ninja/modifiers/Mana_Modifiers.json',
                'ninja/modifiers/Other_and_Underline_Modifiers.json',
                'ninja/modifiers/Resistance_Modifiers.json',
                'ninja/modifiers/Speed_Modifiers.json',
                'ninja/modifiers/Universal_Modifiers.json'
            ],
            description: '复杂模板规则'
        },
        uniqueModifiers: {
            indexPath: 'ninja/modifiers/Unique_Modifiers/Unique_Modifiers_index.json',
            description: '传奇物品词缀'
        }
    };

    function getTradeDataPath(lang, fileName) {
        if (!lang || lang === 'en') return null;
        return `${DATA_BASE_PATH}${lang}/${TRADE_DATA_FILES[fileName].path}`;
    }

    function getNinjaDataPath(lang, fileRelativePath) {
        if (!lang || lang === 'en') return null;
        return `${DATA_BASE_PATH}${lang}/${fileRelativePath}`;
    }

    function getAllTradeFiles(lang) {
        if (!lang || lang === 'en') return {};
        const result = {};
        Object.keys(TRADE_DATA_FILES).forEach(key => {
            result[key] = `${DATA_BASE_PATH}${lang}/${TRADE_DATA_FILES[key].path}`;
        });
        return result;
    }

    function getAllNinjaFiles(lang) {
        if (!lang || lang === 'en') return { simple: [], complex: [] };
        
        const result = {
            simple: [],
            complex: [],
            uniqueIndex: null
        };

        NINJA_DATA_FILES.simple.baseFiles.forEach(file => {
            result.simple.push(`${DATA_BASE_PATH}${lang}/${file}`);
        });

        NINJA_DATA_FILES.complex.baseFiles.forEach(file => {
            result.complex.push(`${DATA_BASE_PATH}${lang}/${file}`);
        });

        if (NINJA_DATA_FILES.uniqueModifiers.indexPath) {
            result.uniqueIndex = `${DATA_BASE_PATH}${lang}/${NINJA_DATA_FILES.uniqueModifiers.indexPath}`;
        }

        return result;
    }

    return {
        DATA_BASE_PATH: DATA_BASE_PATH,
        TRADE_DATA_FILES: TRADE_DATA_FILES,
        NINJA_DATA_FILES: NINJA_DATA_FILES,
        getTradeDataPath: getTradeDataPath,
        getNinjaDataPath: getNinjaDataPath,
        getAllTradeFiles: getAllTradeFiles,
        getAllNinjaFiles: getAllNinjaFiles
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseConfig;
}
