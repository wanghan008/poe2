(function() {
    'use strict';

    console.log('[POE2市集汉化] 结果页面脚本已加载');

    let affix;
    let passivesNotable;
    let stats_name;

    chrome.storage.local.get('language', ({ language }) => {
        console.log('[POE2市集汉化] 当前语言:', language);
        if (!language || language === 'us' || language === 'en') return;
        chrome.storage.local.get(['cache_us'], ({cache_us}) => {
            console.log('[POE2市集汉化] cache_us:', cache_us ? '已加载' : '未找到', '词缀数量:', cache_us?.affix ? Object.keys(cache_us.affix).length : 0);
            if (!cache_us) return;
            passivesNotable = cache_us.passivesNotable;
            affix = cache_us.affix;
            stats_name = cache_us.itemname;
            if (!affix || !stats_name || !passivesNotable) return;
            checkLoaded();
        });
    });

    const checkLoaded = () => {
        let targetNode = document.querySelector('#app');
        if (!targetNode) {
            setTimeout(checkLoaded, 500);
            return;
        }
        let config = { attributes: true, childList: true, subtree: true, characterData: false };
        let observer = new MutationObserver((mutations, observer) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.className === 'resultset') {
                        observer.disconnect();
                        resultsChange();
                    }
                });
            });
        });
        observer.observe(targetNode, config);
    };

    const resultsChange = () => {
        let targetNode = document.querySelector('.results');
        if (!targetNode) return;
        let observer = new MutationObserver((mutations, observer) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.className === 'row') {
                        translate();
                    }
                });
            });
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    };

    let timer;
    const translate = () => {
        if (timer) {
            window.clearTimeout(timer);
        }
        timer = window.setTimeout(() => {
            let mods = document.querySelectorAll('[data-field]');
            Array.prototype.filter
            .call(mods, (elm) => !~elm.className.indexOf('translated'))
            .forEach((elm) => {
                let datel = elm.parentNode.querySelector('.l');
                if (!!datel) { datel.innerHTML = datel.innerHTML.replace(/P/g,'前').replace(/S/g,'后'); }
                let field = elm.dataset['field'].replace('stat.','');
                let zhString;
                let originalString = elm.innerHTML;

                if (field === 'map_tier') {
                    zhString = originalString.replace('Map Tier','地图阶级');
                } else if (field === 'indexed') {
                    zhString = originalString.replace('a few seconds','几秒钟').replace(' ago','前').replace(/months?/,'个月').replace(/days?/,'天')
                    .replace(/hours?/,'小时').replace(/minutes?/,'分钟').replace(/years?/,'年').replace(' a ',' 1 ').replace(' an ',' 1 ');
                } else if (field === 'map_iiq') {
                    zhString = originalString.replace('Item Quantity','物品数量');
                } else if (field === 'stack_size') {
                    zhString = originalString.replace('Stack Size','堆叠数量');
                } else if (field === 'heist_wings') {
                    zhString = originalString.replace('Wings Revealed','发现的侧厅');
                } else if (field === 'heist_reward_rooms') {
                    zhString = originalString.replace('Reward Rooms Revealed','破解的奖励室');
                } else if (field === 'heist_escape_routes') {
                    zhString = originalString.replace('Escape Routes Revealed','发现逃亡路线');
                } else if (field === 'map_iir') {
                    zhString = originalString.replace('Item Rarity','物品稀有度');
                } else if (field === 'pseudo.pseudo_map_more_currency_drops') {
                    zhString = originalString.replace('More Currency','更多通货');
                } else if (field === 'pseudo.pseudo_map_more_map_drops') {
                    zhString = originalString.replace('More Maps','更多地图');
                } else if (field === 'pseudo.pseudo_map_more_scarab_drops') {
                    zhString = originalString.replace('More Scarabs','更多圣甲虫');
                } else if (field === 'map_packsize') {
                    zhString = originalString.replace('Monster Pack Size','怪物群大小').replace('Maximum Alive Reinforcements','最大存活援军');
                } else if (field === 'quality') {
                    zhString = originalString.replace('Quality','品质').replace(' Modifiers','词缀').replace('Speed','速度').replace('Attribute','属性').replace('Life and Mana','生命和魔力')
                        .replace('Critical','暴击').replace('Resistance','抗性').replace('Defence','防御').replace('Elemental Damage','元素伤害').replace('Caster','施法')
                        .replace('Attack','攻击').replace('Physical and Chaos Damage','物理伤害和混沌伤害');
                } else if (field === 'pdamage') {
                    zhString = originalString.replace('Physical Damage','物理伤害');
                } else if (field === 'edamage') {
                    zhString = originalString.replace('Elemental Damage','火焰，冰霜，闪电伤害').replace('Fire Damage','火焰伤害').replace('Cold Damage','冰霜伤害').replace('Lightning Damage','闪电伤害');
                } else if (field === 'crit') {
                    zhString = originalString.replace('Critical Strike Chance','攻击暴击率').replace('Critical Hit Chance','暴击率');
                } else if (field === 'aps') {
                    zhString = originalString.replace('Attacks per Second','每秒攻击次数');
                } else if (field === 'ar') {
                    zhString = originalString.replace('Armour','护甲');
                } else if (field === 'block') {
                    zhString = originalString.replace('Chance to Block','格挡几率');
                } else if (field === 'es') {
                    zhString = originalString.replace('Energy Shield','能量护盾');
                } else if (field === 'ev') {
                    zhString = originalString.replace('Evasion Rating','闪避值');
                } else if (field === 'gem_level') {
                    zhString = originalString.replace('Level','等级');
                } else if (field === 'heist_lockpicking') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Lockpicking','解密术').replace('in','的');
                } else if (field === 'heist_brute_force') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Brute Force','凶蛮之力').replace('in','的');
                } else if (field === 'heist_perception') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Perception','洞察').replace('in','的');
                } else if (field === 'heist_demolition') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Demolition','爆破').replace('in','的');
                } else if (field === 'heist_counter_thaumaturgy') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Counter-Thaumaturgy','逆向奇术').replace('in','的');
                } else if (field === 'heist_trap_disarmament') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Trap Disarmament','解除陷阱').replace('in','的');
                } else if (field === 'heist_agility') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Agility','灵敏').replace('in','的');
                } else if (field === 'heist_deception') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Deception','欺诈').replace('in','的');
                } else if (field === 'heist_engineering') {
                    zhString = originalString.replace('Requires','需要').replace('Level','等级').replace('Engineering','工程学').replace('in','的');
                } else if (field === 'heist_objective_value') {
                    zhString = originalString.replace('Heist Target','赏金目标').replace('Moderate Value','价值中等').replace('High Value','价值很高').replace('Precious','珍稀之物').replace('Priceless','无价之宝');
                } else if (field === 'area_level') {
                    zhString = originalString.replace('Area Level','区域等级');
                } else {
                    let usString = affix[field]?.u?.replace(/\n/g,'<br>');
                    zhString = affix[field]?.z;
                    if (!!usString === false || !!zhString === false) {
                        elm.classList.add('translated');
                        return;
                    }
                    if (!~originalString.search(' # ') && !!~zhString.search(' # ')) {
                        usString = usString.replace(' an ',' # ');
                        originalString = originalString.replace(' an ',' 1 ');
                    } else if (!!~field.search('pseudo_total_intelligence|pseudo_total_strength|pseudo_total_dexterity')) {
                        zhString = zhString.replace('%',' ');
                    }

                    if (!!affix[field].o) {
                        let option = affix[field].o;
                        if (field === 'enchant.stat_3948993189') {
                            let Small = originalString.split('Added Small Passive Skills grant: ');
                            if (Small.length == 3) {
                                let finstr = originalString.replace('<br>','\n').replace(/Added Small Passive Skills grant: /g,'');
                                if (!!option[finstr]) {
                                    let zharr = option[finstr].split('\n');
                                    let usarr = finstr.split('\n');
                                    zhString = originalString.replace(/Added Small Passive Skills grant: /g,'增加的小天赋获得：').replace(usarr[0],zharr[0]).replace(usarr[1],zharr[1]);
                                }
                            } else {
                                let val = option[Small[1]];
                                if (!!val) { zhString = zhString.replace('#', ' ' + val + ' '); }
                            }
                        } else if (field === 'enchant.stat_3522828354') {
                            let Small = option[originalString.replace(/Strongboxes in your Maps are at least (.+)/,'$1')];
                            if (!!Small) { zhString = "地图内的保险箱里至少为 # 物品".replace('#', ' ' + Small.replace('的', ' ') + ' '); }
                        } else if (!!~field.search('stat_2954116742|stat_3459808765|stat_1898784841|stat_1422267548|stat_2954116742')) {
                            let Small = passivesNotable[originalString.replace(/Allocates (.+)/,'$1')];
                            if (!!Small) { zhString = zhString.replace('#', '【' + Small.n + '】'); }
                        } else if (!!~field.search('stat_1190333629|stat_2460506030')) {
                            let Small = passivesNotable[originalString.replace(/Allocates (.+) if you have.*/,'$1')];
                            if (!!Small) { zhString = zhString.replace('#', '【' + Small.n + '】'); }
                        } else if (field === 'implicit.stat_3624393862') {
                            let Small = option[originalString.replace(/Map is occupied by (.+)/,'$1')];
                            if (!!Small) { zhString = zhString.replace('#','【' + Small + '】'); }
                        } else if (field === 'implicit.stat_1792283443') {
                            let Small = option[originalString.replace(/Area is influenced by (.+)/,'$1')];
                            if (!!Small) { zhString = zhString.replace('#',' ' + Small + ' '); }
                        } else if (field === 'enchant.stat_3187151138') {
                            let Small = option[originalString.replace(/Your Maps contain (.+)/,'$1')];
                            if (!!Small) { zhString = ("该地图会出现【#】").replace('#',Small); }
                        } else if (field === 'explicit.stat_3642528642') {
                            let Small = option[originalString.replace(/Only affects Passives in (.+) Ring/,'$1')];
                            if (!!Small) { zhString = zhString.replace('# 环', ' ' + Small + ' 圈'); }
                        } else if (field === 'explicit.stat_1190121450') {
                            let Small = option[originalString.replace(/You have (.+) Conflux for.*/,'$1')];
                            if (!!Small) { zhString = "你每隔 8 秒获得一次 # 汇流，持续 3 秒".replace('#',Small); }
                        } else if (field === 'explicit.stat_2878779644') {
                            let Small = option[originalString.replace(/Grants Level 20 Summon Bestial (.+) Skill/,'$1')];
                            if (!!Small) { zhString = "获得 20 级的#".replace('#','【' + Small + '】'); }
                        } else if (field === 'explicit.stat_2422708892') {
                            let Small = option[originalString.replace(/Passives in Radius of (.+) can be Allocated.*/,'$1')];
                            if (!!Small) { zhString = "范围内的天赋【"+ Small + "】可以在未连结至天赋树的情况下配置"; }
                        } else if (field === 'implicit.stat_2563183002') {
                            let Small = option[originalString.replace(/Map contains (.+)'s Citadel.*/,'$1')];
                            if (!!Small) { zhString = zhString.replace("#'s", ' '+Small+' ') + '<br>增加 '+Small+ ' 掉落的奖励数量，等于物品总量的 20%'; }
                        } else if (field === 'pseudo.pseudo_temple_apex') {
                            let Small = affix.roomxz[originalString.replace('Has Room: ','')];
                            if (!!Small) { zhString = "内有房间："+ Small; }
                        } else if (field === 'explicit.stat_3872739249') {
                            let Small = option[originalString.replace(/Grants Summon (.+) Skill/,'$1')];
                            if (!!Small) { zhString = "获得【"+ Small + "】"; }
                        } else if (!!~field.search('pseudo_tangled_implicit_tier|pseudo_searing_implicit_tier')) {
                            let arr = /Implicit Modifier \((\d)\)/.exec(originalString);
                            if (!!arr) {
                                let str = ["次级","高级","顶级","卓越","精细","完美"][arr[1]-1];
                                zhString = zhString.replace('#',arr[1]) + str;
                            }
                        } else if (field === 'enchant.stat_832377952') {
                            let Small = option[originalString.replace(/Harvests in your Maps contain at least one Crop of (.+) Plants/,'$1')];
                            if (!!Small) { zhString = zhString.replace('#', Small); }
                        } else if (field === 'implicit.stat_3159649981') {
                            let Small = option[originalString.replace('Area contains ','')];
                            if (!!Small) { zhString = zhString.replace('#', Small); }
                        } else if (field === 'enchant.stat_1542416476') {
                            let Small = option[originalString.replace('Breaches in your Maps belong to ','')];
                            if (!!Small) { zhString = zhString.replace('#', Small); }
                        }
                        if (zhString == affix[field].z) {
                            elm.innerText = affix[field].u;
                            zhString = originalString + '<span style="color:#F00">〔此词缀需要修复,请反馈〕</span>';
                        }
                    } else if (field === 'explicit.stat_3408048164') {
                        zhString = originalString.replace('to', '-').replace('Adds', '每个暴击球为法术附加').replace('Cold Damage to Spells per Power Charge', '基础冰霜伤害');
                    } else if (field === 'sanctum.stat_386901949') {
                        if (originalString == 'An additional Room is revealed on the Sanctum Map') {
                            zhString = "禁域地图上揭晓了一个额外的房间";
                        } else if (originalString == '2 additional Rooms are revealed on the Sanctum Map') {
                            zhString = "禁域地图上揭晓了2个额外的房间";
                        } else {
                            zhString = originalString + '<span style="color:#F00">〔此词缀需要修复,请反馈〕</span>';
                        }
                    } else if (!!~field.indexOf('stat_286947568') && !!~originalString.indexOf('amount')) {
                        zhString = '玩家阻挡被压制的法术伤害量 #%';
                        usString = 'Players have #% to amount of Suppressed Spell Damage Prevented';
                    } else if (!!~field.indexOf('stat_4116705863') && !!~originalString.indexOf('amount')) {
                        zhString = '阻挡被压制的法术伤害量 #%';
                        usString = '#% to amount of Suppressed Spell Damage Prevented';
                    } else if (!!~field.indexOf('stat_76458612')) {
                        zhString = "你在天赋树上连接到一个职业的出发位置时，你获得：<br>野蛮人：每秒生命再生 #%<br>决斗者：近战打击距离 +#<br>游侠：药剂充能获取率提高  #%<br>暗影：攻击和施法速度提高  #%<br>女巫：技能效果持续时间延长  #%<br>圣堂武僧：攻击和法术伤害格挡率 #%<br>贵族：伤害提高  #%";
                        usString = "While your Passive Skill Tree connects to a class' starting location, you gain:<br>Marauder: #% of Life Regenerated per second<br>Duelist: +# to Melee Strike Range<br>Ranger: #% increased Flask Charges gained<br>Shadow: #% increased Attack and Cast Speed<br>Witch: #% increased Skill Effect Duration<br>Templar: #% Chance to Block Attack and Spell Damage<br>Scion: #% increased Damage";
                    } else if (field === 'enchant.stat_1471796012') {
                        zhString = originalString.replace('Cobra Lash Chains', '【毒蛇鞭击】有额外').replace('additional times', '次连锁弹射');
                    } else if (!!~usString.indexOf('#')) {
                        if (!!~field.search('stat_2257592286') && !!~originalString.search('\\d+?% reduced Hiring Fee$')) {
                            usString = '#% increased Hiring Fee';
                        } else if (field === 'explicit.stat_587431675' && !!~originalString.search('increased Critical Strike Chance')) {
                            usString = '#% increased Critical Strike Chance';
                            zhString = '暴击率提高 #%';
                        } else if (!!~field.search('stat_762600725') && !!~originalString.search('Lose \\+\\d+? Life when you Block')) {
                            usString = 'Lose +# Life when you Block';
                            zhString = '生命在你格挡时失去 #';
                        } else if (field === 'pseudo.pseudo_total_chaos_resistance') {
                            zhString = '+#% 最大混沌抗性';
                        }

                        let zhstr = zhString;
                        let usstr = usString.split(' (')[0];

                        if (!!~originalString.indexOf('reduced') && !!~usstr.indexOf('increased') && !!~zhstr.search('提高|加快|延长|扩大|增强|增加|增大')) {
                            usstr = usstr.replace('increased','reduced');
                            zhstr = zhstr.replace('提高','降低').replace('延长','缩短').replace('扩大','缩小').replace('加快','减慢').replace('增强','减弱').replace('增加','减少').replace('增大','缩小');
                        }
                        if (!!~originalString.indexOf('Lose') && !!~usstr.indexOf('Recover') && !!~zhstr.indexOf('恢复')) {
                            usstr = usstr.replace('Recover','Lose');
                            zhstr = zhstr.replace('恢复','失去');
                        }
                        if (!!~originalString.indexOf('slower') && !!~usstr.indexOf('faster') && !!~zhstr.indexOf('加快')) {
                            usstr = usstr.replace('faster','slower');
                            zhstr = zhstr.replace('加快','减慢');
                        }
                        if (!!~originalString.indexOf('Lose') && !!~usstr.indexOf('Gain') && !!~zhstr.search('获得|回复')) {
                            usstr = usstr.replace('Gain','Lose');
                            zhstr = zhstr.replace('获得','损失').replace('回复','失去');
                        }
                        if (!!~originalString.indexOf('increased') && !!~usstr.indexOf('reduced') && !!~zhstr.search('降低|缩短')) {
                            usstr = usstr.replace('reduced','increased');
                            zhstr = zhstr.replace('降低','提高').replace('缩短','延长');
                        }
                        if (!!~originalString.indexOf('less') && !!~usstr.indexOf('more') && !!~zhstr.search('总增|增加|扩大')) {
                            usstr = usstr.replace('more','less');
                            zhstr = zhstr.replace('总增','总降').replace('增加','减少').replace('扩大','缩小');
                        }
                        if (!!~usstr.search('#\\s+?to\\s+?#') && !!~zhstr.search('#\\s+?([到-]|to)\\s+?#') && !~originalString.search('\\d+?\\s+?to\\s+?\\d+?')) {
                            usstr = usstr.replace('# to #','#');
                            zhstr = zhstr.replace('# 到  #','#');
                        }
                        if (!~usstr.search('#\\s+?to\\s+?#') && !~zhstr.search('#\\s+?[到-]\\s+?#') && !!~originalString.search('\\d+?\\s+?to\\s+?\\d+?')) {
                            usstr = usstr.replace('#','# to #');
                            zhstr = zhstr.replace('#','# - #');
                        }

                        let regExpString = usstr
                            .replace(/\b(\w+?)s?\b/gim, '$1s*?')
                            .replace(/%/gim, '\\%')
                            .replace(/\+([^#])/gim, '\\+$1')
                            .replace(/[+-]?#/gim, '(\\S+)');
                        let affixRegExp = new RegExp(regExpString, 'igm');
                        let match = affixRegExp.exec(originalString);

                        if (match && match.length >= 1) {
                            match.shift();
                            zhString = zhstr.replace(/[+-]?#/gim, () => match.shift());
                        } else {
                            let numRange = /\[(\d+?)\]/gim.exec(elm?.parentNode?.querySelector('.lc')?.querySelector('.d')?.innerHTML);
                            if (numRange && numRange.length >= 1) {
                                numRange.shift();
                                zhString = zhString.replace(/#/gim, () => numRange.shift());
                            } else {
                                elm.innerText = affix[field].u;
                            }
                        }
                    } else if (usString !== originalString) {
                        if (!!~originalString.indexOf('Your Maps are ') && !!~usString.indexOf('Area is ')) {
                            usString = usString.replace('Area is ','Your Maps are ');
                        } else if (!!~originalString.search(/Your Maps /i) && !!~usString.search(/Areas? /)) {
                            usString = usString.replace(/Areas? /,'Your Maps ');
                        } else if (!!~originalString.indexOf('Maps are ') && !!~usString.indexOf('Area are ')) {
                            usString = usString.replace('Area are ','Maps are ');
                        } else if (!!~originalString.indexOf('Map Bosses are ') && !!~usString.indexOf('Unique Boss is ')) {
                            usString = usString.replace('Unique Boss is ','Map Bosses are ');
                        } else if (!!~originalString.indexOf('Map Bosses ') && !!~usString.indexOf('Unique Boss ')) {
                            usString = usString.replace('Unique Boss ','Map Bosses ');
                        }
                        let affixRegExp = new RegExp(usString.replace(/\b(\w+?)s?\b/gim, '$1s*').replace(/([%+-.\)\(])/gim, '\\$1'), 'igm');
                        if (!~field.search('stat_3481854423|stat_387722020|stat_3250634678|stat_3224819794|stat_4265846487|stat_906446422|stat_3804597710|veiled\.mod') && (!~originalString.search(affixRegExp))) {
                            let numberRegExp = new RegExp('\\d+');
                            let originalNumber = numberRegExp.exec(originalString);
                            let zhNumber = numberRegExp.exec(zhString);
                            if (originalNumber && originalNumber.length > 0) {
                                originalNumber = originalNumber.shift();
                                if (zhNumber && zhNumber.length > 0) {
                                    zhNumber = zhNumber.shift();
                                    zhString = zhString.replace(zhNumber, () => originalNumber);
                                } else {
                                    zhString = zhString.replace(/#/gim, () => originalNumber);
                                }
                            } else {
                                elm.innerText = affix[field].u;
                            }
                        }
                    }
                }

                if (!!~field.indexOf('delirium') || !!~field.indexOf('monster')) {
                    zhString = zhString.replace(/\(.+?\)/,'');
                } else if (field === 'explicit.stat_2304729532' && !!~originalString.search('tripled')) {
                    zhString = '固定基底词缀三倍效果加成';
                }

                elm.setAttribute('title', elm.innerText);
                if (!!~field.search('veiled\.mod')) {
                    elm.insertAdjacentHTML('afterend', `<span style="color:#00FF00">${zhString}</span>`);
                } else {
                    elm.innerHTML = zhString;
                }
                if (!~field.indexOf('.')) { elm.parentNode.classList.add('translated'); }
                elm.classList.add('translated');
            });

            Array.prototype.filter
            .call(document.querySelectorAll('.notableProperty'), (elm) => !~elm.className.indexOf('translated'))
            .forEach((elm) => {
                let colourAugmented = elm.querySelector('.colourAugmented');
                let translate = passivesNotable[colourAugmented?.innerHTML];
                if (!translate) { return; }
                elm.setAttribute('title','【' + translate.n + '】\n' + translate.d.replace(/<br>/g,'\n') + '\n' + elm.innerText);
                elm.querySelector('.lc').innerHTML = elm.querySelector('.lc').innerHTML.replace(/span>.*$/,'span>');
                elm.querySelector('.colourAugmented').innerHTML = '【' + translate.n + '】<span style="color: #83838d;font-size: 9px;"><鼠标悬停显示效果></span>';
                elm.classList.add('translated');
            });

            Array.prototype.filter
            .call(document.querySelectorAll('.itemHeader,.vaalHeader,.hybridHeader'), (elm) => !~elm.className.indexOf('translated'))
            .forEach((elm) => {
                let itemNames = elm.querySelectorAll('.itemName');
                let name_uf, name_ub;
                itemNames.forEach((name) => {
                    let regstr = /class="lc">(.+?)<\/span>/gim.exec(name.innerHTML);
                    if (regstr && regstr.length >= 1) {
                        if (!~name.className.indexOf('typeLine')) {
                            name_uf = regstr[1];
                        } else {
                            name_ub = regstr[1];
                        }
                    }
                });
                let name_zb = stats_name[name_ub] ? stats_name[name_ub] + '(' + name_ub + ')' : null;
                let name_u_b = name_ub;
                if (!name_zb) {
                    let name_zu_b = name_ub;
                    let getzb = (str) => {
                        name_u_b = name_u_b.replace(str,'');
                        if (!!stats_name[name_u_b]) { name_zb = name_zu_b.replace(name_u_b, stats_name[name_u_b] + '(' + name_u_b + ')'); }
                    };
                    if (!name_zb && !!~name_ub.indexOf('Synthesised ')) {
                        name_zu_b = name_zu_b.replace('Synthesised','Synthesised(忆境)');
                        getzb('Synthesised ');
                    }
                    if (!name_zb && !!~name_ub.indexOf('Superior ')) {
                        name_zu_b = name_zu_b.replace('Superior','Superior(精良的)');
                        getzb('Superior ');
                    }
                    if (!name_zb) {
                        let name_u__b = name_ub.replace(/ of .*$/,'');
                        let Reg = new RegExp(/^\S+ /);
                        if (!stats_name[name_u__b]) { name_u__b = name_u__b.replace(Reg,''); }
                        if (!stats_name[name_u__b]) { name_u__b = name_u__b.replace(Reg,''); }
                        if (!!stats_name[name_u__b]) { name_zb = name_zu_b.replace(name_u__b, stats_name[name_u__b] + '(' + name_u__b + ')'); }
                    }
                }
                if (!!name_zb) {
                    if (!!name_uf) {
                        let finstr = stats_name[name_uf + ' ' + name_u_b];
                        if (finstr) { elm.innerHTML = elm.innerHTML.replace('>' + name_uf + '<','>' + finstr.replace(' ' + stats_name[name_u_b],'') + '(' + name_uf + ')' + '<'); }
                    }
                    elm.innerHTML = elm.innerHTML.replace('>' + name_ub + '<','>' + name_zb + '<');
                    elm.classList.add('translated');
                }
            });

            Array.prototype.filter
            .call(document.querySelectorAll('.requirements'), (elm) => !~elm.className.indexOf('translated'))
            .forEach((elm) => {
                elm.innerHTML = elm.innerHTML.replace('Requires','需求').replace('Level','等级').replace(/Str(ength)?/,'力量').replace(/Dex(terity)?/,'敏捷').replace(/Int(elligence)?/,'智慧').replace('in','的')
                .replace('Any Job','任意任务').replace('Class','职业').replace('Witch','女巫').replace('Scion','贵族').replace('Marauder','野蛮人').replace('Ranger','游侠').replace('maximum','最大')
                .replace('Duelist','决斗者').replace('Templar','圣堂武僧').replace('Shadow','暗影刺客').replace('requirements','最大');
                elm.classList.add('translated');
            });

            Array.prototype.filter
            .call(document.querySelectorAll('.property'), (elm) => !~elm.className.indexOf('translated'))
            .forEach((elm) => {
                let reg = {
                    ' to ':" ", 'Critical Strike Chance':"暴击率", 'Effectiveness of Added Damage':"伤害效用", 'Replaces a':"替换一个", ' Intelligence':"智力", ' Attribute':"属性", ' Strength':"力量", ' Dexterity':"敏捷",
                    'Passive Skill':"天赋技能", Notable:"核心", Keystone:"基石", Ancestral:"先祖", " Tattoo":"文身", Loyalty:"忠诚",
                    Bow:"弓", 'Rune ':"符文", Claw:"爪", Dagger:"匕首", Warstaff:"战杖", Staff:"长杖", Axe:"斧", 'Two Handed ':"双手", 'Two Hand ':"双手", 'One Handed ':"单手", Mace:"锤", Sword:"剑", Wand:"法杖",
                    'Fishing Rod':"鱼竿", Abyss:"深渊", Client:"客户", 'Alert Level Reduction':"警报等级衰减", 'Time Before Lockdown':"封锁前的时间", 'This item can be equipped by':"该物品可以装备给",
                    'Any Heist member can equip this item.':"任何赏金猎人都可以装备该物品。", Sceptre:"短杖", 'Weapon Range':"武器范围", metres:"米", Attack:"攻击", Melee:"近战", Strike:"打击", Slam:"猛击",
                    Warcry:"战吼", Spell:"法术", Arcane:"奥术", Brand:"烙印", Orb:"法球", Nova:"新星", Channelling:"持续吟唱", Physical:"物理", Fire:"火焰", Cold:"冰霜", Lightning:"闪电", Chaos:"混沌",
                    Projectile:"投射物", Chaining:"连锁", Prismatic:"虹光", Minion:"召唤生物", Mine:"地雷", Trap:"陷阱", Golem:"图腾", Aura:"光环", Herald:"捷", Stance:"姿态", Guard:"护卫", Totem:"图腾",
                    Movement:"位移", Travel:"旅行", Blink:"闪现", Curse:"诅咒", Hex:"魔蛊", Mark:"咒印", AoE:"效果区域", Duration:"持续时间", Vaal:"瓦尔", Trigger:"触发", Critical:"暴击", Link:"羁绊",
                    Mana:"魔力", ' Damage':"伤害", ' Speed':"速度", 'of base':"基础", 'Cost &amp; Reservation Multiplier':"消耗及保留加成", Cost:"消耗", Cast:"施放", Reservation:"保留",
                    Time:"时间", Cooldown:"冷却", 'per ':"每", Seconds:"秒", Second:"秒", second:"秒", sec:"秒", Max:"最高等级", Instant:"瞬发",
                    'Alternate Quality':"替换品质", 'Cooldown Time':"冷却时间", 'Souls Per Use':"每次施放所需灵魂", 'Can Store':"可储存", 'Soul Gain Prevention':"陷阱持续",
                    'Karst, the Lockpick':"解密师卡斯特", 'Huck, the Soldier':"军士哈克", 'Niles, the Interrogator':"审讯师奈尔斯", 'Vinderi, the Dismantler':"爆破师温德利",
                    'Gianna, the Master of Disguise':"易容大师吉安娜", 'Tibbs, the Giant':"巨汉特卜斯", 'Tullina, the Catburglar':"潜行者图林娜", 'Nenet, the Scout':"斥候奈尼特",
                    'Isla, the Engineer':"工程师伊斯拉", 'Atlas Region':"异界地区", 'Haewark Hamlet':"海沃克村", 'Lira Arthain':"利拉亚森", "Valdo's Rest":"瓦尔多之息",
                    'Glennach Cairns':"格伦纳赫石冢", 'Limited to':"仅限", Radius:"范围", Variable:"变量", Medium:"中", Small:"小", Survival:"幸存", Lasts:"持续", Large:"大",
                    Consumes:"每次使用", ' on use':"中消耗", 'Currently has':"目前有", Charges:"充能次数", Recovers:"回复", Historic:"史实",
                    Life:"生命", ' over':"用时", Genus:"属类", Group:"组别", Family:"科目", Uses:"使用", Use:"使用", Requires:"需要", Support:"辅助",
                    'Socketed Fossils':"个已镶嵌的化石", 'Socketed Fossil':"个已镶嵌的化石", 'Resolve':"坚毅", 'Inspiration':"启迪", 'Aureus':"耀金币",
                    ' Boons':"恩赐", Minor:"次要", Major:"主要", ' Afflictions':"痛苦",
                    'Corpse Level':"灵柩等级", 'Monster Category':"灵柩类型", "Eldritch":"古灵", "Demon":"恶魔", "Construct":"构造体", "Undead":"亡灵", "Beast":"野兽", "Humanoid":"人形",
                    ' Sacrifice':'献祭', 'Reward':'奖励', 'Challenge':'挑战', "Defeat waves of enemies":"击杀特定数量怪物", "Survive":"存活一段时间", "Protect the Altar":"保护祭坛不被摧毁", "Stand in the Stone Circles":"在范围内击败小头目",
                    ' of ':"从",
                };
                let zhString = elm.innerHTML;
                for (let i in reg) {
                    zhString = zhString.replace(String(i), reg[i]);
                }
                if (zhString != elm.innerHTML) {
                    elm.innerHTML = zhString;
                    elm.classList.add('translated');
                }
            });

            Array.prototype.filter
            .call(document.querySelectorAll('.textCurrency'), (elm) => !~elm.className.indexOf('translated'))
            .forEach((elm) => {
                let zhString = elm.innerHTML.replace('~price','一口价').replace('~b/o','询价').replace('scour','重铸石').replace('vaal','瓦尔宝珠').replace('chaos','混沌石').replace('blessed','祝福石').replace('chisel','制图钉')
                .replace('chrome','幻色石').replace('divine','神圣石').replace('exalted','崇高石').replace('gcp','珠宝匠的棱镜').replace('jewellers','工匠石').replace('awakened-sextant','觉醒六分仪')
                .replace('regret','后悔石').replace('fusing','链结石').replace('chance','机会石').replace('alt','改造石').replace('alch','点金石').replace('regal','富豪石').replace('mirror','卡兰德的魔镜');
                if (zhString != elm.innerHTML) {
                    elm.innerHTML = zhString;
                    elm.classList.add('translated');
                }
            });

        }, 100);
    };

})();
