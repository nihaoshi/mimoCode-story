---
name: story-chapter-write-mimo
version: 2.0.0
description: 单章写作流程，14步子agent隔离执行，有问题必修
category: write
triggers:
  - /chapter-write
  - 写第X章
  - 单章写作
  - 续写
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
  - name: chapter_number
    type: number
    required: false
    description: 指定章节号（默认自动检测下一章）
---

# 单章写作流程 v2.0

## 核心设计

1. **子 agent 隔离执行**：每个任务由独立子 agent 执行，上下文完全隔离
2. **有问题必修**：质量检测中只要有任何 WARN 或 BLOCK，就必须修复
3. **综合检测**：字数、禁用词、一致性、逻辑性合并为一次检测
4. **综合修复**：一个修复 agent 处理所有问题

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

**每个 Agent 执行前后必须运行守卫脚本：**
```bash
node {skill_dir}/scripts/step-guard.js pre  <步骤号> {workflow_dir}
node {skill_dir}/scripts/step-guard.js post <步骤号> {workflow_dir}
```

---

## 任务树（15步）

```
T-CHAP-{N}: 写第{N}章
│
├─── Phase 1: 准备阶段
│    ├── T-CHAP-{N}-01: 目录健全检查 [子 agent 隔离·explore]
│    ├── T-CHAP-{N}-02: 获取最新章节信息 [子 agent 隔离·explore]
│    ├── T-CHAP-{N}-03: 检查细纲是否存在 [子 agent 隔离·explore]
│    ├── [条件] T-CHAP-{N}-04: 创建细纲 [子 agent 隔离·general]
│    ├── [条件] T-CHAP-{N}-04.5: 对标文件处理 [子 agent 隔离·general]
│    ├── T-CHAP-{N}-05: 分析细纲确定读取文件 [子 agent 隔离·general]
│    ├── T-CHAP-{N}-06: 决策是否创建新设定 [子 agent 隔离·general]
│    └── [条件] T-CHAP-{N}-07: 创建新设定文件 [子 agent 隔离·general]
│
├─── Phase 2: 写作阶段
│    ├── T-CHAP-{N}-08: 读取上下文并展示 [子 agent 隔离·general]
│    ├── T-CHAP-{N}-09: 生成约束参数 [子 agent 隔离·general]
│    └── T-CHAP-{N}-10: 正文写作 [子 agent 隔离·general] ← 只写作，不检查
│
├─── Phase 3: 检测阶段
│    └── T-CHAP-{N}-11: 综合质量检测 [子 agent 隔离·general]
│        ├── 字数检测
│        ├── 禁用词+AI腔检测
│        ├── 一致性检测
│        ├── 章内逻辑性检查
│        └── 跨章节检查
│
├─── Phase 4: 修复阶段（有问题必修）
│    ├── [条件] T-CHAP-{N}-12: 综合修复 [子 agent 隔离·general]
│    └── [条件] T-CHAP-{N}-13: 复查 [子 agent 隔离·general]
│    └── [条件] T-CHAP-{N}-13.5: 百分制评分 [子 agent 隔离·general]
│
└─── Phase 5: 收尾阶段
     ├── T-CHAP-{N}-14: 追踪+设定更新 [子 agent 隔离·general]
     └── T-CHAP-{N}-14.5: 设定回写验证 [子 agent 隔离·explore]
```

---

## 子 Agent 调用规范

每步必须用 `actor` 工具 spawn 子 agent 执行，不可在主会话中直接完成。

### 通用 prompt 前缀

所有子 agent 的 prompt 必须包含防偷懒铁律：

```
你是单章写作流程的一个步骤执行器。

【防偷懒铁律】
- 读文件，写文件，跑脚本，给用户看
- 不凭记忆，不跳步骤，不偷懒
- 所有输出必须写入 .workflow/ 目录
- 项目目录：{project_dir}
- 章节号：{N}
```

### Step 01-03: explore 类（只读检查）

```javascript
// Step 01: 目录健全检查
actor({
  "operation": {
    "action": "run",
    "subagent_type": "explore",
    "description": "目录健全检查 - 第{N}章",
    "prompt": "你是单章写作流程的目录检查器。\n\n【防偷懒铁律】读文件，写文件，跑脚本，给用户看。不凭记忆，不跳步骤。\n\n【任务】检查项目目录 {project_dir} 的结构完整性。\n\n【检查项】\n1. 正文/ 目录是否存在\n2. 追踪/ 目录是否存在\n3. 大纲/ 目录是否存在\n4. 设定/ 目录是否存在\n5. 故事线/ 目录是否存在\n6. 跨卷追踪/ 目录是否存在\n7. 对标/ 目录是否存在（可选）\n8. 参考资料/ 目录是否存在（可选）\n9. 以下追踪文件是否存在：伏笔.md、时间线.md、角色状态.md、物品.md、环境.md、物资.md、重复语句.md、上下文.md\n\n【执行规则】\n- 缺失的目录必须创建\n- 缺失的追踪文件必须创建空模板\n- 所有问题必须修复，不能跳过\n\n【输出】将结果写入 {project_dir}/.workflow/step01-health-check.json，格式：\n{\"project_dir\": \"...\", \"status\": \"pass|fail\", \"missing_dirs\": [...], \"missing_files\": [...], \"created\": [...], \"issues\": [...]}\n\n- status: 仅当所有必需目录和文件都存在时为 \"pass\"，否则为 \"fail\"\n- issues: 列出所有发现的问题（即使已修复）\n- created: 列出本次创建的目录和文件\n\n【关键规则】\n- 只要发现任何问题，status 必须为 \"fail\"\n- 即使问题已修复，仍需记录在 issues 中\n- 后续步骤必须检查 status，为 \"fail\" 时停止并报告",
    "context": "none"
  }
})
```

