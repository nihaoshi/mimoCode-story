# MiMo Code Memory 集成指南

本指南说明如何使用 MiMo Code 的 memory 系统来持久化网文写作状态。

## 为什么用 Memory

MiMo Code 的 memory 系统支持跨会话持久化，比文件系统更适合存储：
- 角色状态（跨会话需要记住）
- 伏笔追踪（跨章节需要）
- 写作进度（断点恢复）
- 偏好设置（用户习惯）

## Memory vs 文件系统

| 维度 | Memory | 文件系统 |
|------|--------|----------|
| 持久化 | 跨会话 | 项目内 |
| 查询 | 语义搜索 | 文件读取 |
| 适用 | 状态、偏好 | 大量文本、模板 |
| 速度 | 快（索引） | 慢（全量读） |

## 推荐分工

### 用 Memory 存储（小量、需要搜索）

```
scope: projects
├── {project-id}/
│   ├── character-states.md      # 角色当前状态
│   ├── foreshadowing.md         # 伏笔追踪表
│   ├── timeline.md              # 故事时间线
│   ├── writing-progress.md      # 写作进度
│   └── preferences.md           # 用户偏好
```

### 用文件系统存储（大量、模板化）

```
{书名}/
├── 设定/        # 完整设定文档
├── 大纲/        # 详细大纲
├── 正文/        # 章节正文
├── 追踪/        # 追踪文件（同步到 memory）
└── 参考资料/    # 研究资料
```

## Memory 存储模板

### 角色状态

```markdown
# character-states

## {角色名}
- 状态: {当前状态}
- 位置: {当前所在地}
- 身份: {当前身份}
- 能力: {当前能力}
- 关系: {与其他角色的关系}
- 最后更新: 第{N}章
```

### 伏笔追踪

```markdown
# foreshadowing

## 活跃伏笔
| ID | 埋设章节 | 内容 | 计划回收 | 状态 |
|----|---------|------|---------|------|
| F001 | 第3章 | {伏笔内容} | 第15章 | 待回收 |
| F002 | 第7章 | {伏笔内容} | 第20章 | 已回收 |

## 已回收
| ID | 埋设章节 | 回收章节 | 回收方式 |
|----|---------|---------|---------|
| F001 | 第3章 | 第15章 | {回收方式} |
```

### 写作进度

```markdown
# writing-progress

## 当前状态
- 最新章节: 第{N}章
- 总字数: {X}字
- 当前卷: 第{M}卷
- 下一章: 第{N+1}章

## 近期决策
- 第{N}章: {决策内容}
- 第{N-1}章: {决策内容}
```

### 用户偏好

```markdown
# preferences

## 写作风格
- 偏好平台: {起点/番茄/晋江}
- 偏好题材: {玄幻/都市/...}
- 字数偏好: {每章字数}
- 对话风格: {书面/口语}

## 操作习惯
- 自动去AI味: {是/否}
- 自动审稿: {是/否}
- 并行写作: {是/否}
```

## 使用方式

### 1. 初始化项目

在 `story-setup` 中，创建 memory 条目：

```
memory({
  operation: "search",
  query: "writing-progress {project-name}",
  scope: "projects"
})
```

### 2. 更新角色状态

每章写完后，更新角色状态：

```
memory({
  operation: "search",
  query: "character-states {角色名}",
  scope: "projects"
})
```

### 3. 查询伏笔

写新章节前，查询待回收伏笔：

```
memory({
  operation: "search",
  query: "foreshadowing 活跃",
  scope: "projects"
})
```

### 4. 恢复进度

新会话开始时，恢复写作进度：

```
memory({
  operation: "search",
  query: "writing-progress",
  scope: "projects"
})
```

## 注意事项

1. **Memory 适合小量数据**：每条 memory 建议 < 10KB
2. **文件系统适合大量数据**：正文、完整设定放文件系统
3. **双向同步**：重要状态变更同时更新 memory 和文件
4. **命名规范**：使用 `{scope}/{key}.md` 格式
