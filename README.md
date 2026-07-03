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
| **9 重质量门禁** | 禁用词、一致性、伏笔、字数、角色声音、情绪曲线、爽点密度、跨章重复、项目缺口（warn 必须处理，不可跳过） |
| **百分制评分** | 15维度LLM评审，90分通过，15套题材模板自动适配，不达标自动修复（无阻断且无警告后才执行） |
| **写前预防** | 质量约束注入到写作上下文，AI 写之前就知道红线 |
| **去AI味** | 专业检测并清除 AI 写作痕迹，让文字更自然 |
| **跨会话连续** | 基于 MiMo Code 持久化记忆，写作进度自动保存/恢复 |
| **批量细纲生成** | 进度管理后自动补建当前弧/卷细纲，含去重检查 |
| **动态配置更新** | 写完章节后自动扫描所有配置文件，按需更新追踪+设定+故事线+跨卷追踪 |
| **设定回写验证** | 写完章节后自动验证设定文件是否已正确更新，防止遗漏 |

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

重启 MiMo Code，运行 `/mimo debug skill`，应在列表中看到 `story-mimo`、`story-long-write-mimo` 等技能。

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
/story-long-write    # 长篇小说
/story-short-write   # 短篇小说
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
| `story-long-write-mimo` | `/story-long-write-mimo` | 长篇写作（5阶段） |
| `story-chapter-write-mimo` | `/chapter-write` | 单章写作（15步，含设定回写验证） |
| `story-chapter-fast-write-mimo` | `/快速写章` | 快速书写（按需加载，token优化60-70%） |
| `story-chapter-ultra-write-mimo` | `/极致写章` | 极致书写（全量检测，追求最高质量） |
| `story-short-write-mimo` | `/story-short-write-mimo` | 短篇写作（4阶段） |
| `story-outline-mimo` | `/outline` | 大纲生成（含细纲+质量自检） |
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

### 质量控制（5个）

| 技能 | 触发方式 | 功能 |
|------|---------|------|
| `quality-mimo` | `/quality-mimo` | 统一质量检查 |
| `story-deslop-mimo` | `/story-deslop-mimo` | 去AI味 |
| `story-review-mimo` | `/story-review-mimo` | 多视角审稿 |
| `audit-mimo` | `/audit-mimo` | 全量审计 |
| `project-health-mimo` | `/project-health-mimo` | 项目健康检查 |

### 辅助工具（9个）

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

**关键改进**：
- 动态扫描：不再硬编码目录，自动适配项目结构变化
- 按需更新：根据正文实际变化决定更新哪些文件，避免遗漏
- 角色同步：更新后自动运行 `character-sync.js` 验证一致性
- **必须实际执行编辑**：Step C 必须用 Edit/Write 工具修改文件，不可只列出需要更新的文件
- **设定文件回写必须执行**：正文揭示新信息时，必须用 Edit 工具更新设定/文件

### 设定回写验证

追踪更新完成后，自动验证设定文件是否已正确更新：

```
1. 扫描本章正文中的所有角色名
2. 检查每个角色的设定文件是否包含本章新增的关键信息
3. 检查追踪/角色状态.md 中角色状态是否已更新
4. 输出验证报告（✅已更新 / ⚠️需更新 / ❌缺失）
5. 如有遗漏，当场补充更新
```

**两种执行模式**：
- `story-chapter-write-mimo`：子 agent 隔离执行（explore 类型）
- `story-long-write-mimo`：主 agent 执行

### 细纲去重机制

生成新细纲前，扫描前 5 章细纲检查重复：

| 检查项 | 规则 |
|--------|------|
| 核心事件 | 不得与前 5 章高度相似 |
| 情节点 | 不得与前 3 章 >50% 重合 |
| 情绪 | 连续 3 章不得同一情绪目标 |
| 爽点 | 连续 3 章不得同一爽点类型 |

### project_dir 声明

所有 32 个技能的 frontmatter 均声明 `inputs.project_dir`，编排层可统一验证输入参数。

---

## 自动化脚本

### 质量检查脚本（skills/_shared/scripts/）

