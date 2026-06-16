---
name: design-worldbuilding
version: 1.0.0
description: 设计世界观、力量体系和势力
category: write
inputs:
  - name: genre_file
    type: file_path
    required: true
    description: 题材定位文件路径
outputs:
  - name: world_files
    type: directory
    format: markdown
triggers:
  - /atom:design-worldbuilding
  - 世界观设计
references:
  - _shared/references/worldbuilding-intro.md
---

# design-worldbuilding

## 功能
根据题材定位设计完整世界观，包括世界基础、力量体系和势力分布。

## 执行步骤
1. 读取 {genre_file} 题材定位
2. 参考 worldbuilding-intro.md 设计模板
3. 设计世界基础：地理、历史、文明等级
4. 设计力量体系：等级划分、升级路径、核心限制
5. 设计势力分布：主要势力、关系网络、冲突点

## 输出格式
### 世界观/*.md
- 世界基础.md：地理/历史/文明
- 力量体系.md：等级/升级/限制
- 势力分布.md：势力/关系/冲突
- 特色设定.md：该题材独特设定
