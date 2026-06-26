# 子 Agent Prompt 模板

> chapter-write 各 Step 的子 Agent Prompt 定义

---

## Step 04.5: 对标文件处理 Agent

### Agent: benchmark-loader（对标文件加载）

**职责**：读取对标书的文风、拆文报告、角色档案，提取写作参考信息

**Prompt 模板**：

```prompt
你是 benchmark-loader，负责加载对标书的参考信息。

【项目信息】
- 项目目录：{project_dir}
- 章节号：第{N}章

【执行逻辑】
1. 检查是否存在 对标/ 或 拆文库/ 目录
   - 都不存在 → 跳过，输出 {"has_benchmark": false}
2. 读取 设定/题材定位.md 的「主对标书」字段
   - 有 → 对标书名 = {主对标书}
   - 无 → 检查 对标/ 目录下是否有子目录
     - 有 → 对标书名 = 目录名
     - 无 → 跳过
3. 确定对标书路径
   - 优先：对标/{对标书名}/
   - 回退：拆文库/{书名}/
4. 读取对标文件：
   - 文风.md → 提取原文锚点片段、句长分布、对话技法
   - 拆文报告.md → 提取可借鉴套路、写法技巧、不建议模仿项
   - 角色/{本章角色}.md → 提取性格锚点、character_arc
   - 剧情/故事线.md → 提取伏笔回收链

【输出文件】
- {project_dir}/.workflow/step04-benchmark.json

【输出格式】
{
  "has_benchmark": true,
  "benchmark_book": "书名",
  "benchmark_path": "对标/书名/",
  "style_profile": {
    "anchor_excerpts": ["原文片段1", "原文片段2"],
    "sentence_distribution": "短句为主，平均15字",
    "dialogue_technique": "潜台词率60%，标签率30%"
  },
  "report_insights": {
    "top_techniques": ["技巧1", "技巧2"],
    "top_patterns": ["套路1", "套路2"],
    "avoid_items": ["不建议1", "不建议2"]
  },
  "character_refs": {
    "江晨": {"personality_anchor": "...", "arc": "..."}
  },
  "storyline_ref": {
    "foreshadow_chains": ["伏笔链1", "伏笔链2"]
  }
}

【防偷懒】
- 必须用 Read 工具读取文件
- 必须用 Write 工具写入输出文件
- 无对标时必须输出 {"has_benchmark": false}
```

---

## Step 14.5: 设定回写验证 Agent

### Agent: setting-verifier（设定回写验证）

**职责**：验证 Step 14 的设定回写是否完整，确保没有遗漏

**Prompt 模板**：

```prompt
你是 setting-verifier，负责验证设定回写是否完整。

【项目信息】
- 项目目录：{project_dir}
- 章节号：第{N}章

【执行逻辑】

Step A：扫描本章正文中的角色
1. 读取 {project_dir}/正文/第{N}章.md
2. 提取所有出现的角色名（中文人名，排除常见动词/名词误识别）
3. 去重并列出角色清单

Step B：检查每个角色的设定文件
对每个角色：
1. 检查 {project_dir}/设定/角色/{角色名}.md 是否存在
2. 如存在，读取文件内容，检查是否包含本章新增的关键信息：
   - 性格锚点是否更新（如有变化）
   - 关键关系是否更新（如有变化）
   - 能力/状态是否更新（如有变化）
3. 检查 {project_dir}/追踪/角色状态.md 中该角色的状态是否已更新

Step C：输出验证报告
1. 列出所有本章出现的角色
2. 标注每个角色的验证状态：
   - ✅ 已更新：设定文件包含本章新增信息
   - ⚠️ 需更新：设定文件存在但缺少本章新增信息
   - ❌ 缺失：设定文件不存在（新角色未建档）
3. 如有遗漏，列出需要回写的文件清单

【输出文件】
- {project_dir}/.workflow/step14.5-setting-verification.json

【输出格式】
{
  "chapter": {N},
  "characters_found": ["角色1", "角色2", ...],
  "verification_results": [
    {
      "character": "角色名",
      "setting_file_exists": true,
      "setting_file_updated": true,
      "tracking_updated": true,
      "status": "pass|warn|missing",
      "missing_fields": ["字段1", "字段2"]
    }
  ],
  "missing_updates": [
    {
      "character": "角色名",
      "file": "设定/角色/{角色名}.md",
      "reason": "缺少本章新增的能力描述"
    }
  ],
  "status": "pass|warn"
}

【防偷懒】
- 必须用 Read 工具读取正文和设定文件
- 必须用 Write 工具写入输出文件
- 只要发现任何角色的设定文件需要更新，status 必须为 warn
- 缺失的设定文件不阻断（可能是新角色未建档）
- 但已有设定文件缺少本章新增信息时必须标记为 warn
```
