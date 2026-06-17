---
name: pre-write-checklist
version: 2.0.0
description: 写前检查清单，验证写作前置条件是否就绪
category: pre-write
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: project_dir
    type: directory
    required: false
    description: 写作项目目录
    default_source: "."
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

## 双模执行
- **独立模式**：输入为空时，检查当前项目目录
- **编排器模式**：输入不为空时，以传入的 {project_dir} 为准

## 执行步骤
1. 运行：`node _shared/scripts/detect-story-gaps.js {project_dir}`
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
