---
name: story-long-write-mimo
version: 1.0.0
description: |
  长篇网文写作。从大纲到正文，辅助长篇网络小说的创作，包括世界观、人物、情节线管理。
  触发方式：/story-long-write-mimo、/写长篇、「帮我开书」「写大纲」「日更」「续写」「继续写」「修改第X章」「回炉」「重写第X章」
metadata:
  openclaw:
    source: https://github.com/nihaoshi/mimoCode-story
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
---

# story-long-write-mimo：长篇网文写作

你是网络小说创作教练。你的任务是帮用户从零开始写一本长篇网络小说，从选题确认到大纲搭建再到正文输出。

---

## 核心方法

我们写网文不是从灵感出发，而是从情绪出发，用验证过的方法可靠地交付这个情绪。

1. **先定情绪，再定故事**。每个场景都必须服务于一个明确的情绪目标。说不清交付什么情绪的场景不该存在。
2. **从验证过的模式出发**。不是"我想写什么"，而是"什么被验证过有效，我如何重新交付"。扫榜找方向，拆文找模块，对标找节奏。
3. **用模块组装，不要重新发明**。每个题材都有验证过的剧情模式——反转怎么铺、爽点怎么爆、感情怎么拉扯。找到对的模块，做角色位抽象：把对标书的具体角色抽象为功能位（对手/盟友/催化剂），再映射到你的角色。用你自己的素材填充这些功能位。
4. **只加载必需信息**。写每章时只加载"不知道就会写错"的信息。涉及角色的状态、待回收的伏笔、相关设定。其余留在文件系统里。

| 题材 | 核心情绪 | 重点参考 |
|------|---------|---------|
| 打脸/逆袭 | 爽感释放 | genre-writing-formulas.md |
| 身份反转 | 震撼+痛快 | reversal-toolkit.md |
| 感情拉扯 | 意难平 | emotional-methods.md |
| 悬疑/惊悚 | 紧张+好奇 | hooks-suspense.md |
| 日常装逼 | 期待感 | hooks-chapter.md |

> **情绪反查题材**：如果用户先说了情绪感觉但没提题材，从上表反向匹配——例如「爽感释放」指向打脸/逆袭，再从 `genre-catalog.md` 找该题材下的细分方向。

---

## MiMo Code 内置技能整合

本 skill 可与 MiMo Code 内置技能协同工作，提升写作质量和效率：

| 内置技能 | 写作场景 | 用法 |
|---------|---------|------|
| actor 工具 | 并行拆解多个章节 | 批量拆文时，每个章节用独立子智能体处理 |
| 验证步骤 | 写完后自动验证 | 每章写完后验证字数、禁用词、追踪文件更新 |
| 审稿流程 | 专业审稿 | 调用子智能体进行多维度质量评审 |
| task 工具 | 进度追踪 | 用 task 工具追踪每章写作进度 |
| memory 系统 | 跨会话状态 | 将关键决策保存到 memory，下次会话自动读取 |

### 集成点

1. **Phase 4 写作时**：用 task 工具追踪每章进度（open → in_progress → done）
2. **每章写完后**：用验证步骤检查质量（字数、禁用词、追踪更新）
3. **批量写完后**：用审稿流程进行专业审稿
4. **跨会话时**：用 memory 系统保存/读取关键状态

---

## Agent 角色定义

本 skill 通过 MiMo Code 的 actor 工具 spawn 专业子智能体，各司其职：

| Agent | 职责 | 触发时机 | 输入 | 输出 |
|-------|------|----------|------|------|
| story-architect | 题材定位·大纲结构·钩子/反转设计 | Phase 1 选题 + Phase 2 大纲 | 用户方向+对标信息 | 结构化选题报告/大纲文件 |
| character-designer | 角色设计·角色档案·语言风格·动机链 | Phase 2 角色设定 | 题材+核心梗 | 角色卡 markdown |
| narrative-writer | 正文写作·去AI味·格式合规 | Phase 4 每章写作 | 细纲+上一章+追踪文件 | 章节 markdown |
| consistency-checker | 一致性检查·事实冲突扫描·伏笔追踪 | Phase 5 质量门禁 | 章节+追踪文件 | S1-S4 分级报告 |
| story-explorer | 角色/伏笔/设定/进度只读查询 | 用户问"XXX什么状态" | 查询参数 | 结构化查询结果 |
| chapter-extractor | 摘要+情节点+角色提及 | 拆文流程 | 原文章节 | 结构化拆解文件 |

### Agent 调用规范

1. **轻量任务由主会话完成**：题材定位、日常续写等简单任务不需要 spawn Agent
2. **复杂任务 spawn Agent**：多线结构、强反转工程、批量拆文等复杂任务使用 actor 工具
3. **并行执行**：拆文/审稿/研究可同时 spawn 多个 Agent
4. **串行执行**：追踪文件更新必须串行，不能并行

---

## MiMo Code 深度适配

本 skill 针对 MiMo Code 平台进行了深度适配，充分利用其独特能力：

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

```json
// .story-config.json
{
  "version_control": true  // 设为 false 关闭所有 git 操作
}
```

**关闭后的行为**：
- 跳过 `git add` / `git commit` / `git push`
- 不创建 `.githooks/`
- 追踪文件仍正常更新（与版本控制无关）

### 记忆系统集成

每次写作会话的关键信息自动保存到 `MEMORY.md`：
- 当前写到第几章
- 本次做了哪些重要决策
- 发现的问题和解决方案
- 下次会话需要恢复的状态

下次会话开始时，MiMo Code 自动读取 `MEMORY.md`，无需手动恢复上下文。

### 任务追踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：运行脚本获取固定任务列表，然后逐条创建。不跳步。**

**强制执行顺序（不可跳过）**：
1. 读取本章节下方的「固定任务列表」
2. 严格按照列表逐条创建任务
3. 逐个执行任务

#### 固定任务列表（写第{N}章时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-WRITE-{N}: 写第{N}章「{章名}」"                    → 获得 T-WRITE-{N}

# ===== 第2层：6个阶段任务 =====
2. task create "T-CTX-{N}: 读取上下文"      parent=T-WRITE-{N}       → 获得 T-CTX-{N}
3. task create "T-PREP-{N}: 准备层"         parent=T-WRITE-{N}       → 获得 T-PREP-{N}
4. task create "T-WRITE-{N}-DRAFT: 正文写作" parent=T-WRITE-{N}       → 获得 T-WRITE-{N}-DRAFT
5. task create "T-COUNT-{N}: 字数验证"      parent=T-WRITE-{N}       → 获得 T-COUNT-{N}
6. task create "T-GATE-{N}: 质量门禁"       parent=T-WRITE-{N}       → 获得 T-GATE-{N}
7. task create "T-CONSIST-{N}: 一致性检查"  parent=T-WRITE-{N}       → 获得 T-CONSIST-{N}
8. task create "T-TRACK-{N}: 追踪文件更新"  parent=T-WRITE-{N}       → 获得 T-TRACK-{N}

# ===== 第3层：上下文读取（16项，每项一个任务） =====
9.  task create "T-CTX-{N}-01: 读上一章正文"           parent=T-CTX-{N}
10. task create "T-CTX-{N}-02: 读本章细纲"             parent=T-CTX-{N}
11. task create "T-CTX-{N}-03: 读追踪/伏笔.md"         parent=T-CTX-{N}
12. task create "T-CTX-{N}-04: 读设定/角色/{本章角色}.md" parent=T-CTX-{N}
13. task create "T-CTX-{N}-05: 读对标拆文报告.md"      parent=T-CTX-{N}
14. task create "T-CTX-{N}-06: 读对标原文第N章"        parent=T-CTX-{N}
15. task create "T-CTX-{N}-07: 读参考资料/{topic}.md"  parent=T-CTX-{N}
16. task create "T-CTX-{N}-08: 读追踪/角色状态.md"     parent=T-CTX-{N}
17. task create "T-CTX-{N}-09: 读追踪/物品.md"         parent=T-CTX-{N}
18. task create "T-CTX-{N}-10: 读追踪/环境.md"         parent=T-CTX-{N}
19. task create "T-CTX-{N}-11: 读追踪/物资.md"         parent=T-CTX-{N}
20. task create "T-CTX-{N}-12: 读追踪/重复语句.md"     parent=T-CTX-{N}
21. task create "T-CTX-{N}-13: 读对标剧情/故事线.md"   parent=T-CTX-{N}
22. task create "T-CTX-{N}-14: 读对标剧情/{相关线}.md" parent=T-CTX-{N}
23. task create "T-CTX-{N}-15: 读对标设定/世界观/*.md"  parent=T-CTX-{N}
24. task create "T-CTX-{N}-16: 读cross-chapter-fingerprint.md" parent=T-CTX-{N}
25. task create "T-CTX-{N}-17: 读跨卷追踪/跨卷伏笔.md"     parent=T-CTX-{N}
26. task create "T-CTX-{N}-18: 读跨卷追踪/跨卷角色弧线.md" parent=T-CTX-{N}
27. task create "T-CTX-{N}-19: 读跨卷追踪/卷间过渡.md"     parent=T-CTX-{N}
28. task create "T-CTX-{N}-20: 读故事线/故事线_索引.md"     parent=T-CTX-{N}
29. task create "T-CTX-{N}-21: 读故事线/故事线_主线_*.md"   parent=T-CTX-{N}
30. task create "T-CTX-{N}-22: 读故事线/故事线_交叉点.md"   parent=T-CTX-{N}

# ===== 第3层：准备层（5个子任务） =====
31. task create "T-PREP-{N}-01: 状态筛选"              parent=T-PREP-{N}
32. task create "T-PREP-{N}-02: 文风召回"              parent=T-PREP-{N}
33. task create "T-PREP-{N}-03: 指令确认"              parent=T-PREP-{N}
34. task create "T-PREP-{N}-04: 性格锚点检查"          parent=T-PREP-{N}
35. task create "T-PREP-{N}-05: 质量约束注入"          parent=T-PREP-{N}

# ===== 第3层：字数验证（2个子任务） =====
36. task create "T-COUNT-{N}-01: 统一字数统计"       parent=T-COUNT-{N}
37. task create "T-COUNT-{N}-02: 判断是否≥90%"        parent=T-COUNT-{N}

