# MiMo Code 网文写作技能包

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: MiMo Code](https://img.shields.io/badge/Platform-MiMo%20Code-blue.svg)](https://github.com/XiaomiMiMo/MiMo-Code)

专业的网文写作全流程技能包，覆盖长篇与短篇网络小说的**扫榜选题 → 拆文学习 → 大纲设计 → 正文写作 → 质量控制 → 去AI味 → 审稿发布**完整链路。

基于 [oh-story-claudecode](https://github.com/nihaoshi/oh-story-claudecode) 深度适配，专为 [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) 平台设计。

---

## 目录

- [核心特性](#核心特性)
- [前置依赖](#前置依赖)
- [安装方式](#安装方式)
- [更新技能包](#更新技能包)
- [快速开始](#快速开始)
- [技能一览](#技能一览)
- [自动化脚本](#自动化脚本)
- [质量门禁体系](#质量门禁体系)
- [知识库体系](#知识库体系)
- [项目结构](#项目结构)
- [Writing Project Rules](#writing-project-rules)
- [MiMo Code 深度适配](#mimocode-深度适配)
- [使用示例](#使用示例)
- [与原版的区别](#与原版的区别)
- [更新日志](#更新日志)
- [License](#license)

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **全流程覆盖** | 从选题到发布，16 个技能覆盖网文创作全生命周期 |
| **长篇 + 短篇** | 同时支持长篇连载和短篇创作，按篇幅自动分流 |
| **智能路由** | `/story` 主入口自动识别用户意图，分发到对应技能 |
| **7 重质量门禁** | 禁用词、一致性、伏笔、字数、角色声音、情绪曲线、爽点密度 |
| **Writing Project Rules** | 自动部署写作强制规则到项目，AI 每次会话自动读取 |
| **跨会话连续** | 基于 MiMo Code 持久化记忆，写作进度自动保存/恢复 |
| **去AI味** | 专业检测并清除 AI 写作痕迹，让文字更自然 |
| **实时市场数据** | 通过浏览器 CDP 采集起点/番茄/七猫/晋江等平台榜单数据 |
| **简介生成** | 按平台规范生成简介文案，支持 A/B 测试版 |
| **多格式导出** | 支持 TXT、平台专用格式、校对稿导出 |

---

## 前置依赖

| 依赖 | 版本 | 用途 | 必需性 |
|------|------|------|--------|
| [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) | 最新 | 运行平台 | **必需** |
| [Node.js](https://nodejs.org/) | 12+ | 质量检查脚本（10 个） | **必需**（长篇写作） |
| [Python 3](https://www.python.org/) | 3.6+ | 字数统计（跨平台） | 可选 |
| [Git](https://git-scm.com/) | 任意 | 版本控制 | 可选 |
| [agent-browser](https://www.npmjs.com/package/agent-browser) | 最新 | 浏览器操控（CDP 协议） | 可选（仅扫榜采集） |

---

## 安装方式

### 方式一：一键安装（推荐）

**macOS / Linux：**

```bash
curl -fsSL https://raw.githubusercontent.com/nihaoshi/mimoCode-story/main/install.sh | bash
```

**Windows PowerShell：**

```powershell
irm https://raw.githubusercontent.com/nihaoshi/mimoCode-story/main/install.ps1 | iex
```

安装脚本自动完成：
1. 克隆仓库到 `~/mimoCode-story`
2. 复制所有技能到 `~/.config/mimocode/skills/`
3. 安装 agent-browser 依赖（可选）
4. 验证安装完整性

### 方式二：手动安装

```bash
# 1. 克隆仓库
git clone https://github.com/nihaoshi/mimoCode-story.git ~/mimoCode-story

# 2. 复制 skills 到 MiMo Code 用户技能目录
# macOS / Linux:
mkdir -p ~/.config/mimocode/skills
cp -r ~/mimoCode-story/skills/* ~/.config/mimocode/skills/

# Windows (PowerShell):
New-Item -ItemType Directory -Force -Path "$HOME\.config\mimocode\skills"
Copy-Item -Path "$HOME\mimoCode-story\skills\*" -Destination "$HOME\.config\mimocode\skills\" -Recurse -Force
```

### 方式三：通过 MiMo Code 会话安装

在 MiMo Code 中直接告诉它：

```
帮我把 ~/mimoCode-story/skills 目录复制到 ~/.config/mimocode/skills/
```

### 验证安装

重启 MiMo Code，运行：

```
/mimo debug skill
```

应在列表中看到 `story`、`story-long-write`、`story-short-write` 等 16 个技能。

---

## 更新技能包

### 一键更新

**macOS / Linux：**

```bash
cd ~/mimoCode-story && git pull && cp -r skills/* ~/.config/mimocode/skills/
```

**Windows PowerShell：**

```powershell
cd ~/mimoCode-story; git pull; Copy-Item -Path "skills\*" -Destination "$HOME\.config\mimocode\skills\" -Recurse -Force
```

### 更新后验证

重启 MiMo Code，运行 `/mimo debug skill` 确认技能列表完整。

### 更新内容说明

| 更新类型 | 说明 |
|---------|------|
| 脚本更新 | `skills/story-long-write/scripts/` 下的自动化脚本 |
| 技能更新 | `skills/*/SKILL.md` 下的技能定义 |
| 知识库更新 | `skills/_shared/references/` 下的参考文档 |
| 模板更新 | `skills/_shared/templates/` 下的写作模板 |

### 已有项目更新

如果已有写作项目需要使用新版本的技能包：

1. 更新技能包（按上述步骤）
2. 重新运行质量门禁：`node skills/story-long-write/scripts/quality-gate.js <章节文件>`
3. 如需更新 AGENTS.md 中的规则，手动复制新规则到项目的 AGENTS.md

---

## 快速开始

### 1. 初始化写作项目

```
/story-setup
```

交互式部署，选择项目类型（长篇/短篇）、是否启用 Git 版本控制。自动创建：

- 完整目录结构（设定/大纲/正文/追踪/故事线/跨卷追踪）
- **AGENTS.md**（Writing Project Rules，AI 自动读取）
- `.story-deployed`（部署标记）
- `.active-book`（当前书目标记）
- Git hooks（可选）

### 2. 开始写作

```
# 长篇小说
/story-long-write

# 短篇小说
/story-short-write
```

### 3. 扫榜选题

```
# 长篇扫榜（起点/番茄/七猫/晋江）
/story-long-scan

# 短篇扫榜（知乎盐言/点众/黑岩）
/story-short-scan
```

### 4. 拆文学习

```
# 长篇拆文
/story-long-analyze

# 短篇拆文
/story-short-analyze
```

### 5. 质量检查

```
# 统一质量门禁（7 重检查）
node skills/story-long-write/scripts/quality-gate.js <章节文件>

# 快速模式（仅阻断项检查）
node skills/story-long-write/scripts/quality-gate.js --fast <章节文件>
```

---

## 技能一览

| 技能 | 触发方式 | 功能 |
|------|---------|------|
| `story-mimo` | `/story-mimo`、`/网文` | 路由入口，自动分发到对应技能 |
| `story-setup-mimo` | `/story-setup-mimo`、`准备写书` | 初始化写作项目 |
| `story-long-write-mimo` | `/story-long-write-mimo`、`写长篇` | 长篇写作（核心技能，5 阶段流程） |
| `story-short-write-mimo` | `/story-short-write-mimo`、`写短篇` | 短篇写作（4 阶段流程） |
| `story-long-analyze-mimo` | `/story-long-analyze-mimo`、`长篇拆文` | 长篇小说拆解分析 |
| `story-short-analyze-mimo` | `/story-short-analyze-mimo`、`短篇拆文` | 短篇小说拆解分析 |
| `story-long-scan-mimo` | `/story-long-scan-mimo`、`长篇扫榜` | 长篇市场数据采集与分析 |
| `story-short-scan-mimo` | `/story-short-scan-mimo`、`短篇扫榜` | 短篇市场数据采集与分析 |
| `story-scan-mimo` | `/story-scan-mimo`、`扫榜` | 通用扫榜路由 |
| `story-import-mimo` | `/story-import-mimo`、`导入小说` | 逆向导入已有小说为项目结构 |
| `story-deslop-mimo` | `/story-deslop-mimo`、`去AI味` | 检测并清除 AI 写作痕迹 |
| `story-review-mimo` | `/story-review-mimo`、`审稿` | 多维度质量审查 |
| `story-cover-mimo` | `/story-cover-mimo`、`封面` | 封面提示词生成 |
| `story-synopsis-mimo` | `/story-synopsis-mimo`、`简介` | 简介/文案生成（4 平台） |
| `story-export-mimo` | `/story-export-mimo`、`导出` | 多格式导出 |
| `browser-cdp-mimo` | `浏览器操作`、`CDP` | Chrome 浏览器控制 |
| `goal-mimo` | `/goal-mimo`、`写到第X章` | 自主写作目标控制 |
| `dream-mimo` | `/dream-mimo`、`提取经验` | 写作经验沉淀 |
| `distill-mimo` | `/distill-mimo`、`分析工作流` | 工作流优化 |
| `quality-mimo` | `/quality-mimo`、`检查质量` | 统一质量检查入口 |
| `audit-mimo` | `/audit-mimo`、`审计项目` | 全量项目审计 |
| `project-health-mimo` | `/project-health-mimo`、`检查项目` | 项目健康检查与修复 |

---

## 自动化脚本

### 长篇写作脚本（skills/story-long-write-mimo/scripts/）

| 脚本 | 功能 | `--json` | 退出码 |
|------|------|---------|--------|
| `quality-gate.js` | 统一质量门禁（7 重检查） | ✅ | 0=通过, 1=警告, 2=阻断 |
| `style-lint.js` | 禁用词 + AI 腔检测 + 格式/专业术语检查 | ✅ | 0=通过, 1=有问题 |
| `consistency-check.js` | 一致性检查（物品/环境/角色/时间线/身份） | ✅ | 0=通过, 1=警告, 2=错误 |
| `foreshadow-check.js` | 伏笔逾期 + 格式 + 重叠检查 | ✅ | 0=通过, 1=逾期 |
| `voice-check.js` | 角色声音一致性 | ✅ | 0=通过, 1=不一致 |
| `emotion-analyzer.js` | 情绪曲线分析 | ✅ | 0=正常, 1=平坦警告 |
| `satisfaction-meter.js` | 爽点密度度量 | ✅ | 0=达标, 1=不足 |
| `full-consistency-audit.js` | 全量一致性审计 | ✅ | 0=通过, 1=警告, 2=错误 |
| `repair-scripts.js` | 脚本修复器 | ✅ | 0=成功, 1=需修复, 2=错误 |
| `wordcount-pacer.js` | 字数节奏指导 | - | - |
| `normalize-punctuation.js` | 标点规范化 | - | - |
| `detect-python.js` | Python 检测 | - | - |

### 共享脚本（skills/_shared/scripts/）

| 脚本 | 功能 | 说明 |
|------|------|------|
| `goal.js` | /goal 命令 | 设置写作目标，监控进度 |
| `dream.js` | /dream 命令 | 扫描章节，提取写作经验 |
| `distill.js` | /distill 命令 | 分析工作流，发现重复模式 |
| `punctuation-normalize.js` | 标点规范化 | 检查/修复 AI 生成内容的标点问题 |

### 短篇写作脚本（skills/story-short-write-mimo/scripts/）

| 脚本 | 功能 | 说明 |
|------|------|------|
| `quality-gate.js` | 短篇质量门禁 | 字数/钩子/情绪/反转/AI腔检查 |

### 使用示例

```bash
# 运行统一质量门禁
node skills/story-long-write/scripts/quality-gate.js 正文/第001章_XXX.md

# JSON 格式输出（供自动化流水线使用）
node skills/story-long-write/scripts/quality-gate.js --json 正文/第001章_XXX.md

# 快速模式（跳过警告项检查）
node skills/story-long-write/scripts/quality-gate.js --fast 正文/第001章_XXX.md

# 单独运行某个检查
node skills/story-long-write/scripts/style-lint.js --json 正文/第001章_XXX.md
node skills/story-long-write/scripts/consistency-check.js --json 正文/第001章_XXX.md

# 情绪曲线可视化
node skills/story-long-write/scripts/emotion-analyzer.js 正文/第001章_XXX.md

# 字数节奏指导
node skills/story-long-write/scripts/wordcount-pacer.js 大纲/细纲_第001章.md
```

---

## 质量门禁体系

`quality-gate.js` 是统一质量门禁，串联 7 项检查：

```
写正文 → quality-gate.js（自动阻断）
  ├── style-lint       一级禁用词 > 0 → 阻断
  ├── consistency      物品/环境/角色/时间线错误 → 阻断
  ├── foreshadow       伏笔逾期 > 50 章 → 警告
  ├── wordcount        字数 < 目标 90% → 阻断
  ├── voice-check      角色声音不一致 → 警告
  ├── emotion-analyzer 情绪曲线平坦 → 警告
  └── satisfaction     爽点密度不足 → 警告

退出码：
  0 = 全部通过
  1 = 有警告（可继续）
  2 = 有阻断项（必须修复）
```

**AGENTS.md 中的强制规则**：退出码 2 时不得标记任务完成，必须修复后重新运行。

---

## 知识库体系

`skills/_shared/` 目录下包含 70+ 个共享参考文档：

### 参考文档（references/）

| 类别 | 文档 | 说明 |
|------|------|------|
| 写作技法 | `dialogue-mastery.md` | 对话技巧精通 |
| | `character-basics.md` | 角色设计基础 |
| | `outline-methods.md` | 大纲核心方法 |
| | `opening-design.md` | 开篇设计 |
| | `hooks-chapter.md` | 章节钩子设计 |
| | `reversal-toolkit.md` | 反转设计工具 |
| | `emotional-arc-design.md` | 情感弧线设计 |
| | `emotion-curve-design.md` | 情绪曲线设计 |
| | `pacing-mastery.md` | 节奏控制精通 |
| 去AI味 | `anti-ai-writing.md` | 去AI味完整指南 |
| | `banned-words.md` | 分级禁用词表 |
| 题材公式 | `genre-writing-formulas.md` | 21 种题材公式 |
| | `genre-catalog.md` | 题材框架速查 |
| | `genre-core-mechanics.md` | 核心钩子分析 |
| 市场分析 | `publishing-guide.md` | 平台运营指南 |
| | `reader-profiling.md` | 读者画像系统 |
| | `scan-output-format.md` | 扫榜数据格式 |
| 质量监控 | `consistency-tracking.md` | 一致性追踪系统 |
| | `quality-monitoring.md` | 质量监控系统 |
| | `data-analytics.md` | 数据分析系统 |

### 模板（templates/）

| 模板 | 说明 |
|------|------|
| `dialogue-scene.md` | 5 种对话场景模板 |
| `emotional-arc.md` | 5 种情感弧线模板 |
| `villain-introduction.md` | 5 种反派登场模板 |
| `worldbuilding-intro.md` | 5 种世界观引入模板 |

### 示例（examples/）

| 示例 | 说明 |
|------|------|
| `dialogue-examples.md` | 5 个经典对话范例 |
| `emotion-examples.md` | 5 个情感弧线范例 |
| `villain-examples.md` | 5 个反派设计范例 |

### 检查清单（checklists/）

| 清单 | 说明 |
|------|------|
| `dialogue-checklist.md` | 对话质量检查（30 项） |
| `emotion-checklist.md` | 情感弧线检查（25 项） |
| `villain-checklist.md` | 反派设计检查（25 项） |
| `world-checklist.md` | 世界观检查（25 项） |

---

## 项目结构

```
{书名}/
├── AGENTS.md              # Writing Project Rules（自动部署）
├── .story-deployed        # 部署标记
├── .active-book           # 当前书目标记
│
├── 设定/                  # 世界观与角色设定
│   ├── 世界观/            # 背景设定、金手指、力量体系
│   ├── 角色/              # 每个角色一个文件
│   ├── 势力/              # 组织/门派/家族
│   ├── 关系.md            # 角色关系图
│   ├── 题材定位.md        # 题材与目标读者
│   └── 文风.md            # 写作风格指南
│
├── 大纲/                  # 分层大纲
│   ├── 大纲.md            # 全书卷级大纲
│   ├── 卷纲_第X卷.md      # 每卷详细大纲
│   └── 细纲_第XXX章.md    # 每章细纲（含字数目标）
│
├── 正文/                  # 章节文件
│   └── 第XXX章_章名.md    # 每章一个文件
│
├── 追踪/                  # 状态追踪（每章更新）
│   ├── 上下文.md          # 进度摘要（跨会话恢复）
│   ├── 伏笔.md            # 伏笔追踪
│   ├── 角色状态.md        # 角色状态 + 性格锚点
│   ├── 时间线.md          # 事件时间线
│   ├── 物品.md            # 物品追踪
│   ├── 环境.md            # 环境追踪
│   └── 物资.md            # 物资追踪
│
├── 故事线/                # 多线并行管理
│   ├── 故事线_索引.md
│   └── 故事线_主线_XXX.md
│
├── 跨卷追踪/              # 跨卷伏笔与角色弧线
│   ├── 跨卷伏笔.md
│   ├── 跨卷角色弧线.md
│   └── 卷间过渡.md
│
├── 对标/                  # 拆文引用视图
├── 参考资料/              # story-researcher 输出
└── 导出/                  # story-export 输出
```

---

## Writing Project Rules

`story-setup` 自动部署的 AGENTS.md 包含以下强制规则：

### 写完每章必须执行

1. 更新 `追踪/伏笔.md` — 新增/回收伏笔
2. 更新 `追踪/时间线.md` — 记录事件时序
3. 更新 `追踪/角色状态.md` — 更新角色状态 + 性格锚点
4. 更新 `追踪/物品.md` — 物品位置/状态变化
5. 更新 `追踪/环境.md` — 季节/天气/场景
6. 更新 `追踪/上下文.md` — 进度摘要
7. 运行质量门禁：`node skills/story-long-write/scripts/quality-gate.js <章节文件>`

### 质量门禁规则

退出码 2（阻断）时**不得标记任务完成**，必须修复后重新运行。

### 写作铁律

1. 写正文前必须读细纲，不得凭记忆写
2. 续写前必须读上一章正文，不得凭记忆接
3. 写对话前必须查角色性格锚点
4. 参考文档标记"必读"的必须实际加载
5. 字数未达标（< 目标 90%）不得结束本章

### 一级禁用词（33 个）

不禁、竟然、居然、事实上、实际上、显而易见、毫无疑问、可想而知、不言而喻、与此同时、值得注意的是、需要指出的是、不可否认、嘴角勾起、嘴角上扬、嘴角微扬、眼中闪过、眼底闪过、目光中闪过、深吸一口气、长舒一口气、吐出一口浊气、缓缓开口、淡淡说道、轻声说道、仿佛、宛如、恰似、犹如、值得一提、不得不说、总而言之

---

## MiMo Code 深度适配

本技能包充分利用 MiMo Code 平台的独特能力：

| 能力 | 写作场景 | 实现方式 |
|------|---------|---------|
| **持久化记忆** | 跨会话状态连续 | `MEMORY.md` 自动保存/恢复写作进度 |
| **智能上下文** | 长篇写作不丢失上下文 | 自动检查点 + 预算化注入 |
| **任务追踪** | 进度管理 | 树状任务系统追踪每章状态 |
| **子智能体** | 并行处理 | 拆文/审稿/研究可并行执行 |
| **Goal** | 自主写作 | `/goal-mimo` 设置写作目标，通过 story-long-write-mimo 工作流自动循环 |
| **Dream** | 经验沉淀 | `/dream-mimo` 提取写作经验到记忆，保存禁用词/有效技法/重复模式 |
| **Distill** | 工作流优化 | `/distill-mimo` 分析写作模式，发现重复句式并建议优化 |

### 能力详解

#### 持久化记忆（Memory）
- **写入时机**：每章写完后、用户做出重要决策时、发现问题并解决时
- **读取时机**：新会话开始时自动加载
- **存储位置**：`MEMORY.md` 的 `## 写作进度` 和 `## 重要决策` 部分

#### 智能上下文
- **工作原理**：只加载当前章节需要的信息，避免上下文溢出
- **必加载**：上一章正文、本章细纲、角色状态、伏笔
- **按需加载**：物品、环境、其他角色详情

#### Goal 自主写作
- **触发**：用户说"写到第X章"
- **执行**：AI 读取 SKILL.md 中的 Goal 模式，按 8 步循环执行
- **辅助脚本**：`goal.js` 设置目标配置，`quality-gate.js` 检查质量

#### Dream 经验沉淀
- **触发**：用户说"提取经验"
- **执行**：扫描章节，分析禁用词/AI腔/有效技法/重复模式
- **输出**：写入 MEMORY.md，供后续写作参考

#### Distill 工作流优化
- **触发**：用户说"分析工作流"
- **执行**：检测重复句式、重复用词、字数波动、工作流缺失
- **输出**：优化建议报告

---

## 使用示例

### 完整写作流程

```
# 1. 初始化项目
/story-setup

# 2. 扫榜选题
/story-long-scan

# 3. 拆文学习（可选）
/story-long-analyze

# 4. 开始写作
/story-long-write

# 5. 质量检查
node skills/story-long-write/scripts/quality-gate.js 正文/第001章_XXX.md

# 6. 去AI味
/story-deslop

# 7. 审稿
/story-review

# 8. 生成简介
/story-synopsis

# 9. 导出
/story-export
```

### 日更续写

```
# 继续写下一章
/续写

# 或者
/日更
```

### 批量写作

```
# 设置写作目标，自主循环
/goal 写到第30章，每章不低于3000字
```

---

## 与原版的区别

| 维度 | 原版 (oh-story-claudecode) | MiMo Code 版 |
|------|---------------------------|-------------|
| 平台 | Claude Code | MiMo Code |
| 技能数 | 12 | 16 |
| 脚本数 | 3 | 10 |
| 质量门禁 | 无统一入口 | `quality-gate.js`（7 重检查） |
| 情绪分析 | 无 | `emotion-analyzer.js` |
| 爽点检测 | 无 | `satisfaction-meter.js` |
| 角色声音 | 无 | `voice-check.js` |
| 简介生成 | 无 | `story-synopsis` |
| 导出功能 | 无 | `story-export` |
| 节奏指导 | 无 | `wordcount-pacer.js` + `pacing-mastery.md` |
| 情绪曲线 | 无 | `emotion-curve-design.md` |
| 记忆集成 | 无 | 深度集成 MiMo Code 记忆系统 |
| Goal/Dream | 无 | 支持自主写作和经验沉淀 |

---

## 更新日志

### v3.1.0（2026-06-14）

**技能重命名**：所有技能名称添加 `-mimo` 后缀，统一命名规范

**新增技能（3 个）**：
- `goal-mimo` — 自主写作目标控制，通过 story-long-write-mimo 工作流自动循环
- `dream-mimo` — 写作经验沉淀，扫描章节提取禁用词/AI腔/有效技法
- `distill-mimo` — 工作流优化，检测重复句式并建议优化

**新增脚本（5 个）**：
- `_shared/scripts/goal.js` — 目标配置管理
- `_shared/scripts/dream.js` — 经验提取分析
- `_shared/scripts/distill.js` — 工作流分析
- `_shared/scripts/punctuation-normalize.js` — 标点符号规范化
- `story-short-write-mimo/scripts/quality-gate.js` — 短篇质量门禁

**脚本增强**：
- `consistency-check.js` — 新增身份一致性、追踪完整性、时间线逻辑检测
- `style-lint.js` — 新增格式一致性、专业术语检测
- `foreshadow-check.js` — 新增标记格式、重叠检测
- `quality-gate.js` — 新增 `--full` 参数支持增强检查

**Bug 修复**：
- `repair-scripts.js` — 修复参数解析 bug
- `quality-gate.js` — 修复 `--full` 参数未传递给子脚本

### v3.0.0（2026-06-13）

**新增脚本（5 个）**：
- `quality-gate.js` — 统一质量门禁，串联 7 重检查
- `voice-check.js` — 角色声音一致性检查
- `emotion-analyzer.js` — 情绪曲线分析（关键词检测 + 平坦警告 + ASCII 可视化）
- `satisfaction-meter.js` — 爽点密度度量（信号词检测 + 间距 + 压制释放比）
- `wordcount-pacer.js` — 字数节奏指导（标准/开篇/高潮/过渡四种模板）

**新增技能（2 个）**：
- `story-synopsis` — 简介/文案生成（起点/番茄/晋江/知乎四平台 + A/B 测试）
- `story-export` — 多格式导出（TXT/平台TXT/校对稿/章节目录）

**新增参考文档（2 个）**：
- `emotion-curve-design.md` — 情绪曲线设计（V/W/递进/延迟满足四种模型）
- `pacing-mastery.md` — 节奏控制精通（段落/章节/卷级节奏 + 常见问题修复）

**脚本改进**：
- `style-lint.js` — 添加 `--json` 输出，修复"竟然/居然"重复 bug
- `consistency-check.js` — 添加 `--json` 输出，新增时间线/角色状态/已死角色/名字漂移检查，修复 `\r\n` 兼容
- `foreshadow-check.js` — 添加 `--json` 输出
- `quality-gate.js` — 使用 `execFileSync` 替代 `execSync` 防止 shell 注入

**规则升级**：
- AGENTS.md 质量检查从"建议"升级为"阻断式门禁"
- Goal/Dream/Distill/并行写作集成指引写入 SKILL.md

### v2.0.0（2026-06-11）

- 初始版本，基于 oh-story-claudecode 适配 MiMo Code
- 14 个技能，5 个脚本，60+ 参考文档

---

## License

[MIT](LICENSE)
