---
name: story-chapter-fast-write-mimo
version: 2.0.0
description: |
  章节快速书写（已合并到 story-write-mimo）。
  本skill已重构为转发入口，所有写作功能统一由 story-write-mimo 提供。
  触发方式：/story-chapter-fast-write-mimo、/快速写章、「快速写第X章」
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

# story-chapter-fast-write-mimo → story-write-mimo

> **注意**：本skill已重构为转发入口。所有写作功能统一由 `story-write-mimo` 提供。

---

## 转发规则

当用户触发本skill时，自动转发到 `story-write-mimo`：

```
/story-chapter-fast-write-mimo [参数]
↓ 转发为
/story-write-mimo fast [参数]
```

### 参数映射

| 原参数 | 新参数 | 说明 |
|--------|--------|------|
| 无参数 | fast模式 | 默认快速模式 |
| chapter_number | 写第X章 | 指定章节 |

---

## 转发执行

```javascript
// 主agent执行转发
actor({
  operation: {
    action: "run",
    subagent_type: "general",
    description: "转发到story-write-mimo",
    prompt: `
      用户触发了 story-chapter-fast-write-mimo，需要转发到 story-write-mimo。

      用户输入：{用户原始输入}

      请执行 story-write-mimo skill，使用 fast 模式。
      如果指定了章节号，写指定章节。
      如果没有指定章节号，自动检测下一章并续写。

      参考文件：skills/story-write-mimo/SKILL.md
    `,
    context: "none"
  }
})
```

---

## 保持向后兼容

本skill保留原有的触发词和描述，确保：
1. 用户原有的使用习惯不受影响
2. 原有的触发词仍然有效
3. 新用户可以使用新的统一入口

---

## 相关skill

- `story-write-mimo` — 统一写作入口（新）
- `story-long-write-mimo` — 已转发
- `story-chapter-write-mimo` — 已转发
- `story-chapter-ultra-write-mimo` — 已转发
