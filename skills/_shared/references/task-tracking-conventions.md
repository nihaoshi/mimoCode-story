# Task 跟踪规范

> 所有编排 skill 必须遵循此规范，将工作流步骤映射为 task 系统任务。

---

## 核心原则

1. **先建任务骨架，再逐个执行** — skill 触发时第一步是创建完整任务树
2. **不跳步** — 每个任务必须 `done` 后才能进入下一个
3. **条件创建** — 循环/分支步骤只在条件满足时创建，不预建空壳
4. **完成标准明确** — 每个任务的 `done` 条件写在 summary 中

---

## 任务命名规范

```
T-{SKILL}-{PHASE}-{STEP}: {描述}
```

| 字段 | 说明 | 示例 |
|------|------|------|
| SKILL | skill 缩写 | WRITE、DESLOP、REVIEW、QUALITY、AUDIT |
| PHASE | 阶段编号 | 1、2、3、4、5 |
| STEP | 步骤编号 | 01、02、03 |

**子任务**用 `.` 分隔：`T-WRITE-4-01.1`

---

## 任务状态流转

```
open → in_progress → done
                  ↘ blocked → open（障碍解除后）
                  ↘ abandoned（跳过/不适用）
```

**规则**：
- 每次只能有一个 `in_progress` 任务（同一层级）
- `done` 后不可回退
- `abandoned` 必须带 `event_summary` 说明原因

---

## 条件创建规则

### 字数循环

```
T-COUNT-{N}: 字数验证
├── T-COUNT-{N}-01: Python字符统计
├── T-COUNT-{N}-02: 判断是否达标
└── [条件] T-COUNT-{N}-FIX: 补写（<90%时创建）
    ├── 回细纲补充子事件
    ├── 三维度织入补写
    └── 回到 T-COUNT-{N}-02 重新判断
```

### 质量门禁循环

```
T-GATE-{N}: 质量门禁
├── T-GATE-{N}-BAN: detect-banned-words
├── T-GATE-{N}-AI: detect-ai-sentence
├── T-GATE-{N}-CON: detect-consistency
├── T-GATE-{N}-FORESH: detect-foreshadow
├── [条件] T-GATE-{N}-FIX: 修正（任一BLOCK时创建）
│   ├── T-GATE-{N}-FIX-BAN: fix-banned-words
│   ├── T-GATE-{N}-FIX-AI: fix-ai-sentence
│   └── ...（只创建需要的fix）
└── [条件] T-GATE-{N}-RECHECK: 复查（FIX完成后创建）
    ├── 重新 detect-banned-words
    └── 重新 detect-ai-sentence
```

**循环终止条件**：同一检测连续 2 轮无新改动 → 停止，最多 3 轮。

### 追踪同步循环

```
Phase 5修正正文后 → 重新创建受影响的 T-TRACK-{N}-* 任务
```

---

## 缺失处理规则

| 严重度 | 处理 | 任务行为 |
|--------|------|---------|
| 🚫 BLOCK | 必须补建 | `block` 当前任务，创建补建子任务 |
| ⚠️ WARN | 问用户 | `block` 当前任务，等用户决策 |
| ℹ️ 可选 | 直接跳过 | `abandoned` + "缺失跳过" |

---

## Skill 集成模板

每个 skill 的 SKILL.md 在 `## Task 跟踪集成` 章节引用此规范，并定义：

1. **任务树模板** — 该 skill 触发时创建的任务列表
2. **条件创建规则** — 哪些任务是条件创建的
3. **循环处理** — 该 skill 特有的循环场景
4. **完成标准** — 每个关键任务的 done 条件

---

## 跨会话恢复

新会话开始时：
1. 读取 `追踪/上下文.md` 获取进度
2. 检查是否有 `in_progress` 的任务（从 memory 中恢复）
3. 从断点继续，不重复已完成的步骤

---

## 注意事项

- 任务树是**运行时骨架**，不是文档副本
- 每个任务对应一个**可验证的动作**，不是描述
- 子智能体 spawn 的任务挂在对应父任务下
- 任务完成后更新 `追踪/上下文.md` 的进度摘要
