# 自动化检测系统

> 版本：1.0.0
> 更新时间：2026-06-12
> 目标：机器检查一致性

---

## 概述

通过脚本自动检测写作内容的一致性、重复词句、伏笔过期等问题。

---

## 检测维度

| 维度 | 检测内容 | 检测方式 | 输出 |
|------|---------|---------|------|
| 连续性检测 | 角色名/物品名/时间标记 | 脚本扫描+交叉验证 | JSON报告 |
| 重复词句检测 | 重复形容词/动词/句式 | 脚本扫描 | 问题列表 |
| 伏笔过期检测 | 埋设到回收的时间 | 脚本计算 | 预警列表 |

---

## 脚本文件

```
scripts/
├── consistency-check.js      # 连续性检测
├── style-lint.js             # 重复词句检测
└── foreshadow-check.js       # 伏笔过期检测
```

---

## 脚本实现

### consistency-check.js

```javascript
// 连续性检测脚本
// 扫描正文中出现的角色名/物品名/时间标记，与追踪文件交叉验证

const fs = require('fs');
const path = require('path');

function checkConsistency(projectDir) {
    const results = {
        characters: { found: [], missing: [], extra: [] },
        items: { found: [], missing: [], extra: [] },
        timeline: { issues: [] }
    };
    
    // 1. 扫描正文中的角色名
    const charactersInText = extractCharacters(path.join(projectDir, '正文'));
    const charactersInTracking = loadCharacters(path.join(projectDir, '追踪/角色状态_索引.md'));
    
    // 交叉验证
    charactersInText.forEach(char => {
        if (charactersInTracking.includes(char)) {
            results.characters.found.push(char);
        } else {
            results.characters.extra.push(char);
        }
    });
    
    charactersInTracking.forEach(char => {
        if (!charactersInText.includes(char)) {
            results.characters.missing.push(char);
        }
    });
    
    // 2. 扫描正文中的物品名
    const itemsInText = extractItems(path.join(projectDir, '正文'));
    const itemsInTracking = loadItems(path.join(projectDir, '追踪/物品_索引.md'));
    
    itemsInText.forEach(item => {
        if (itemsInTracking.includes(item)) {
            results.items.found.push(item);
        } else {
            results.items.extra.push(item);
        }
    });
    
    // 3. 扫描时间标记
    const timeMarkers = extractTimeMarkers(path.join(projectDir, '正文'));
    const timeline = loadTimeline(path.join(projectDir, '追踪/时间线.md'));
    
    timeMarkers.forEach(marker => {
        if (!isConsistentWithTimeline(marker, timeline)) {
            results.timeline.issues.push(marker);
        }
    });
    
    return results;
}

// 辅助函数
function extractCharacters(textDir) {
    // 从正文中提取角色名
    // 使用正则匹配中文人名模式
    const files = fs.readdirSync(textDir).filter(f => f.endsWith('.md'));
    const characters = new Set();
    
    files.forEach(file => {
        const content = fs.readFileSync(path.join(textDir, file), 'utf8');
        // 匹配中文人名（2-3个字）
        const matches = content.match(/[\u4e00-\u9fa5]{2,3}/g) || [];
        matches.forEach(match => {
            if (isLikelyCharacterName(match)) {
                characters.add(match);
            }
        });
    });
    
    return Array.from(characters);
}

function extractItems(textDir) {
    // 从正文中提取物品名
    const files = fs.readdirSync(textDir).filter(f => f.endsWith('.md'));
    const items = new Set();
    
    files.forEach(file => {
        const content = fs.readFileSync(path.join(textDir, file), 'utf8');
        // 匹配常见物品名模式
        const patterns = [
            /白瓷片/g,
            /过所/g,
            /警告信/g,
            /文房四宝/g
        ];
        patterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => items.add(match));
        });
    });
    
    return Array.from(items);
}
```

---

### style-lint.js

```javascript
// 重复词句检测脚本
// 检测同一章内重复形容词/动词、连续3章相同句式开头

const fs = require('fs');
const path = require('path');

function checkStyle(chapterFile) {
    const results = {
        repeatedWords: [],
        repeatedPatterns: [],
        dialogue单调: false
    };
    
    const content = fs.readFileSync(chapterFile, 'utf8');
    const lines = content.split('\n');
    
    // 1. 检测重复形容词/动词
    const wordCount = {};
    const words = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    Object.entries(wordCount).forEach(([word, count]) => {
        if (count > 5 && isAdjectiveOrVerb(word)) {
            results.repeatedWords.push({ word, count });
        }
    });
    
    // 2. 检测连续相同句式开头
    const firstChars = lines.slice(0, 10).map(line => line.charAt(0));
    const patternCount = {};
    firstChars.forEach(char => {
        patternCount[char] = (patternCount[char] || 0) + 1;
    });
    
    Object.entries(patternCount).forEach(([char, count]) => {
        if (count >= 3) {
            results.repeatedPatterns.push({ pattern: `以"${char}"开头`, count });
        }
    });
    
    // 3. 检测对话标签单调
    const dialogueTags = content.match(/"[^"]*"[^"]*说/g) || [];
    const saidCount = dialogueTags.filter(tag => tag.includes('说')).length;
    const totalDialogue = dialogueTags.length;
    
    if (totalDialogue > 0 && saidCount / totalDialogue > 0.6) {
        results.dialogue单调 = true;
    }
    
    return results;
}

function isAdjectiveOrVerb(word) {
    // 简单判断是否是形容词或动词
    // 实际应用中需要更复杂的NLP处理
    const adjectives = ['美丽', '漂亮', '英俊', '高大', '瘦小'];
    const verbs = ['走', '跑', '看', '听', '说'];
    return adjectives.includes(word) || verbs.includes(word);
}
```