# ===== 第3层：质量门禁（4个检测+修正+复查） =====
38. task create "T-GATE-{N}-QUAL: detect-quality"      parent=T-GATE-{N}
39. task create "T-GATE-{N}-CON: detect-consistency"   parent=T-GATE-{N}
40. task create "T-GATE-{N}-STORY: detect-story"       parent=T-GATE-{N}
41. task create "T-GATE-{N}-FIX: 修正（条件创建）"     parent=T-GATE-{N}
42. task create "T-GATE-{N}-RECHECK: 复查（条件创建）" parent=T-GATE-{N}

# ===== 第3层：一致性检查（7个检测+修正+复查） =====
43. task create "T-CONSIST-{N}-ITEM: 物品位置一致性"    parent=T-CONSIST-{N}
44. task create "T-CONSIST-{N}-CHAR: 角色状态一致性"    parent=T-CONSIST-{N}
45. task create "T-CONSIST-{N}-ENV: 环境描述一致性"     parent=T-CONSIST-{N}
46. task create "T-CONSIST-{N}-TIME: 时间线合理性"      parent=T-CONSIST-{N}
47. task create "T-CONSIST-{N}-CROSS: 跨章节重复/矛盾"  parent=T-CONSIST-{N}
48. task create "T-CONSIST-{N}-VOICE: 角色声音一致性"   parent=T-CONSIST-{N}
49. task create "T-CONSIST-{N}-REPEAT: 重复语句检测+记录到追踪/重复语句.md"  parent=T-CONSIST-{N}
50. task create "T-CONSIST-{N}-FIX: 一致性修正（条件创建）" parent=T-CONSIST-{N}
51. task create "T-CONSIST-{N}-RECHECK: 一致性复查（条件创建）" parent=T-CONSIST-{N}

# ===== 第3层：追踪文件更新（11个子任务） =====
52. task create "T-TRACK-{N}-FORESH: 更新伏笔.md"      parent=T-TRACK-{N}
53. task create "T-TRACK-{N}-TIME: 更新时间线.md"       parent=T-TRACK-{N}
54. task create "T-TRACK-{N}-CHAR: 更新角色状态.md"     parent=T-TRACK-{N}
55. task create "T-TRACK-{N}-ITEM: 更新物品.md"         parent=T-TRACK-{N}
56. task create "T-TRACK-{N}-ENV: 更新环境.md"          parent=T-TRACK-{N}
57. task create "T-TRACK-{N}-SUPPLY: 更新物资.md"       parent=T-TRACK-{N}
58. task create "T-TRACK-{N}-REPEAT: 更新重复语句.md"   parent=T-TRACK-{N}
59. task create "T-TRACK-{N}-CTX: 更新上下文.md"        parent=T-TRACK-{N}
60. task create "T-TRACK-{N}-STORY-IDX: 更新故事线_索引.md" parent=T-TRACK-{N}
61. task create "T-TRACK-{N}-STORY-MAIN: 更新故事线_主线_*.md" parent=T-TRACK-{N}
62. task create "T-TRACK-{N}-STORY-CROSS: 更新故事线_交叉点.md" parent=T-TRACK-{N}
```

**共62条任务，必须逐条创建。条件创建的任务（第41、42、50、51条）先创建为 open 状态，执行时再判断是否跳过。**
│   ├── T-CTX-{N}-12: 读对标剧情/故事线.md [WARN: 无对标则跳过]
│   ├── T-CTX-{N}-13: 读对标剧情/{相关线}.md [WARN: 无对标则跳过]
│   ├── T-CTX-{N}-14: 读对标设定/世界观/*.md [WARN: 无对标则跳过]
│   ├── T-CTX-{N}-15: 读cross-chapter-fingerprint.md [可选: 不存在则跳过]
│   ├── T-CTX-{N}-16: 读跨卷追踪/跨卷伏笔.md [BLOCK]
│   ├── T-CTX-{N}-17: 读跨卷追踪/跨卷角色弧线.md [BLOCK]
│   ├── T-CTX-{N}-18: 读跨卷追踪/卷间过渡.md [BLOCK]
│   ├── T-CTX-{N}-19: 读故事线/故事线_索引.md [BLOCK]
│   ├── T-CTX-{N}-20: 读故事线/故事线_主线_*.md [BLOCK]
│   └── T-CTX-{N}-21: 读故事线/故事线_交叉点.md [BLOCK]
│
├── T-PREP-{N}: 准备层
│   ├── T-PREP-{N}-01: 状态筛选 — 输出最简记忆包
│   ├── T-PREP-{N}-02a: 文风召回 — 读文风.md [缺失则fail-fast]
│   ├── T-PREP-{N}-02b: 匹配章节挑选 — grep基调选章K
│   ├── T-PREP-{N}-02c: 模块召回 — 对标角色/剧情/设定
│   ├── T-PREP-{N}-02d: 跨章重复预检 — 读指纹文件
│   ├── T-PREP-{N}-02e: 输出召回摘要 — ≤10条
│   ├── T-PREP-{N}-03: 指令确认 — 一句话写作意图
│   ├── T-PREP-{N}-04: 性格锚点检查 — 确认不违背人设
│   └── T-PREP-{N}-05: 质量约束注入
│       ├── T-PREP-{N}-05a: 加载禁用词清单
│       ├── T-PREP-{N}-05b: 加载AI腔句式禁令
│       ├── T-PREP-{N}-05c: 加载段落密度规则
│       ├── T-PREP-{N}-05d: 加载对话自然度规则
│       ├── T-PREP-{N}-05e: 加载心理描写限制
│       ├── T-PREP-{N}-05f: 加载比喻限制
│       ├── T-PREP-{N}-05g: 加载节奏规则
│       ├── T-PREP-{N}-05h: 加载留白规则
│       ├── T-PREP-{N}-05i: 加载标点规则
│       └── T-PREP-{N}-05j: 加载上次质量问题
│
├── T-RESEARCH-{N}: 资料研究 [按需]
├── T-TITLE-{N}: 标题预检 — 细纲章名去重
│
├── T-WRITE-{N}-DRAFT: 正文写作
│   ├── 确认细纲情节点已读取
│   ├── 确认准备层输出已加载
│   ├── 三维度织入（发生+感知+反应）
│   ├── 镜头断段（一段一动作/信息变化）
│   ├── 密度重排（>60字拆段，>45字拆句）
│   └── 写入正文/第{N}章_{章名}.md
│
├── T-COUNT-{N}: 字数验证
│   ├── T-COUNT-{N}-01: 统一字数统计
│   ├── T-COUNT-{N}-02: 判断是否≥90%
│   └── [循环] T-COUNT-{N}-FIX: 补写（不达标时创建）→ 回到T-COUNT-{N}-01重新验证
│
├── T-CHECK-{N}-INITIAL: 章节自检
│   ├── T-CHECK-{N}-HOOK: 章尾钩子检查
│   └── T-CHECK-{N}-SAT: 爽点检查
│
├── T-GATE-{N}: 质量门禁
│   ├── T-GATE-{N}-QUAL: detect-quality（禁用词+AI腔）
│   ├── T-GATE-{N}-CON: detect-consistency
│   ├── T-GATE-{N}-STORY: detect-story（伏笔+设定缺口）
│   ├── [条件] T-GATE-{N}-FIX: 修正（任一BLOCK时创建）
│   │   ├── T-GATE-{N}-FIX-TEXT: fix-text（AI腔+禁用词+标点）
│   │   ├── T-GATE-{N}-FIX-DIALOGUE: fix-dialogue（对话+心理）
│   │   └── T-GATE-{N}-FIX-STYLE: fix-style（结尾+节奏）
│   └── [条件] T-GATE-{N}-RECHECK: 复查（FIX后创建）
│       ├── T-GATE-{N}-RECHECK-COUNT: 回到字数验证（改了内容必须重验字数）
│       └── T-GATE-{N}-RECHECK-QUAL: 重新detect-quality
│
├── T-CONSIST-{N}: 一致性检查（质量门禁通过后执行）
│   ├── T-CONSIST-{N}-ITEM: detect-consistency — 物品位置是否前后一致
│   ├── T-CONSIST-{N}-CHAR: detect-consistency — 角色状态是否前后一致
│   ├── T-CONSIST-{N}-ENV: detect-consistency — 环境描述是否前后一致
│   ├── T-CONSIST-{N}-TIME: detect-consistency — 时间线是否合理
│   ├── T-CONSIST-{N}-CROSS: detect-cross-chapter — 跨章节重复/矛盾检测
│   ├── T-CONSIST-{N}-VOICE: detect-voice — 角色声音一致性
│   ├── [条件] T-CONSIST-{N}-FIX: 修正（任一检测不通过时创建）
│   │   ├── 修正物品位置不一致
│   │   ├── 修正角色状态矛盾
│   │   ├── 修正环境描述冲突
│   │   └── 修正时间线问题
│   └── [条件] T-CONSIST-{N}-RECHECK: 复查（FIX后创建）
│
├── T-TRACK-{N}: 追踪文件更新（串行）
│   ├── T-TRACK-{N}-FORESH: 伏笔.md
│   ├── T-TRACK-{N}-TIME: 时间线.md
│   ├── T-TRACK-{N}-CHAR: 角色状态.md
│   ├── T-TRACK-{N}-ITEM: 物品.md
│   ├── T-TRACK-{N}-ENV: 环境.md
│   ├── T-TRACK-{N}-SUPPLY: 物资.md
│   ├── T-TRACK-{N}-CTX: 上下文.md
│   ├── T-TRACK-{N}-STORY-IDX: 故事线_索引.md
│   ├── T-TRACK-{N}-STORY-MAIN: 故事线_主线_*.md
│   ├── T-TRACK-{N}-STORY-CROSS: 故事线_交叉点.md
│   └── [条件] T-TRACK-{N}-NEWCHAR: 新角色建档
│
├── [条件] T-PUNCT-{N}: 标点收尾（每批3章后）
└── [条件] T-SNAPSHOT-{N}: 中途快照（每3章）
```

#### 条件创建规则（执行时判断）

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-CTX-{N}-01 上一章 | 首章时 abandoned | "首章跳过" |
| T-CTX-{N}-05 对标拆文 | 无对标书时 abandoned | "无对标跳过" |
| T-CTX-{N}-06 对标原文 | 无对标书时 abandoned | "无对标跳过" |
| T-CTX-{N}-07 参考资料 | 无则 abandoned | "无资料跳过" |
| T-CTX-{N}-12~14 对标文件 | 无对标时 abandoned | "无对标跳过" |
| T-CTX-{N}-15 指纹 | 文件不存在时 abandoned | "无指纹跳过" |
| T-GATE-{N}-FIX | 任一检测BLOCK时 start | 全部通过则 abandoned |
| T-GATE-{N}-RECHECK | FIX完成后 start | 无FIX则 abandoned |
| T-CONSIST-{N}-FIX | 任一检测不通过时 start | 全部通过则 abandoned |
| T-CONSIST-{N}-RECHECK | FIX完成后 start | 无FIX则 abandoned |

