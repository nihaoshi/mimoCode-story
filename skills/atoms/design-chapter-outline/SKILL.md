---
name: design-chapter-outline
version: 1.0.0
description: 设计单章细纲
category: write
inputs:
  - name: volume_outline
    type: file_path
    required: true
    description: 卷纲文件路径
  - name: chapter_number
    type: number
    required: true
    description: 章节编号
outputs:
  - name: chapter_outline
    type: file
    format: markdown
triggers:
  - /atom:design-chapter-outline
  - 细纲设计
references:
  - _shared/references/hooks-chapter.md
---

# design-chapter-outline

## 功能
基于卷纲设计单章细纲，包含事件分解、钩子设计、爽点布局和字数分配。

## 执行步骤
1. 读取 {volume_outline} 卷纲，定位第 {chapter_number} 章所在卷
2. 参考 hooks-chapter.md 钩子设计方法
3. 分解章节为 3-5 个场景
4. 设计章首钩子、章末悬念、中间爽点
5. 分配各场景字数比例

## 输出格式
### 细纲.md
- 章节号 / 章节名 / 字数目标
- 章首钩子设计
- 场景列表（场景名 | 事件 | 角色 | 字数 | 情绪）
- 爽点/转折标注
- 章末悬念设计
