# POE2 市集汉化增强版

一个 POE2 Trade / Ninja 网页汉化扩展。

## 目录结构

```
POE2市集汉化增强版/
├── manifest.json           # 插件配置文件
├── popup.html              # 弹出窗口界面
├── popup.js                # 弹出窗口逻辑
├── options.html            # 设置页面
├── options.js              # 设置页面逻辑
├── js/
│   ├── background.js       # 后台服务脚本
│   ├── config/
│   │   ├── language_config.js    # 语言配置
│   │   └── database_config.js    # 数据库配置
│   ├── trade/
│   │   ├── app.js          # 市集页面脚本
│   │   ├── result.js       # 结果页面脚本
│   │   └── interface.js    # 界面注入脚本
│   ├── ninja/
│   │   └── content_Ninja.js # Ninja页面脚本
│   └── other/
│       ├── content_FilterBlade.js
│       ├── content_Mobalytics.js
│       ├── content_Maxroll.js
│       └── content_Poe2db.js
├── data/
│   ├── common/             # 公共数据
│   │   └── passivesNotable.json
│   ├── zh_cn/              # 简体中文数据
│   │   ├── trade/          # 市集数据
│   │   │   ├── item.json
│   │   │   ├── stats.json
│   │   │   ├── static.json
│   │   │   ├── filters.json
│   │   │   └── interface.json
│   │   └── ninja/          # Ninja数据
│   │       ├── simple/     # 简单词典
│   │       │   ├── 1.Ninja_Ui.json
│   │       │   ├── 2.Item_Name.json
│   │       │   └── ...
│   │       └── modifiers/  # 词缀模板
│   │           ├── Universal_Modifiers.json
│   │           └── ...
│   └── zh_tw/              # 繁体中文数据
│       ├── trade/
│       └── ninja/
└── images/                 # 图标等资源
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 数据更新指南

### 1. 市集数据 (Trade)

市集数据位于 `data/{lang}/trade/` 目录：

- **item.json**: 物品名称翻译
  ```json
  {
    "Crimson Amulet": "赤红护身符",
    "Gold Amulet": "帝金护身符"
  }
  ```

- **interface.json**: 界面文本翻译
  ```json
  {
    "Search": "搜索",
    "Filter": "筛选"
  }
  ```

### 2. Ninja数据

Ninja数据位于 `data/{lang}/ninja/` 目录：

- **simple/**: 简单词典，支持多语言格式
  ```json
  [
    { "Search": { "zh_cn": "搜索", "zh_tw": "搜尋" } }
  ]
  ```

- **modifiers/**: 复杂词缀模板

### 3. 更新步骤

1. 编辑对应的JSON文件
2. 保持JSON格式正确
3. 刷新插件或重新加载页面

## 功能特性

- ✅ 国际服市集 (Trade2) 汉化
- ✅ Ninja 网站汉化
- ✅ 简体/繁体中文切换
- ✅ 各站点独立语言设置
- ✅ 支持多个辅助网站 (FilterBlade, Mobalytics, Maxroll)

## 语言切换

1. 点击插件图标打开弹出窗口
2. 选择全局语言（简体/繁体/英文）
3. 或在设置页面为各站点单独设置语言
4. 刷新页面生效

## 数据格式说明

### 简单词典格式

```json
[
  { "英文原文": { "zh_cn": "简体中文", "zh_tw": "繁體中文" } }
]
```

或简单格式：

```json
{
  "英文原文": "简体中文翻译"
}
```

### 词缀模板格式

```json
[
  {
    "original": "Adds # to # Physical Damage",
    "translation": {
      "zh_cn": "附加 # - # 物理伤害",
      "zh_tw": "附加 # - # 物理傷害"
    }
  }
]
```

## 注意事项

- 更新数据时请备份原文件
- JSON文件必须使用UTF-8编码
- 确保JSON格式正确（可用在线工具验证）