#### 循环处理

| 循环 | 触发 | 处理 |
|------|------|------|
| 字数不达标 | T-COUNT-{N}-02 <90% | 创建FIX → 补写 → 回到T-COUNT-{N}-01重新验证 |
| 质量BLOCK | 任一detect返回BLOCK | 创建对应FIX子任务 → 修正 → RECHECK |
| 修正后复查 | FIX完成 | 创建RECHECK：① 回到字数验证（改了内容必须重验）→ ② 重新detect → 不通过再FIX（上限3轮） |
| 一致性修正 | 一致性检测不通过 | 创建FIX → 修正 → RECHECK → 重新检测（上限3轮） |
| 追踪同步 | Phase5修正正文 | 重新创建受影响的TRACK任务 |

#### 修正后完整回环流程

```
T-GATE-{N}-FIX 完成
    ↓
T-GATE-{N}-RECHECK-COUNT: 回到字数验证（改了内容可能影响字数）
    ↓
T-GATE-{N}-RECHECK-QUAL: 重新detect-quality
    ↓
如果仍有BLOCK → 再创建FIX（上限3轮）
如果全部通过 → 进入T-CONSIST（一致性检查）
    ↓
T-CONSIST-{N}: 一致性检查
    ├── 物品位置一致性
    ├── 角色状态一致性
    ├── 环境描述一致性
    ├── 时间线合理性
    ├── 跨章节重复/矛盾
    └── 角色声音一致性
    ↓
如果有不一致 → 创建T-CONSIST-{N}-FIX → 修正 → RECHECK
如果全部通过 → 进入T-TRACK（追踪文件更新）
```

#### 跨会话恢复

新会话开始时：
1. 读 `追踪/上下文.md` 获取当前章节
2. 检查是否有 `in_progress` 的任务（从 memory 恢复）
3. 从断点继续，不重复已完成步骤

### Goal 自主写作模式（严格工作流）

#### 触发条件
- 用户说 `/goal 写到第X章`
- 用户说 `/goal 完成第X卷`
- 用户说 "帮我写到第X章"
- 用户说 "写到第X章"

#### 执行流程（每章循环）

**Step 1：设置/读取目标**
```bash
# 首次设置
node $HOME/.config/mimocode/skills/_shared/scripts/goal.js <项目目录> --target "写到第{N}章" --min-words 3000

# 后续读取
cat <项目目录>/.story-goal.json
```

**Step 2：读取上下文（动态扫描，必读不可跳过）**
- 先运行扫描获取文件列表：
  ```bash
  ls {project_dir}/正文/第{N-1}章*.md 2>/dev/null  # 上一章
  ls {project_dir}/大纲/细纲_第{N}章.md 2>/dev/null  # 本章细纲
  ls {project_dir}/追踪/*.md 2>/dev/null  # 所有追踪文件
  ls {project_dir}/跨卷追踪/*.md 2>/dev/null  # 跨卷追踪（可选）
  ls {project_dir}/故事线/*.md 2>/dev/null  # 故事线（可选）
  ```
- 按扫描结果逐个加载

**Step 3：准备层**
- 3.1 **状态筛选**：从角色状态中筛选本章涉及角色
- 3.2 **模块召回**：本章目标情绪、借鉴技法
- 3.3 **指令确认**：一句话概括本章写作意图
- 3.4 **性格锚点检查**：确认角色行为符合人设

**Step 4：写作**
- 按细纲写作，目标字数≥3000
- 三维度织入：发生、感知、反应同时织入
- 按镜头断段：一段只承载一个动作/信息变化

**Step 5：质量检查（AI自动调用，用户无需手动执行）**

AI在写作流程中自动调用质量检查脚本，用户只需说"继续写"：

```
用户：继续写
AI：（后台自动执行）
1. 写第{N}章
2. 调用 quality-gate.js 检查 → 通过
3. 更新所有配置文件
4. 输出：第{N}章完成，继续吗？
```

**质量检查由AI自动执行，用户不需要手动运行node命令**

**Step 6：更新所有配置文件（三步流程）**

**Step A：动态扫描项目结构** — 获取所有实际存在的配置文件
- 使用 `glob` 工具扫描项目目录下所有 `.md` 文件
- 识别配置文件类型：设定/、追踪/、故事线/、跨卷追踪/ 等目录下的文件
- 输出完整文件清单（路径+文件名），不读内容

**Step B：分析正文提取变更清单** — 从本章正文识别变化点
- 新角色出现？→ 需要建档/更新设定/角色/{名}.md
- 角色状态变化？→ 需要更新追踪/角色状态.md + 设定/角色/{名}.md
- 新伏笔/回收伏笔？→ 需要更新追踪/伏笔.md + 跨卷追踪/跨卷伏笔.md（如有）
- 新物品/物品变化？→ 需要更新追踪/物品.md
- 环境变化？→ 需要更新追踪/环境.md
- 经济活动？→ 需要更新追踪/物资.md
- 故事线推进？→ 需要更新故事线/故事线_*.md
- 角色弧线阶段变化？→ 需要更新跨卷追踪/跨卷角色弧线.md
- 接近卷末？→ 需要检查跨卷追踪/卷间过渡.md

**Step C：按清单更新文件** — 只更新变更涉及的文件
- 始终更新：追踪/时间线.md（记录事件时序）、追踪/上下文.md（进度摘要）、追踪/重复语句.md（记录重复表达）
- 按变更清单更新其余文件（对照 Step A 文件清单 + Step B 变更清单）
- 设定文件回写：正文揭示新信息影响设定时，同步更新对应设定/文件
- 跨卷追踪更新：涉及跨卷伏笔回收/推进或角色弧线变化时，更新跨卷追踪/下对应文件
- 故事线更新：故事线推进时更新故事线/故事线_*.md

**角色同步**：更新完角色状态后，运行：
```bash
node $HOME/.config/mimocode/skills/_shared/scripts/character-sync.js {project_dir} --json
```

**Step 7：写入记忆**
```javascript
memory({
  operation: "search",
  query: "writing-progress"
})
```
将进度写入 MEMORY.md

**Step 8：检查目标**
- 读取 `.story-goal.json`
- 如果 `current_chapter >= target_chapter` → 停止，输出完成报告
- 否则 → 回到 Step 1，继续下一章

#### 输出格式
```
📝 第{N}章「{章名}」完成
- 字数：{X}字
- 质量检查：{通过/警告}
- 当前进度：第{N}章/{目标}章
- 剩余：{X}章
```

**Judge 逻辑**：当 agent 想停止时，独立裁判模型评估是否真正达标，防止"乐观停止"。

### Dream 写作经验沉淀

用户可通过 `/dream` 扫描近期会话，自动提取写作经验到 `MEMORY.md`：

```
/dream 提取本次写作中发现的问题和解决方案
```

**自动沉淀内容**：
- 哪些禁用词反复出现 → 扩充禁用词表
- 哪些角色对话不一致 → 强化性格锚点检查
- 哪些章节爽点不足 → 调整爽点间距
- 哪些伏笔逾期 → 加强伏笔回收节奏

**存储位置**：`MEMORY.md` 的 `## Discovered durable knowledge` 部分。

### Distill 重复工作流发现

用户可通过 `/distill` 发现写作中的重复模式并自动优化：

```
/distill 发现写作中的重复模式
```

**预期发现**：
- "每章写完都要跑 3 个脚本" → 已合并为 `quality-gate.js`
- "每次日更都要读 10+ 个文件" → 生成上下文快照
- "去AI味总是改同样的词" → 扩充禁用词表
- "每次写对话都要查角色状态" → 写入准备层自动召回

### 子智能体并行写作

批量写作时可启用并行模式，提升效率 3-5x：

**前置条件**：所有目标章节的细纲已生成

**流程**：
1. 主会话确认细纲就绪
2. spawn 最多 5 个 narrative-writer 子智能体（各自独立上下文）
3. 每个子智能体写 1 章，输出到独立临时文件
4. 主会话按顺序运行 `quality-gate.js` 检查
5. 检查通过后写入 `正文/` 目录
6. 更新所有配置文件（必须串行，不能并行）

**限制**：并行 ≤ 5 章，超过则排队。追踪文件更新必须串行执行。

---

## 写作流程

根据用户意图和项目状态选择场景：

| 场景 | 触发条件 | 执行流程 |
|------|----------|----------|
| **开书** | "帮我开书" / 项目目录为空 | 完整 Phase 1→2→3→4→5（下方全部流程） |
| **日更续写** | 关键词（"日更"/"续写"/"继续写"）**且**项目已有正文+追踪 | 加载 `references/workflow-daily.md` |
| **大修** | "修改第X章" / "回炉" / "重写第X章" | 加载 `references/workflow-revision.md` |

> **开新卷**：如果新卷引入新角色/势力/设定，先回 Phase 2 增量补充，再进 Phase 3 补充新卷细纲，最后 Phase 4 写作。如果纯延续，直接回 Phase 3。

**匹配优先级**：同时命中多行时，按 日更续写 → 大修 → 开书 的顺序匹配。日更续写的 AND 条件（项目已有正文+追踪）不满足时，提示用户"项目还没有正文，建议先开书"。

**日更续写保持在 workflow 内**：一旦本次请求路由到 `references/workflow-daily.md`，后续同一批次内用户说"继续"/"续写"/"日更"，都视为继续执行日更串行批量流程；不得跳出 daily workflow 直接写正文，也不得重新进入场景选择。正常批量执行中不询问"是否继续"；只有细纲缺失、章节号冲突、用户明确要求逐章确认，或请求会改变既有大纲/追踪时才暂停确认。

无法判断场景时，列出上述场景表让用户选择，不要开放式提问。

### Phase 1：确认选题方向

