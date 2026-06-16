---
name: full-consistency-audit
version: 1.0.0
description: 全量一致性审计，覆盖所有追踪维度
category: detect
inputs:
  - name: project_dir
    type: dir_path
    required: true
    description: 写作项目根目录
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

## 执行步骤
1. 读取 {project_dir} 下所有正文和追踪文件
2. 运行：`node skills/_shared/scripts/full-consistency-audit.js {project_dir}`
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
