# MiMoCode-Story 项目功能细分报告

> 生成时间：2026-06-15 | 版本：v3.3.1 | 用于后期项目重构参考

---

## 一、项目概览

**项目性质**：MiMo Code 网文写作 AI 技能包（Markdown + Node.js 脚本），无构建系统、无测试、无包管理器。

**核心价值**：为 LLM Agent 提供 23 个专业技能，覆盖中国网络小说从市场调研到成稿导出的全流程。

**技术栈**：Markdown（技能定义 + 知识库）、Node.js 14+（30+ 脚本）、可选 Python/agent-browser。

---

## 二、技能清单与功能分类

### 2.1 分类总览

| 分类 | 技能数 | 技能列表 |
|------|--------|----------|
| **路由入口** | 1 | story-mimo |
| **市场调研** | 3 | story-scan-mimo, story-long-scan-mimo, story-short-scan-mimo |
| **拆文分析** | 2 | story-long-analyze-mimo, story-short-analyze-mimo |
| **写作执行** | 2 | story-long-write-mimo, story-short-write-mimo |
| **质量保障** | 3 | story-deslop-mimo, story-review-mimo, quality-mimo |
| **项目审计** | 1 | audit-mimo |
| **项目管理** | 4 | story-setup-mimo, story-import-mimo, story-session-mimo, project-health-mimo |
| **发布导出** | 3 | story-export-mimo, story-cover-mimo, story-synopsis-mimo |
| **自优化** | 3 | dream-mimo, distill-mimo, goal-mimo |
| **浏览器自动化** | 1 | browser-cdp-mimo |
| **合计** | **23** | |
| **重构后新增** | +1 | pre-write-mimo（写前预防） |
| **重构后合并** | -2 | quality-mimo + story-deslop-mimo → detect-fix-mimo |

### 2.2 流水线位置

```
扫榜 → 拆文 → 开书(设定→大纲→正文) → 质检 → 去AI味 → 审稿 → 导出
  │      │       │                                    │       │
  │      │       └── goal-mimo (自主循环)              │       └── story-cover/synopsis
  │      │                                            └── quality/audit
  │      └── story-import-mimo (逆向导入，复用拆文管道)
  └── browser-cdp-mimo (数据采集支撑)

重构后新流水线：
写前预防(pre-write) → 写正文 → 全量验证+修正(detect-fix) → 评审(review，可选)
```

---

## 三、各技能详细功能

### 3.1 路由层

| 技能 | 文件 | 行数 | 功能 | 流程阶段 |
|------|------|------|------|----------|
| **story-mimo** | `skills/story-mimo/SKILL.md` | 52 | 网文工具箱主入口，关键词匹配路由到具体 skill | 意图识别 → 路由分发 |

**路由表**：

| 用户意图 | 关键词 | 路由目标 |
|----------|--------|----------|
| 写长篇 | 开书、写大纲、长篇、连载 | story-long-write-mimo |
| 写短篇 | 短篇、盐言、一万字 | story-short-write-mimo |
| 长篇拆文 | 拆文、分析这本书、黄金三章 | story-long-analyze-mimo |
| 短篇拆文 | 拆短篇、分析这个故事 | story-short-analyze-mimo |
| 长篇扫榜 | 长篇什么火、起点排行 | story-long-scan-mimo |
| 短篇扫榜 | 短篇什么火、知乎盐言排行 | story-short-scan-mimo |
| 通用扫榜 | 排行、什么火、帮我选题 | story-scan-mimo |
| 去AI味 | 去AI味、太AI | story-deslop-mimo |
| 审稿 | 审稿、审查 | story-review-mimo |
| 封面 | 封面、封面图 | story-cover-mimo |
| 环境部署 | 准备写书、搭环境 | story-setup-mimo |
| 导入已有小说 | 导入、把我的书导进来 | story-import-mimo |
| 简介/文案 | 简介、文案 | story-synopsis-mimo |
| 导出 | 导出、导出TXT | story-export-mimo |
| 质量检查 | 检查质量 | quality-mimo |
| 项目审计 | 审计项目、全量检查 | audit-mimo |

---

### 3.2 市场调研类

| 技能 | 文件 | 行数 | 功能 | 流程阶段 | 依赖脚本 |
|------|------|------|------|----------|----------|
| **story-scan-mimo** | `skills/story-scan-mimo/SKILL.md` | 143 | 通用扫榜，webfetch 抓取 + 内置知识库分析 | Phase 1-4：范围→数据→趋势→选题 | 无 |
| **story-long-scan-mimo** | `skills/story-long-scan-mimo/SKILL.md` | 333 | 长篇深度扫榜，5 平台脚本采集，输出选题决策 | Phase 1-4：平台→采集→分析→选题决策 | qidian/fanqie/jjwxc/ciweimao/qimao-rank-scraper.js |
| **story-short-scan-mimo** | `skills/story-short-scan-mimo/SKILL.md` | 223 | 短篇扫榜，点众/黑岩 CDP 采集，情绪市场分析 | Phase 1-4：平台→采集→分析→选题匹配 | dz-browse-scraper.js, heiyan-booklist-scraper.js |

**差异对比**：

| 维度 | story-scan-mimo | story-long-scan-mimo | story-short-scan-mimo |
|------|-----------------|---------------------|----------------------|
| 数据获取 | webfetch + 知识库 | 脚本采集（5 平台） | CDP 采集（2 平台） |
| 分析深度 | 浅（趋势概览） | 深（多榜单交叉分析） | 中（情绪市场分析） |
| 输出 | 选题决策.md | 选题决策.md + 扫榜报告 | 扫榜报告 + 选题匹配 |
| 平台覆盖 | 起点/番茄/晋江/知乎 | 起点/番茄/晋江/七猫/刺猬猫 | 知乎盐言/七猫/黑岩/点众 |

---

### 3.3 拆文分析类

| 技能 | 文件 | 行数 | 功能 | 流程阶段 | 依赖脚本 |
|------|------|------|------|----------|----------|
| **story-long-analyze-mimo** | `skills/story-long-analyze-mimo/SKILL.md` | 112 | 长篇深度拆解，6 阶段管道（Stage 0-6） | 概要→黄金三章→逐章摘要→聚合→设定→报告→文风 | 无（纯 LLM 驱动） |
| **story-short-analyze-mimo** | `skills/story-short-analyze-mimo/SKILL.md` | 120 | 短篇拆解，故事核/结构/手法/共鸣四维分析 | 接收→逐段分析→输出报告 | 无 |

**长篇拆解管道（6 阶段）**：