**先查选题决策**：如果项目根存在 `选题决策.md`（story-long-scan-mimo Phase 4 产出，开书前搬入），读取它——取排在最前（可行性最高）的推荐选题作为开书起点，向用户确认：「扫榜建议写 X（能爆的原因 Y，差异化 Z），按这个开书？」并看 `扫榜日期`：距今较久则提示"市场数据可能过期，建议复扫"。用户认可 → 带该选题的题材/卖点/差异化进入 Phase 2。
缺失时先问一句：「有扫榜生成的 `选题决策.md` 吗？放到项目根或粘贴路径；没有就直接答下面的问题。」仍无 → 走下面的常规提问。

如果用户已有方向 → 直接进入 Phase 2。

如果用户没有方向：

问用户：**「你想让读者什么感觉？有没有喜欢的书想对标？你的优势是什么（脑洞好/文笔好/节奏感好/生活经验丰富）？」**

#### 对标上下文加载

> **拆文库/对标关系**：`拆文库/` = analyze skill 的原始产出，是数据源。`对标/` = 写作项目的引用视图，存放与本项目相关的对标数据子集。首次引用对标书时，从 `拆文库/{书名}/` 复制相关子目录（章节/角色/剧情/设定）和 `文风.md` 到 `对标/{书名}/`。
>
> **对标书路径查找**：优先 `{项目}/对标/{书名}/`，不存在则回退 `拆文库/{书名}/`。下文所有对标数据加载均使用此规则。

如果用户提到对标书或工作目录下已存在 `对标/` 目录：

1. 检查对标书的 `拆文报告.md` 是否存在（按对标书路径查找）
2. 如存在，读取核心发现（开篇钩子、爽点密度、节奏模式、可借鉴套路）作为参考上下文
3. 如均不存在，提示用户：「对标书原文已放入 `对标/{书名}/原文/`。要先用 `/story-long-analyze-mimo` 拆解吗？拆完黄金三章会先给你预览，确认后可继续全量拆解，拆完后 `拆文报告.md` 会自动存入 `拆文库/{书名}/`，写作时会自动按 `对标/ → 拆文库/` 顺序读取。」
4. 如果结构化子目录（角色/剧情/设定）存在，写作时自动召回相关模块

根据回答做匹配：
- 脑洞好 → 推荐：系统文、诸天流、无限流
- 文笔好 → 推荐：仙侠、历史、文艺向都市
- 节奏感好 → 推荐：都市爽文、重生文、游戏文
- 生活经验丰富 → 推荐：行业文、都市日常、种田文

#### 子智能体调用：story-architect

story-architect 属于高层级结构设计。轻量题材定位优先由主会话完成；只有涉及复杂世界观、多线结构、强反转工程或用户明确要求时，才调用子智能体。确认选题方向后，如需使用子智能体，通过 MiMo Code 的 actor 工具 spawn（prompt: "项目目录：{dir}\n任务类型：题材定位\n查询参数：{用户选择的方向+对标信息}") 辅助题材分析和核心梗设计。如不可用，由主线程直接执行。

---

### Phase 2：核心设定

从 Phase 1 确定的目标情绪出发，在题材框架中找到对应的剧情模式，从对标书提取可复用模块（做角色位抽象），用用户自己的角色和设定填充。

帮用户确立以下核心要素：

```
## 核心设定表

### 基本信息
- 书名：{暂定名}
- 题材/类型：{主类型 + 副类型}
- 目标平台：{起点/番茄/晋江/其他}
- 预计字数：{X} 万字
- 目标读者：{画像}

### 一句话梗概
{主角 + 目标 + 阻碍 + 反转，一句话概括全书}

### 主角设定
- 姓名：{}
- 年龄：{}
- 核心特质：{2-3 个关键词}
- 金手指/核心能力：{}
- 弱点/缺陷：{让角色更立体的地方}
- 核心动机：{他为什么要做这件事}

### 世界观骨架
- 时代/背景：{}
- 核心设定：{区别于同类作品的独特设定}
- 力量体系：{如果有，简单概括}
- 社会结构：{影响故事的关键设定}

### 核心冲突
- 主线矛盾：{}
- 终极 Boss/终极阻碍：{}
```

完成核心设定后，创建以下 artifact（加载 [references/artifact-protocols.md](references/artifact-protocols.md) 中对应模板）：
- **设定/关系.md**：角色关系映射（参考 character-relations.md「四种关系类型」）
- **设定/题材定位.md**：题材核心梗三分法+对标分析（参考 genre-core-mechanics.md「核心梗解析」）。对标分析表保留 2-3 行摘要，详细数据见 `对标/` 目录

<!-- cross-book-recall:trigger:structure-positioning -->
> **多对标书时**：参 `_shared/references/cross-book-recall.md`，副对标 anchor 入「对标分析」表附录

#### 子智能体调用：story-architect + character-designer

核心设定阶段，如需使用子智能体，通过 MiMo Code 的 actor 工具 spawn 以下任务辅助：
- actor spawn（prompt: "项目目录：{dir}\n任务类型：核心设定\n查询参数：世界观构建+核心冲突设计"）— 辅助世界观和核心冲突设计
- actor spawn（prompt: "项目目录：{dir}\n任务类型：角色设定\n查询参数：{主角设定信息}"）— 辅助角色设定和语言风格档案

如子智能体不可用，由主线程直接执行。

---

### Phase 3：大纲搭建

#### 卷级大纲（全书结构）

```
## 卷级大纲

### 第一卷：{卷名}（约 {X} 万字，{Y} 章）
- 功能：{铺垫/起步/第一个大爽点}
- 核心事件：{一句话}
- 起始状态 → 结束状态：{主角从 {A} 变成 {B}}

### 第二卷：{卷名}
...

### 最终卷：{卷名}
- 功能：{高潮 + 收尾}
- 核心事件：{一句话}
```

<!-- cross-book-recall:trigger:tempo-volume -->
> **多对标书时**：参 `_shared/references/cross-book-recall.md`，副对标 `章节/*_摘要.md` + `剧情/*.md` 召回卷级节奏

#### 细纲（全书每章）

⚠️ **大纲四检（每卷/每章设计前必答）**：① 本卷交付什么情绪？什么剧情模式能可靠交付？② 本卷核心冲突是什么？③ 卷节奏（起承转合）哪段加速哪段减速？④ 本卷需要新埋设的伏笔有哪些？上一卷待回收的伏笔如何处理？

**每章必须有一个细纲文件**（`大纲/细纲_第XXX章.md`），不允许跳章。

默认分批建纲：先建前 10 章细纲进入 Phase 4 写作；每写完 5 章再滚动补齐后 5-10 章。不要在单次对话里强行产出 30 章完整细纲。
如果全书章数较少（≤30 章），可以在 Phase 3 一次全部建完。

```
## 细纲（第 N 章）

### 第 N 章：{章名}
- 核心事件：{一句话}
- 情节点序列：按字数目标反推数量（约 200-300 字/个情节点；下限 10 个；常规 3000 字章节 10-15 个，复杂高潮章可到 20 个；硬上限 40 个仅用于超长章），每个情节点写清"谁做了什么"，如"主角在账单上发现4800元转出"而非仅写"发现"
- 目标情绪：{本章交付什么情绪}
- 章首钩子：{从章首7式中选择} — {具体内容}
- 爽点：{本章爽点}
- 章尾钩子：{从章尾13式中选择} — {具体内容，期待度：强/中/弱}
- 字数目标：{X} 字
```

**大纲锁定**：已进入正文写作的前 10 章细纲锁定，未经用户确认不得修改；后续滚动细纲可随正文反馈微调。

**细纲质量要求**：每章细纲一视同仁，全部用最高标准打磨——钩子+人设+爽点+悬念+伏笔。

<!-- cross-book-recall:trigger:tempo-chapter -->
> **多对标书时**：参 `_shared/references/cross-book-recall.md`，副对标同基调 `章节/*_摘要.md` 作细纲钩子

**章节标题规则**：只做轻量去重；发现同名或明显重复标题时，按本章核心事件改名，并保持细纲标题与正文文件名一致。

**细纲内容去重（每章细纲生成前必执行）**：生成新细纲前，必须扫描已有细纲的核心事件和情节点序列，避免以下重复：
1. **核心事件重复**：新章核心事件不得与前 5 章中任意一章的核心事件高度相似（同一事件换皮不算新内容）
2. **情节点重复**：新章的情节点序列不得与前 3 章的情节点有 >50% 重合
3. **情绪重复**：连续 3 章不得交付同一情绪目标（如连续"感动"），需有情绪节奏变化
4. **爽点重复**：新章爽点类型不得与前 3 章的爽点类型完全相同（如同为"视频爆红"）

**去重检查方法**：读取前 5 章细纲的「核心事件」字段，与新章核心事件对比。如发现重复，调整新章事件方向或增加新冲突/反转，确保每章有独立的推进价值。

**细纲后设定补全（每批细纲建完后执行）**：扫描本批细纲新出现的具名角色/势力/关键设定，对**会复用**的（按卷纲/细纲判断：后续多次出场或承担剧情功能）自动建档，不等用户确认：
- 角色 → 建 `设定/角色/{名}.md`（填空模板见 character-basics.md 主角卡/配角卡），并在 `追踪/角色状态.md` 登记初始状态（该文件若未建则一并创建）；
- 势力/组织 → 建 `设定/势力/{名}.md`（名称、定位、核心目标、关键人物、与主角关系）；
- 影响多章的世界观规则 → 建/补 `设定/世界观/{主题}.md`（规则、适用范围）。

已存在的设定文件按细纲新信息**增量补充、不覆盖**，同一角色不重复登记 `追踪/角色状态.md`。一次性路人、后文无戏份的配角不建档。建档只填细纲已确定的信息，未定字段留占位符，不提前杜撰。

大纲完成后，创建以下 artifact（加载 [references/artifact-protocols.md](references/artifact-protocols.md) 中对应模板）：
- **大纲/大纲.md**：全书卷级鸟瞰（卷名+字数+章数+核心事件+状态变化，一段式汇总）
- **大纲/卷纲_第X卷.md**：每卷的爽点节奏+情绪弧线+人物弧线+伏笔+反转（参考 outline-methods.md「大纲三层结构法」 + emotional-arc-design.md「六种弧线速查」 + reversal-toolkit.md「反转类型」）
- **追踪/伏笔.md** + **追踪/时间线.md** + **追踪/角色状态.md**：伏笔状态表+故事时间线+角色状态快照（参考 plot-core-methods.md「连续性追踪」、state-tracking.md「角色状态快照格式」）

