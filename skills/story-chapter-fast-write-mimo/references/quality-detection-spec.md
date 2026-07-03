# 综合质量检测规范

> Step 11 质量检测的详细执行规范。

---

## 检测流程

### 1. 字数检测
```bash
node $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js <章节文件> --json
```
- 达标：字数 >= 细纲目标的90%
- 不达标：BLOCK

### 2. 禁用词+AI腔检测
```bash
node $HOME/.config/mimocode/skills/_shared/scripts/style-lint.js --json <章节文件>
```
- 一级禁用词命中：BLOCK
- AI腔句式命中：BLOCK
- 二级禁用词高频：WARN

### 3. 标点符号检测
```bash
node $HOME/.config/mimocode/skills/_shared/scripts/punctuation-normalize.js --json <章节文件>
```
- AI标点符号命中：BLOCK

### 4. 一致性检测
```bash
node $HOME/.config/mimocode/skills/_shared/scripts/consistency-check.js --json <章节文件> <项目目录>
```
- 物品位置不一致：BLOCK
- 角色状态矛盾：BLOCK
- 环境描述冲突：BLOCK
- 时间线不合理：BLOCK

### 5. 设定校验（LLM）
- 对比正文与设定文件
- 检查世界观规则是否遵守
- 检查金手指规则是否正确
- 检查文风是否符合设定
- 检查题材核心梗是否体现
- 检查角色关系是否符合设定

### 6. 章内逻辑性（LLM）
- 因果关系是否合理
- 时间顺序是否正确
- 角色行为是否符合设定

### 7. 跨章节检查
```bash
node $HOME/.config/mimocode/skills/_shared/scripts/cross-chapter-check.js --json <章节文件> <项目目录>
```
- 跨章节重复内容：WARN
- 跨章节矛盾：WARN

### 8. 跨卷一致性（LLM）
- 跨卷伏笔是否逾期
- 角色弧线是否连贯
- 故事线是否断裂

---

## 输出格式

```json
{
  "chapter": 5,
  "status": "fail",
  "blockers": ["禁用词: '仿佛'", "字数不足: 2800/3000"],
  "warnings": ["跨章节重复: '冷笑了一声'"],
  "checks": [
    {"name": "字数", "status": "fail", "detail": "2800/3000"},
    {"name": "禁用词", "status": "fail", "detail": "命中: 仿佛"},
    {"name": "AI腔", "status": "pass"},
    {"name": "一致性", "status": "pass"},
    {"name": "设定校验", "status": "pass"},
    {"name": "逻辑性", "status": "pass"},
    {"name": "跨章节", "status": "warn", "detail": "重复表达"},
    {"name": "跨卷一致性", "status": "pass"}
  ]
}
```