| 阶段 | 名称 | 输入 | 输出 |
|------|------|------|------|
| 0 | 概要提取 | 原始文本 | 概要.md + 章节索引 |
| 1 | 黄金三章 | 前 3 章 | 第1-3章_深度拆解.md + 快速预览.md |
| 2 | 逐章摘要 | 分块章节 | 章节摘要.md |
| 3 | 聚合分析 | 全部摘要 | 剧情/*.md + 故事线.md |
| 4 | 设定+关系 | Stage 2-3 数据 | 设定/*.md + 角色/*.md |
| 5 | 汇总报告 | 全部输出 | 拆文报告.md |
| 6 | 文风 | 报告+原文 | 文风.md |

**短篇拆解维度**：

| 维度 | 分析内容 |
|------|----------|
| 故事核 | 核心情绪、反转设计、信息差、情绪曲线 |
| 结构 | 开头设计、铺垫手法、升级节奏、反转时机、结尾 |
| 写作手法 | POV、对话技巧、信息控制、物件钩子、感官细节 |
| 共鸣 | 情感共鸣、代入感、社会议题 |

---

### 3.4 写作执行类

| 技能 | 文件 | 行数 | 功能 | 流程阶段 | 依赖脚本 |
|------|------|------|------|----------|----------|
| **story-long-write-mimo** | `skills/story-long-write-mimo/SKILL.md` | 847 | 长篇完整写作系统，5 阶段 + 目标循环 + 经验沉淀 | Phase 1-5 + Goal/Dream/Distill | quality-gate.js, normalize-punctuation.js, detect-story-gaps.js, cross-chapter-check.js, goal.js |
| **story-short-write-mimo** | `skills/story-short-write-mimo/SKILL.md` | 280 | 短篇写作，情绪驱动 4 阶段流程 | Phase 1-4：情绪→框架→场景→润色 | quality-gate.js (短篇版), punctuation-normalize.js |

**长篇写作 5 阶段**：

| 阶段 | 名称 | 核心任务 |
|------|------|----------|
| Phase 1 | 确认选题方向 | 题材匹配、对标书分析、选题决策读取 |
| Phase 2 | 核心设定 | 世界观、角色设计、势力、关系、题材定位 |
| Phase 3 | 大纲搭建 | 卷纲、细纲（黄金三章设计） |
| Phase 4 | 正文写作 | 逐章：读细纲→加载上下文→准备层→调研→写正文→字数验证→禁用词扫描→更新追踪 |
| Phase 5 | 质量检查 | 情绪交付、一致性、去AI味 |

**短篇写作 4 阶段**：

| 阶段 | 名称 | 核心任务 |
|------|------|----------|
| Phase 1 | 情绪定位 | 读者感受 + 题材方向 |
| Phase 2 | 核心框架 | 一句话梗概、核心反转、情绪弧线、人设 |
| Phase 3 | 逐场景写作 | 钩子(300-500字)→铺垫(30-40%)→升级(20-30%)→反转(10-15%)→结尾(5-10%) |
| Phase 4 | 润色 | 开头钩子、情绪曲线、反转铺垫、去AI味、标点 |

**长篇独有子系统**：

| 子系统 | 功能 | 依赖 |
|--------|------|------|
| Goal 自主写作循环 | 设置目标→循环写章→检查进度→直到达标 | goal.js |
| Dream 经验沉淀 | 扫描近 10 章，提取有效技法和常见问题 | dream.js |
| Distill 工作流优化 | 分析写作模式，发现重复和改进点 | distill.js |

---

### 3.5 质量保障类

| 技能 | 文件 | 行数 | 功能 | 依赖脚本 |
|------|------|------|------|----------|
| **story-deslop-mimo** | `skills/story-deslop-mimo/SKILL.md` | 200 | 去AI味，6 道门控清洗 | 无 |
| **story-review-mimo** | `skills/story-review-mimo/SKILL.md` | 128 | 多视角审稿，5 维度评分 | 无 |
| **quality-mimo** | `skills/quality-mimo/SKILL.md` | ~50 | 统一质量检查入口 | quality-gate.js 等 |

**三个技能的区别**：

| 维度 | quality-mimo | story-deslop-mimo | story-review-mimo |
|------|-------------|-------------------|-------------------|
| 角色 | 质检工具（脚本执行器） | 润色工匠（文本改写） | 审稿编辑（评判打分） |
| 本质 | 检查 — 告诉你哪里有问题 | 修改 — 直接帮你改文本 | 评审 — 给你打分+建议 |
| 执行者 | Node.js 脚本（自动化） | LLM 改写（需判断力） | LLM 审读（需鉴赏力） |
| 输出 | ✅/⚠️/❌ 检查报告 | 改写后的文本+修改统计 | 5 维度评分+问题表 |
| 修改文本 | ❌ 不改 | ✅ 直接改 | ❌ 不改（只建议） |

**去AI味 6 道门控**：

| 门控 | 功能 |
|------|------|
| Gate A | 禁用词替换 |
| Gate B | 句式去套路化 |
| Gate C | 心理外化 |
| Gate D | 节奏打散 |
| Gate E | 对话去风格化 |
| Gate F | 结尾去升华 |

**审稿 5 维度**：

| 维度 | 检查项 |
|------|--------|
| 结构 | 钩子、情绪曲线、节奏、反转、章尾钩子 |
| 角色 | 一致性、动机、弧线、配角 |
| 文笔 | AI腔、对话质量、描写密度、禁用词 |
| 商业 | 爽点密度、钩子效果、题材适配、平台适配 |
| 一致性 | 事实、时间线、伏笔、角色状态 |

**调用关系**：
```
写完一章
  ├─→ quality-mimo（自动）→ 跑 quality-gate.js → 输出检查结果
  │       └─→ 发现AI腔 → 调用 story-deslop-mimo 改写
  └─→ story-review-mimo（手动）→ 5 维度打分 → 文笔分低 → 建议调用 story-deslop-mimo
```

---

### 3.6 项目审计

| 技能 | 文件 | 行数 | 功能 | 依赖脚本 |
|------|------|------|------|----------|
| **audit-mimo** | `skills/audit-mimo/SKILL.md` | ~40 | 全量项目审计，扫描所有章节和追踪文件 | full-consistency-audit.js |

---

### 3.7 项目管理类

| 技能 | 文件 | 行数 | 功能 | 依赖脚本 |
|------|------|------|------|----------|
| **story-setup-mimo** | `skills/story-setup-mimo/SKILL.md` | 232 | 一键部署写作项目结构（长篇/短篇），Git hooks, AGENTS.md | 无 |
| **story-import-mimo** | `skills/story-import-mimo/SKILL.md` | 635 | 逆向导入已有小说，复用拆文管道，迁移为标准项目结构 | 依赖 analyze 管道 |
| **story-session-mimo** | `skills/story-session-mimo/SKILL.md` | 143 | Session 生命周期管理，跨会话恢复 | detect-story-gaps.js, dream.js |
| **project-health-mimo** | `skills/project-health-mimo/SKILL.md` | ~60 | 项目健康检查与自动修复 | project-health.js |

**story-setup-mimo 部署内容**：

| 内容 | 说明 |
|------|------|
| 目录结构 | 设定/大纲/正文/追踪/故事线/跨卷追踪/参考资料 |
| AGENTS.md | 写作项目强制规则（禁用词、铁律、参考文档速查） |
| .story-deployed | 部署标记 |
| .active-book | 当前书目指向 |
| .story-config.json | 项目配置（版本控制、并行章节） |
| Git hooks | pre-commit（章节完整性）、post-commit（追踪提醒） |

**story-import-mimo 迁移流程**：

```
Phase 1: 确认导入源（文件/文本） → 篇幅分流（长/短）
Phase 2: 深度分析（调用 analyze 管道，输出到 拆文库/）
Phase 3: 结构迁移
  ├── 长篇路径(3-L): 正文标准化 → 角色迁移 → 关系迁移 → 世界观拆分 → 大纲反推 → 追踪生成 → 文风同步
  └── 短篇路径(3-S): 正文迁移 → 设定生成 → 小节大纲 → 对标引用
Phase 4: 项目激活（质量检查 → .active-book → 选题决策搬迁）
```

---

### 3.8 发布导出类

| 技能 | 文件 | 行数 | 功能 | 依赖脚本 |
|------|------|------|------|----------|
| **story-export-mimo** | `skills/story-export-mimo/SKILL.md` | 111 | 多格式导出（TXT/平台TXT/校对稿） | quality-gate.js, normalize-punctuation.js |
| **story-cover-mimo** | `skills/story-cover-mimo/SKILL.md` | 89 | 封面设计顾问，生成图片提示词 | 无 |
| **story-synopsis-mimo** | `skills/story-synopsis-mimo/SKILL.md` | 177 | 多平台简介生成（起点/番茄/晋江/知乎），A/B 测试变体 | 无 |

---

### 3.9 自优化类

| 技能 | 文件 | 行数 | 功能 | 依赖脚本 |
|------|------|------|------|----------|
| **dream-mimo** | `skills/dream-mimo/SKILL.md` | ~40 | 写作经验沉淀，扫描章节提取技法 → MEMORY.md | dream.js |
| **distill-mimo** | `skills/distill-mimo/SKILL.md` | ~40 | 工作流优化，检测重复模式和改进点 | distill.js |
| **goal-mimo** | `skills/goal-mimo/SKILL.md` | ~50 | 自主写作目标控制，设置目标 → 循环调用 long-write | goal.js |

---

### 3.10 浏览器自动化

| 技能 | 文件 | 行数 | 功能 | 依赖脚本 |
|------|------|------|------|----------|
| **browser-cdp-mimo** | `skills/browser-cdp-mimo/SKILL.md` | ~80 | Chrome CDP 协议自动化，复用登录态 | setup-cdp-chrome.js |

---

## 四、技能间依赖关系

### 4.1 依赖关系图

```
story-mimo (路由)
    │
    ├──→ story-long-scan-mimo ──→ browser-cdp-mimo (CDP采集)
    ├──→ story-short-scan-mimo ──→ browser-cdp-mimo (CDP采集)
    ├──→ story-scan-mimo (webfetch)
    │
    ├──→ story-long-analyze-mimo (独立)
    ├──→ story-short-analyze-mimo (独立)
    │
    ├──→ story-import-mimo ──→ story-long-analyze-mimo (调用拆解管道)
    │                    ──→ story-short-analyze-mimo (调用拆解管道)
    │                    ──→ story-setup-mimo (环境检测)
    │
    ├──→ story-long-write-mimo ──→ story-long-analyze-mimo (对标分析)
    │                         ──→ story-long-scan-mimo (选题决策)
    │                         ──→ story-deslop-mimo (去AI味)
    │                         ──→ story-session-mimo (会话管理)
    │                         ──→ goal-mimo (自主循环)
    │                         ──→ dream-mimo (经验沉淀)
    │                         ──→ distill-mimo (工作流优化)
    │
    ├──→ story-short-write-mimo ──→ story-short-analyze-mimo (对标)
    │                          ──→ story-deslop-mimo (去AI味)
    │
    ├──→ story-deslop-mimo (独立)
    ├──→ story-review-mimo ──→ story-deslop-mimo (AI腔检测时)
    ├──→ story-cover-mimo (独立)
    ├──→ story-synopsis-mimo ──→ story-long-write-mimo (读取大纲/设定)
    │                       ──→ story-long-scan-mimo (读取选题决策)
    ├──→ story-export-mimo (独立)
    ├──→ quality-mimo ──→ quality-gate.js (9项检查)
    ├──→ audit-mimo ──→ full-consistency-audit.js
    ├──→ story-setup-mimo (独立)
    ├──→ project-health-mimo (独立)
    └──→ browser-cdp-mimo (独立)
```

### 4.2 被依赖频率排名

| 技能 | 被依赖次数 | 依赖方 |
|------|-----------|--------|
| story-deslop-mimo | 3 | long-write, short-write, review |
| story-long-analyze-mimo | 2 | long-write, import |
| story-long-scan-mimo | 2 | long-write, synopsis |
| story-session-mimo | 1 | long-write |
| story-setup-mimo | 1 | import |
| browser-cdp-mimo | 2 | long-scan, short-scan |

---

## 五、脚本清单与依赖

### 5.1 共享脚本 (`_shared/scripts/`)

| 脚本 | 行数 | 功能 | 被引用方 |
|------|------|------|----------|
| **banned-words.js** | 32 | 禁用词列表（Level1: 31词, Level2: 18词） | style-lint.js, dream.js, 短篇 quality-gate.js |
| **cdp-utils.js** | 84 | CDP 工具函数（ab/sleep/evalJSON/scrollLoad/getArg/safeStr） | 所有 scraper 脚本 |
| **goal.js** | 184 | 写作目标管理，解析自然语言目标 | goal-mimo |
| **dream.js** | 200 | 经验提取引擎，扫描章节提取技法 | dream-mimo, story-session-mimo |
| **distill.js** | 241 | 工作流分析引擎，检测重复模式 | distill-mimo |
| **punctuation-normalize.js** | 312 | 标点规范化（基础版） | quality-mimo, story-short-write-mimo |

### 5.2 长篇写作脚本 (`story-long-write-mimo/scripts/`)

| 脚本 | 行数 | 功能 | 调用方式 |
|------|------|------|----------|
| **quality-gate.js** | 358 | 质量门禁编排器，运行 9 项子检查 | execFileSync 子进程调用 |
| **style-lint.js** | 283 | 禁用词 + AI 风格检测 | quality-gate.js 调用 |
| **consistency-check.js** | 408 | 一致性检查（物品/环境/角色/时间线） | quality-gate.js 调用 |
| **foreshadow-check.js** | 210 | 伏笔检查（逾期/格式/重叠） | quality-gate.js 调用 |
| **voice-check.js** | 231 | 角色声音一致性检查 | quality-gate.js 调用 |
| **emotion-analyzer.js** | 233 | 情绪曲线分析（关键词评分 + ASCII 图） | quality-gate.js 调用 |
| **satisfaction-meter.js** | 178 | 爽点密度测量 | quality-gate.js 调用 |
| **cross-chapter-check.js** | 429 | 跨章重复检测（n-gram + Jaccard） | quality-gate.js 调用 |
| **detect-story-gaps.js** | 338 | 写前缺口检测（设定/大纲/追踪） | quality-gate.js 调用, story-session-mimo |
| **wordcount-pacer.js** | 156 | 字数节奏指导（按章节类型分配） | 未被 quality-gate 调用 |
| **normalize-punctuation.js** | 359 | 标点规范化（增强版，含引号模式） | story-long-write-mimo Phase 5 |
| **full-consistency-audit.js** | 208 | 全量一致性审计 | quality-mimo, audit-mimo |
| **repair-scripts.js** | 223 | 脚本自修复（检测缺失/过期脚本） | 未被 skill 直接调用 |
| **detect-python.js** | 36 | Python 解释器检测 | 未被 skill 直接调用 |

### 5.3 短篇写作脚本 (`story-short-write-mimo/scripts/`)

| 脚本 | 行数 | 功能 |
|------|------|------|
| **quality-gate.js** | 259 | 短篇质量门禁（6 项检查，直接实现，非子进程） |

### 5.4 扫榜采集脚本

| 脚本 | 位置 | 行数 | 功能 | 依赖 |
|------|------|------|------|------|
| **qidian-rank-scraper.js** | story-long-scan-mimo/scripts/ | 499 | 起点榜单采集（SSR + CDP 回退） | cdp-utils.js |
| **fanqie-rank-scraper.js** | story-long-scan-mimo/scripts/ | 199 | 番茄榜单采集（字体反爬绕过） | cdp-utils.js |
| **jjwxc-rank-scraper.js** | story-long-scan-mimo/scripts/ | - | 晋江榜单采集 | cdp-utils.js |
| **ciweimao-rank-scraper.js** | story-long-scan-mimo/scripts/ | - | 刺猬猫榜单采集 | cdp-utils.js |
| **qimao-rank-scraper.js** | story-long-scan-mimo/scripts/ | - | 七猫榜单采集 | cdp-utils.js |
| **dz-browse-scraper.js** | story-short-scan-mimo/scripts/ | 264 | 点众短篇采集 | cdp-utils.js |
| **heiyan-booklist-scraper.js** | story-short-scan-mimo/scripts/ | 257 | 黑岩书库采集（需登录） | cdp-utils.js |

### 5.5 浏览器自动化脚本

| 脚本 | 位置 | 行数 | 功能 |
|------|------|------|------|
| **setup-cdp-chrome.js** | browser-cdp-mimo/scripts/ | 537 | Chrome CDP 环境搭建（跨平台） |

### 5.6 项目健康脚本

| 脚本 | 位置 | 功能 |
|------|------|------|
| **project-health.js** | project-health-mimo/scripts/ | 项目结构检测与自动修复 |

### 5.7 脚本依赖关系图

```
banned-words.js ←── style-lint.js ←── quality-gate.js(长篇)
                ←── dream.js
                ←── quality-gate.js(短篇)

cdp-utils.js ←── qidian-rank-scraper.js
             ←── fanqie-rank-scraper.js
             ←── jjwxc-rank-scraper.js
             ←── ciweimao-rank-scraper.js
             ←── qimao-rank-scraper.js
             ←── dz-browse-scraper.js
             ←── heiyan-booklist-scraper.js

quality-gate.js(长篇) ←── style-lint.js
                     ←── consistency-check.js
                     ←── foreshadow-check.js
                     ←── voice-check.js
                     ├── emotion-analyzer.js
                     ├── satisfaction-meter.js
                     ├── cross-chapter-check.js
                     └── detect-story-gaps.js

full-consistency-audit.js ←── quality-mimo, audit-mimo
goal.js ←── goal-mimo
dream.js ←── dream-mimo, story-session-mimo
distill.js ←── distill-mimo
punctuation-normalize.js ←── quality-mimo, story-short-write-mimo
normalize-punctuation.js ←── story-long-write-mimo
```

---

## 六、共享资源清单

### 6.1 参考文档 (`_shared/references/`)

按功能分类：

| 分类 | 文件数 | 关键文件 |
|------|--------|----------|
| **写作技法** | 8 | dialogue-mastery.md, writing-craft.md, anti-ai-writing.md, banned-words.md, format-and-structure.md, style-craft.md, style-profile-generator.md, style-profile-protocol.md |
| **故事设计** | 8 | outline-methods.md, outline-conflict.md, outline-rhythm.md, opening-design.md, hooks-chapter.md, hooks-paragraph.md, hooks-suspense.md, reversal-toolkit.md |
| **角色** | 4 | character-basics.md, character-design-methods.md, character-relations.md, villain-and-reveal.md |
| **情感** | 5 | emotional-arc-design.md, emotional-methods.md, emotion-curve-design.md, plot-emotion-system.md, pacing-mastery.md |
| **题材** | 5 | genre-catalog.md, genre-core-mechanics.md, genre-writing-formulas.md, genre-writing-techniques.md, genre-readers.md |
| **追踪/系统** | 12 | state-tracking.md, consistency-tracking.md, cross-volume-tracking.md, story-line-management.md, structured-indexing.md, pipeline-ops.md, pipeline-parallelism.md, adaptive-batch-sizing.md, quality-monitoring.md, version-management.md, data-analytics.md, auto-detection.md |
| **平台/发布** | 4 | publishing-guide.md, scan-output-format.md, reader-profiling.md, zhihu-style.md |
| **其他** | 10+ | female-audience-writing.md, output-contract.md, output-templates.md, memory-integration.md, material-decomposition.md, genre-trends.md, topic-decision.md, real-market-data.md, deconstruction-notes.md, deconstruction-examples.md, user-experience.md |
| **索引** | 1 | INDEX.md |
| **合计** | **~60** | |

### 6.2 模板 (`_shared/templates/`)

| 文件 | 用途 |
|------|------|
| dialogue-scene.md | 对话场景模板 |
| emotional-arc.md | 情感弧线模板 |
| villain-introduction.md | 反派出场模板 |
| worldbuilding-intro.md | 世界观介绍模板 |

### 6.3 清单 (`_shared/checklists/`)

| 文件 | 用途 |
|------|------|
| dialogue-checklist.md | 对话检查清单 |
| emotion-checklist.md | 情感检查清单 |
| villain-checklist.md | 反派检查清单 |
| world-checklist.md | 世界观检查清单 |

### 6.4 示例 (`_shared/examples/`)

| 文件 | 用途 |
|------|------|
| dialogue-examples.md | 对话示例 |
| emotion-examples.md | 情感示例 |
| villain-examples.md | 反派示例 |

---

## 七、数据流图

### 7.1 核心数据流

```
用户输入
    │
    ▼
story-mimo (路由)
    │
    ├─→ story-long-scan-mimo
    │       │ 输出: 选题决策.md, 扫榜报告
    │       ▼
    │   story-long-analyze-mimo
    │       │ 输出: 拆文库/{书名}/ (概要/章节/角色/剧情/设定/文风)
    │       ▼
    │   story-long-write-mimo
    │       │ 读取: 选题决策.md, 拆文库/, 对标/
    │       │ 输出: 设定/*, 大纲/*, 正文/*, 追踪/*
    │       │ 调用: quality-gate.js → 9项检查
    │       ▼
    │   story-deslop-mimo (去AI味)
    │       │ 修改: 正文/* (in-place)
    │       ▼
    │   story-review-mimo (审稿)
    │       │ 输出: 审稿报告
    │       ▼
    │   story-export-mimo (导出)
    │       │ 输出: 导出/*.txt
    │       ▼
    │   story-cover-mimo / story-synopsis-mimo
    │       │ 输出: 封面提示词 / 多平台简介
    │       ▼
    └─→ 完成
```

### 7.2 追踪文件更新流

```
每章写完后：
    │
    ├──→ 更新 追踪/伏笔.md (新增/回收伏笔)
    ├──→ 更新 追踪/时间线.md (事件时序)
    ├──→ 更新 追踪/角色状态.md (角色状态 + 性格锚点)
    ├──→ 更新 追踪/物品.md (物品位置/状态)
    ├──→ 更新 追踪/环境.md (季节/天气/场景)
    ├──→ 更新 追踪/上下文.md (进度摘要)
    └──→ 运行 quality-gate.js (质量门禁)
```

### 7.3 跨会话恢复流

```
新会话开始 → story-session-mimo
    │
    ├──→ 读取 追踪/上下文.md (上次进度)
    ├──→ 读取 追踪/角色状态.md (角色当前状态)
    ├──→ 读取 追踪/伏笔.md (待回收伏笔)
    ├──→ 运行 detect-story-gaps.js (缺口检测)
    └──→ 显示进度快照
```

---

## 八、冗余分析

### 8.1 脚本冗余

| 冗余项 | 涉及文件 | 问题描述 |
|--------|----------|----------|
| **标点规范化重复** | `_shared/scripts/punctuation-normalize.js` (312行) vs `story-long-write-mimo/scripts/normalize-punctuation.js` (359行) | 核心逻辑高度重叠（AI标点正则相同、不可见字符检测相同、分隔线清理相同），长篇版增加了引号模式切换和破折号智能替换 |
| **质量门禁重复** | `story-long-write-mimo/scripts/quality-gate.js` (358行) vs `story-short-write-mimo/scripts/quality-gate.js` (259行) | 功能相似但实现完全不同：长篇版通过 execFileSync 调用 9 个子脚本，短篇版直接在主进程实现 6 项检查 |
| **禁用词检查重复** | `style-lint.js` vs 短篇 `quality-gate.js` | 都引用 `banned-words.js`，但检查方式不同（子进程 vs 直接循环） |

### 8.2 技能冗余

| 冗余项 | 涉及技能 | 问题描述 |
|--------|----------|----------|
| **扫榜三合一** | story-scan-mimo, story-long-scan-mimo, story-short-scan-mimo | story-scan-mimo 的功能被另外两个覆盖，三者参考文档高度重叠 |
| **长短篇拆文** | story-long-analyze-mimo, story-short-analyze-mimo | 流程相似，仅输出格式不同，可设计统一管道 |

### 8.3 文档冗余

| 冗余项 | 涉及文件 | 问题描述 |
|--------|----------|----------|
| 格式规范 | `story-import-mimo/references/format-and-structure.md` vs `_shared/references/format-and-structure.md` | 可能包含相同内容 |
| 状态追踪 | `story-import-mimo/references/state-tracking.md` vs `_shared/references/state-tracking.md` | 可能包含相同内容 |
| 拆文笔记 | `story-long-analyze-mimo/references/deconstruction-notes.md` vs `_shared/references/deconstruction-notes.md` | 可能包含相同内容 |

---

## 九、架构问题清单

### 9.1 结构问题

| 编号 | 问题 | 严重度 | 说明 |
|------|------|--------|------|
| S1 | SKILL.md 文件过大 | P0 | `story-long-write-mimo/SKILL.md` 847 行，超出 500 行规则，AI 上下文窗口压力大 |
| S2 | 路由入口功能单薄 | P1 | story-mimo 仅关键词匹配，无语义分析、无上下文感知 |
| S3 | 技能依赖关系不明确 | P1 | 依赖通过自然语言描述，无结构化依赖声明 |
| S4 | 长篇/短篇结构割裂 | P1 | 相似功能在两个 skill 中重复实现 |

### 9.2 代码质量问题

| 编号 | 问题 | 严重度 | 说明 |
|------|------|--------|------|
| C1 | 子进程调用开销大 | P1 | quality-gate.js 每次启动最多 9 个子进程 |
| C2 | 无模块化设计 | P2 | 脚本间依赖通过 require 相对路径硬编码 |
| C3 | 无依赖管理 | P2 | package.json 为空，无 npm scripts |
| C4 | 无测试 | P1 | 项目无任何测试文件 |
| C5 | 错误处理不一致 | P2 | 部分 try-catch，部分直接抛异常，退出码定义不一致 |

### 9.3 文档问题

| 编号 | 问题 | 严重度 | 说明 |
|------|------|--------|------|
| D1 | 参考文档组织混乱 | P2 | _shared/references/ 60+ 文件，分类不清晰 |
| D2 | INDEX.md 不够全面 | P2 | 部分文件未被收录 |
| D3 | 文件命名不统一 | P3 | emotion-curve-design.md vs emotional-arc-design.md |

---

## 十、重构建议

### 10.1 优先级排序

| 优先级 | 改进项 | 预期收益 |
|--------|--------|----------|
| **P0** | 拆分 story-long-write-mimo/SKILL.md（847→多文件） | AI 上下文效率提升 |
| **P0** | 合并两个标点规范化脚本 | 消除维护不同步 |
| **P1** | 合并三个扫榜技能为一个 | 减少用户困惑 |
| **P1** | 统一质量门禁（长篇/短篇共享核心） | 消除重复代码 |
| **P1** | 添加测试框架（Jest/Mocha） | 保证代码质量 |
| **P2** | 定义技能依赖规范（dependencies.json） | 明确依赖关系 |
| **P2** | 整理 _shared/references/（分类+补全 INDEX） | 提升可维护性 |
| **P3** | 引入 ES 模块化 | 改善脚本结构 |
| **P3** | 减少子进程调用（quality-gate 改为函数导入） | 提升执行效率 |

### 10.2 推荐重构路径

**Phase 1（基础）**：拆分大文件 + 合并冗余脚本 + 添加测试
**Phase 2（技能层）**：合并扫榜技能 + 统一质量门禁
**Phase 3（架构层）**：定义依赖规范 + 整理参考文档 + 模块化

---

## 附录：Demo 目录说明

`demo/` 包含完整示例产出，修改技能时可参考：

| 目录 | 内容 |
|------|------|
| `拆文库-盘龙/` | 长篇拆文完整输出（23 章分析） |
| `拆文库-曾将爱意私藏/` | 短篇拆文示例 |
| `让你管账号，你高燃混剪炸全网/` | 完整写作项目（设定/大纲/正文/追踪/故事线） |

---

## 十一、原子功能拆分清单（重构用）

> 目标：将现有技能拆分为最细粒度的原子功能，后续通过流程编排组合成新技能。

### 11.1 写前预防类（新增）

| 原子功能 | 功能描述 | 输入 | 输出 | 可组合为 |
|----------|----------|------|------|----------|
| 规则引擎 | 根据题材/平台/风格自动选择适用规则 | 题材定位.md, .story-config.json | 规则集 YAML | pre-write-mimo |
| 写前检查清单 | 验证细纲/上一章/角色状态/伏笔/文风是否就绪 | 项目目录 | 就绪/缺失报告 | pre-write-mimo |
| Prompt 模板注入 | 将写作约束注入 AI 上下文 | 规则集 + 角色锚点 | 约束文本段 | pre-write-mimo |
| 禁用词预加载 | 将 Level1/Level2 禁用词列表加载到上下文 | banned-words.js | 禁用词文本 | pre-write-mimo |
| 风格约束生成 | 根据题材+平台生成风格要求文本 | 题材定位.md | 风格约束文本 | pre-write-mimo |
| 角色锚点加载 | 从角色状态.md 提取性格锚点 | 追踪/角色状态.md | 锚点摘要文本 | pre-write-mimo |

### 11.2 检测类（从现有脚本提取）

| 原子功能 | 功能描述 | 输入 | 输出 | 依赖脚本 |
|----------|----------|------|------|----------|
| 禁用词检测 | 扫描 Level1/Level2 禁用词 | 章节文件 | 禁用词列表+位置 | style-lint.js |
| AI腔检测 | 检测 AI 写作痕迹（排比/句式/标签） | 章节文件 | AI腔报告 | style-lint.js |
| 一致性检测 | 交叉验证追踪文件（物品/环境/角色/时间线） | 章节文件+追踪文件 | 一致性报告 | consistency-check.js |
| 伏笔检测 | 检查伏笔逾期/格式/重叠 | 章节文件+伏笔.md | 伏笔报告 | foreshadow-check.js |
| 字数检测 | 检查章节字数是否达标 | 章节文件+细纲 | 字数报告 | quality-gate.js |
| 角色声音检测 | 检查对话是否符合角色性格锚点 | 章节文件+角色状态.md | 声音报告 | voice-check.js |
| 情绪曲线检测 | 分析段落情绪强度，检测平坦区域 | 章节文件 | 情绪曲线+平坦报告 | emotion-analyzer.js |
| 跨章重复检测 | n-gram 指纹比对，检测跨章重复 | 章节文件+前N章 | 重复报告 | cross-chapter-check.js |
| 爽点密度检测 | 测量爽点/压力信号密度和间隔 | 章节文件 | 爽点密度报告 | satisfaction-meter.js |
| 设定缺口检测 | 检查设定/大纲/追踪文件完整性 | 项目目录 | 缺口报告 | detect-story-gaps.js |
| 全量一致性审计 | 扫描所有章节和追踪文件的跨章矛盾 | 全部章节+追踪 | 审计报告 | full-consistency-audit.js |

### 11.3 修正类（从现有技能提取）

| 原子功能 | 功能描述 | 输入 | 输出 | 来源 |
|----------|----------|------|------|------|
| 禁用词自动替换 | 将禁用词替换为推荐表达 | 章节文件+禁用词列表 | 修正后文本 | style-lint.js 逻辑 |
| 句式去套路化 | 替换 AI 惯用句式（不是A而是B/带着/仿佛） | 章节文件 | 修正后文本 | deslop Gate B |
| 心理外化 | 将直接心理描写转为动作展示 | 章节文件 | 修正后文本 | deslop Gate C |
| 节奏打散 | 打断排比、长句拆短、段落长短交错 | 章节文件 | 修正后文本 | deslop Gate D |
| 对话去腔调 | 加口语化、打断对话、删解释性对话 | 章节文件 | 修正后文本 | deslop Gate E |
| 结尾去升华 | 删总结性语句、用动作/场景收尾 | 章节文件 | 修正后文本 | deslop Gate F |
| 标点规范化 | 清理 AI 特殊标点、不可见字符 | 章节文件 | 修正后文本 | punctuation-normalize.js |

### 11.4 评审类（从现有技能提取）

| 原子功能 | 功能描述 | 输入 | 输出 | 来源 |
|----------|----------|------|------|------|
| 结构评审 | 评审钩子/情绪曲线/节奏/反转/章尾 | 章节文件 | 结构评分+问题 | review 维度1 |
| 角色评审 | 评审一致性/动机/弧线/配角 | 章节文件+角色设定 | 角色评分+问题 | review 维度2 |
| 文笔评审 | 评审AI腔/对话/描写/禁用词 | 章节文件 | 文笔评分+问题 | review 维度3 |
| 商业评审 | 评审爽点/钩子/题材适配/平台适配 | 章节文件+题材定位 | 商业评分+问题 | review 维度4 |
| 一致性评审 | 评审事实/时间线/伏笔/角色状态 | 章节文件+追踪文件 | 一致性评分+问题 | review 维度5 |

### 11.5 扫榜类（现有技能拆分）

| 原子功能 | 功能描述 | 输入 | 输出 | 来源 |
|----------|----------|------|------|------|
| 平台数据采集 | 通过脚本/CDP 抓取排行榜数据 | 平台+榜单类型 | 结构化排行数据 | scan scraper 脚本 |
| 题材趋势分析 | 从排行数据提取题材热度/趋势 | 排行数据 | 趋势分析报告 | scan Phase 2 |
| 选题决策生成 | 从趋势数据生成可执行选题建议 | 趋势数据+用户偏好 | 选题决策.md | scan Phase 4 |
| 读者画像分析 | 分析目标平台读者特征 | 平台数据 | 画像报告 | reader-profiling.md |

### 11.6 拆文类（现有技能拆分）

| 原子功能 | 功能描述 | 输入 | 输出 | 来源 |
|----------|----------|------|------|------|
| 概要提取 | 从原文提取章节结构和概要 | 原始文本 | 概要.md+章节索引 | analyze Stage 0 |
| 黄金三章拆解 | 深度拆解前3章的结构/技法/卖点 | 前3章原文 | 深度拆解.md×3 | analyze Stage 1 |
| 逐章摘要提取 | 每章提取情节点+角色 | 分块章节 | 章节摘要.md | analyze Stage 2 |
| 聚合分析 | 从摘要聚合剧情线/角色/故事框架 | 全部摘要 | 剧情/*.md+故事线.md | analyze Stage 3 |
| 设定提取 | 提取世界观/势力/金手指 | Stage 2-3 数据 | 设定/*.md | analyze Stage 4 |
| 角色提取 | 提取角色信息/关系/分级 | Stage 2-3 数据 | 角色/*.md | analyze Stage 4 |
| 文风提取 | 从原文+拆文报告提取写作风格 | 拆文报告+原文 | 文风.md | analyze Stage 6 |
| 短篇故事核分析 | 分析核心情绪/反转/信息差 | 短篇原文 | 故事核报告 | short-analyze |
| 短篇结构分析 | 分析开头/铺垫/升级/反转/结尾 | 短篇原文 | 结构报告 | short-analyze |

### 11.7 写作类（现有技能拆分）

| 原子功能 | 功能描述 | 输入 | 输出 | 来源 |
|----------|----------|------|------|------|
| 卷纲设计 | 设计卷级大纲（功能/事件/状态变化） | 题材定位+拆文库 | 卷纲.md | write Phase 3 |
| 细纲设计 | 设计单章细纲（事件/钩子/爽点/字数） | 卷纲+章节号 | 细纲.md | write Phase 3 |
| 角色设计 | 设计角色（基本信息/动机/弱点/弧线） | 题材+功能位 | 角色卡.md | write Phase 2 |
| 关系设计 | 设计角色关系图谱 | 角色列表 | 关系.md | write Phase 2 |
| 世界观设计 | 设计世界观/力量体系/势力 | 题材定位 | 世界观/*.md | write Phase 2 |
| 正文生成 | 基于细纲+上下文生成正文 | 细纲+上一章+设定 | 正文草稿 | write Phase 4 |
| 对话优化 | 优化对话自然度和信息量 | 正文对话部分 | 优化后对话 | write Phase 4 |
| 描写优化 | 优化描写密度和画面感 | 正文描写部分 | 优化后描写 | write Phase 4 |

### 11.8 基础设施类

| 原子功能 | 功能描述 | 输入 | 输出 | 来源 |
|----------|----------|------|------|------|
| 项目结构创建 | 创建标准目录+文件 | 项目名+类型 | 目录结构 | setup Phase 3 |
| Git 初始化 | 初始化仓库+安装 hooks | 项目目录 | .git+hooks | setup Phase 3.5 |
| AGENTS.md 部署 | 写入写作项目规则 | 项目目录 | AGENTS.md | setup Phase 3.4 |
| 项目健康检查 | 检测必要文件是否完整 | 项目目录 | 检查报告 | project-health |
| 项目自动修复 | 补全缺失文件/目录 | 项目目录 | 修复报告 | project-health |
| Session 恢复 | 跨会话恢复进度/角色/伏笔 | 追踪文件 | 恢复报告 | session Phase 1 |
| Session 保存 | 保存当前进度到追踪文件 | 追踪文件 | 更新后文件 | session Phase 2 |
| 经验沉淀 | 扫描章节提取有效技法 | 章节文件 | MEMORY.md 更新 | dream |
| 工作流优化 | 分析写作模式发现改进点 | 章节+追踪 | 优化建议 | distill |
| 目标管理 | 设置/追踪写作目标 | 用户目标 | .story-goal.json | goal |
| 文本导入解析 | 识别章节格式/切分/标准化 | 源文件 | 标准化章节 | import Phase 1 |
| 结构迁移 | 将拆文库迁移为项目结构 | 拆文库/* | 项目结构 | import Phase 3 |
| 多格式导出 | 导出为 TXT/平台TXT/校对稿 | 正文/* | 导出文件 | export |
| 封面提示词生成 | 分析题材生成封面设计提示词 | 书名+题材 | 提示词文档 | cover |
| 多平台简介生成 | 生成起点/番茄/晋江/知乎简介 | 书名+卖点 | 多平台简介 | synopsis |

---

## 十二、重构方案：预防优先 + 专业拆分

### 12.1 背景

当前 3 个质量技能功能重合度高：
- quality-mimo：脚本自动检查（检测不修改）
- story-deslop-mimo：LLM 改写去AI味（修改不检测）
- story-review-mimo：LLM 评审打分（评审不修改）

问题：写完才检查 → 发现问题再改 → 效率低、改动大。

**目标**：预防优先——写前注入规则让 AI 写对，写后全量验证 + 自动修正。

### 12.2 新架构：4 层流水线

```
写前预防 → 写中约束 → 写后全量验证+修正 → 写后评审（可选）
   │           │            │                  │
   ▼           ▼            ▼                  ▼
pre-write   write-rules  detect-fix          review
```

### 12.3 第 1 层：写前预防（pre-write-mimo）—— 新增

**核心思想**：写之前把规则塞进 AI 上下文，让 AI 从源头写对。

| 模块 | 功能 | 实现方式 |
|------|------|----------|
| **规则引擎** | 根据题材/平台/风格自动选择适用规则 | 读取 题材定位.md + .story-config.json → 匹配规则集 |
| **写前检查清单** | 验证所有必要文件存在且就绪 | 脚本检查：细纲、上一章、角色状态、伏笔、文风 |
| **Prompt 模板注入** | 将写作约束注入 AI 上下文 | 生成"本次写作约束"文本 |
| **禁用词预加载** | 将 Level1/Level2 禁用词加载到上下文 | 读取 banned-words.js |
| **风格约束生成** | 根据题材+平台生成风格要求 | 读取 题材定位.md + publishing-guide.md |
| **角色锚点加载** | 从角色状态.md 提取性格锚点 | 读取 追踪/角色状态.md |

**规则集结构**：
```yaml
base:  # 基础规则（所有题材适用）
  banned_words: [不禁, 竟然, 仿佛, ...]
  max_para_sentences: 3
  dialogue_tag_ratio: 0.4

genre:  # 题材规则
  都市: { style: 口语化短句, avoid: 过度描写 }
  玄幻: { style: 画面感动作驱动, avoid: 现代用语 }
  言情: { style: 情绪细腻感官, avoid: 过度说明 }

platform:  # 平台规则
  起点: { style: 硬核爽感, words: 3000-4000 }
  番茄: { style: 快节奏强冲突, words: 2000-3000 }
```

**文件**：`skills/pre-write-mimo/SKILL.md` + `skills/_shared/scripts/pre-write-engine.js` + `skills/_shared/references/writing-rules.yaml`

### 12.4 第 2 层：写中约束（整合到现有写作技能）

在 story-long-write-mimo / story-short-write-mimo 的 Phase 4 中，**写前自动调用 pre-write-mimo**，将约束注入上下文。

不是新技能，而是对现有写作技能的增强。

### 12.5 第 3 层：写后全量验证+修正（detect-fix-mimo）

**合并 quality-mimo + story-deslop-mimo**，检测+修正一体化。**写后必须全量验证。**

**全量验证清单**（11 项，每章写完必须跑完）：

| 检查项 | 检测方式 | 修正方式 | 严重度 |
|--------|----------|----------|--------|
| 禁用词 | style-lint.js | 自动替换 | BLOCK |
| AI腔 | LLM 判断 | 自动改写（6 Gate） | WARN→BLOCK |
| 一致性 | consistency-check.js | 标记修正 | BLOCK |
| 伏笔逾期 | foreshadow-check.js | 标记提醒 | WARN |
| 字数不达标 | wordcount | 提示补充 | BLOCK |
| 角色声音 | voice-check.js | 标记偏差 | WARN |
| 情绪曲线 | emotion-analyzer.js | 标记平坦区 | WARN |
| 跨章重复 | cross-chapter-check.js | 标记重复段 | WARN |
| 爽点密度 | satisfaction-meter.js | 标记低密度 | WARN |
| 设定缺口 | detect-story-gaps.js | 标记缺失 | WARN |
| 追踪完整性 | full-consistency-audit.js | 提示补更新 | BLOCK |

**流程**：
```
写完一章
  ├─→ 第一轮：脚本全量检测（11项，秒级）
  │     ├── BLOCK → 自动修正或标记必须修复
  │     └── WARN → 标记警告
  ├─→ 第二轮：LLM 全量检测（AI腔+风格）
  │     └── 发现AI腔 → 自动改写（6 Gate）
  ├─→ 第三轮：修正后复检（BLOCK 项重新验证）
  └─→ 输出全量验证报告（通过/警告/阻断）
```

**退出码**：0=通过, 1=警告可继续, 2=阻断必须修复

**文件**：`skills/detect-fix-mimo/SKILL.md`（复用现有脚本）

### 12.6 第 4 层：写后评审（review-mimo）

**精简 story-review-mimo**，去掉一致性维度（已移至 detect-fix-mimo），只保留需要人类判断力的 4 维度。

| 维度 | 检查内容 | 为什么需要评审 |
|------|----------|---------------|
| 结构 | 钩子效果、情绪曲线、节奏 | 需要整体鉴赏力 |
| 角色 | 动机合理性、弧线完整性 | 需要理解角色深度 |
| 文笔 | 对话质量、描写密度 | 需要文学判断力 |
| 商业 | 爽点密度、平台适配 | 需要市场经验 |

**文件**：`skills/review-mimo/SKILL.md`

### 12.7 新旧技能映射

| 旧技能 | 新方案 | 变化 |
|--------|--------|------|
| quality-mimo | detect-fix-mimo（检测部分） | 合并，增加自动修正 |
| story-deslop-mimo | detect-fix-mimo（修正部分） | 合并，作为子流程 |
| story-review-mimo | review-mimo | 精简，去掉一致性维度 |
| （无） | pre-write-mimo | 新增，写前预防 |

### 12.8 新旧流水线对比

**旧流程**：
```
写完一章 → quality-mimo（检测）→ story-deslop-mimo（改AI腔）→ story-review-mimo（评审）
```

**新流程**：
```
写前：pre-write-mimo（注入规则+检查清单）→ AI 写正文（自带约束）
写后：detect-fix-mimo（全量验证11项+自动修正）→ review-mimo（人工评审，可选）
```

### 12.9 实施步骤

| Phase | 内容 | 关键文件 |
|-------|------|----------|
| Phase 1 | 新增 pre-write-mimo（写前预防） | `skills/pre-write-mimo/SKILL.md`, `_shared/scripts/pre-write-engine.js`, `_shared/references/writing-rules.yaml` |
| Phase 2 | 合并 detect-fix-mimo（检测+修正） | `skills/detect-fix-mimo/SKILL.md` |
| Phase 3 | 精简 review-mimo | `skills/review-mimo/SKILL.md` |
| Phase 4 | 更新路由和配置 | `skills/story-mimo/SKILL.md`, `.skills-plugin-config.json` |

### 12.10 验证方式

1. **pre-write-mimo**：写一章前运行，检查输出的约束文本是否正确
2. **detect-fix-mimo**：用含禁用词/AI腔的测试章节运行，验证自动修正
3. **review-mimo**：用测试章节运行，验证 4 维度评分
4. **端到端**：完整走一遍"写前预防→写正文→全量验证→评审"流程