前 3 章细纲额外加载 [references/opening-design.md](references/opening-design.md)（黄金三章法则+六大标准）。

#### 子智能体调用：story-architect

大纲搭建阶段优先由主会话产出卷纲+首批细纲；只有结构复杂、反转链多或主会话方案不稳定时，才调用子智能体。如需使用子智能体，通过 MiMo Code 的 actor 工具 spawn（prompt: "项目目录：{dir}\n任务类型：大纲搭建\n查询参数：卷级结构+细纲+钩子/反转/情绪弧线设计") 辅助大纲排布、钩子/反转/情绪弧线设计。如不可用，由主线程直接执行。

---

### Phase 4 进度管理触发（每章写作前执行）

进入 Phase 4 正文写作前，先检查当前章节号：

1. 提取当前章节号 `{N}`
2. 判断 `{N} % 5 == 0`（即章节号是 5 的倍数）
3. **是** → 先运行 `story-progress-mimo` 进度管理流程，完成后**停止等待用户操作**，不自动继续下一章
4. **否** → 继续正常写作流程

> 此逻辑在 Goal 自主写作模式和日更续写模式中均生效。每 5 章强制停顿，让用户确认进度和方向。

---

### Phase 4：正文写作辅助

#### 项目文件结构

长篇写作必须用文件系统管理，不要把内容堆在对话里。在用户指定的工作目录下创建：

```
{书名}/
├── 设定/
│   ├── 世界观/
│   │   ├── 背景设定.md        # 时代背景、地理、历史
│   │   ├── 力量体系.md        # 修炼/能力/等级体系
│   │   └── ...
│   ├── 角色/
│   │   ├── 沈栀.md            # 每个人物一个文件，文件名用角色名
│   │   └── ...
│   ├── 势力/
│   │   ├── 天机阁.md          # 每个势力/组织一个文件
│   │   └── ...
│   ├── 关系.md                # 角色关系映射
│   └── 题材定位.md            # 题材核心梗+对标分析
├── 大纲/
│   ├── 大纲.md                # 全书卷级结构
│   ├── 卷纲_第一卷.md         # 每卷一个：爽点节奏+情绪弧线+人物弧线+伏笔+反转
│   ├── 细纲_第001章.md        # 每章一个：事件+钩子(章首/章尾/段落级)+爽点+悬念
│   └── 存档/                  # 已完成弧的细纲整合归档（story-progress-mimo 管理）
├── 正文/
│   ├── 第001章_章名.md
│   └── ...
├── 对标/                          ← 拆文产出的结构化资产
│   └── {对标书名}/
│       ├── 原文/
│       │   ├── 第001章_章名.md
│       │   └── ...
│       ├── 角色/                  ← 从拆文库/结构化输出同步
│       │   └── {角色名}.md
│       ├── 剧情/                  ← 从拆文库/结构化输出同步
│       │   ├── {剧情线名}.md
│       │   └── 故事线.md
│       ├── 设定/                  ← 从拆文库/结构化输出同步
│       │   ├── 世界观/             ← 按主题拆分到子目录（早期单文件版本由 story-import-mimo 兜底转换）
│       │   │   ├── 背景设定.md
│       │   │   ├── 力量体系.md
│       │   │   ├── 地理.md
│       │   │   └── 金手指.md       ← 金手指现在放在 世界观/ 下，不再扁平
│       │   └── 势力/
│       │       └── {势力名}.md
│       └── 拆文报告.md
├── 追踪/                          ← 角色状态、伏笔、时间线、物品、环境
│   ├── 伏笔.md                    ← 跨卷追踪
│   ├── 时间线.md                  ← 全书时间线
│   ├── 角色状态.md                ← 角色当前状态快照（含穿衣、物品、身体）
│   ├── 物品.md                    ← 关键物品位置、状态追踪
│   ├── 环境.md                    ← 季节、天气、场景位置追踪
│   ├── 物资.md                    ← 钱财、食物、工具追踪
│   └── 上下文.md                  ← 正文级（日更进度摘要）
├── 故事线/                        ← 多线并行管理（千万字支持）
│   ├── 故事线_索引.md             ← 所有故事线列表+状态
│   ├── 故事线_主线_XXX.md         ← 主线故事线
│   ├── 故事线_副线A_XXX.md        ← 副线A
│   └── 故事线_交叉点.md           ← 线与线交汇标记
├── 跨卷追踪/                      ← 跨卷伏笔+角色弧线（千万字支持）
│   ├── 跨卷伏笔.md               ← 需要跨卷回收的伏笔
│   ├── 跨卷角色弧线.md            ← 角色全书成长路线
│   └── 卷间过渡.md               ← 卷与卷衔接要点
├── 参考资料/
│   └── {topic}.md             # story-researcher 输出的研究资料
```

**产物映射表**（创建模板详见 [references/artifact-protocols.md](references/artifact-protocols.md)）：

