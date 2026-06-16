---
name: audit-mimo
version: 1.0.0
description: |
  全量项目审计。检查整个项目的所有章节和追踪文件，发现跨章节矛盾。
  触发方式：/audit-mimo、/全量检查、「审计项目」「检查整个项目」
---

# audit-mimo：全量项目审计

你是项目审计专家。对整个写作项目进行全面检查，发现跨章节矛盾和追踪文件问题。

---

## 触发条件

| 用户说 | 动作 |
|--------|------|
| /audit-mimo | 审计当前项目 |
| /audit-mimo <项目目录> | 审计指定项目 |
| 审计项目 | 同 /audit-mimo |
| 检查整个项目 | 同 /audit-mimo |

---

## 执行流程

### Step 1：确定项目目录

- 如果在写作项目中 → 使用当前目录
- 如果指定了路径 → 使用指定路径

### Step 2：运行全量审计

```bash
node skills/_shared/scripts/full-consistency-audit.js <项目目录>
```

### Step 3：输出审计报告

```
🔍 全量项目审计报告

📊 项目信息：
- 项目：{项目名}
- 章节数：{X}章
- 追踪文件：{X}个

📋 检查结果：
- 追踪文件：✅ 完整
- 章节一致性：⚠️ 2处问题
- 跨章节矛盾：✅ 无

📝 问题详情：
1. 第5章与第8章：白瓷片位置不一致
2. 第12章：薛嫂怀孕时间与第19章矛盾

💡 建议：
- 修正第5章白瓷片位置描述
- 统一薛嫂怀孕时间线
```

---

## 检查内容

### 追踪文件完整性
- 伏笔.md 是否存在且有内容
- 时间线.md 是否存在且有内容
- 角色状态.md 是否存在且有内容
- 物品.md 是否存在且有内容
- 环境.md 是否存在且有内容
- 上下文.md 是否存在且有内容

### 章节一致性
- 物品位置是否前后一致
- 角色状态是否前后一致
- 环境描述是否前后一致
- 身份设定是否前后一致

### 跨章节矛盾
- 时间线是否合理
- 伏笔是否遗漏
- 角色行为是否符合人设

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：读取下方固定任务列表，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取下方「固定任务列表」
2. 严格按照列表逐条创建任务
3. 逐个执行

#### 固定任务列表（全量审计时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-AUDIT: 全量审计「{项目名}」"                    → T-AUDIT

# ===== 第2层：3个审计维度+修正+报告 =====
2. task create "T-AUDIT-TRACK: 追踪文件完整性检查"    parent=T-AUDIT → T-AUDIT-TRACK
3. task create "T-AUDIT-CONSIST: 跨章节一致性检查"    parent=T-AUDIT → T-AUDIT-CONSIST
4. task create "T-AUDIT-CONTRA: 跨章节矛盾检测"      parent=T-AUDIT → T-AUDIT-CONTRA
5. task create "T-AUDIT-FIX: 修正（条件创建）"        parent=T-AUDIT → T-AUDIT-FIX
6. task create "T-AUDIT-REPORT: 输出审计报告"         parent=T-AUDIT → T-AUDIT-REPORT

# ===== 第3层-追踪完整性：6项 =====
7.  task create "T-AUDIT-TRACK-01: 检查伏笔.md 存在且有内容"       parent=T-AUDIT-TRACK
8.  task create "T-AUDIT-TRACK-02: 检查时间线.md 存在且有内容"     parent=T-AUDIT-TRACK
9.  task create "T-AUDIT-TRACK-03: 检查角色状态.md 存在且有内容"   parent=T-AUDIT-TRACK
10. task create "T-AUDIT-TRACK-04: 检查物品.md 存在且有内容"       parent=T-AUDIT-TRACK
11. task create "T-AUDIT-TRACK-05: 检查环境.md 存在且有内容"       parent=T-AUDIT-TRACK
12. task create "T-AUDIT-TRACK-06: 检查上下文.md 存在且有内容"     parent=T-AUDIT-TRACK

# ===== 第3层-一致性检查：4项 =====
13. task create "T-AUDIT-CONSIST-01: 物品位置是否前后一致"          parent=T-AUDIT-CONSIST
14. task create "T-AUDIT-CONSIST-02: 角色状态是否前后一致"          parent=T-AUDIT-CONSIST
15. task create "T-AUDIT-CONSIST-03: 环境描述是否前后一致"          parent=T-AUDIT-CONSIST
16. task create "T-AUDIT-CONSIST-04: 身份设定是否前后一致"          parent=T-AUDIT-CONSIST

# ===== 第3层-矛盾检测：3项 =====
17. task create "T-AUDIT-CONTRA-01: 时间线是否合理"                 parent=T-AUDIT-CONTRA
18. task create "T-AUDIT-CONTRA-02: 伏笔是否遗漏"                  parent=T-AUDIT-CONTRA
19. task create "T-AUDIT-CONTRA-03: 角色行为是否符合人设"           parent=T-AUDIT-CONTRA

# ===== 第3层-报告：3项 =====
20. task create "T-AUDIT-REPORT-01: 项目信息（章节数、追踪文件数）" parent=T-AUDIT-REPORT
21. task create "T-AUDIT-REPORT-02: 问题详情（按严重度排序）"       parent=T-AUDIT-REPORT
22. task create "T-AUDIT-REPORT-03: 修复建议"                       parent=T-AUDIT-REPORT
```

### 条件创建规则

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-AUDIT-FIX | 发现BLOCK级问题时start | 无问题则abandoned |

---

## 与其他skill的关系

| 关系 | 说明 |
|------|------|
| 调用 | `full-consistency-audit.js`（审计脚本） |
| 被调用 | 用户主动触发 |
| 被调用 | 写作流程中定期执行 |

---

## 使用场景

| 场景 | 说明 |
|------|------|
| 写完一批章节后 | 检查新写的章节是否与之前矛盾 |
| 准备发布前 | 全面检查项目质量 |
| 发现问题时 | 定位矛盾来源 |
| 定期维护 | 每月审计一次，保持项目健康 |
