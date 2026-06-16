---
name: pre-write-checklist
version: 1.0.0
description: 写前检查清单，验证写作前置条件是否就绪
category: pre-write
inputs:
  - name: project_dir
    type: dir_path
    required: true
    description: 写作项目目录
outputs:
  - name: checklist_report
    type: report
    format: markdown
script: _shared/scripts/detect-story-gaps.js
triggers:
  - /atom:pre-write-checklist
  - 写前检查清单
---

# pre-write-checklist

## 功能
验证细纲、上一章正文、角色状态、伏笔表、文风参考是否就绪。

## 执行步骤
1. 运行：`node skills/_shared/scripts/detect-story-gaps.js {project_dir}`
2. 检查以下项目是否存在且非空：
   - 细纲文件（大纲/细纲/当前章节点）
   - 上一章正文
   - 追踪/角色状态.md
   - 追踪/伏笔.md
   - 题材定位.md 或文风参考
3. 输出检查报告

## 输出格式
### 写前检查报告
| 检查项 | 状态 | 说明 |
|--------|------|------|
| 细纲 | ✅/❌ | |
| 上一章 | ✅/❌ | |
| 角色状态 | ✅/❌ | |
| 伏笔表 | ✅/❌ | |
| 文风参考 | ✅/❌ | |
- 结论：就绪 / 缺失N项