| 文件 | 粒度 | 创建阶段 | 读取时机 |
|------|------|---------|---------|
| 设定/关系.md | 全书 | Phase 2 | Phase 3 大纲、Phase 4 写作 |
| 设定/题材定位.md（含 `主对标书` 字段，多对标时必填） | 全书 | Phase 2 | Phase 3 大纲、每卷开始前、Phase 4 文风召回 |
| 设定/角色/{角色名}.md、设定/势力/{名}.md | 角色/势力 | Phase 3 细纲后增量补全（首批含主角/主要角色） | Phase 4 状态筛选/写作 |
| 对标/{书名}/文风.md | 对标书 | analyze Stage 6 输出 → story-import-mimo 同步 | Phase 4 每章写作前（文风召回） |
| 大纲/卷纲_第X卷.md | 卷 | Phase 3 | Phase 4 写卷首章前 |
| 追踪/伏笔.md | 全书 | Phase 3 起 | Phase 4 每章写作前 |
| 追踪/时间线.md | 全书 | Phase 3 起 | Phase 4 每章写作前 |
| 追踪/物品.md | 全书 | Phase 3 起 | Phase 4 每章写作前（一致性检查） |
| 追踪/环境.md | 全书 | Phase 3 起 | Phase 4 每章写作前（一致性检查） |
| 追踪/物资.md | 全书 | Phase 3 起 | Phase 4 每章写作前（一致性检查） |
| 故事线/故事线_索引.md | 全书 | Phase 3 起 | Phase 4 多线并行写作 |
| 跨卷追踪/跨卷伏笔.md | 全书 | Phase 3 起 | Phase 4 跨卷伏笔回收 |
| 跨卷追踪/跨卷角色弧线.md | 全书 | Phase 3 起 | Phase 4 角色弧线追踪 |
| 对标/{书名}/拆文报告.md | 对标书 | 用户手动+analyze | Phase 2 核心设定、Phase 3 大纲、Phase 4 写作 |
| 追踪/上下文.md | 全书 | Phase 4 首次日更（workflow-daily 自动创建） | 每次日更开始时 |
| 参考资料/{topic}.md | 按需 | Phase 4（story-researcher 输出） | Phase 4 后续章节写作时复用 |
| 追踪/角色状态.md | 全书 | Phase 3 | Phase 4 每章写作前（状态筛选步骤） |
| 对标/{书名}/角色/{角色名}.md | 对标书 | analyze 输出 | Phase 4 模块召回（角色参考） |
| 对标/{书名}/剧情/{剧情线名}.md | 对标书 | analyze 输出 | Phase 4 模块召回（剧情模块参考） |
| 对标/{书名}/设定/*.md | 对标书 | analyze 输出 | Phase 2 设定参考、Phase 4 世界观约束 |

**缺失文件回退**：所有新增文件是可选增强，缺失时按以下优先级降级，不报错不阻塞：
1. **角色状态文件缺失** → 从角色设定文件和前文推断当前状态
2. **物品/环境/物资文件缺失** → 从角色状态和前文推断，不阻塞写作
3. **故事线/跨卷追踪文件缺失** → 从卷纲和大纲推断，不阻塞写作
4. **对标结构化子目录缺失** → 按「对标书路径查找」规则回退（对标子目录 → 拆文库同名子目录 → 对标拆文报告.md → 跳过）
5. **有对标书但 `文风.md` 缺失** → 日更文风召回 fail-fast，提示先运行 `/story-long-analyze-mimo` Stage 6 并 `/story-import-mimo` 同步；**完全无对标项目**则跳过文风召回，不阻塞
6. **伏笔/时间线文件缺失** → 不检查，相关信息在卷纲或大纲中体现即可

**文件组织原则：**
- **人物一个一个文件**：`角色/角色名.md`，方便按需读取
- **势力一个一个文件**：`势力/势力名.md`，组织/门派/家族/国家等
- **世界观按主题拆分**：背景、力量体系、社会结构等各自独立
- **细纲一章一个文件**：`细纲_第XXX章.md`，含钩子设计，与正文一一对应
- **正文按章拆分**：每章一个文件，`第XXX章_章名.md`
- 每章写完直接写入 `正文/` 目录，不要先输出到对话

#### 单章写作流程（混合模式）

> **Phase 4（正文写作）和 Phase 5（质量检测）使用子 agent 隔离执行**，其他阶段由主 agent 执行。

**执行模式**：

| 阶段 | 执行方式 | 原因 |
|------|---------|------|
| 上下文读取 | 主 agent | 需要读取多个文件组装上下文 |
| 准备层 | 主 agent | 需要创意决策 |
| 正文写作 | **子 agent** | 质量隔离，防止偷懒 |
| 综合检测+修复 | **子 agent** | 质量隔离，有问题必修 |
| 追踪更新 | 主 agent | 需要上下文连贯 |

**子 agent 调用方式**：

```javascript
// 正文写作
actor({
  operation: "run",
  subagent_type: "general",
  description: "正文写作 - 第{N}章",
  prompt: "详见 references/agent-prompt-templates.md",
  context: "none" // 隔离上下文
})

// 综合检测+修复
actor({
  operation: "run",
  subagent_type: "general",
  description: "质量检测+修复 - 第{N}章",
  prompt: "详见 references/agent-prompt-templates.md",
  context: "none" // 隔离上下文
})
```

**守卫脚本调用**：

```bash
# 执行前验证
node skills/story-long-write-mimo/scripts/step-guard.js pre <step> <workflow_dir> <project_dir>

# 执行后验证
node skills/story-long-write-mimo/scripts/step-guard.js post <step> <workflow_dir>
```

**prompt 模板**：详见 `references/agent-prompt-templates.md`

---

当用户准备写某一章时：

1. **检查细纲 + 读取上下文（动态扫描）**（⚠️ 不可跳过，不可偷懒，不可省略任何一项）：读取 `大纲/细纲_第{N}章.md`。如果不存在，**必须先补建细纲再写正文**，不允许跳过细纲直接写作。补建时参考卷纲中本章对应的事件规划和上下文。细纲确认后，**动态扫描项目目录获取所有文件**：

   **Step A：扫描项目结构**
   ```bash
   ls {project_dir}/正文/第{N-1}章*.md 2>/dev/null  # 上一章
   ls {project_dir}/大纲/细纲_第{N}章.md 2>/dev/null  # 本章细纲
   ls {project_dir}/设定/角色/*.md 2>/dev/null  # 角色设定
   ls {project_dir}/设定/世界观/*.md 2>/dev/null  # 世界观
   ls {project_dir}/设定/势力/*.md 2>/dev/null  # 势力
   ls {project_dir}/设定/关系.md 2>/dev/null
   ls {project_dir}/设定/题材定位.md 2>/dev/null
   ls {project_dir}/设定/文风.md 2>/dev/null
   ls {project_dir}/追踪/*.md 2>/dev/null  # 追踪文件
   ls {project_dir}/跨卷追踪/*.md 2>/dev/null  # 跨卷追踪（可选）
   ls {project_dir}/故事线/*.md 2>/dev/null  # 故事线（可选）
   ls {project_dir}/对标/*/拆文报告.md 2>/dev/null  # 对标（可选）
   ls {project_dir}/对标/*/文风.md 2>/dev/null
   ls {project_dir}/拆文库/*/拆文报告.md 2>/dev/null  # 拆文库（可选）
   ls {project_dir}/参考资料/*.md 2>/dev/null  # 参考资料（可选）
   ```

   **Step B：按扫描结果加载**
   从扫描结果中筛选需要的文件，逐个读取并输出状态（✅已加载 / ⚠️缺失 / 🚫阻断）：
   - 必需：上一章正文、本章细纲、世界观、金手指
   - 重要：伏笔、角色状态、物品、环境、物资、时间线、角色设定
   - 可选：跨卷追踪、故事线、对标、参考资料

   **对标文件加载规则**：
   - 从 `设定/题材定位.md` 读取「主对标书」字段确定对标书名
   - 优先加载 `对标/{主对标书}/文风.md`，不存在则回退 `拆文库/{主对标书}/文风.md`
   - 优先加载 `对标/{主对标书}/拆文报告.md`，不存在则回退 `拆文库/{主对标书}/拆文报告.md`

   **输出格式**：读取完后，输出清单：
   ```
   第{N}章上下文检查：
   ✅ 上一章：正文/第003章_XXX.md
   ✅ 细纲：大纲/细纲_第004章.md
   ⚠️ 伏笔：追踪/伏笔.md — 文件不存在，需要创建吗？
   ✅ 角色：设定/角色/江晨.md, 设定/角色/钟嘉嘉.md
   ...
   ```
   第{N}章上下文检查：
   ✅ (1) 上一章：正文/第003章_XXX.md
   ✅ (2) 细纲：大纲/细纲_第004章.md
   ⚠️ (3) 伏笔：追踪/伏笔.md — 文件不存在，需要创建吗？
   ✅ (4) 角色：设定/角色/江晨.md, 设定/角色/钟嘉嘉.md
   ...
   ✅ (14) 世界观：设定/世界观/背景设定.md, 设定/世界观/金手指.md
   ✅ (15) 金手指：设定/世界观/金手指.md
   ✅ (16) 势力：设定/势力/火箭军.md
   ✅ (17) 关系：设定/关系.md
   ✅ (18) 题材：设定/题材定位.md
   ✅ (19) 文风：设定/文风.md
   ...
   ```

   **缺失处理规则**：
   - 🚫 **BLOCK（阻断）**：**必须补建后才能继续写正文**。细纲不存在 → 当场补建细纲；上一章不存在（首章除外）→ 提示"上一章缺失，无法衔接上下文"，阻断写作
   - ⚠️ **WARN（警告）**：**列出缺失项，问用户怎么办**——「追踪/伏笔.md 不存在，要现在创建吗？还是跳过继续写？」用户选择：创建 / 跳过
   - ℹ️ **可选**：不问用户，缺失时直接跳过，不影响写作
2. **准备层**（下面的 3 步是核心方法在单章写作中的落地：筛选状态 → 召回模块 → 确认意图）：
   - 2.1 **状态筛选**：从 `追踪/角色状态.md` 中筛选本章涉及角色的当前状态，从 `追踪/伏笔.md` 中筛选本章需要回收/推进的伏笔，从 `追踪/物品.md` 筛选相关物品状态，从 `追踪/环境.md` 筛选当前环境。参考 `_shared/references/context-checklist.md`。输出最简记忆包（参考 state-tracking.md）。如果角色状态文件不存在，从角色设定和前文推断
   - 2.2 **模块召回与文风召回**：
     - ① 本章目标情绪词？② 借鉴哪个参考文件的哪个技法？③ 用在哪些段落？答不出 → 先回读参考再动笔
      - (a) **文风召回**：按「对标书路径查找」规则读 `{对标书路径}/文风.md`（路径优先 `{项目}/对标/{书名}/`，回退 `拆文库/{书名}/`）；多本对标书时从 `设定/题材定位.md` 读 `主对标书` 字段。文风文件不存在 → **fail-fast 报错**：「对标书 X 缺少 文风.md。请用 `/story-long-analyze-mimo` 跑 Stage 6 生成文风，再 `/story-import-mimo` 同步。」不 inline 生成
     - (b) **匹配章节挑选**：从 `{对标书路径}/章节/*_摘要.md` grep `基调：(紧张|轻松|悲伤|热血|爽|甜|温馨|恐怖|压抑|其他)`（全角冒号），按本章目标情绪挑章 K——多章同基调时选择规则：先看爽点类型是否接近，再看情节点数量/原文章节估算字数是否接近本章目标字数，最后取章节号最小者；必读 `{对标书路径}/章节/第K章_摘要.md`，若同章存在 `第K章_深度拆解.md` 则加读，否则回退黄金三章深度拆解/文风文件里的可借鉴技巧，不因非黄金三章缺少深度拆解而失败
     - (c) **模块召回**：从对标的结构化子目录（角色/剧情/设定）中按本章情节检索相关模块
     - (d) <!-- cross-book-recall:trigger:execution-output --> 输出"对标召回摘要 + 文风召回指令 + 原文锚点片段引用"（合计 ≤10 条），作为 narrative-writer 的输入。**多对标书时**参 `_shared/references/cross-book-recall.md`，进 prompt 的只主对标（副对标不入正文）
      - (e) **跨章重复预检**：读取 `追踪/cross-chapter-fingerprint.md`，写作时避免重复以下内容：
        - 高频重复片段（列出 top 5）
        - 高频重复动作（列出 top 5）
        - 如指纹文件不存在，跳过此步骤（不阻塞）
     - **快捷路径**：如需使用子智能体，通过 MiMo Code 的 actor 工具 spawn（prompt: "项目目录：{dir}\n查询类型：benchmark_style_load\n查询参数：我要写第 {N} 章；这一章按细纲偏{紧张/热血/轻松等}，目标字数约 {N}，爽点类型={如有}") 一次拿到 `{style_profile_path, style_profile_summary, matched_chapter_K, matched_chapter_techniques, anchor_excerpts, gaps}`；准备层必须原样保留 `gaps`，若 `gaps.matched_deep_dive_missing: true`，文风召回指令必须说明已用黄金三章/文风文件里的技巧回退
   - 2.3 **指令确认**：综合细纲+最简记忆包+模块召回结果，确认本章节奏（快/慢）和情绪目标，用一句话概括本章写作意图。例：「快节奏打脸——读者等了三章，这章必须一拳到位。技法=信息差揭示（hooks-suspense.md），用于第2-4段。」
   - 2.4 **性格锚点检查**（⚠️ 不可跳过）：写对话和行为描写前，从 `追踪/角色状态.md` 读取本章涉及角色的"性格锚点"（核心性格/说话风格/行为模式/禁忌）。如果角色没有性格锚点，从 `设定/角色/{角色名}.md` 提取初始锚点并补录到角色状态文件。写作时严格遵守锚点约束，不得让角色说出/做出违背锚点的事（除非有充分铺垫的性格转变剧情）
   - 2.5 **质量约束注入**（⚠️ 不可跳过）：写作前将以下规则加载到上下文，作为本次写作的硬约束红线。**写的时候就避开这些问题，而不是写完再改**：
       - **完整规则**：读取 `_shared/references/quality-rules.md`，获取禁用词、AI腔禁令、段落规则、对话规则、心理描写限制、比喻限制、节奏规则、留白规则等全部约束
       - **上次质量问题**：读取 `追踪/上下文.md` 中最近记录的质量问题（如有），本次写作直接避开
3. **资料研究**（按需）：如果写作中遇到需要查证的外部事实（历史年代、地理方位、职业细节等），spawn `story-researcher` agent 搜索并输出到 `参考资料/` 目录。研究完成后再继续写作。
4. **标题预检**：写正文前从细纲读取章名；如与既有章节同名或明显重复，先按本章核心事件改名，并同步细纲标题与正文文件名。
5. **写作**：第 1 章如果以内心戏、设定认知或独处开场，必须先把内心变化外化为可见事件（决定、误判、对话、物件变化、外部压力），再按字数目标展开；不得用大段心理独白凑字。若第 1 章低于目标，优先补“外部事件/对话/选择代价”，不要补解释性内心戏。
6. **正文执行**：如需使用子智能体写作正文，通过 MiMo Code 的 actor 工具 spawn（prompt: "项目目录：{dir}\n任务描述：写正文\n章节：第{N}章\n细纲文件：大纲/细纲_第{N}章.md\n上一章：正文/第{N-1}章_*.md\n准备层输出：{2.1最简记忆包 + 2.2模块/文风召回结果 + 2.3写作意图 + 2.5质量约束}\n情绪目标：{从准备层2.3确认}\n涉及角色：{从准备层2.1筛选}\n参考技法：{从准备层2.2召回}\n质量红线：{从准备层2.5加载的禁用词清单+AI腔禁令+段落规则+对话规则+心理描写限制+比喻限制+节奏规则+留白规则}\n对标/拆文路径：{本次查找到的 对标/{书名}/ 或 拆文库/{书名}/，没有则写 无}\n对标召回摘要：{准备层2.2(c)输出的相关角色/剧情/设定/章节模块，最多5条；没有则写 无}\n文风路径：{准备层2.2(a) 找到的 文风.md 绝对路径，没有则写 无}\n文风召回指令：{准备层2.2(b) 输出，含匹配章节号和 1-2 句技法指令——例如 '标点节奏照文风文件里的停顿节奏、对话潜台词用问非所答；情绪交替参考第K章爽点铺放比'。没有则写 无}\n原文锚点片段：{文风文件里 4-6 段中按本章情绪选 1-2 段，完整粘贴 300-500字 原文 — 用于 few-shot 模仿手法、非抄字句；没有则写 无}\n写作硬约束：按三维度织入写场景，但仍必须按镜头断段；一段只承载一个动作/信息变化，优先一段一句，避免一段到底。输出前做密度重排：段落 >60 字按句号/动作转折拆开，单句 >45 字拆短。**文风优先级**：与默认 Gates 冲突时按文风优先级表决议（硬约束 banned-words/Gate F/万能比喻禁令/字数下限 不让位；句长/标点/对话潜台词/情绪交替由文风优先）。\n⚠️质量红线（写作时直接避开，不要写完再改）：禁用词清单中的词绝对不能出现；AI腔句式禁止（'感到X涌上心头'/'宛如'/'这不仅X更Y'/'这一刻'/'面对X选择了Y'/'不是A而是B'）；禁止排比；心理描写≤2句；比喻≤1个/千字；段落≤4行；单句≤45字。\n⚠️字数硬约束：本章必须达到细纲中设定的字数目标（{从细纲读取}字）。写完后立即用统一字数统计工具核对：`node $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js <正文文件> --json`。字数未达标禁止结束本章。") 执行正文写作，输出写入 `正文/第XXX章_章名.md`。如子智能体不可用，由主线程直接写作。
7. **字数验证**（写作完成后的第一件事）：用统一字数统计工具核对本章实际字数：`node $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js <正文文件> --json`。如果字数 < 细纲目标的 90%，**回到细纲补充更多子事件/情节点**，然后用三维度织入将这些新子事件写成正文，并按镜头断段控制单段密度，直到字数达标后再进入步骤 8。
8. **检查**：章尾是否有钩子、爽点是否到位
9. **禁用词检查**：质量约束已在准备层 2.5 注入，此处做全量扫描确认——对照 `references/banned-words.md` 检查本章，一级词命中即替换；二级词高频出现时替换。如发现残留，说明前置约束未完全生效，需修正并记入 `追踪/上下文.md` 的质量问题栏，下次写作加强
10. **更新追踪（三步流程）**：

    **Step A：动态扫描项目结构** — 获取所有可更新文件清单
    - 读取 `$HOME/.config/mimocode/skills/_shared/references/project-structure.md` 获取目录结构定义
    - 扫描 `设定/角色/*.md`、`设定/势力/*.md`、`设定/世界观/*.md`
    - 扫描 `追踪/*.md`、`故事线/*.md`、`跨卷追踪/*.md`
    - 输出文件清单（只列文件名，不读内容）

    **Step B：分析正文提取变更清单** — 从本章正文识别变化点
    - 新角色出现？→ 需要建档/更新 `设定/角色/{名}.md`
    - 角色状态变化？→ 需要更新 `追踪/角色状态.md` + `设定/角色/{名}.md`
    - 新伏笔/回收伏笔？→ 需要更新 `追踪/伏笔.md` + `跨卷追踪/跨卷伏笔.md`（如有）
    - 新物品/物品变化？→ 需要更新 `追踪/物品.md`
    - 环境变化？→ 需要更新 `追踪/环境.md`
    - 经济活动？→ 需要更新 `追踪/物资.md`
    - 故事线推进？→ 需要更新 `故事线/故事线_*.md`
    - 角色弧线阶段变化？→ 需要更新 `跨卷追踪/跨卷角色弧线.md`
    - 接近卷末？→ 需要检查 `跨卷追踪/卷间过渡.md`

    **Step C：按清单更新文件** — 只更新变更涉及的文件
    - 始终更新：`追踪/时间线.md`（记录事件时序）、`追踪/上下文.md`（进度摘要）、`追踪/重复语句.md`（记录重复表达）
    - 按变更清单更新其余文件（对照 Step A 文件清单 + Step B 变更清单）
    - **设定文件回写**：正文揭示新信息影响设定时（如角色能力提升、势力关系变化），同步更新对应 `设定/` 文件
    - **跨卷追踪更新**：正文涉及跨卷伏笔回收/推进或角色弧线阶段变化时，更新 `跨卷追踪/` 下对应文件
    - **角色同步检查**：更新角色状态后，运行 `node $HOME/.config/mimocode/skills/_shared/scripts/character-sync.js <项目目录> --json` 验证设定与追踪一致。如发现「missing_tracking」或「missing_design」问题，当场修复

    > **下一步**：追踪文件更新完成后，进入步骤 10.5 设定回写验证。

10.5. **设定回写验证**（确保没有遗漏）：
    - (a) **扫描本章正文中的角色**：读取正文，提取所有出现的角色名，去重并列出清单
    - (b) **检查每个角色的设定文件**：对每个角色，检查 `设定/角色/{角色名}.md` 是否存在，如存在检查是否包含本章新增的关键信息（性格锚点、关键关系、能力/状态变化）
    - (c) **检查追踪文件**：检查 `追踪/角色状态.md` 中每个角色的状态是否已更新
    - (d) **输出验证报告**：列出所有本章角色，标注验证状态（✅已更新 / ⚠️需更新 / ❌缺失）
    - (e) **处理遗漏**：如有遗漏，当场补充设定文件或追踪文件的更新
    - (f) **记录日志**：将验证结果写入 `追踪/上下文.md` 的设定回写记录

    > **下一步**：设定回写验证完成后，进入 Phase 5 质量检查。Phase 5 如果修正了正文内容，需要回到步骤 10 重新更新受影响的追踪文件。

11. **中途快照 + 质量门禁**（长篇写作安全网）：每连续写完 3 章，在继续前执行以下操作（在 Phase 5 之后）：
    - (a) 将当前进度写入 `追踪/上下文.md`（只更新进度元信息——当前位置、最近决策、待处理线索——不重复角色状态/伏笔的具体内容）
    - (b) 用 `ls -la 正文/` 确认最近 3 个章节文件已成功写入磁盘且大小正常（>100 bytes）
    - (c) **自动运行质量门禁**：`node $HOME/.config/mimocode/skills/_shared/scripts/quality-gate.js <章节文件> --json`（需从全局skill目录执行）
    - (d) 如果 status 为 blocked，暂停写作，修复问题后继续
    - (e) 更新 `追踪/cross-chapter-fingerprint.md` 指纹文件（由 cross-chapter-check.js 自动生成）

> **日更模式**：此步骤自动跳过——workflow-daily Step 2 已按章更新上下文.md。

#### 去AI味前置约束（写作时必须遵守）

> ⚠️ 去AI味不是写完再改，而是写作时就必须遵循的规则。完整规则见 `_shared/references/quality-rules.md`。

---

#### 写作技巧提醒

| 场景 | 技巧 |
|------|------|
| 开篇 500 字 | 必须有钩子，不能从天气/风景开始（除非反差极大） |
| 对话 | 推进剧情或揭示性格，不能只为了凑字数 |
| 打斗 | 不要流水账，写策略和反转，不写「你一拳我一脚」 |
| 日常 | 日常要有人物互动和伏笔，不能只是「吃饭睡觉」 |
| 爽点释放 | 铺垫要充分、释放要干脆，读者等得越久释放越要爽 |
| 爽点密度 | 每 3000-5000 字必须有一个让读者「爽」的情绪节点 |
| 公式约束 | 参考 genre-writing-formulas.md 中的创作公式 |
| 章尾 | 每章结尾都要有让读者想翻下一页的东西 |
| 情绪验证 | 写完每章回头检查：读者到这里应该感受到什么？感受到了吗？如果没感受到 → 补冲突或钩子 |

#### 字数硬约束

| 节奏 | 最低字数 | 说明 |
|------|----------|------|
| 高速推进 | ≥ 2000 字/章 | 每章一个明确事件 |
| 正常节奏 | ≥ 3000 字/章 | 主线 + 少量副线 |
| 舒缓铺垫 | ≥ 3000 字/章 | 人物互动 + 伏笔 |
| 高潮爆发 | ≥ 2000 字/章 | 集中释放、不拖沓 |

**默认最低字数：3000 字/章。细纲另有标注时以细纲为准。低于最低字数的章节必须补足后再继续。**


#### 追踪文件归档

每完成 50 章或一个卷结束时，对 `追踪/上下文.md` 做一次轻量归档：保留最近 5 章详记，将更早内容压缩到 `追踪/归档/第XXX-YYY章.md`，并在上下文中保留归档索引。伏笔、时间线、角色状态仍以当前文件为准，不把活跃线索移入归档。

---

### Phase 5：质量检查（子 agent 隔离执行）

> **Phase 5 使用子 agent 隔离执行**，确保质量检测不受主 agent 上下文影响。

**执行方式**：

```javascript
actor({
  operation: "run",
  subagent_type: "general",
  description: "综合质量检测+修复 - 第{N}章",
  prompt: "详见 references/agent-prompt-templates.md",
  context: "none" // 隔离上下文
})
```

**守卫脚本验证**：

```bash
# 执行前验证
node skills/story-long-write-mimo/scripts/step-guard.js pre check .workflow <project_dir>

# 执行后验证
node skills/story-long-write-mimo/scripts/step-guard.js post check .workflow
```

**检测项**（8项，必须全部运行）：

| 序号 | 检测项 | 严重度 | 脚本/方法 |
|------|--------|--------|----------|
| 1 | 字数达标 | BLOCK | wordcount.js 统计 |
| 2 | 禁用词+AI腔 | BLOCK | style-lint.js |
| 3 | AI标点符号 | BLOCK | punctuation-normalize.js |
| 4 | 一致性 | BLOCK | consistency-check.js |
| 5 | **设定校验** | BLOCK | LLM 分析 |
| 6 | 逻辑性 | WARN | LLM 分析 |
| 7 | 跨章节检查 | WARN | cross-chapter-check.js |
| 8 | **跨卷一致性** | WARN | LLM 分析 |

**跨卷一致性校验内容**：
- 跨卷伏笔是否逾期（超过预期卷数仍未回收）
- 角色弧线是否连贯（角色成长/转变是否与跨卷角色弧线一致）
- 故事线是否断裂（主线/副线是否有未衔接的断点）

**设定校验内容**：
- 世界观规则是否遵守（如时代背景、社会规则、技术设定）
- 金手指规则是否正确（如系统机制、能力限制）
- 文风是否符合设定（如语言风格、叙事视角）
- 题材核心梗是否体现（如爽点模式、情绪目标）
- 角色关系是否符合设定（如亲疏、敌友、势力归属）

**修复规则**：只要有任何 WARN 或 BLOCK，就必须修复，不能跳过。

**输出文件**：`.workflow/step-check-report.json`

**prompt 模板**：详见 `references/agent-prompt-templates.md`

#### 子智能体调用：consistency-checker

质量检查阶段，如需使用子智能体执行一致性检查，通过 MiMo Code 的 actor 工具 spawn（prompt: "项目目录：{dir}\n检查范围：{本次写作的章节}\n检查类型：事实冲突+伏笔断线+角色属性不一致") 获取 S1-S4 分级报告。如子智能体不可用，由主线程参照 quality-checklist.md 直接检查。

#### 子智能体调用：narrative-writer（去AI味审查）

质量检查阶段，如需使用子智能体执行文字质量审查和去AI味检查，通过 MiMo Code 的 actor 工具 spawn（prompt: "项目目录：{dir}\n任务描述：审查+去AI味\n检查范围：{本次写作的章节}") 执行。如子智能体不可用，由主线程直接执行。

检查后更新所有配置文件：
- 更新 `追踪/伏笔.md` 中的过期伏笔和回收状态
- 更新 `追踪/时间线.md` 中的时间线疑点
- 更新 `设定/角色/*.md` 中的角色设定（如有变化）
- 更新 `故事线/故事线_*.md` 中的故事线进展（如有变化）



---

## 流程衔接

**流水线：** 长篇
**位置：** 写作（第 3/3 步）

| 时机 | 跳转到 | 命令 |
|---|---|---|
| 写完，去 AI 味 | story-deslop-mimo | `/story-deslop-mimo` |
| 想对比参考书 | story-long-analyze-mimo | `/story-long-analyze-mimo` |
| 需要市场方向 | story-long-scan-mimo | `/story-long-scan-mimo` |
| 太长，适合短篇 | story-short-write-mimo | `/story-short-write-mimo` |

---

## 参考资料索引

按场景加载，不一次全部加载。

### Phase 1：选题方向

| 场景 | 加载文件 | 优先级 |
|------|---------|--------|
| 确定题材类型 | `references/genre-catalog.md` | **必读** |
| 判断市场方向 | `references/genre-readers.md` | 按需 |
| 特殊题材考量 | `references/plot-special-topics.md` | 按需 |
| 女频长篇（题材/文案/平台/感情线） | `references/female-audience-writing.md` | 按需 |

### Phase 2：核心设定

| 场景 | 加载文件 | 优先级 |
|------|---------|--------|
| 设定人物 | `references/character-basics.md` | **必读** |
| 设计关系 | `references/character-relations.md` | 按需 |
| 题材框架与定位 | `references/genre-catalog.md` + `references/genre-core-mechanics.md` | **必读** |
| 创建 artifact | `references/artifact-protocols.md` | 按需 |

### Phase 3：大纲搭建

| 场景 | 加载文件 | 优先级 |
|------|---------|--------|
| 搭建大纲 | `references/outline-methods.md` | **必读** |
| 设计矛盾与结构 | `references/outline-conflict.md` | 按需 |
| 深度结构设计 | `references/outline-structure-theory.md` | 按需 |
| 节奏与升级感 | `references/outline-rhythm.md` | 按需 |
| 小纲与卡文 | `references/plot-core-methods.md` | 按需 |
| 选择叙事框架 | `references/plot-frameworks.md` | 按需 |
| 题材写作公式 | `references/genre-writing-formulas.md` | 按需 |
| 黄金三章 | `references/opening-design.md` | **必读** |
| 情绪弧线 | `references/emotional-arc-design.md` | 按需 |
| 反转设计 | `references/reversal-toolkit.md` | 按需 |

### Phase 4：正文写作

| 场景 | 加载文件 | 优先级 |
|------|---------|--------|
| 章节钩子 | `references/hooks-chapter.md` | **必读** |
| 悬念设计 | `references/hooks-suspense.md` | 按需 |
| 段落级钩子 | `references/hooks-paragraph.md` | 按需 |
| 题材风格 | `references/style-genre-modules.md` | 按需 |
| 打斗/装逼 | `references/style-combat-face.md` | 按需 |
| 写作技法 | `references/style-craft.md` | 按需 |
| 商业创作核心方法 | `references/commercial-core-methods.md` | 按需 |
| 对话 | `references/dialogue-mastery.md` | **必读** |
| 人物深化 | `references/character-design-methods.md` | 按需 |
| 情绪技法 + 叙事单元 | `references/plot-emotion-system.md` + `references/emotional-methods.md` | 按需 |
| 写作技法全程参考 | `references/writing-craft.md` | 按需 |
| 格式与结构规范 | `references/format-and-structure.md`（仅对话/段落格式适用长篇） | 按需 |
| 状态追踪协议 | `references/state-tracking.md` | 按需 |
| 一致性追踪系统 | `references/consistency-tracking.md` | 按需 |
| 故事线管理 | `references/story-line-management.md` | 按需 |
| 跨卷追踪 | `references/cross-volume-tracking.md` | 按需 |
| 结构化索引层 | `references/structured-indexing.md` | 按需 |
| 流水线并行 | `references/pipeline-parallelism.md` | 按需 |
| 自适应批量 | `references/adaptive-batch-sizing.md` | 按需 |
| 质量监控 | `references/quality-monitoring.md` | 按需 |
| 版本管理 | `references/version-management.md` | 按需 |
| 数据分析 | `references/data-analytics.md` | 按需 |
| 自动化检测 | `references/auto-detection.md` | 按需 |
| 用户体验 | `references/user-experience.md` | 按需 |

### Phase 5：质量检查

| 场景 | 加载文件 | 优先级 |
|------|---------|--------|
| 质量检查 | `references/quality-checklist.md` | 按需 |
| 禁用词扫描 | `references/banned-words.md` | **必读** |
| 去AI味 | `references/anti-ai-writing.md` | **必读** |

### 按主题快速定位（横切主题）

有些主题横跨多个阶段、散在多个文件里。下表给每个主题一个**权威文件**（先读它，通常够用），配套文件只在需要那个角度时再加载。括号是该文件里对应的小节。

| 主题 | 权威文件（先读） | 配套文件（按角度补充） |
|------|-----------------|----------------------|
| 爽点（按意图分流） | **`references/plot-emotion-system.md`**（爽点设计体系：本质/六种类型/倒推法——"怎么设计爽点"先读这个） | 翻盘/高潮式爽点→`references/plot-core-methods.md`（假胜→崩解）· 打脸/装逼释放→`references/style-combat-face.md`· 题材打脸逆袭公式→`references/genre-writing-formulas.md`· 爽文循环/多层→`references/outline-methods.md`·`references/outline-conflict.md` |
| 情绪模块 | **`references/plot-emotion-system.md`**（情绪模块与戏剧单元分类） | `references/outline-rhythm.md`（情绪模块系统 + 常用情绪模块公式） |
| 节奏 | **`references/outline-rhythm.md`**（升级感三步 + 桥段与节奏的结构化设计） | `references/plot-core-methods.md`（连续性追踪与节奏管理：热度/冷却） |
| 高潮 | **`references/plot-core-methods.md`**（高潮构建公式：蓄能→假胜→崩解） | `references/outline-rhythm.md`（高潮分类与反推）· `references/outline-methods.md`（八节点故事结构：结构定位） |
| 金手指 | **`references/plot-special-topics.md`**（金手指拆分理解与战力防崩 + 进阶设计） | `references/outline-conflict.md`（金手指与身份：四点统一） |
| 感情线 | **`references/character-relations.md`**（好感度体系/四阶段 + 男女频差异） | `references/outline-conflict.md`（感情线设计）· `references/style-combat-face.md`（后宫文女主 / 男频极简爱情线构型）· `references/plot-special-topics.md`（爱情线提纯策略） |
| 反转 | **`references/reversal-toolkit.md`**（反转类型/铺垫/有效性自检） | `references/plot-core-methods.md`（假胜：先给希望再击碎） |
| 人物 | **`references/character-basics.md`**（主角/配角/反派/动机模板速填） | `references/character-design-methods.md`（三层标签反差/九维深化）· `references/character-relations.md`（关系类型/感情线） |
| 女频写作 | **`references/female-audience-writing.md`**（女频长篇：核心原则/文案/题材/感情线长线/平台） | `references/genre-readers.md`（读者心理/平台差异）· `references/character-relations.md`（感情线总框架） |
| 去AI味 | **`references/anti-ai-writing.md`**（AI指纹/核心规则/Show Don't Tell） | `references/banned-words.md`（禁用词扫描）· `references/quality-checklist.md`（成稿检查） |
| 一致性追踪 | **`references/consistency-tracking.md`**（物品/环境/物资/角色状态追踪） | `references/state-tracking.md`（角色状态快照格式）· `references/story-line-management.md`（故事线管理）· `references/cross-volume-tracking.md`（跨卷追踪） |
| 千万字性能 | **`references/structured-indexing.md`**（结构化索引层：上下文加载提速3-5x） | `references/pipeline-parallelism.md`（流水线并行：单章耗时降低30-40%）· `references/adaptive-batch-sizing.md`（自适应批量：长会话稳定性提升） |
| 质量监控 | **`references/quality-monitoring.md`**（质量监控：一致性/爽点/AI腔） | `references/auto-detection.md`（自动化检测脚本）· `references/data-analytics.md`（数据分析仪表盘） |
| 版本管理 | **`references/version-management.md`**（Git自动提交+变更日志） | - |
| 用户体验 | **`references/user-experience.md`**（项目仪表盘+快捷恢复+反馈循环） | - |

---

## 语言

- 跟随用户的语言回复，用户用什么语言就用什么语言回复
- 中文回复遵循《中文文案排版指北》