| 脚本 | 功能 | 退出码 |
|------|------|--------|
| `quality-gate.js` | 统一质量门禁（9重检查+百分制评分） | 0=通过, 1=警告, 2=阻断, 3=评分不达标 |
| `style-lint.js` | 禁用词+AI腔检测 | 0=通过, 1=有问题 |
| `consistency-check.js` | 一致性检查 | 0=通过, 1=警告, 2=错误 |
| `cross-chapter-check.js` | 跨章重复检测 | 0=通过, 1=重复 |
| `voice-check.js` | 角色声音一致性 | 0=通过, 1=不一致 |
| `emotion-analyzer.js` | 情绪曲线分析 | 0=正常, 1=平坦警告 |
| `satisfaction-meter.js` | 爽点密度度量 | 0=达标, 1=不足 |
| `detect-story-gaps.js` | 项目缺口检测 | 0=通过, 1=警告, 2=阻断 |
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
  │   ├── foreshadow        伏笔逾期 > 50 章 → 警告
  │   ├── wordcount         字数 < 目标 90% → 阻断
  │   ├── cross-chapter     跨章重复检测 → 警告
  │   ├── voice-check       角色声音不一致 → 警告
  │   ├── emotion-analyzer  情绪曲线平坦 → 警告
  │   ├── satisfaction      爽点密度不足 → 警告
  │   └── detect-gaps       设定缺口/大纲缺失 → 警告
  │
  └── 第二层：百分制评分（主观项）
      ├── 15维度LLM评审（开场/情感/结构/语言/细节/过渡/逻辑/对比/张力/亲和/感官/节奏/连贯/具体化/爆发力）
      ├── 15套题材模板（玄幻/仙侠/都市/悬疑/言情/历史/科幻/末世/重生/穿越/系统/无限流/宫斗/短篇/默认）
      ├── 通过阈值：90分
      └── 不达标自动修复循环（最多3轮）

退出码：
  0 = 全部通过（含评分 ≥ 90）
  1 = 有警告（必须处理后复查，不可跳过）
  2 = 有阻断项（必须修复）
  3 = 评分不达标（需修复后重评）

⚠️ 重要：warn 也必须处理！
  - 返回 exit code 1 时，必须创建 FIX 任务处理警告
  - 处理完后重新运行 quality-gate.js 复查
  - 复查通过（exit code 0）后才能继续后续流程
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

### v5.8.2（2026-07-03）

