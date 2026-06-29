# Agent 契约

> 每个 Agent 的职责边界和通信协议。

---

## 通用契约

所有 Agent 必须：
1. 读取输入文件（通过 `read` 工具）
2. 执行任务
3. 写入输出文件（通过 `write` 或 `edit` 工具）
4. 输出明确的状态标识（pass/fail/warn）

---

## Agent 间通信协议

所有中间结果存放在 `.workflow/` 目录，格式为 JSON。

### 命名规范

```
step{编号}-{描述}.json
```

### 必填字段

每个 JSON 文件必须包含：
- `chapter`: 章节号
- `status`: pass/fail/warn
- `details`: 详细信息数组

### 示例

```json
{
  "chapter": 5,
  "status": "pass",
  "details": {
    "files_loaded": ["设定/世界观/背景设定.md", "追踪/角色状态.md"],
    "issues": []
  }
}
```