```javascript
// Step 02: 获取最新章节信息
actor({
  "operation": {
    "action": "run",
    "subagent_type": "explore",
    "description": "获取最新章节信息 - 第{N}章",
    "prompt": "你是单章写作流程的章节扫描器。\n\n【防偷懒铁律】不凭记忆，必须扫描目录。\n\n【任务】扫描 {project_dir}/正文/ 目录，找出最新章节。\n\n【执行】\n1. 列出正文/ 目录下所有 .md 文件\n2. 提取最大章节编号\n3. 对最新章节运行字数统计：node $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js <最新章节文件> --json\n\n【输出】写入 {project_dir}/.workflow/step02-chapter-info.json，格式：\n{\"latest_chapter\": 5, \"latest_file\": \"正文/第005章.md\", \"word_count\": 3200, \"next_chapter\": 6}",
    "context": "none"
  }
})
```

```javascript
// Step 03: 检查细纲
actor({
  "operation": {
    "action": "run",
    "subagent_type": "explore",
    "description": "检查细纲 - 第{N}章",
    "prompt": "你是单章写作流程的细纲检查器。\n\n【防偷懒铁律】必须实际检查文件，不能推断。\n\n【任务】检查 {project_dir}/大纲/细纲_第{N}章.md 是否存在且格式完整。\n\n【执行】\n1. 检查文件是否存在\n2. 如存在，验证是否包含：核心事件、情节点序列、目标情绪、章首钩子、章尾钩子、字数目标\n3. 统计情节点数量\n\n【输出】写入 {project_dir}/.workflow/step03-outline-check.json，格式：\n{\"exists\": true, \"need_create\": false, \"chapter\": {N}, \"plot_points\": 12, \"has_hook\": true, \"word_target\": 3000}",
    "context": "none"
  }
})
```

### Step 04-07: general 类（准备阶段）