**脚本路径全面修复**：
- 修复 `story-chapter-fast-write-mimo`：创建缺失的 `scripts/` 目录，复制 `step-guard.js`
- 修复 `story-chapter-ultra-write-mimo`：创建缺失的 `scripts/` 目录，复制 `step-guard.js`
- 修复 `story-review-mimo`：3 处引用不存在的 `atoms/*/scripts/run-detect.js` 改为 `_shared/scripts/` 对应脚本
- 修复 57 处模糊路径 `node skills/xxx` 统一为 `{skill_dir}/` 或 `$HOME/.config/mimocode/skills/`
- 涉及 18 个文件：12 个 SKILL.md + 6 个 references/*.md
- 路径规范：技能自带脚本用 `{skill_dir}/scripts/`，共享脚本用 `$HOME/.config/mimocode/skills/_shared/scripts/`

### v5.8.1（2026-07-01）

**评分模块与质量检测修复**：
- 修复 `quality-gate.js`：有 warn 时跳过评分的问题，恢复原有逻辑（warn 需先处理）
- 修复 6 个写作 skill 评分触发条件：统一改为"无阻断且无警告"后才执行评分
- 修复 6 个写作 skill warn 处理：添加 `warn 必须处理，不可跳过` 强制提示
- 修复 6 个写作 skill 设定回写：添加 `必须实际执行编辑，不可只列出` 要求
- 修复 5 个写作 skill 条件任务表格：补充评分任务触发条件（Step 13.5/4.5/09.5）
- 修复 3 个写作 skill 修复循环流程图：补充评分步骤位置
- 涉及文件：`quality-gate.js`、`story-long-write-mimo`、`story-chapter-write-mimo`、`story-chapter-fast-write-mimo`、`story-chapter-ultra-write-mimo`、`story-short-write-mimo`、`story-deslop-mimo`、`story-rewrite-mimo`、`quality-mimo`

### v5.8.0（2026-06-30）

**百分制评分系统**：
- 新增 `writing-score-rubric.md`：15维度评分标准（开场吸引力/情感深度/叙述结构/语言生动性/细节描写/过渡连贯/逻辑清晰/对比反差/情感张力/人性化亲和/视觉感官/节奏流畅/逻辑连贯/细节具体化/情感爆发力）
- 新增 `writing-scorer.js`：评分脚本，读取章节和题材模板，输出LLM评审任务
- 新增 15 套题材评分模板（`score-templates/`）：玄幻/仙侠/都市/悬疑/言情/历史/科幻/末世/重生/穿越/系统流/无限流/宫斗/短篇/默认
- 升级 `quality-gate.js`：新增 `--genre`/`--no-score`/`--score`/`--threshold` 参数，退出码3（score_fail）
- 升级 `quality-rules.md`：新增百分制评分规则章节（双层门禁/15维度/题材模板/修复循环）
- 升级 7 个写作skill：long-write/chapter-write/chapter-fast-write/chapter-ultra-write/short-write/rewrite/deslop 全部集成评分步骤
- 双层门禁机制：第一层脚本检查（客观项）→ 第二层LLM评分（主观项）→ 90分通过，不达标自动修复循环最多3轮

### v5.7.0（2026-06-29）

**脚本路径统一 + 细纲格式补全**：
- 修复所有 SKILL.md 中的脚本引用路径：`skills/_shared/scripts/` → `$HOME/.config/mimocode/skills/_shared/scripts/`（32处）
- 修复所有 SKILL.md 中的参考文档引用路径：`skills/_shared/references/` → `$HOME/.config/mimocode/skills/_shared/references/`（23处）
- 补全 `agent-prompt-templates.md` 缺失的 Step 4（细纲生成）prompt 模板
- 细纲格式新增 3 个字段：涉及角色、涉及场景、涉及伏笔（供下游文件分析器使用）
- 统一 4 个 skill 的细纲格式：story-outline-mimo、story-chapter-write-mimo、story-chapter-fast-write-mimo、story-chapter-ultra-write-mimo
- 更新 story-progress-mimo 的细纲格式检查项

### v5.6.0（2026-06-28）

**全量修复与新增技能**：
- 新增 `story-chapter-fast-write-mimo`（快速书写）：融合 long-write 的4个优势 + chapter-write 的15步，按需加载，token 减少 60-70%
- 新增 `story-chapter-ultra-write-mimo`（极致书写）：融合 long-write 全部深度 + chapter-write 全部隔离，三重检测，追求最高质量
- 修复 `audit-mimo`：从 5 维度扩展到 10 维度（新增物资/重复语句/跨卷追踪/故事线/设定文件审计）
- 修复 `goal-mimo`：增加写作 skill 选择参数（long/fast/ultra）
- 修复 `project-health-mimo`：补充 8 项遗漏检查、增加严重度分级（BLOCK/WARN/OPTIONAL）、修复脚本与文档不一致
- 修复 `story-review-mimo`：从 5 维度扩展到 7 维度，增加字数/跨章节/声音/毒点检测，集成 detect-* 原子技能
- 修复 `story-rewrite-mimo`：增加后章一致性检测、影响范围分析、连锁重写机制
- 修复 `story-outline-mimo` + `story-progress-mimo`：细纲生成职责、Phase 编号修正、守卫脚本全覆盖、任务编号统一
- 修复拆文目录：统一角色/文风/剧情目录映射规则
- 统一守卫脚本：全部命名为 `step-guard.js`
- 补充 4 个 skill 的 Task 跟踪集成章节
- 更新 AGENTS.md 表格（新增 4 个 skill，更新 audit 维度说明）

### v5.5.0（2026-06-27）

**AGENTS.md 精简重构**：
- 删除跨会话恢复规则（10个文件列表）→ skill 自动加载
- 删除写完每章必须执行（11项）→ skill 流程已包含
- 删除性格一致性规则、禁用词说明、重复语句说明 → 写作铁律已覆盖
- 删除 Git Hooks 安装说明 → skill 中已有
- 通过标准统一：整个流程任何环节的检查结果都必须 pass
- `story-setup-mimo` 版本升级到 3.3.0

### v5.4.1（2026-06-27）

**项目健康检查脚本升级**：
- `project-health.js` 检查范围扩展到所有配置文件
- 新增检查：故事线/、跨卷追踪/ 目录及文件
- 新增检查：追踪/物资.md、追踪/重复语句.md
- 新增文件模板：故事线索引、跨卷伏笔、角色弧线、卷间过渡等
- `project-health-mimo` 版本升级到 2.1.0

### v5.4.0（2026-06-27）

**项目健康检查强化**：
- AGENTS.md 项目健康检查规则升级为全量检查
- 检查范围：动态扫描项目目录下所有配置文件（设定/、追踪/、故事线/、跨卷追踪/、大纲/）
- 通过标准：所有检查项必须为 `pass`
- 阻断规则：`fail`/`warn`/`block` 都必须修复，不能跳过
- 执行流程：检查 → 列出问题 → 修复 → 重检 → 直到全部 pass
- `story-setup-mimo` 版本升级到 3.2.0

### v5.3.0（2026-06-27）

**项目健康检查强制规则**：
- 在 `AGENTS.md` 中新增项目健康检查规则（不可违反）
- 触发任何写作 skill 时，第一步必须检查项目健康状态
- 检查结果为 `fail` 时必须修复所有问题，不能跳过
- 修复后重新检查，直到 `pass` 才能继续
- `story-setup-mimo` 版本升级到 3.1.0

### v5.2.0（2026-06-27）

**动态配置更新**：
- 所有写作技能统一使用动态扫描更新配置文件，不再硬编码目录
- 使用 `glob` 工具扫描项目目录下所有 `.md` 文件，自动识别配置文件类型
- 更新范围：追踪+设定+故事线+跨卷追踪，按需更新不遗漏
- 修改 `story-long-write-mimo`、`story-chapter-write-mimo`、`story-short-write-mimo`、`story-rewrite-mimo` 等12个文件
- 统一所有引用"更新追踪文件"的地方为"更新所有配置文件"

### v5.1.0（2026-06-26）

**设定回写验证**：
- 新增 Step 14.5（`story-chapter-write-mimo`）：子 agent 隔离执行设定回写验证
- 新增步骤 10.5（`story-long-write-mimo`）：主 agent 执行设定回写验证
- 自动扫描正文中的角色，检查设定文件是否包含本章新增信息
- 输出验证报告，标注遗漏项并当场补充
- 更新 `step-guard.js`、`validate-step.js`、`workflow-guard.js` 支持新步骤

### v5.0.0（2026-06-25）

**架构升级：统一文件发现机制**
- 新增 `scan-project-structure.js` 自动扫描项目目录结构
- 新增 `project-structure.md` 动态扫描规范，所有技能引用统一结构定义
- 10 个核心技能从硬编码文件路径改为动态扫描，新增文件夹自动适配

**frontmatter 统一**
- 所有 27 个技能声明 `inputs.project_dir`，编排层可统一验证
- 缺失声明的技能（18个）全部补充

**前置检查统一**
- 所有技能增加目录存在检查，缺失时友好提示
- 新增前置检查的技能（15个）

**追踪更新三步流程**
- 写作技能统一使用：扫描项目→分析变更→按清单更新
- 覆盖追踪文件+设定文件+故事线+跨卷追踪
- `story-long-write-mimo`、`story-chapter-write-mimo`、`story-short-write-mimo`、`story-rewrite-mimo` 全部适配

**细纲去重**
- 生成新细纲前扫描前 5 章，避免核心事件/情节点/情绪/爽点重复
- `story-long-write-mimo`、`story-chapter-write-mimo`、`story-progress-mimo` 全部适配

**批量细纲生成**
- `story-progress-mimo` 新增 Phase 5：进度管理后自动补建当前弧/卷细纲
- 含质量检查（格式/去重/伏笔衔接/角色弧线）

**字数统计统一**
- `story-deslop-mimo` 从 LLM 自行统计改为 `wordcount.js`
- `story-short-write-mimo` 补全 `wordcount.js` 调用命令

**扫榜路径统一**
- 3 个扫榜技能加 `inputs.project_dir` 声明
- 选题决策输出路径统一：有 project_dir 时写入项目目录，无时写入当前目录

**project-structure.md 更新机制**
- 运行 `scan-project-structure.js` 可自动扫描项目并更新结构定义
- 新增文件夹时无需手动修改多个技能

### v4.0.0（2026-06-16）

**原子化重构**：
- 新增 45 个原子技能，分为 7 类：检测 11 + 修正 7 + 评审 5 + 写前预防 6 + 扫榜 4 + 拆文 7 + 写作 5
- 14 个脚本提升到 `_shared/scripts/`

### v3.0.0（2026-06-13）

- 新增 `quality-gate.js` 统一质量门禁（9重检查）
- 新增 `story-synopsis-mimo`、`story-export-mimo`

### v2.0.0（2026-06-11）

- 初始版本，基于 oh-story-claudecode 适配 MiMo Code

---

## License

[MIT](LICENSE)
