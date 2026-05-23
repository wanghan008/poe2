var NinjaTranslationConfig = (function() {
    function getBasePath(lang) {
        return `data/${lang}/ninja/`;
    }

    function getSimpleFiles(lang) {
        const basePath = getBasePath(lang) + 'simple/';
        return [
            basePath + "1.Ninja_Ui.json",
            basePath + "2.Armour unique.json",
            basePath + "2.Currency Item name.json",
            basePath + "2.List of drop-disabled items.json",
            basePath + "2.Other unique.json",
            basePath + "2.Weapon unique.json",
            basePath + "2.Item Name.json",
            basePath + "2.Item Type.json",
            basePath + "3.Ascendancy passives.json",
            basePath + "3.Character Class.json",
            basePath + "3.Keystone Passive.json",
            basePath + "3.Notable Passive.json",
            basePath + "4.Gem Title Bar.json",
            basePath + "4.Item Skills List.json",
            basePath + "4.Lineage Supports List.json",
            basePath + "4.Passive Tree.json",
            basePath + "4.Skill Gems List.json",
            basePath + "4.Spirit Gems List.json",
            basePath + "4.Support Gems List.json",
            basePath + "5.Modifiers.json",
            basePath + "5.Prefix and Suffix.json",
            basePath + "5.Quality Modifiers.json",
            basePath + "5.Underline Modifiers.json",
            basePath + "6.Monster.json",
            basePath + "6.Quests.json",
            basePath + "7.waystones.json",
            basePath + "8.tools.json",
            basePath + "9.others.json",
            basePath + "10.Allocates.json"
        ];
    }

    function getComplexFiles(lang) {
        const basePath = getBasePath(lang) + 'modifiers/';
        const uniqueBasePath = basePath + 'Unique Modifiers/';
        
        return [
            basePath + "Attack Modifiers.json",
            basePath + "Attribute Modifiers.json",
            basePath + "Augment Modifiers.json",
            basePath + "Base Modifiers.json",
            basePath + "Common Modifiers.json",
            basePath + "Critical Modifiers.json",
            basePath + "Damage Modifiers.json",
            basePath + "Defences Modifiers.json",
            basePath + "Desecrated Modifiers.json",
            basePath + "Essence Modifiers.json",
            basePath + "Flasks Modifiers.json",
            basePath + "Jewellery Modifiers.json",
            basePath + "Jewels Modifiers.json",
            basePath + "Life Modifiers.json",
            basePath + "Mana Modifiers.json",
            basePath + "Other and Underline Modifiers.json",
            basePath + "Resistance Modifiers.json",
            basePath + "Speed Modifiers.json",
            basePath + "Universal Modifiers.json",
            uniqueBasePath + "Unique Modifiers_index.json",
            uniqueBasePath + "Armour Modifiers/Atziri's Acuity.json",
            uniqueBasePath + "Armour Modifiers/Atziri's Splendour.json",
            uniqueBasePath + "Armour Modifiers/Hyrri's Ire.json",
            uniqueBasePath + "Armour Modifiers/Morior Invictus.json",
            uniqueBasePath + "Armour Modifiers/Plaguefinger.json",
            uniqueBasePath + "Armour Modifiers/Rathpith Globe.json",
            uniqueBasePath + "Armour Modifiers/Simple Armour Modifiers.json",
            uniqueBasePath + "Armour Modifiers/The Covenant.json",
            uniqueBasePath + "Armour Modifiers/The Vertex.json",
            uniqueBasePath + "Other Modifiers/Against the Darkness.json",
            uniqueBasePath + "Other Modifiers/Controlled Metamorphosis.json",
            uniqueBasePath + "Other Modifiers/Darkness Enthroned.json",
            uniqueBasePath + "Other Modifiers/Defiance of Destiny.json",
            uniqueBasePath + "Other Modifiers/From Nothing.json",
            uniqueBasePath + "Other Modifiers/Headhunter.json",
            uniqueBasePath + "Other Modifiers/Heart of the Well.json",
            uniqueBasePath + "Other Modifiers/Ingenuity.json",
            uniqueBasePath + "Other Modifiers/Megalomaniac.json",
            uniqueBasePath + "Other Modifiers/Prism of Belief.json",
            uniqueBasePath + "Other Modifiers/Snakepit.json",
            uniqueBasePath + "Other Modifiers/Soul Tether.json",
            uniqueBasePath + "Other Modifiers/The Adorned.json",
            uniqueBasePath + "Other Modifiers/Undying Hate.json",
            uniqueBasePath + "Other Modifiers/Unique Flasks.json",
            uniqueBasePath + "Weapon Modifiers/Atziri's Rule.json",
            uniqueBasePath + "Weapon Modifiers/Sacred Flame.json"
        ];
    }

    function getConfigFiles(lang) {
        return {
            simple: getSimpleFiles(lang),
            complex: getComplexFiles(lang),
            fallbackComplex: getComplexFiles('zh_cn')
        };
    }

    return {
        getConfigFiles: getConfigFiles,
        getSimpleFiles: getSimpleFiles,
        getComplexFiles: getComplexFiles
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NinjaTranslationConfig;
}
