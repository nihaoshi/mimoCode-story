# MiMo Code Story Skill Pack

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: MiMo Code](https://img.shields.io/badge/Platform-MiMo%20Code-blue.svg)](https://github.com/XiaomiMiMo/MiMo-Code)

专业的网文写作全流程技能包，覆盖长篇与短篇网络小说的**扫榜选题 → 拆文学习 → 大纲设计 → 正文写作 → 质量控制 → 去AI味 → 审稿发布**完整链路。

基于 [oh-story-claudecode](https://github.com/nihaoshi/oh-story-claudecode) 深度适配，专为 [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) 平台设计。

---

## 目录

- [核心特性](#核心特性)
- [前置依赖](#前置依赖)
- [安装方式](#安装方式)
- [快速开始](#快速开始)
- [技能一览](#技能一览)
- [项目结构](#项目结构)
- [Writing Project Rules](#writing-project-rules)
- [知识库体系](#知识库体系)
- [自动化脚本](#自动化脚本)
- [MiMo Code 深度适配](#mimocode-深度适配)
- [使用示例](#使用示例)
- [与原版的区别](#与原版的区别)
- [更新日志](#更新日志)
- [License](#license)

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **全流程覆盖** | 从选题到发布，14 个技能覆盖网文创作全生命周期 |
| **长篇 + 短篇** | 同时支持长篇连载和短篇创作，按篇幅自动分流 |
| **智能路由** | `/story` 主入口自动识别用户意图，分发到对应技能 |
| **质量守护** | 一致性检查、文风检查、伏笔健康度检测，杜绝逻辑漏洞 |
| **Writing Project Rules** | 自动部署写作强制规则到项目，AI 每次会话自动读取 |
| **跨会话连续** | 基于 MiMo Code 持久化记忆，写作进度自动保存/恢复 |
| **去AI味** | 专业检测并清除 AI 写作痕迹，让文字更自然 |
| **插件系统** | 支持 MiMo Code 插件机制，可配置自动触发规则 |

---

## 前置依赖

| 依赖 | 用途 | 必需性 |
|------|------|--------|
| [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) | 运行平台 | **必需** |
| [Node.js](https://nodejs.org/) 12+ | 一致性检查/文风检查/伏笔检查脚本 | **必需**（长篇写作） |
| [Python 3](https://www.python.org/) | 字数统计（跨平台） | **必需**（长篇写作） |
| [Git](https://git-scm.com/) | 版本控制 | 可选 |
| [agent-browser](https://www.npmjs.com/package/agent-browser) | 浏览器操控（CDP 协议） | 可选（仅 browser-cdp） |

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
2. 复制 14 个技能到 `~/.config/mimocode/skills/`
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

应在列表中看到 `story`、`story-long-write`、`story-short-write` 等 14 个技能。

### 更新技能包

```bash
cd ~/mimoCode-story && git pull
# 重新复制到 MiMo Code 目录
cp -r skills/* ~/.config/mimocode/skills/
```

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

### 3. 质量控制

```
# 去AI味
/story-deslop

# 审稿
/story-review
```

---

## 技能一览

| 命令 | 功能 | 适用场景 |
|------|------|----------|
| `/story` | 网文工具箱主入口 | 自动路由到对应技能 |
| `/story-setup` | 初始化写作项目 | 新建项目时 |
| `/story-long-write` | 长篇小说写作 | 日更、续写、修改章节 |
| `/story-short-write` | 短篇小说写作 | 盐言故事、知乎体 |
| `/story-long-analyze` | 长篇拆文 | 学习爆款结构 |
| `/story-short-analyze` | 短篇拆文 | 分析短篇技巧 |
| `/story-scan` | 扫榜选题（通用） | 选题决策 |
| `/story-long-scan` | 长篇扫榜 | 起点/番茄/晋江排行 |
| `/story-short-scan` | 短篇扫榜 | 知乎盐言/七猫排行 |
| `/story-deslop` | 去AI味 | 清除 AI 写作痕迹 |
| `/story-review` | 多角度审稿 | 质量审查 |
| `/story-cover` | 生成封面 | 封面设计 |
| `/story-import` | 导入已有小说 | 半成品/完本逆向解析 |
| `/browser-cdp` | 浏览器操控 | 复用登录态、爬取数据 |

---

## 项目结构

### 技能仓库结构

```
mimoCode-story/
├── skills/                              # 技能目录
│   ├── story/                           # 主入口路由
│   ├── story-setup/                     # 环境部署
│   ├── story-long-write/                # 长篇写作（核心）
│   │   ├── references/                  # 专属参考文档
│   │   └── scripts/                     # 自动化脚本
│   │       ├── consistency-check.js     # 一致性检查
│   │       ├── foreshadow-check.js      # 伏笔检查
│   │       ├── style-lint.js            # 文风检查
│   │       ├── normalize-punctuation.js # 标点规范化
│   │       └── detect-python.js         # 跨平台 Python 检测
│   ├── story-short-write/               # 短篇写作
│   ├── story-long-analyze/              # 长篇拆文
│   ├── story-short-analyze/             # 短篇拆文
│   ├── story-long-scan/                 # 长篇扫榜选题
│   ├── story-short-scan/                # 短篇扫榜选题
│   ├── story-scan/                      # 扫榜选题（通用）
│   ├── story-import/                    # 逆向导入已有小说
│   ├── story-deslop/                    # 去AI味
│   ├── story-review/                    # 审稿
│   ├── story-cover/                     # 封面
│   ├── browser-cdp/                     # 浏览器操控（CDP）
│   └── _shared/                         # 共享资源
│       ├── references/                  # 共享参考文件（68 个）
│       │   └── INDEX.md                 # 知识库索引
│       ├── templates/                   # 写作模板库（4 个）
│       ├── examples/                    # 专家案例库（3 个）
│       └── checklists/                  # 写作检查清单（4 个）
├── .githooks/                           # Git Hooks（可选）
│   ├── pre-commit                       # 提交前检查
│   └── post-commit                      # 提交后提醒
├── demo/                                # 使用示例
│   ├── 让你管账号，你高燃混剪炸全网/       # 长篇写作项目示例
│   ├── 拆文库-曾将爱意私藏/               # 拆文输出示例
│   ├── 拆文库-盘龙/                      # 拆文输出示例
│   └── 短篇写作-示例/                    # 短篇写作示例
├── install.sh                           # macOS/Linux 安装脚本
├── install.ps1                          # Windows 安装脚本
├── package.json                         # npm 包配置
├── openclaw.plugin.json                 # 插件清单
├── .skills-plugin-config.json           # 技能注册配置
├── AGENTS.md                            # 本仓库的 AI 指令
└── README.md
```

### 写作项目结构（由 `/story-setup` 创建）

```
{书名}/
├── AGENTS.md                            # Writing Project Rules（AI 自动读取）
├── .story-deployed                      # 部署标记
├── .active-book                         # 当前书目标记
├── 设定/
│   ├── 世界观/
│   │   ├── 背景设定.md
│   │   └── 金手指.md
│   ├── 角色/
│   │   └── {角色名}.md
│   ├── 势力/
│   ├── 关系.md
│   ├── 题材定位.md
│   └── 文风.md
├── 大纲/
│   ├── 大纲.md
│   ├── 卷纲_第1卷.md
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

---

## Writing Project Rules

`/story-setup` 会自动在写作项目根目录创建 `AGENTS.md`，包含以下强制规则。AI 每次会话自动读取并遵守。

### 写完每章必须执行

1. 更新 `追踪/伏笔.md` — 新增/回收伏笔
2. 更新 `追踪/时间线.md` — 记录事件时序
3. 更新 `追踪/角色状态.md` — 更新角色状态 + 性格锚点
4. 更新 `追踪/物品.md` — 物品位置/状态变化
5. 更新 `追踪/环境.md` — 季节/天气/场景
6. 更新 `追踪/上下文.md` — 进度摘要
7. 运行 `consistency-check.js` — 一致性检查
8. 运行 `style-lint.js` — 文风检查
9. 运行 `foreshadow-check.js` — 伏笔健康检查

### 跨会话恢复规则

新会话开始时，AI 必须先读取：
1. `追踪/上下文.md` — 上次进度
2. `追踪/角色状态.md` — 角色当前状态（含性格锚点）
3. `追踪/伏笔.md` — 待回收伏笔

### 写作铁律（不可违反）

1. 写正文前必须用 Read 工具读细纲，不得凭记忆写
2. 续写前必须用 Read 工具读上一章正文，不得凭记忆接
3. 写对话前必须查角色性格锚点（`追踪/角色状态.md`）
4. 参考文档标记"必读"的必须实际用 Read 工具加载
5. 字数未达标（< 细纲目标 90%）不得结束本章

### 一级禁用词

不禁、竟然、居然、事实上、实际上、显而易见、毫无疑问、可想而知、不言而喻、与此同时、值得注意的是、需要指出的是、不可否认、嘴角勾起、嘴角上扬、嘴角微扬、眼中闪过、眼底闪过、目光中闪过、深吸一口气、长舒一口气、吐出一口浊气、缓缓开口、淡淡说道、轻声说道、仿佛、宛如、恰似、犹如、值得一提、不得不说、总而言之

### 参考文档速查

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

---

## 知识库体系

`_shared/references/` 包含 68 份共享参考文档，按场景分类：

### 题材与市场

- 题材框架、核心梗设计、读者心理、扫榜选题方法论

### 人物设计

- 角色设定、关系映射、动机链、反派系统、性格锚点

### 剧情与结构

- 大纲方法、矛盾设计、节奏把控、情绪弧线、反转设计

### 写作技法

- 钩子设计、悬念设计、对话技法、写作公式、开篇设计

### 质量控制

- 去AI味、禁用词表、质量检查、一致性追踪

### 千万字支持

- 结构化索引、故事线管理、跨卷追踪、版本管理

### 数据分析

- 写作指标、爽点密度、伏笔健康度、AI 腔趋势

---

## 自动化脚本

`story-long-write/scripts/` 提供写作质量自动检测：

| 脚本 | 功能 | 用法 |
|------|------|------|
| `consistency-check.js` | 一致性检查（物品/环境/角色状态） | `node scripts/consistency-check.js 正文/第XXX章.md` |
| `foreshadow-check.js` | 伏笔健康检查（超期伏笔预警） | `node scripts/foreshadow-check.js 正文/第XXX章.md` |
| `style-lint.js` | 文风检查（禁用词/排比/AI 腔） | `node scripts/style-lint.js 正文/第XXX章.md` |
| `detect-python.js` | 跨平台 Python 检测 | `node scripts/detect-python.js` |

### Git Hooks（可选）

`.githooks/` 提供提交时自动检查（仅当 `version_control=true`）：

- `pre-commit`：检查章节文件格式和完整性
- `post-commit`：提醒更新追踪文件

安装方式（在写作项目中执行）：

**macOS / Linux：**

```bash
cp .githooks/* .git/hooks/
chmod +x .git/hooks/*
```

**Windows (PowerShell)：**

```powershell
Copy-Item .githooks\* .git\hooks\ -Force
```

---

## MiMo Code 深度适配

本技能包针对 MiMo Code 平台进行了深度适配，充分利用其独特能力：

### 核心能力映射

| MiMo Code 能力 | 写作场景 | 实现方式 |
|---------------|---------|---------|
| **持久化记忆** | 跨会话状态连续 | `MEMORY.md` 自动保存/恢复写作进度和决策 |
| **智能上下文管理** | 长篇写作不丢失上下文 | 自动检查点 + 预算化注入 |
| **任务追踪** | 进度管理 | 树状任务系统追踪每章写作状态 |
| **子智能体** | 并行处理 | 拆文/审稿/研究可并行执行 |
| **Goal 停止条件** | 自主写作控制 | `/goal` 命令设置写作停止条件 |
| **Dream & Distill** | 自我进化 | `/dream` 提取写作经验，`/distill` 发现重复工作流 |

### 版本控制（可选）

版本控制功能默认开启，用户可在部署时选择关闭：

```
/story-setup
→ 询问：你需要 Git 版本控制吗？
→ 选择：是/否
```

**关闭后的行为**：
- 跳过 `git add` / `git commit` / `git push`
- 不创建 `.githooks/`
- 追踪文件仍正常更新（与版本控制无关）

### 插件系统

本技能包支持 MiMo Code 插件系统：

```json
// openclaw.plugin.json
{
  "name": "mimocode-story",
  "version": "3.0.0",
  "configSchema": {
    "version_control": { "type": "boolean", "default": true },
    "auto_checkpoint": { "type": "boolean", "default": true },
    "parallel_chapters": { "type": "boolean", "default": false }
  }
}
```

### 自动触发规则

通过 `.skills-plugin-config.json` 配置自动触发：

| 触发器 | 行为 |
|--------|------|
| `trigger: "always"` + `inject: true` | 每条消息自动注入角色状态和一致性守护 |
| 关键词匹配 | 匹配到写作关键词时自动路由到对应技能 |

---

## 使用示例

### 写长篇

```
用户：/story-long-write
AI：你想让读者什么感觉？有没有喜欢的书想对标？

用户：想写玄幻，对标《斗破苍穹》
AI：好的，让我帮你搭建大纲...
```

### 写短篇

```
用户：/story-short-write
AI：你想让读者读完什么感觉？

用户：意难平，想让读者哭
AI：好的，情绪目标确定。让我们构思核心框架...
```

### 去AI味

```
用户：/story-deslop
AI：请提供要处理的文本...

用户：[贴入文本]
AI：检测到中度 AI 味，正在处理...
      - 禁用词替换：12 处
      - 句式调整：8 处
      - 心理外化：5 处
```

### 导入已有小说

```
用户：/story-import
AI：请提供小说文件路径...

用户：D:/我的小说/未完本.txt
AI：正在逆向解析...
      - 识别为长篇项目
      - 已解析 120 章，约 45 万字
      - 自动生成大纲、角色状态、伏笔追踪
      - 项目已创建，可使用 /story-long-write 续写
```

---

## 与原版的区别

| 维度 | 原版 (oh-story-claudecode) | 本版 (mimocode-story) |
|------|---------------------------|----------------------|
| 平台 | Claude Code / OpenClaw | **MiMo Code** |
| Hooks | 6 个 shell hooks | **2 个 git hooks**（可选）+ **插件触发器** |
| Agents | 7 个 Claude Code agents | **MiMo Code 子智能体** |
| 插件格式 | `.claude-plugin/marketplace.json` | **openclaw.plugin.json** |
| 安装方式 | `npx skills add` | **git clone + 一键脚本** |
| 知识库 | 100+ 份方法论文档 | **完整保留**（68 份共享参考） |
| Memory | 无 | **MiMo Code 持久化记忆** |
| 任务追踪 | 无 | **MiMo Code 树状任务系统** |
| 上下文管理 | 无 | **MiMo Code 智能上下文管理** |
| 版本控制 | 强制 | **可选**（用户选择是否启用） |
| 自我进化 | 无 | **Dream & Distill** |
| Writing Project Rules | 无 | **自动部署到项目，AI 自动读取** |
| Demo 示例 | 无 | **完整写作项目示例** |

---

## 更新日志

### v3.0.0 (2026-06-12)

- **新增**：`/story-setup` 自动创建 `AGENTS.md`（Writing Project Rules）
- **新增**：写作项目结构包含 `故事线/`、`跨卷追踪/`、`参考资料/` 目录
- **新增**：Demo 项目完整展示部署后的项目结构
- **优化**：README 重构，增加目录导航和详细说明

### v2.0.0

- 从 oh-story-claudecode 适配到 MiMo Code
- 新增插件系统支持
- 新增自动触发规则
- 版本控制改为可选

### v1.0.0

- 初始版本，基于 oh-story-claudecode

---

## License

MIT

---

## 致谢

- [oh-story-claudecode](https://github.com/nihaoshi/oh-story-claudecode) - 原版网文写作技能包
- [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) - MiMo Code 平台