---

### foreshadow-check.js

```javascript
// 伏笔过期检测脚本
// 检测埋设章节与当前章节差>预计回收差的80%

const fs = require('fs');
const path = require('path');

function checkForeshadowing(projectDir) {
    const results = {
        expiring: [],
        expired: [],
        healthy: []
    };
    
    const foreshadowFile = path.join(projectDir, '追踪/伏笔_索引.md');
    const content = fs.readFileSync(foreshadowFile, 'utf8');
    
    // 解析伏笔表格
    const lines = content.split('\n');
    const currentChapter = getCurrentChapter(projectDir);
    
    lines.forEach(line => {
        if (line.startsWith('| F')) {
            const parts = line.split('|').map(p => p.trim());
            const id = parts[1];
            const埋设章节 = parseInt(parts[3]);
            const预计回收 = parts[4];
            
            if (预计回收.includes('本卷')) {
                // 计算过期风险
                const expected回收章数 = 50; // 假设本卷50章
                const elapsed = currentChapter - 埋设章节;
                const threshold = expected回收章数 * 0.8;
                
                if (elapsed > threshold) {
                    results.expiring.push({
                        id,
                        埋设章节,
                        已埋章数: elapsed,
                        过期风险: '高'
                    });
                } else if (elapsed > expected回收章数) {
                    results.expired.push({
                        id,
                        埋设章节,
                        已埋章数: elapsed,
                        过期风险: '已过期'
                    });
                } else {
                    results.healthy.push({
                        id,
                        埋设章节,
                        已埋章数: elapsed,
                        过期风险: '正常'
                    });
                }
            }
        }
    });
    
    return results;
}

function getCurrentChapter(projectDir) {
    const contextFile = path.join(projectDir, '追踪/上下文.md');
    const content = fs.readFileSync(contextFile, 'utf8');
    const match = content.match(/最后完成章节：第(\d+)章/);
    return match ? parseInt(match[1]) : 0;
}
```

---

## 使用流程

### 1. 每章写完后自动检测

```bash
# 在workflow-daily.md Step 2每章写完后执行
node skills/_shared/scripts/consistency-check.js {project_dir}
node skills/_shared/scripts/style-lint.js 正文/第{N}章_*.md
node skills/_shared/scripts/foreshadow-check.js {project_dir}
```

### 2. 检测结果处理

```javascript
// 检测结果写入质量日志
const results = checkConsistency(projectDir);
writeToQualityLog(results);
```

### 3. 预警输出

如果检测到问题，输出预警：

```
⚠️ 检测到以下问题：

连续性问题：
- 角色"张三"在正文中出现但未在追踪文件中记录
- 物品"玉佩"位置与追踪文件不一致

重复词句问题：
- "美丽"重复出现8次
- 连续5段以"他"开头

伏笔过期预警：
- F02 已埋30章，需在本卷内回收
```

---

## 与现有系统的集成

### workflow-daily.md

在Step 2每章写完后增加：

```
2.7 自动化检测
- 运行 consistency-check.js
- 运行 style-lint.js
- 运行 foreshadow-check.js
- 如有问题，写入质量日志
- 如有预警，输出提醒
```

### 质量日志.md

检测结果自动写入质量日志：

```markdown
### 第{N}章自动检测结果

**连续性检测**：
- [✅] 角色名：全部匹配
- [✅] 物品名：全部匹配
- [⚠️] 时间标记：发现1处不一致

**重复词句检测**：
- [⚠️] "美丽"重复8次
- [✅] 句式开头：无重复

**伏笔过期检测**：
- [⚠️] F02 已埋30章，需关注
```

---

## 性能提升预估

| 场景 | 改造前 | 改造后 | 提升 |
|------|--------|--------|------|
| 一致性检查 | 人工 | 脚本自动 | 从0到1 |
| 重复词句 | 人工 | 脚本自动 | 从0到1 |
| 伏笔管理 | 人工 | 脚本自动预警 | 从0到1 |
| 问题发现 | 事后 | 实时 | 提前发现 |
