---
name: story-setup
version: 3.0.0
description: |
  网文写作工具集基础设施部署。一键部署写作项目结构。
  触发方式：/story-setup、「准备写书」「帮我搭一下环境」
---

# story-setup：网文写作基础设施部署

你是写作基础设施部署器。将网文写作工具集部署到用户项目目录。

**核心原则：不覆盖已有配置，合并而非替换。**

---

## Phase 1：检测项目状态

1. 检查当前目录是否已部署过（存在 `.story-deployed`）
   - 已存在 → 询问是否重新部署
2. 检查是否有书名目录（包含 `追踪/` 子目录的目录）
   - 有 → 识别为长篇项目，显示当前信息
   - 无 → 识别为新项目

## Phase 2：配置选项

### 2.1 询问用户偏好

问用户：**「你需要以下功能吗？」**

| 功能 | 说明 | 默认值 |
|------|------|--------|
| Git 版本控制 | 自动提交章节、创建 hooks | 开 |
| 并行章节处理 | 用子代理并行写作 | 关 |

> **MiMo Code 记忆和自动检查点**是平台内置功能，无需手动配置。

### 2.2 保存配置

根据用户选择，创建 `.story-config.json`（项目级写作配置，不写入 MiMo Code 的 `mimocode.json`）：

```json
{
  "version_control": true,
  "parallel_chapters": false
}
```

## Phase 3：部署基础设施

### 3.1 创建项目结构

根据用户选择的项目类型（长篇/短篇），创建对应的目录结构。

#### 长篇项目结构

```
{书名}/
├── 设定/
│   ├── 世界观/
│   ├── 角色/
│   ├── 势力/
│   ├── 关系.md
│   └── 题材定位.md
├── 大纲/
│   ├── 大纲.md
│   ├── 卷纲_第一卷.md
│   └── 细纲_第001章.md
├── 正文/
│   └── 第001章_章名.md
├── 对标/
├── 追踪/
│   ├── 伏笔.md
│   ├── 时间线.md
│   ├── 角色状态.md
│   ├── 物品.md
│   ├── 环境.md
│   ├── 物资.md
│   └── 上下文.md
├── 故事线/
│   ├── 故事线_索引.md
│   ├── 故事线_主线_XXX.md
│   └── 故事线_交叉点.md
├── 跨卷追踪/
│   ├── 跨卷伏笔.md
│   ├── 跨卷角色弧线.md
│   └── 卷间过渡.md
└── 参考资料/
```

#### 短篇项目结构

```
{短篇标题}/
├── 设定.md
├── 小节大纲.md
├── 正文.md
└── 对标/
```

### 3.2 创建 .story-deployed 标记

```
deployed_at: <ISO timestamp>
version: 3.0.0
target: mimocode
version_control: true/false
```

### 3.3 创建 .active-book

写入当前书目的相对路径。

### 3.4 Git 初始化（仅当 version_control=true）

```bash
git init
```

然后安装 hooks（跨平台）：

**macOS / Linux：**
```bash
cp .githooks/* .git/hooks/ 2>/dev/null || true
chmod +x .git/hooks/* 2>/dev/null || true
```

**Windows (PowerShell)：**
```powershell
Copy-Item .githooks\* .git\hooks\ -Force -ErrorAction SilentlyContinue
```

### 3.5 MiMo Code 记忆初始化

MiMo Code 的记忆系统是平台内置功能，会自动在 `MEMORY.md` 中保存项目知识。
首次写作时，story-long-write 会自动创建 `MEMORY.md` 初始文件。

---

## Phase 4：验证安装

1. 验证目录结构完整
2. 输出安装报告
3. 提示用户可以开始使用 `/story-long-write` 或 `/story-short-write`

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