```javascript
// Step 04: 创建细纲 [条件]（动态扫描）
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "创建细纲 - 第{N}章",
    "prompt": "你是单章写作流程的细纲创建器。\n\n【防偷懒铁律】必须动态扫描项目目录获取文件列表，不能硬编码。\n\n【任务】为第{N}章创建细纲。\n\n【Step A：读取项目结构定义】\n读取 $HOME/.config/mimocode/skills/_shared/references/project-structure.md，获取目录结构和文件清单。\n\n【Step B：动态扫描项目目录】\n```bash\nls {project_dir}/大纲/大纲.md 2>/dev/null\nls {project_dir}/大纲/卷纲_*.md 2>/dev/null\nls {project_dir}/追踪/*.md 2>/dev/null\nls {project_dir}/正文/第{N-1}章*.md 2>/dev/null\nls {project_dir}/设定/世界观/*.md 2>/dev/null\nls {project_dir}/设定/角色/*.md 2>/dev/null\nls {project_dir}/设定/势力/*.md 2>/dev/null\nls {project_dir}/设定/关系.md 2>/dev/null\nls {project_dir}/设定/题材定位.md 2>/dev/null\nls {project_dir}/设定/文风.md 2>/dev/null\nls {project_dir}/跨卷追踪/*.md 2>/dev/null\nls {project_dir}/故事线/*.md 2>/dev/null\n```\n\n【细纲内容去重（必须执行）】生成新细纲前，扫描前 5 章细纲的核心事件和情节点序列，避免以下重复：\n1. 核心事件重复：新章核心事件不得与前 5 章中任意一章高度相似\n2. 情节点重复：新章情节点序列不得与前 3 章有 >50% 重合\n3. 情绪重复：连续 3 章不得交付同一情绪目标\n4. 爽点重复：新章爽点类型不得与前 3 章完全相同\n去重方法：读取前 5 章细纲的「核心事件」字段对比，如重复则调整事件方向或增加新冲突。\n\n【输出格式】写入 {project_dir}/大纲/细纲_第{N}章.md，格式如下：\n\n# 第{N}章：{章名} 细纲\n\n## 核心事件\n{一句话描述本章核心事件}\n\n## 情节点序列\n1. {情节点1}\n2. {情节点2}\n...（>=10个）\n\n## 目标情绪\n{本章要交付的情绪}\n\n## 章首钩子\n{如何吸引读者继续阅读}\n\n## 章尾钩子\n{如何引导读者期待下一章}\n\n## 爽点\n{本章爽点类型和位置}\n\n## 字数目标\n{预计字数}\n\n## 涉及角色\n{本章出场或提及的角色名列表，用于文件分析器映射到设定文件}\n\n## 涉及场景\n{本章发生的地点/场景，用于映射到世界观文件}\n\n## 涉及伏笔\n{本章需要推进或回收的伏笔，用于从伏笔.md筛选相关行}\n\n【要求】\n- 情节点 >= 10 个\n- 必须有章首钩子和章尾钩子\n- 必须有爽点标注\n- 必须有字数目标\n- 涉及角色/场景/伏笔必须列出，供下游文件分析器使用\n- 细纲内容不得违反世界观规则和金手指规则\n- 角色行为必须符合角色设定和性格锚点\n- 如有跨卷伏笔需要在本章回收，必须在涉及伏笔中标注",
    "context": "none"
  }
})
```

```javascript
// Step 04.5: 对标文件处理 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "对标文件处理 - 第{N}章",
    "prompt": "你是单章写作流程的对标文件处理器。\n\n【防偷懒铁律】必须实际读取文件，不能凭记忆。\n\n【任务】处理对标书的文风和拆文报告，为写作提供参考。\n\n【执行】\n1. 读取 {project_dir}/设定/题材定位.md 的「主对标书」字段\n2. 确定对标书路径（优先 对标/{书名}/，回退 拆文库/{书名}/）\n3. 读取对标文风.md，提取原文锚点片段（300-500字）\n4. 读取拆文报告.md，提取可借鉴套路\n5. 读取本章涉及角色的角色档案\n\n【输出】写入 {project_dir}/.workflow/step04-benchmark.json，格式：\n{\"benchmark_book\": \"书名\", \"benchmark_path\": \"...\", \"anchor_excerpts\": [...], \"techniques\": [...], \"characters\": [...]}",
    "context": "none"
  }
})
```

```javascript
// Step 05: 分析细纲确定读取文件（动态扫描）
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "文件分析 - 第{N}章",
    "prompt": "你是单章写作流程的文件分析器。\n\n【防偷懒铁律】必须动态扫描项目目录获取文件列表，不能硬编码。\n\n【任务】动态扫描项目结构，确定本章需要读取的所有文件。\n\n【Step A：读取项目结构定义】\n读取 $HOME/.config/mimocode/skills/_shared/references/project-structure.md，获取目录结构和文件清单。\n\n【Step B：动态扫描项目目录】\n执行以下扫描命令获取实际文件列表：\n```bash\n# 设定目录\nls {project_dir}/设定/世界观/*.md 2>/dev/null\nls {project_dir}/设定/角色/*.md 2>/dev/null\nls {project_dir}/设定/势力/*.md 2>/dev/null\nls {project_dir}/设定/关系.md 2>/dev/null\nls {project_dir}/设定/题材定位.md 2>/dev/null\nls {project_dir}/设定/文风.md 2>/dev/null\n# 追踪目录\nls {project_dir}/追踪/*.md 2>/dev/null\n# 跨卷追踪（可选）\nls {project_dir}/跨卷追踪/*.md 2>/dev/null\n# 故事线（可选）\nls {project_dir}/故事线/*.md 2>/dev/null\n# 对标文件（可选）\nls {project_dir}/对标/*/拆文报告.md 2>/dev/null\nls {project_dir}/对标/*/文风.md 2>/dev/null\n```\n\n【Step C：从细纲提取本章涉及的角色和场景】\n读取 {project_dir}/大纲/细纲_第{N}章.md，提取：\n1. 本章涉及的角色名 → 映射到扫描到的 设定/角色/{角色名}.md\n2. 本章涉及的场景\n3. 本章涉及的伏笔\n\n【Step D：组装文件清单】\n将扫描结果 + 细纲解析结果合并，输出最终需要加载的文件列表。\n\n【输出】写入 {project_dir}/.workflow/step05-required-files.json，格式：\n{\"scanned_files\": {\"setting\": [...], \"tracking\": [...], \"cross_volume\": [...], \"storyline\": [...], \"benchmark\": [...]}, \"characters\": [...], \"scenes\": [...], \"foreshadows\": [...], \"files_to_load\": [...]}",
    "context": "none"
  }
})
```

```javascript
// Step 06: 设定决策
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "设定决策 - 第{N}章",
    "prompt": "你是单章写作流程的设定决策器。\n\n【防偷懒铁律】必须实际比对，不能推断。\n\n【任务】比对细纲中的元素与现有设定，发现新元素。\n\n【执行】\n1. 读取 {project_dir}/.workflow/step05-required-files.json\n2. 读取 {project_dir}/追踪/角色状态.md\n3. 检查细纲中提到的角色是否已有设定文件\n4. 检查细纲中提到的势力/地点是否已有设定文件\n\n【输出】写入 {project_dir}/.workflow/step06-new-settings.json，格式：\n{\"need_new_settings\": true, \"new_characters\": [...], \"new_forces\": [...], \"new_locations\": [...]}",
    "context": "none"
  }
})
```

```javascript
// Step 07: 创建新设定 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "创建新设定 - 第{N}章",
    "prompt": "你是单章写作流程的设定创建器。\n\n【防偷懒铁律】必须完整，不能只有骨架。\n\n【任务】为新出现的元素创建设定文件。\n\n【输入】读取 {project_dir}/.workflow/step06-new-settings.json\n\n【执行】\n1. 为每个新角色创建 {project_dir}/设定/角色/{角色名}.md\n2. 为每个新势力创建 {project_dir}/设定/势力/{势力名}.md\n3. 在 {project_dir}/追踪/角色状态.md 中登记新角色初始状态\n4. 运行 character-sync.js 验证同步\n\n【输出】设定文件 + 更新后的角色状态.md",
    "context": "none"
  }
})
```

### Step 08-10: general 类（写作阶段）

```javascript
// Step 08: 读取上下文
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "读取上下文 - 第{N}章",
    "prompt": "你是单章写作流程的上下文加载器。\n\n【防偷懒铁律】设定文件必须全部读取，不能跳过。\n\n【任务】读取 step05 列出的所有文件，组装写作上下文。参考 $HOME/.config/mimocode/skills/_shared/references/context-checklist.md 场景2：正文写作（22项）。\n\n【必读】\n1. {project_dir}/.workflow/step05-required-files.json — 需要读取的文件列表\n2. 按列表逐一读取所有文件，每读一个输出状态（✅已加载 / ⚠️缺失 / 🚫阻断）\n3. 上一章结尾必须是最后500字原文\n4. 细纲：{project_dir}/大纲/细纲_第{N}章.md — 本章细纲（O3）\n5. 设定文件（S1-S7）必须全部读取：世界观/*.md、金手指.md、角色/{角色}.md、势力/*.md、关系.md、题材定位.md、文风.md\n6. 追踪文件（T1-T8）必须全部读取：伏笔.md、时间线.md、角色状态.md、物品.md、环境.md、物资.md、重复语句.md、上下文.md\n7. 跨卷追踪（C1-C3）存在时必须加载：跨卷伏笔.md、跨卷角色弧线.md、卷间过渡.md\n8. 故事线（L1-L3）存在时必须加载：故事线索引.md、主线_*.md、交叉点.md\n9. 如有对标，读取 {project_dir}/.workflow/step04-benchmark.json\n\n【输出】写入 {project_dir}/.workflow/step08-context.json，格式：\n{\"chapter\": {N}, \"previous_ending\": \"...\", \"characters\": {...}, \"settings\": {...}, \"tracking\": {...}, \"cross_volume\": {...}, \"storylines\": {...}, \"foreshadows\": [...], \"benchmark\": {...}}",
    "context": "none"
  }
})
```

```javascript
// Step 09: 生成约束
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "生成约束 - 第{N}章",
    "prompt": "你是单章写作流程的约束生成器。\n\n【防偷懒铁律】禁用词必须从文件加载，字数限制必须明确。\n\n【任务】生成本章写作的质量约束参数。\n\n【执行】\n1. 读取 {project_dir}/.workflow/step08-context.json 获取上下文\n2. 从细纲读取字数目标\n3. 加载质量规则（读取 $HOME/.config/mimocode/skills/_shared/references/quality-rules.md）\n4. 如有对标，从 step04-benchmark.json 读取锚点片段和技法\n\n【输出】写入 {project_dir}/.workflow/step09-constraints.json，格式：\n{\"word_count_target\": 3000, \"banned_words\": [...], \"ai_patterns\": [...], \"benchmark_excerpts\": [...], \"techniques\": [...]}",
    "context": "none"
  }
})
```

```javascript
// Step 10: 正文写作
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "正文写作 - 第{N}章",
    "prompt": "你是 narrative-writer，负责正文写作。只写作，不检查质量。\n\n【防偷懒铁律】必须写入文件，不在对话中输出。必须包含所有场景。\n\n【输入文件】\n1. {project_dir}/大纲/细纲_第{N}章.md — 细纲\n2. {project_dir}/.workflow/step08-context.json — 上下文\n3. {project_dir}/.workflow/step09-constraints.json — 约束\n\n【写作要求】\n1. 严格按细纲的事件序列写作\n2. 遵守约束参数（禁用词、文风、字数目标）\n3. 字数必须达到 {word_count_target}\n4. 写入文件，不在对话中输出\n\n【质量红线】读取 $HOME/.config/mimocode/skills/_shared/references/quality-rules.md 获取完整规则。写作时直接避开，不要写完再改。\n\n【输出】\n- 正文：{project_dir}/正文/第{N}章.md\n\n写完后运行字数验证：\nnode $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js {project_dir}/正文/第{N}章.md --json\n字数未达标禁止结束。",
    "context": "none"
  }
})
```

### Step 11-13: general 类（检测修复阶段）

```javascript
// Step 11: 综合质量检测
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "综合质量检测 - 第{N}章",
    "prompt": "你是 quality-checker，负责综合质量检测。有问题必修。\n\n【防偷懒铁律】必须运行所有检测脚本，不能跳过。\n\n【输入文件】\n- 正文：{project_dir}/正文/第{N}章.md\n- 约束：{project_dir}/.workflow/step09-constraints.json\n- 上下文：{project_dir}/.workflow/step08-context.json\n- 细纲：{project_dir}/大纲/细纲_第{N}章.md\n\n【参考文件】（设定校验和跨卷一致性检测必须读取）\n- 设定：{project_dir}/设定/世界观/*.md、设定/世界观/金手指.md\n- 角色：{project_dir}/设定/角色/{相关角色}.md\n- 关系：{project_dir}/设定/关系.md\n- 题材：{project_dir}/设定/题材定位.md\n- 文风：{project_dir}/设定/文风.md\n- 物品：{project_dir}/追踪/物品.md（如存在）\n- 环境：{project_dir}/追踪/环境.md（如存在）\n- 物资：{project_dir}/追踪/物资.md（如存在）\n- 跨卷伏笔：{project_dir}/跨卷追踪/跨卷伏笔.md（如存在）\n- 角色弧线：{project_dir}/跨卷追踪/跨卷角色弧线.md（如存在）\n- 故事线：{project_dir}/故事线/故事线_索引.md、故事线_主线_*.md、故事线_交叉点.md（如存在）\n\n【检测项】（必须全部运行）\n1. 字数达标 — node $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js {chapter_file} --json — BLOCK\n2. 禁用词+AI腔 — node $HOME/.config/mimocode/skills/_shared/scripts/style-lint.js --json {chapter_file} — BLOCK\n3. AI标点符号 — node $HOME/.config/mimocode/skills/_shared/scripts/punctuation-normalize.js --json {chapter_file} — BLOCK\n4. 一致性 — node $HOME/.config/mimocode/skills/_shared/scripts/consistency-check.js --json {chapter_file} {project_dir} — BLOCK\n5. 设定校验 — LLM分析（对比设定文件，检查世界观/金手指/文风/题材/关系是否符合）— BLOCK\n6. 章内逻辑性 — LLM分析 — WARN\n7. 跨章节检查 — node $HOME/.config/mimocode/skills/_shared/scripts/cross-chapter-check.js --json {chapter_file} {project_dir} — WARN\n8. 跨卷一致性 — LLM分析（对比跨卷追踪和故事线文件，检查伏笔逾期/弧线断裂/故事线断裂）— WARN\n\n【输出】写入 {project_dir}/.workflow/step11-quality-report.json，格式：\n{\"status\": \"pass|warn|fail\", \"blockers\": [...], \"warnings\": [...], \"checks\": [...]}\n\n【关键规则】只要有任何 WARN 或 BLOCK，status 必须为 fail。",
    "context": "none"
  }
})
```

```javascript
// Step 12: 综合修复 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "综合修复 - 第{N}章",
    "prompt": "你是 quality-fixer，负责修复所有问题。\n\n【防偷懒铁律】每个问题必须修复，不能跳过 WARN。\n\n【输入文件】\n- 检测报告：{project_dir}/.workflow/step11-quality-report.json\n- 正文：{project_dir}/正文/第{N}章.md\n- 约束：{project_dir}/.workflow/step09-constraints.json\n- 细纲：{project_dir}/大纲/细纲_第{N}章.md\n\n【参考文件】（修复一致性错误和设定违反时必须读取）\n- 角色状态：{project_dir}/追踪/角色状态.md\n- 物品：{project_dir}/追踪/物品.md\n- 环境：{project_dir}/追踪/环境.md\n- 世界观：{project_dir}/设定/世界观/*.md\n- 角色设定：{project_dir}/设定/角色/{相关角色}.md\n- 质量规则：读取 $HOME/.config/mimocode/skills/_shared/references/quality-rules.md\n\n【修复规则】\n1. 读取检测报告中的 blockers 和 warnings\n2. 逐一修复每个问题\n3. 字数不足 → 补充内容\n4. 禁用词 → 替换\n5. 一致性错误 → 修正（参考追踪文件获取正确状态）\n6. 设定违反 → 修正（参考设定文件获取正确规则）\n7. 修复后重新运行字数验证：node $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js {chapter_file} --json\n\n【输出】\n- 更新：{project_dir}/正文/第{N}章.md（修复后）\n- 日志：{project_dir}/.workflow/step12-fix-log.json，格式：\n{\"fixed_count\": 5, \"fixed_items\": [...], \"final_word_count\": 3200}",
    "context": "none"
  }
})
```

```javascript
// Step 13: 复查 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "复查 - 第{N}章",
    "prompt": "你是 quality-rechecker，负责复查修复结果。最多3轮。\n\n【防偷懒铁律】不能假设修复成功，必须重新检测。\n\n【任务】重新运行 Step 11 的全部检测项，验证修复是否成功。\n\n【执行】\n1. 重新运行所有检测脚本\n2. 如仍有问题 → 回到 Step 12（上限3轮）\n3. 如全部通过 → 输出通过报告\n\n【输出】写入 {project_dir}/.workflow/step13-recheck-report.json，格式：\n{\"status\": \"pass|fail\", \"round\": 1, \"remaining_blockers\": [], \"remaining_warnings\": []}",
    "context": "none"
  }
})
```

### Step 14: general 类（收尾阶段）

```javascript
// Step 14: 追踪+设定更新（三步流程）
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "追踪+设定更新 - 第{N}章",
    "prompt": "你是单章写作流程的追踪更新器。\n\n【防偷懒铁律】必须从正文实际提取，不能凭记忆。\n\n【任务】按三步流程更新所有相关文件。\n\n【Step A：动态扫描项目结构】获取所有实际存在的配置文件\n- 使用 `glob` 工具扫描 {project_dir} 下所有 `.md` 文件\n- 识别配置文件类型：设定/、追踪/、故事线/、跨卷追踪/ 等目录下的文件\n- 输出完整文件清单（路径+文件名），不读内容\n\n【Step B：分析正文提取变更清单】从本章正文识别变化点\n- 新角色出现？→ 需要建档/更新设定/角色/{名}.md\n- 角色状态变化？→ 需要更新追踪/角色状态.md + 设定/角色/{名}.md\n- 新伏笔/回收伏笔？→ 需要更新追踪/伏笔.md + 跨卷追踪/跨卷伏笔.md（如有）\n- 新物品/物品变化？→ 需要更新追踪/物品.md\n- 环境变化？→ 需要更新追踪/环境.md\n- 经济活动？→ 需要更新追踪/物资.md\n- 故事线推进？→ 需要更新故事线/故事线_*.md\n- 角色弧线阶段变化？→ 需要更新跨卷追踪/跨卷角色弧线.md\n- 接近卷末？→ 需要检查跨卷追踪/卷间过渡.md\n\n【Step C：按清单更新文件】只更新变更涉及的文件\n- 始终更新：追踪/时间线.md（记录事件时序）、追踪/上下文.md（进度摘要）、追踪/重复语句.md（记录重复表达）\n- 按变更清单更新其余文件（对照 Step A 文件清单 + Step B 变更清单）\n- 设定文件回写：正文揭示新信息影响设定时，同步更新对应设定/文件\n- 跨卷追踪更新：涉及跨卷伏笔回收/推进或角色弧线变化时，更新跨卷追踪/下对应文件\n- 故事线更新：故事线推进时更新故事线/故事线_*.md\n\n【角色同步】更新完角色状态后，运行：\nnode $HOME/.config/mimocode/skills/_shared/scripts/character-sync.js {project_dir} --json\n\n【输出】更新后的文件列表",
    "context": "none"
  }
})
```

```javascript
// Step 14.5: 设定回写验证 [子 agent 隔离·explore]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "explore",
    "description": "设定回写验证 - 第{N}章",
    "prompt": "你是单章写作流程的设定回写验证器。\n\n【防偷懒铁律】必须实际扫描文件，不能凭记忆。\n\n【任务】验证 Step 14 的设定回写是否完整。\n\n【Step A：扫描本章正文中的角色】\n1. 读取 {project_dir}/正文/第{N}章.md\n2. 提取所有出现的角色名\n3. 去重并列出角色清单\n\n【Step B：检查每个角色的设定文件】\n对每个角色：\n1. 检查 {project_dir}/设定/角色/{角色名}.md 是否存在\n2. 如存在，检查是否包含本章新增的关键信息：\n   - 性格锚点是否更新\n   - 关键关系是否更新\n   - 能力/状态是否更新\n3. 检查 {project_dir}/追踪/角色状态.md 中该角色的状态是否已更新\n\n【Step C：输出验证报告】\n1. 列出所有本章出现的角色\n2. 标注每个角色的设定文件状态：\n   - ✅ 已更新：设定文件包含本章新增信息\n   - ⚠️ 需更新：设定文件存在但缺少本章新增信息\n   - ❌ 缺失：设定文件不存在\n3. 如有遗漏，列出需要回写的文件清单\n\n【输出】写入 {project_dir}/.workflow/step14.5-setting-verification.json，格式：\n{\"chapter\": {N}, \"characters_found\": [...], \"verification_results\": [...], \"missing_updates\": [...], \"status\": \"pass|warn\"}\n\n【关键规则】\n- 只要发现任何角色的设定文件需要更新，status 必须为 warn\n- 缺失的设定文件不阻断（可能是新角色未建档）\n- 但已有设定文件缺少本章新增信息时必须标记为 warn",
    "context": "none"
  }
})
```

---

## 各步骤说明

### Step 01: 目录健全检查
- **Agent**: 子 agent 隔离（explore）
- **检查**：正文/、追踪/、大纲/、设定/、5个追踪文件模板
- **输出**：`.workflow/step01-health-check.json`
- **防偷懒**：必须实际检查每个路径，缺失必须创建

### Step 02: 获取最新章节
- **Agent**: 子 agent 隔离（explore）
- **前置检查**：读取 `.workflow/step01-health-check.json`，如果 `status` 为 `fail`，停止并报告问题
- **检查**：扫描正文目录，找最大编号，统计字数
- **输出**：`.workflow/step02-chapter-info.json`
- **防偷懒**：必须扫描目录，不能从上下文推断

### Step 03: 检查细纲
- **Agent**: 子 agent 隔离（explore）
- **检查**：细纲文件是否存在，格式是否完整
- **输出**：`.workflow/step03-outline-check.json`
- **防偷懒**：存在时必须验证格式

### Step 04: 创建细纲 [条件：need_create=true]
- **Agent**: 子 agent 隔离（general）
- **输入**：大纲、卷纲、上下文、伏笔、角色状态
- **输出**：`大纲/细纲_{N}章.md`
- **防偷懒**：情节点 >= 10，必须有钩子和爽点

### Step 04.5: 对标文件处理 [条件：存在对标目录或拆文库目录]
- **Agent**: 子 agent 隔离（general）
- **检查**：是否存在 对标/ 或 拆文库/ 目录
- **职责**：
  - 读取 设定/题材定位.md 的「主对标书」字段
  - 确定对标书路径（优先 对标/{书名}/，回退 拆文库/{书名}/）
  - 读取对标文风.md，提取原文锚点片段
  - 读取拆文报告.md，提取可借鉴套路
  - 读取本章涉及角色的角色档案
- **输出**：`.workflow/step04-benchmark.json`
- **防偷懒**：必须实际读取文件，不能凭记忆

### Step 05: 文件分析
- **Agent**: 子 agent 隔离（general）
- **检查**：从细纲解析角色、场景、伏笔
- **输出**：`.workflow/step05-required-files.json`
- **必须包含的设定文件**（除角色外，全部加载）：
  - `设定/世界观/*.md` — 世界观、力量体系、金手指等
  - `设定/势力/*.md` — 势力设定
  - `设定/关系.md` — 角色关系
  - `设定/题材定位.md` — 题材核心梗
  - `设定/文风.md` — 文风设定
- **跨卷追踪文件**（如存在则必须列出）：
  - `跨卷追踪/跨卷伏笔.md` — 需要跨卷回收的伏笔
  - `跨卷追踪/跨卷角色弧线.md` — 角色全书成长路线
  - `跨卷追踪/卷间过渡.md` — 卷与卷衔接要点
- **故事线文件**（如存在则必须列出）：
  - `故事线/故事线_索引.md` — 所有故事线列表+状态
  - `故事线/故事线_主线_*.md` — 主线故事线
  - `故事线/故事线_交叉点.md` — 线与线交汇标记
- **防偷懒**：必须从细纲实际解析，不能硬编码；设定文件必须全部列出

### Step 06: 设定决策
- **Agent**: 子 agent 隔离（general）
- **检查**：与角色状态交叉比对，发现新元素
- **输出**：`.workflow/step06-new-settings.json`
- **防偷懒**：必须实际比对

### Step 07: 创建设定 [条件：need_new_settings=true]
- **Agent**: 子 agent 隔离（general）
- **输入**：新元素列表
- **输出**：设定文件
- **防偷懒**：必须完整，不能只有骨架

### Step 08: 读取上下文
- **Agent**: 子 agent 隔离（general）
- **检查**：读取 step05 列出的所有文件
- **强制加载的设定文件**（除角色外）：
  - `设定/世界观/*.md` — 世界观规则（如时代背景、社会规则、技术设定）
  - `设定/势力/*.md` — 势力设定（如组织结构、势力关系）
  - `设定/关系.md` — 角色关系网络
  - `设定/题材定位.md` — 题材核心梗、卖点
  - `设定/文风.md` — 文风约束
- **BLOCK 级必加载**（跨卷追踪+故事线，如存在）：
  - `跨卷追踪/跨卷伏笔.md` — 跨卷伏笔状态
  - `跨卷追踪/跨卷角色弧线.md` — 角色弧线进展
  - `跨卷追踪/卷间过渡.md` — 卷间衔接要点
  - `故事线/故事线_索引.md` — 故事线总览
  - `故事线/故事线_主线_*.md` — 当前相关主线
  - `故事线/故事线_交叉点.md` — 交叉点标记
- **对标上下文**（如存在）：
  - 读取 `.workflow/step04-benchmark.json`（如存在）
  - 输出到 step08-context.json 的 `benchmark` 字段
- **输出**：`.workflow/step08-context.json`
- **防偷懒**：上一章结尾必须是最后500字原文；设定文件必须全部读取，不能跳过；跨卷追踪和故事线文件存在时必须加载

### Step 09: 生成约束
- **Agent**: 子 agent 隔离（general）
- **检查**：加载禁用词、文风规则、字数限制
- **对标约束**（如 benchmark 存在）：
  - 原文锚点片段 → 作为 few-shot 示范
  - 可借鉴套路 → 设计剧情时参考
  - 写法技巧 → 写作时参考
- **输出**：`.workflow/step09-constraints.json`
- **防偷懒**：禁用词必须从文件加载，字数限制必须明确

### Step 10: 正文写作
- **Agent**: 子 agent 隔离（general）
- **职责**：只写作，不检查质量
- **输入**：细纲、上下文、约束
- **输出**：`正文/第{N}章.md`
- **防偷懒**：必须包含所有场景，必须写入文件

### Step 11: 综合质量检测
- **Agent**: 子 agent 隔离（general）
- **检测项**：
  - 字数达标（BLOCK）
  - 禁用词+AI腔（BLOCK）
  - AI标点符号（BLOCK）
  - 一致性（BLOCK）
  - **设定校验（BLOCK）** — 世界观、金手指、文风、题材、关系
  - 章内逻辑性（WARN）
  - 跨章节检查（WARN）
  - 跨卷一致性（WARN）
- **跨卷一致性校验内容**：
  - 跨卷伏笔是否逾期（已到应回收节点但未回收）
  - 角色弧线是否连贯（本章行为是否符合弧线阶段）
  - 故事线是否断裂（主线/副线推进是否连续）
- **设定校验内容**：
  - 世界观规则是否遵守（如时代背景、社会规则、技术设定）
  - 金手指规则是否正确（如系统机制、能力限制）
  - 文风是否符合设定（如语言风格、叙事视角）
  - 题材核心梗是否体现（如爽点模式、情绪目标）
  - 角色关系是否符合设定（如亲疏、敌友、势力归属）
- **输出**：`.workflow/step11-quality-report.json`
- **关键规则**：只要有任何 WARN 或 BLOCK，必须进入修复流程

### Step 12: 综合修复 [条件：有任何问题]
- **Agent**: 子 agent 隔离（general）
- **职责**：修复所有问题（字数扩充+禁用词替换+逻辑修正）
- **输入**：检测报告、正文、约束
- **输出**：修复后正文 + `.workflow/step12-fix-log.json`
- **防偷懒**：每个问题必须修复，不能跳过 WARN

### Step 13: 复查 [条件：执行了修复]
- **Agent**: 子 agent 隔离（general）
- **职责**：重新运行完整检测
- **输出**：`.workflow/step13-recheck-report.json`
- **防偷懒**：不能假设修复成功，最多3轮

### Step 13.5: 百分制评分（条件创建）
**触发条件**：质量门禁和一致性检查**无阻断且无警告**后创建

**⚠️ 重要：warn 也必须处理！**
- quality-gate.js 返回 warn（exit code 1）时，必须创建 FIX 任务处理警告
- 处理完后重新运行 quality-gate.js 复查
- 复查通过（exit code 0）后才能进入评分
- **不可跳过 warn 直接执行评分**

**执行方式**：子agent隔离执行

**prompt**：
你是章节评分评审 agent。

## 任务
对刚通过质量门禁的章节进行百分制评分。

## 执行步骤
1. 运行评分脚本生成评审任务：
   node skills/_shared/scripts/writing-scorer.js --json <章节文件> <项目目录> --genre <题材>
2. 读取输出中的 prompt 字段
3. 作为评审 agent，按照 prompt 中的15维度标准对章节打分
4. 将评分结果写入追踪/评分记录.md
5. 返回 JSON 格式结果：{"score": XX, "pass": true/false, "weak_dims": [...], "suggestions": [...]}

## 评分标准
详见 skills/_shared/references/writing-score-rubric.md

**判定规则**：
score >= 90 → 通过
score < 90 → 创建 Step 13.6 修复任务

### Step 13.6: 评分修复（条件创建）
**触发条件**：评分 < 90

**执行方式**：子agent隔离执行

**prompt**：
你是章节评分修复 agent。
针对评分不达标的维度进行定向修复。
- 仅修改低分维度涉及的内容
- 修复时参考 writing-score-rubric.md 对应维度标准
- 修复后不得破坏其他维度的得分

**后续流程**：
修复后重新评分 → 仍 < 90 则再修复（上限3轮） → 3轮后仍不达标则阻断

### Step 14: 追踪+设定更新（三步流程）
- **Agent**: 子 agent 隔离（general）
- **检查**：从正文提取信息，按三步流程更新所有相关文件
- **Step A**：扫描项目结构，获取文件清单
- **Step B**：分析正文，提取变更清单
- **Step C**：按清单更新文件（**必须实际执行编辑，不可只列出**）
  - **必须用 Edit/Write 工具实际修改文件**
  - 追踪文件（按需）：伏笔、时间线、角色状态、物品、环境、重复语句、上下文
  - **设定文件回写（必须执行）**：正文揭示新信息时，必须用 Edit 工具更新设定/角色/*.md、设定/世界观.md 等
  - 跨卷追踪（按需）：跨卷伏笔、跨卷角色弧线、卷间过渡
  - 故事线文件（按需）：故事线索引、主线、交叉点
  - **角色同步**：运行 `node $HOME/.config/mimocode/skills/_shared/scripts/character-sync.js <项目目录> --json` 验证设定与追踪一致
- **防偷懒**：Step B 列出的每个变更项，Step C 必须实际执行编辑操作；遗漏未更新的文件会被 Step 14.5 验证捕获

### Step 14.5: 设定回写验证
- **Agent**: 子 agent 隔离（explore）
- **职责**：验证 Step 14 的设定回写是否完整
- **Step A**：扫描本章正文中的所有角色名
- **Step B**：检查每个角色的设定文件是否包含本章新增的关键信息
- **Step C**：输出验证报告，标注哪些角色的设定文件需要更新
- **输出**：`.workflow/step14.5-setting-verification.json`
- **防偷懒**：必须实际扫描文件，不能凭记忆；遗漏的设定文件必须标记为 warn

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| Step 04 | step03.need_create=true | abandoned |
| Step 04.5 | 存在 对标/ 或 拆文库/ 目录 | abandoned |
| Step 07 | step06.need_new_settings=true | abandoned |
| Step 12 | step11有任何WARN或BLOCK | abandoned |
| Step 13 | step12存在 | abandoned |
| Step 13.5 | Step 11无阻断且无警告（或Step 13复查通过） | abandoned |
| Step 13.6 | score < 90 | abandoned |
| Step 14.5 | step14完成 | abandoned |

---

## 修复循环

```
Step 11 检测到 ANY 问题（WARN 或 BLOCK）
  ↓
Step 12 综合修复（所有问题）
  ↓
Step 13 复查
  ↓
仍有问题 → 再回 Step 12（上限3轮）
  ↓
全部通过（无阻断且无警告）→ Step 13.5 百分制评分
  ↓
score >= 90 → Step 14 追踪+设定更新
score < 90 → Step 13.6 修复低分维度 → 重新评分（上限3轮）
  ↓
Step 14.5 设定回写验证
```

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── step01-health-check.json
├── step02-chapter-info.json
├── step03-outline-check.json
├── step04-benchmark.json           # 对标文件处理（条件）
├── step05-required-files.json
├── step06-new-settings.json
├── step08-context.json
├── step09-constraints.json
├── step11-quality-report.json    # 综合检测报告
├── step12-fix-log.json           # 修复日志
├── step13-recheck-report.json    # 复查报告
└── step14.5-setting-verification.json  # 设定回写验证
```

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/anti-lazy-checklist.md` | 防偷懒速查，每个Agent必读 |
| `references/agent-contracts.md` | Agent详细契约，按需读取 |
| `references/logic-check-rules.md` | 章内逻辑性检查规则 |
| `references/quality-detection-spec.md` | 综合质量检测规范 |
| `_shared/scripts/quality-gate.js` | 质量门禁脚本 |
