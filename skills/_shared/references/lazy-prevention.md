# 防偷懒铁律（统一引用）

> 所有 skill 的防偷懒规则从此文件加载，不再各自定义。

---

## 标准铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

---

## 守则

1. **必须用 Read 工具读取文件**，不能从记忆推断内容
2. **必须用 Write/Edit 工具写入文件**，不能只在对话中输出
3. **必须实际运行脚本**，不能假设结果
4. **必须给用户看输出**，不能静默完成
5. **不能跳过步骤**，每个步骤必须实际执行
6. **不能凭记忆写**，每次都要读取最新文件

---

## 守卫脚本调用规范

### 标准调用格式

```bash
# 前置验证（检查输入文件是否存在）
node {skill_dir}/scripts/{guard-script}.js pre  {step} {workflow_dir} {project_dir}

# 后置验证（检查输出文件是否有效）
node {skill_dir}/scripts/{guard-script}.js post {step} {workflow_dir}
```

### 脚本映射

| Skill | 守卫脚本 |
|-------|---------|
| story-write-mimo | `workflow-guard.js` |
| story-chapter-write-mimo | `step-guard.js` |
| story-short-write-mimo | `step-guard.js` |
| story-outline-mimo | `workflow-guard.js` |
| story-progress-mimo | `workflow-guard.js` |
| story-review-mimo | `step-guard.js` |
| story-deslop-mimo | 引用 `story-write-mimo/scripts/workflow-guard.js` |
| quality-mimo | `step-guard.js` |
| audit-mimo | `audit-guard.js` |
| story-long-analyze-mimo | `workflow-guard.js` |
| story-short-analyze-mimo | `workflow-guard.js` |

---

## 子 Agent 调用规范

### 标准格式

```javascript
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",  // 或 "explore"
    "description": "简短描述",
    "prompt": "详细指令...",
    "context": "none"  // 隔离上下文
  }
})
```

### 防偷懒 prompt 注入

所有子 agent 的 prompt 必须包含：
```
【防偷懒铁律】
- 读文件，写文件，跑脚本，给用户看
- 不凭记忆，不跳步骤，不偷懒
- 所有输出必须写入 .workflow/ 目录
- 项目目录：{project_dir}
```

---

## 引用方式

在 SKILL.md 中引用此文件：
```
防偷懒规则详见 `_shared/references/lazy-prevention.md`。
```
