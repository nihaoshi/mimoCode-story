# 防偷懒速查清单

> 每个 Agent 执行前**必须读取**此文件，执行后对照检查

---

## 铁律（不可违反）

1. **必须读文件** — 禁止凭记忆或假设，必须用 Read 工具实际读取
2. **必须写文件** — 输出必须写入 `.workflow/` 目录，不能只在对话中输出
3. **必须验证** — 每步完成后运行守卫脚本验证
4. **必须展示** — 每步结果必须展示给用户
5. **有问题必修** — 检测到任何 WARN 或 BLOCK 都必须修复

---

## 各步骤防偷懒要点

### Step 01: 目录检查
- ❌ 偷懒：假设目录存在
- ✅ 正确：用 `ls` 或 `Test-Path` 实际检查每个路径
- 🔍 验证：`step01-health-check.json` 中 checked 数组必须有 9 项

### Step 02: 章节信息
- ❌ 偷懒：从上下文.md 推断章节号
- ✅ 正确：扫描正文目录，找最大编号文件
- 🔍 验证：`step02-chapter-info.json` 中 next_chapter = last_chapter + 1

### Step 03: 细纲检查
- ❌ 偷懒：假设不存在就创建
- ✅ 正确：实际检查文件存在性，存在时验证格式
- 🔍 验证：`step03-outline-check.json` 中 need_create 逻辑正确

### Step 04: 创建细纲 [条件]
- ❌ 偷懒：情节点少于 10 个
- ✅ 正确：每个场景必须有时间、地点、人物、事件、情绪、钩子
- 🔍 验证：细纲文件存在且格式完整

### Step 05: 文件分析
- ❌ 偷懒：硬编码文件列表
- ✅ 正确：从细纲实际解析角色、场景、伏笔
- 🔍 验证：`step05-required-files.json` 中 characters 从细纲提取

### Step 06: 设定决策
- ❌ 偷懒：跳过比对
- ✅ 正确：与角色状态文件交叉比对
- 🔍 验证：`step06-new-settings.json` 中 need_new_settings 逻辑正确

### Step 07: 创建设定 [条件]
- ❌ 偷懒：只创建骨架
- ✅ 正确：必须包含完整信息（性格、动机、关系等）
- 🔍 验证：设定文件存在且内容完整

### Step 08: 读取上下文
- ❌ 偷懒：用摘要代替原文
- ✅ 正确：上一章结尾必须是最后 500 字原文
- 🔍 验证：`step08-context.json` 中 previous_chapter_ending 长度 >= 100

### Step 09: 约束生成
- ❌ 偷懒：硬编码禁用词
- ✅ 正确：从实际文件加载禁用词，字数限制必须明确
- 🔍 验证：`step09-constraints.json` 中 banned_words_l1 有 31 个，word_count_target 存在

### Step 10: 正文写作
- ❌ 偷懒：检查质量、运行脚本
- ✅ 正确：只写作，不检查，写入文件
- 🔍 验证：正文文件存在，包含所有场景

### Step 11: 综合质量检测
- ❌ 偷懒：跳过某些检测项、忽略 WARN
- ✅ 正确：运行全部 5 项检测，记录所有问题
- 🔍 验证：`step11-quality-report.json` 中 checks 数组有 5 项

### Step 12: 综合修复 [条件]
- ❌ 偷懒：只修 BLOCK 忽略 WARN
- ✅ 正确：修复所有问题（BLOCK 和 WARN 都要修）
- 🔍 验证：`step12-fix-log.json` 中所有问题都有修复记录

### Step 13: 复查 [条件]
- ❌ 偷懒：假设修复成功
- ✅ 正确：重新运行完整检测
- 🔍 验证：`step13-recheck-report.json` 中 total_issues = 0

### Step 14: 追踪更新
- ❌ 偷懒：凭记忆更新
- ✅ 正确：从正文实际提取信息
- 🔍 验证：7 个追踪文件都已更新

---

## 快速检查口诀

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
有问题必修，WARN 也要修
```

---

## 验证命令

```bash
# 验证某步骤输出
node {skill_dir}/scripts/step-guard.js post <步骤号> {workflow_dir}

# 示例
node skills/story-chapter-write-mimo/scripts/step-guard.js post 11 demo/项目/.workflow
```
