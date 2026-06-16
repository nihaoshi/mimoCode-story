---
name: detect-story-gaps
version: 1.0.0
description: 检测世界观和设定中的缺口
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
severity: WARN
script: _shared/scripts/detect-story-gaps.js
triggers:
  - /atom:detect-story-gaps
  - 检测设定缺口
---

# detect-story-gaps

## 功能
扫描项目设定文件，检测世界观、力量体系、地理设定中的未定义引用和逻辑缺口。

## 执行步骤
1. 读取 {project_dir} 下的设定文件和正文
2. 运行：`node skills/_shared/scripts/detect-story-gaps.js {project_dir}`
3. 输出设定缺口列表

## 输出格式
### 设定缺口报告
- 未定义引用：N 处
- 逻辑矛盾：N 处
- 模糊设定：N 处

| 类型 | 引用内容 | 出现位置 | 建议 |
|------|----------|----------|------|
