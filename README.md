# MiMo Code 网文写作技能包

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: MiMo Code](https://img.shields.io/badge/Platform-MiMo%20Code-blue.svg)](https://github.com/XiaomiMiMo/MiMo-Code)

专业的网文写作全流程技能包，覆盖长篇与短篇网络小说的**扫榜选题 → 拆文学习 → 大纲设计 → 正文写作 → 质量控制 → 去AI味 → 审稿发布**完整链路。

---

## 目录

- [核心特性](#核心特性)
- [前置依赖](#前置依赖)
- [安装方式](#安装方式)
- [快速开始](#快速开始)
- [技能一览](#技能一览)
- [架构设计](#架构设计)
- [自动化脚本](#自动化脚本)
- [质量门禁体系](#质量门禁体系)
- [更新日志](#更新日志)
- [License](#license)

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **全流程覆盖** | 32 个技能覆盖网文创作全生命周期 |
| **长篇 + 短篇** | 同时支持长篇连载和短篇创作，按篇幅自动分流 |
| **智能路由** | `/story-mimo` 主入口自动识别用户意图，分发到对应技能 |
| **动态文件发现** | 所有技能动态扫描项目目录获取文件列表，新增文件夹自动适配 |
| **统一 frontmatter** | 所有技能声明 `inputs.project_dir`，编排层可统一验证 |
| **前置检查** | 所有技能执行前验证目录存在，缺失时友好提示 |
| **9 重质量门禁** | 禁用词、一致性、伏笔、字数、角色声音、情绪曲线、爽点密度、跨章重复、项目缺口 |
| **6 类毒点检测** | 爽文不爽、压制无目的、降智打击、反派结局无关、情绪疲劳、重复循环（P0/P1分级） |
| **6 平台对标** | 起点/番茄/晋江/知乎盐选/七猫/点众，每平台独立适配标准 + P0拦截项 |
| **百分制评分** | 15维度LLM评审，90分通过，15套题材模板自动适配，不达标自动修复 |
| **写前预防** | 质量约束注入到写作上下文，AI 写之前就知道红线 |
| **去AI味** | 75个一级禁用词 + 40条AI句式正则 + 28种心理直述模式 + 独立润色步骤 |
| **AI味七维免疫** | 语言规整/逻辑个性/举例泛化/立场模糊/高频重复/事实精准/结构模板化 |
| **跨会话连续** | 基于 MiMo Code 持久化记忆，写作进度自动保存/恢复 |

---

## 前置依赖

| 依赖 | 版本 | 用途 | 必需性 |
|------|------|------|--------|
| [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) | 最新 | 运行平台 | **必需** |
| [Node.js](https://nodejs.org/) | 14+ | 质量检查脚本 | **必需**（长篇写作） |
| [Git](https://git-scm.com/) | 任意 | 版本控制 | 可选 |

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

### 方式二：手动安装

```bash
# 1. 克隆仓库
git clone https://github.com/nihaoshi/mimoCode-story.git ~/mimoCode-story

# 2. 复制 skills 到 MiMo Code 用户技能目录
# macOS / Linux:
cp -r ~/mimoCode-story/skills/* ~/.config/mimocode/skills/

# Windows (PowerShell):
Copy-Item -Path "$HOME\mimoCode-story\skills\*" -Destination "$HOME\.config\mimocode\skills\" -Recurse -Force
```

### 验证安装

重启 MiMo Code，运行 `/mimo debug skill`，应在列表中看到 `story-mimo`、`story-write-mimo` 等技能。

---

## 快速开始

### 1. 初始化写作项目

```
/story-setup
```

### 2. 扫榜选题

```
/story-long-scan    # 长篇扫榜（起点/番茄/七猫/晋江）
/story-short-scan   # 短篇扫榜（知乎盐言/点众/黑岩）
```

### 3. 开始写作

```
/story-write-mimo   # 统一写作入口（支持长篇/短篇）
/story-short-write  # 短篇写作
```

### 4. 日更续写

```
/续写
/日更
```

### 5. 质量检查

```
/quality-mimo
```

---

## 技能一览

### 核心写作（10个）

| 技能 | 触发方式 | 功能 |
|------|---------|------|
| `story-mimo` | `/story-mimo`、`/网文` | 路由入口，自动分发 |
| `story-setup-mimo` | `/story-setup-mimo` | 初始化写作项目 |
| `story-write-mimo` | `/story-write-mimo` | 统一写作入口（standard/fast/ultra 三种模式） |
| `story-chapter-write-mimo` | `/chapter-write` | 单章写作（含设定回写验证） |
| `story-chapter-fast-write-mimo` | `/快速写章` | 快速书写（按需加载，token优化60-70%） |
| `story-chapter-ultra-write-mimo` | `/极致写章` | 极致书写（全量检测，追求最高质量） |
| `story-short-write-mimo` | `/story-short-write-mimo` | 短篇写作（上下文→准备→写作→检测→去AI味→追踪） |
| `story-outline-mimo` | `/outline` | 大纲生成（迭代式+分题材模板+修改模式） |
| `story-progress-mimo` | `/progress` | 进度管理+批量细纲 |

### 拆文分析（3个）

| 技能 | 触发方式 | 功能 |
|------|---------|------|
| `story-long-analyze-mimo` | `/story-long-analyze-mimo` | 长篇拆文 |
| `story-short-analyze-mimo` | `/story-short-analyze-mimo` | 短篇拆文 |
| `story-import-mimo` | `/story-import-mimo` | 导入已有小说 |

### 扫榜选题（3个）

| 技能 | 触发方式 | 功能 |
|------|---------|------|
| `story-long-scan-mimo` | `/story-long-scan-mimo` | 长篇扫榜 |
| `story-short-scan-mimo` | `/story-short-scan-mimo` | 短篇扫榜 |
| `story-scan-mimo` | `/story-scan-mimo` | 通用扫榜 |

### 质量控制（6个）

| 技能 | 触发方式 | 功能 |
|------|---------|------|
| `quality-mimo` | `/quality-mimo` | 统一质量检查 |
| `story-deslop-mimo` | `/story-deslop-mimo` | 去AI味 |
| `story-review-mimo` | `/story-review-mimo` | 多视角审稿 |
| `story-critic-mimo` | `/story-critic-mimo`、`/编辑审稿` | 编辑审稿（8维审查+6毒点+6平台对标+签约/退稿决策） |
| `audit-mimo` | `/audit-mimo` | 全量审计 |
| `project-health-mimo` | `/project-health-mimo` | 项目健康检查 |

### 辅助工具（10个）

| 技能 | 触发方式 | 功能 |
|------|---------|------|
| `story-rewrite-mimo` | `/rewrite` | 章节重写 |
| `story-synopsis-mimo` | `/synopsis` | 简介生成 |
| `story-cover-mimo` | `/cover` | 封面生成 |
| `story-export-mimo` | `/export` | 多格式导出 |
| `goal-mimo` | `/goal` | 自主写作目标 |
| `dream-mimo` | `/dream` | 经验沉淀 |
| `distill-mimo` | `/distill` | 工作流优化 |
| `story-session-mimo` | 自动触发 | 会话管理 |
| `orchestrator` | `/orchestrator` | 写作流程编排 |
| `browser-cdp-mimo` | 浏览器操作 | CDP控制 |

---

## 架构设计

### 统一文件发现机制

所有技能使用动态扫描获取项目文件，不再硬编码路径：

```
技能执行时：
1. 读取 _shared/references/project-structure.md → 获取目录结构定义
2. 运行 ls 命令扫描项目目录 → 动态获取文件列表
3. 按需加载 → 只读取本次需要的文件
```

**新增文件夹时**，运行 `node skills/_shared/scripts/scan-project-structure.js <项目目录>` 即可自动更新结构定义，所有技能自动适配。

### 前置检查机制

所有技能执行前验证目录存在：

```bash
ls {project_dir}/正文/ {project_dir}/设定/ {project_dir}/追踪/ 2>/dev/null || echo "ERROR: 项目目录缺失"
```

缺失时提示用户：「项目目录不存在，请先用 /story-setup-mimo 部署项目。」

### 动态配置更新

写完章节后，动态扫描并更新所有配置文件：

```
Step A：动态扫描项目结构 → 用 glob 扫描所有 .md 文件，识别配置文件类型
Step B：分析正文 → 提取变更清单（新角色？状态变化？伏笔？物品？）
Step C：按清单更新 → 只更新涉及的文件（追踪+设定+故事线+跨卷追踪）
```

### 细纲去重机制

生成新细纲前，扫描前 5 章细纲检查重复：

| 检查项 | 规则 |
|--------|------|
| 核心事件 | 不得与前 5 章高度相似 |
| 情节点 | 不得与前 3 章 >50% 重合 |
| 情绪 | 连续 3 章不得同一情绪目标 |
| 爽点 | 连续 3 章不得同一爽点类型 |

---

## 自动化脚本

### 质量检查脚本（skills/_shared/scripts/）

| 脚本 | 功能 | 退出码 |
|------|------|--------|
| `quality-gate.js` | 统一质量门禁（9重检查+百分制评分） | 0=通过, 2=阻断, 3=评分不达标 |
| `style-lint.js` | 禁用词+AI腔+心理直述+程度副词+段落长度+对话比例+AI标点+结尾升华+排比检测 | 0=通过, 1=警告, 2=阻断 |
| `consistency-check.js` | 一致性检查 | 0=通过, 2=有问题 |
| `cross-chapter-check.js` | 跨章重复检测 | 0=通过, 2=有问题 |
| `voice-check.js` | 角色声音一致性 | 0=通过, 2=有问题 |
| `emotion-analyzer.js` | 情绪曲线分析 | 0=通过, 2=有问题 |
| `satisfaction-meter.js` | 爽点密度度量 | 0=通过, 2=有问题 |
| `detect-story-gaps.js` | 项目缺口检测 | 0=通过, 2=有问题 |
| `writing-scorer.js` | 百分制评分（生成LLM评审任务） | 0=达标, 1=不达标, 2=错误 |
| `wordcount.js` | 字数统计 | - |

### 项目结构扫描脚本

| 脚本 | 功能 |
|------|------|
| `scan-project-structure.js` | 扫描项目目录，输出文件结构JSON |
| `character-sync.js` | 验证设定与追踪文件一致性 |

### 使用示例

```bash
# 运行质量门禁
node skills/_shared/scripts/quality-gate.js 正文/第001章.md

# 扫描项目结构
node skills/_shared/scripts/scan-project-structure.js 项目目录

# 验证角色一致性
node skills/_shared/scripts/character-sync.js 项目目录
```

---

## 质量门禁体系

```
写正文 → quality-gate.js（双层门禁）
  ├── 第一层：脚本检查（客观项）
  │   ├── style-lint        一级禁用词 > 0 → 阻断
  │   ├── consistency       物品/环境/角色/时间线错误 → 阻断
  │   ├── foreshadow        伏笔逾期 > 50 章 → 阻断
  │   ├── wordcount         字数 < 目标 90% → 阻断
  │   ├── cross-chapter     跨章重复检测 → 阻断
  │   ├── voice-check       角色声音不一致 → 阻断
  │   ├── emotion-analyzer  情绪曲线平坦 → 阻断
  │   ├── satisfaction      爽点密度不足 → 阻断
  │   └── detect-gaps       设定缺口/大纲缺失 → 阻断
  │
  └── 第二层：百分制评分（主观项）
      ├── 15维度LLM评审
      ├── 15套题材模板（玄幻/仙侠/都市/悬疑/言情/历史/科幻/末世/重生/穿越/系统/无限流/宫斗/短篇/默认）
      ├── 通过阈值：90分
      └── 不达标自动修复循环（最多3轮）

退出码：
  0 = 全部通过（含评分 ≥ 90）
  2 = 有问题（必须修复后复查）
  3 = 评分不达标（需修复后重评）
```

---

## 项目结构

```
{书名}/
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
│   └── 细纲_第XXX章.md    # 每章细纲
│
├── 正文/                  # 章节文件
│   └── 第XXX章_章名.md
│
├── 追踪/                  # 状态追踪
│   ├── 上下文.md          # 进度摘要
│   ├── 伏笔.md            # 伏笔追踪
│   ├── 角色状态.md        # 角色状态+性格锚点
│   ├── 时间线.md          # 事件时间线
│   ├── 物品.md            # 物品追踪
│   ├── 环境.md            # 环境追踪
│   ├── 物资.md            # 物资追踪
│   └── 重复语句.md        # 重复表达黑名单
│
├── 故事线/                # 多线并行管理
├── 跨卷追踪/              # 跨卷伏笔与角色弧线
├── 对标/                  # 拆文引用视图
└── .workflow/             # 工作流中间文件
```

---

## 更新日志

### v2.2.0（2026-07-18）

**技能精简与统一写作入口**：
- 移除 `story-long-write-mimo`，写作功能统一由 `story-write-mimo` 提供
- 新增 `story-write-mimo`：统一写作入口，支持 standard/fast/ultra 三种模式
- `story-chapter-write-mimo`、`story-chapter-fast-write-mimo`、`story-chapter-ultra-write-mimo` 重构为转发入口
- 精简 README，移除过时引用

### v2.1.0（2026-07-11）

**去AI味检测全面升级 + 短篇写作v4.0 + AI味七维免疫**：
- 一级禁用词：21 → 75个
- AI句式正则：0 → 40条
- 心理直述模式：0 → 28种
- `story-short-write-mimo` v4.0：新增场景级情绪曲线、伏笔清单、角色状态表
- AI味七维免疫清单：语言规整/逻辑个性/举例泛化/立场模糊/高频重复/事实精准/结构模板化

### v2.0.1（2026-07-09）

**编辑审稿升级**：
- 新增毒点检测（6类，P0/P1分级）
- 6平台完整适配（起点/番茄/晋江/知乎/七猫/点众）
- 签约/退稿决策函

### v2.0.0（2026-07-08）

**大纲生成迭代式升级 + 新增编辑审稿技能**：
- `story-outline-mimo` v2.0：迭代式沟通 + 分题材模板 + 修改模式
- 新增 `story-critic-mimo`：8维审查 + 6平台对标

### v5.8.0（2026-06-30）

**百分制评分系统**：
- 15维度LLM评审 + 15套题材模板
- 双层门禁：脚本检查 → LLM评分 → 90分通过

---

## License

[MIT](LICENSE)
