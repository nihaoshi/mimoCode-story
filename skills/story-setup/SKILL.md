---
name: story-setup-mimo
version: 3.0.0
description: |
  网文写作工具集基础设施部署。一键部署写作项目结构。
  触发方式：/story-setup-mimo、「准备写书」「帮我搭一下环境」
---

# story-setup-mimo：网文写作基础设施部署

你是写作基础设施部署器。将网文写作工具集部署到用户项目目录。

**核心原则：不覆盖已有配置，合并而非替换。**

---

## Phase 1：检测项目状态

1. 检查当前目录是否已部署过（存在 `.story-deployed`）
   - 已存在 → 询问是否重新部署
2. 检查是否有书名目录（包含 `追踪/` 子目录的目录）
   - 有 → 识别为长篇项目，显示当前信息
   - 无 → 识别为新项目

## Phase 2：配置选项

### 2.1 询问用户偏好

问用户：**「你需要以下功能吗？」**

| 功能 | 说明 | 默认值 |
|------|------|--------|
| Git 版本控制 | 自动提交章节、创建 hooks | 开 |
| 并行章节处理 | 用子代理并行写作 | 关 |

> **MiMo Code 记忆和自动检查点**是平台内置功能，无需手动配置。

### 2.2 保存配置

根据用户选择，创建 `.story-config.json`（项目级写作配置，不写入 MiMo Code 的 `mimocode.json`）：

```json
{
  "version_control": true,
  "parallel_chapters": false
}
```

## Phase 3：部署基础设施

### 3.1 创建项目结构

根据用户选择的项目类型（长篇/短篇），创建对应的目录结构。

#### 长篇项目结构

```
{书名}/
├── AGENTS.md
├── 设定/
│   ├── 世界观/
│   ├── 角色/
│   ├── 势力/
│   ├── 关系.md
│   └── 题材定位.md
├── 大纲/
│   ├── 大纲.md
│   ├── 卷纲_第一卷.md
│   └── 细纲_第001章.md
├── 正文/
│   └── 第001章_章名.md
├── 对标/
├── 追踪/
│   ├── 伏笔.md
│   ├── 时间线.md
│   ├── 角色状态.md
│   ├── 物品.md
│   ├── 环境.md
│   ├── 物资.md
│   └── 上下文.md
├── 故事线/
│   ├── 故事线_索引.md
│   ├── 故事线_主线_XXX.md
│   └── 故事线_交叉点.md
├── 跨卷追踪/
│   ├── 跨卷伏笔.md
│   ├── 跨卷角色弧线.md
│   └── 卷间过渡.md
└── 参考资料/
```

#### 短篇项目结构

```
{短篇标题}/
├── AGENTS.md
├── 设定.md
├── 小节大纲.md
├── 正文.md
└── 对标/
```

### 3.2 创建 .story-deployed 标记

```
deployed_at: <ISO timestamp>
version: 3.0.0
target: mimocode
version_control: true/false
```

### 3.3 创建 .active-book

写入当前书目的相对路径。

### 3.4 创建项目 AGENTS.md

在写作项目根目录创建 `AGENTS.md`，包含 Writing Project Rules。内容如下：

```markdown
# AGENTS.md

## Writing Project Rules（写作项目强制规则）

以下规则适用于本写作项目，AI 每次会话自动读取：

### 写完每章必须执行

1. 更新 `追踪/伏笔.md` — 新增/回收伏笔
2. 更新 `追踪/时间线.md` — 记录事件时序
3. 更新 `追踪/角色状态.md` — 更新角色状态 + 性格锚点（如有变化）
4. 更新 `追踪/物品.md` — 物品位置/状态变化
5. 更新 `追踪/环境.md` — 季节/天气/场景
6. 更新 `追踪/上下文.md` — 进度摘要
7. 运行 `node skills/story-long-write/scripts/consistency-check.js`
8. 运行 `node skills/story-long-write/scripts/style-lint.js`
9. 运行 `node skills/story-long-write/scripts/foreshadow-check.js`

### 跨会话恢复规则

新会话开始时，必须先读取：
1. `追踪/上下文.md` — 上次进度
2. `追踪/角色状态.md` — 角色当前状态（含性格锚点）
3. `追踪/伏笔.md` — 待回收伏笔

### 性格一致性规则

写对话和行为描写前，必须检查角色的"性格锚点"（在 `追踪/角色状态.md` 中）。不得让角色说出/做出违背锚点的事，除非有充分铺垫。

### 一级禁用词（写正文时必查，命中即替换）

不禁、竟然、居然、事实上、实际上、显而易见、毫无疑问、可想而知、不言而喻、与此同时、值得注意的是、需要指出的是、不可否认、嘴角勾起、嘴角上扬、嘴角微扬、眼中闪过、眼底闪过、目光中闪过、深吸一口气、长舒一口气、吐出一口浊气、缓缓开口、淡淡说道、轻声说道、仿佛、宛如、恰似、犹如、值得一提、不得不说、总而言之

### 写作铁律（不可违反）

1. 写正文前必须用 Read 工具读细纲，不得凭记忆写
2. 续写前必须用 Read 工具读上一章正文，不得凭记忆接
3. 写对话前必须查角色性格锚点（`追踪/角色状态.md`）
4. 参考文档标记"必读"的必须实际用 Read 工具加载，不得跳过
5. 字数未达标（< 细纲目标 90%）不得结束本章

### 参考文档速查（按场景→文件名）

| 场景 | 文件 |
|------|------|
| 写对话 | `dialogue-mastery.md` |
| 设角色 | `character-basics.md` |
| 写大纲 | `outline-methods.md` |
| 开篇设计 | `opening-design.md` |
| 钩子设计 | `hooks-chapter.md` |
| 反转设计 | `reversal-toolkit.md` |
| 去AI味 | `anti-ai-writing.md` + `banned-words.md` |
| 情感线 | `emotional-arc-design.md` |
| 题材公式 | `genre-writing-formulas.md` |
| 爽点设计 | `plot-emotion-system.md` |

### Git Hooks 安装

在写作项目中安装 hooks（仅需一次）：

**macOS / Linux：**
\```bash
cp .githooks/* .git/hooks/
chmod +x .git/hooks/*
\```

**Windows (PowerShell)：**
\```powershell
Copy-Item .githooks\* .git\hooks\ -Force
\```
```

> **注意**：如果用户写作项目根目录已存在 AGENTS.md，则跳过此步骤，提示用户手动合并 Writing Project Rules。

### 3.5 Git 初始化（仅当 version_control=true）

```bash
git init
```

然后安装 hooks（跨平台）：

**macOS / Linux：**
```bash
cp .githooks/* .git/hooks/ 2>/dev/null || true
chmod +x .git/hooks/* 2>/dev/null || true
```

**Windows (PowerShell)：**
```powershell
Copy-Item .githooks\* .git\hooks\ -Force -ErrorAction SilentlyContinue
```

### 3.6 MiMo Code 记忆初始化

MiMo Code 的记忆系统是平台内置功能，会自动在 `MEMORY.md` 中保存项目知识。
首次写作时，story-long-write 会自动创建 `MEMORY.md` 初始文件。

---

## Phase 4：验证安装

1. 验证目录结构完整
2. 输出安装报告
3. 提示用户可以开始使用 `/story-long-write` 或 `/story-short-write`

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
