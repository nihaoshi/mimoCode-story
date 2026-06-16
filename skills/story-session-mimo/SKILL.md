---
name: story-session-mimo
version: 1.0.0
description: |
  Session 生命周期管理。会话开始时自动恢复上下文，压缩前保存快照，结束时更新记忆。
  触发方式：自动触发（由 story-long-write-mimo / story-short-write-mimo 调用）
metadata:
  openclaw:
    source: https://github.com/nihaoshi/mimoCode-story
---

# story-session-mimo：Session 生命周期管理

你是写作会话的生命周期管理器。在会话的不同阶段自动执行必要的上下文管理操作。

---

## 会话开始时（自动执行）

当用户开始新的写作会话时，按以下顺序自动执行：

### Step 1：恢复上次进度

读取 `追踪/上下文.md`，获取：
- 当前写到第几章
- 上次会话的关键决策
- 待处理的问题

### Step 2：恢复角色状态

读取 `追踪/角色状态.md`，获取：
- 主要角色的当前状态
- 性格锚点（写对话前必查）

### Step 3：恢复伏笔状态

读取 `追踪/伏笔.md`，获取：
- 待回收伏笔列表
- 逾期伏笔警告

### Step 4：检测设定缺口

运行 `node skills/_shared/scripts/detect-story-gaps.js <项目目录>`，检测：
- 设定文件完整性
- 大纲缺失
- 伏笔断线
- 追踪文件完整性

> 仅警告，不阻断。阻断项在质量门禁中处理。

### Step 5：显示进度快照

输出格式：
```
📖 会话恢复
- 项目：{书名}
- 进度：第{X}章/共{Y}章
- 待回收伏笔：{N}个
- 设定缺口：{N}个警告
- 上次决策：{关键决策摘要}
```

---

## 上下文压缩前（自动执行）

当 MiMo Code 上下文即将压缩时：

### Step 1：保存进度快照

更新 `追踪/上下文.md`，写入：
- 当前写到第几章
- 本次会话的关键决策
- 待处理的问题
- 下次会话需要恢复的状态

### Step 2：保存关键决策

将重要决策写入 `MEMORY.md` 的 `## 写作进度` 部分：
- 选题方向确认
- 大纲结构调整
- 角色设定变更
- 发现的问题和解决方案

---

## 上下文压缩后（自动执行）

MiMo Code 的 memory 系统在 checkpoint rebuild 时自动注入上下文。此时：

1. 确认 `追踪/上下文.md` 已被读取
2. 确认 `追踪/角色状态.md` 已被读取
3. 确认 `追踪/伏笔.md` 已被读取
4. 如有缺失，提示用户手动加载

---

## 会话结束时（自动执行）

当用户结束写作会话时：

### Step 1：更新进度摘要

更新 `追踪/上下文.md`，写入最终状态：
- 本次写了第X章到第Y章
- 本次做了哪些重要决策
- 发现的问题和解决方案
- 下次会话的起始点

### Step 2：更新记忆

将关键信息写入 `MEMORY.md`：
- 当前进度
- 重要决策
- 待解决问题

### Step 3：提取经验（可选）

如果用户说"提取经验"，运行 `dream.js` 扫描近期章节，提取：
- 禁用词出现频率
- AI腔模式
- 有效技法
- 重复模式

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**会话生命周期的每个阶段都创建对应任务，确保不遗漏。**

### 会话开始任务树

```
T-SESSION-START: 会话恢复 [in_progress]
│
├── T-SESSION-CTX: 读取追踪/上下文.md — 获取当前章节+上次决策
├── T-SESSION-CHAR: 读取追踪/角色状态.md — 获取角色状态+性格锚点
├── T-SESSION-FORESH: 读取追踪/伏笔.md — 获取待回收伏笔
├── T-SESSION-GAP: 运行 detect-story-gaps.js — 检测设定缺口
└── T-SESSION-SNAPSHOT: 输出进度快照 — 项目/进度/伏笔数/缺口数
```

### 上下文压缩前任务树

```
T-SESSION-PRE-COMPRESS: 上下文压缩保存 [in_progress]
│
├── T-SESSION-SAVE-CTX: 更新追踪/上下文.md — 写入进度+决策+问题
└── T-SESSION-SAVE-MEM: 写入MEMORY.md — 保存关键决策
```

### 会话结束任务树

```
T-SESSION-END: 会话结束 [in_progress]
│
├── T-SESSION-END-CTX: 更新追踪/上下文.md — 最终进度摘要
├── T-SESSION-END-MEM: 更新MEMORY.md — 当前进度+重要决策
└── [条件] T-SESSION-END-DREAM: 经验提取（用户说"提取经验"时创建）
    ├── 扫描禁用词频率
    ├── 扫描AI腔模式
    ├── 提取有效技法
    └── 发现重复模式
```

### 条件创建规则

| 任务 | 创建条件 | 跳过条件 |
|------|---------|---------|
| T-SESSION-END-DREAM | 用户说"提取经验" | 用户未要求 |

---

## 与 story-long-write-mimo 的集成

本 skill 作为 story-long-write-mimo 的辅助模块，在以下时机被调用：

| 时机 | 调用方式 | 执行内容 |
|------|---------|---------|
| 日更续写开始 | 自动触发 | Step 1-5（会话恢复） |
| 每章写完后 | 由 story-long-write-mimo 调用 | 更新追踪文件 |
| 上下文压缩前 | 由 MiMo Code 触发 | 保存快照 |
| 用户说"结束" | 由用户触发 | Step 1-3（会话结束） |

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
