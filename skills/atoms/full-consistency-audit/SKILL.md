---
name: full-consistency-audit
version: 2.0.0
description: 全量一致性审计，覆盖所有追踪维度
category: detect
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: project_dir
    type: directory
    required: false
    description: 写作项目根目录
    default_source: "."
outputs:
  - name: report
    type: report
    format: markdown
severity: BLOCK
script: _shared/scripts/full-consistency-audit.js
triggers:
  - /atom:full-consistency-audit
  - 全量一致性审计
---

# full-consistency-audit

## 功能
对整个项目执行全量一致性审计，覆盖角色、物品、环境、时间线、伏笔五大维度。

## 双模执行
- **独立模式**：输入为空时，审计当前项目目录
- **编排器模式**：输入不为空时，以传入的 {project_dir} 为准

## 执行步骤
1. 读取 {project_dir} 下所有正文和追踪文件
2. 运行：`node _shared/scripts/full-consistency-audit.js {project_dir}`
3. 输出全量审计报告

## 输出格式
### 全量一致性审计报告
- 角色一致性：N 处问题
- 物品一致性：N 处问题
- 环境一致性：N 处问题
- 时间线一致性：N 处问题
- 伏笔一致性：N 处问题

| 维度 | 类型 | 详情 | 位置 | 严重度 |
|------|------|------|------|--------|
