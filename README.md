# mimocode-story

MiMo Code 网文写作技能包。覆盖长篇与短篇网络小说的扫榜、拆文、写作、去AI味、审稿全流程。

基于 [oh-story-claudecode](https://github.com/nihaoshi/oh-story-claudecode) 适配，专为 [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) 设计。

## 安装方式

### 方式一：Git 克隆（推荐）

在 MiMo Code 会话中告诉它：

```
帮我克隆这个仓库到本地：https://github.com/nihaoshi/mimoCode-story.git
```

或者在终端手动执行：

```bash
git clone https://github.com/nihaoshi/mimoCode-story.git ~/mimoCode-story
```

克隆完成后，在 MiMo Code 中加载 skills：

```
加载这个目录的 skills：~/mimoCode-story/skills
```

### 方式二：直接下载

1. 下载仓库 ZIP 文件
2. 解压到本地目录（如 `C:\Users\你的用户名\mimoCode-story`）
3. 在 MiMo Code 中加载 skills：

```
加载这个目录的 skills：C:\Users\你的用户名\mimoCode-story\skills
```

### 方式三：全局安装

如果你希望在所有项目中都能使用：

```bash
# 克隆到固定位置
git clone https://github.com/nihaoshi/mimoCode-story.git ~/.mimocode-story

# 然后在 MiMo Code 中加载
加载这个目录的 skills：~/.mimocode-story/skills
```

## 使用方式

安装后，在 MiMo Code 中可以直接使用以下命令：

| 命令 | 功能 |
|------|------|
| `/story` | 网文工具箱主入口（自动路由） |
| `/story-setup` | 初始化写作项目 |
| `/story-long-write` | 写长篇小说 |
| `/story-short-write` | 写短篇小说 |
| `/story-long-analyze` | 拆解长篇小说 |
| `/story-short-analyze` | 拆解短篇小说 |
| `/story-scan` | 扫榜选题（通用） |
| `/story-long-scan` | 长篇扫榜选题 |
| `/story-short-scan` | 短篇扫榜选题 |
| `/story-deslop` | 去AI味 |
| `/story-review` | 多角度审稿 |
| `/story-cover` | 生成封面 |
| `/story-import` | 导入已有小说 |
| `/browser-cdp` | 浏览器操控（CDP 协议） |

### 快速开始

```
# 1. 初始化项目（会询问是否启用版本控制）
/story-setup

# 2. 开始写长篇
/story-long-write

# 或者写短篇
/story-short-write
```

## MiMo Code 深度适配

本技能包针对 MiMo Code 平台进行了深度适配，充分利用其独特能力：

### 核心能力映射

| MiMo Code 能力 | 写作场景 | 实现方式 |
|---------------|---------|---------|
| **持久化记忆** | 跨会话状态连续 | `MEMORY.md` 自动保存/恢复写作进度和决策 |
| **智能上下文管理** | 长篇写作不丢失上下文 | 自动检查点 + 预算化注入 |
| **任务追踪** | 进度管理 | 树状任务系统追踪每章写作状态 |
| **子智能体** | 并行处理 | 拆文/审稿/研究可并行执行 |
| **Goal 停止条件** | 自主写作控制 | `/goal` 命令设置写作停止条件 |
| **Dream & Distill** | 自我进化 | `/dream` 提取写作经验，`/distill` 发现重复工作流 |

### 版本控制（可选）

版本控制功能默认开启，用户可在部署时选择关闭：

```
/story-setup
→ 询问：你需要 Git 版本控制吗？
→ 选择：是/否
```

**关闭后的行为**：
- 跳过 `git add` / `git commit` / `git push`
- 不创建 `.githooks/`
- 追踪文件仍正常更新（与版本控制无关）

### 插件系统

本技能包支持 MiMo Code 插件系统：

```json
// openclaw.plugin.json
{
  "name": "mimocode-story",
  "version": "2.0.0",
  "configSchema": {
    "version_control": { "type": "boolean", "default": true },
    "auto_checkpoint": { "type": "boolean", "default": true },
    "parallel_chapters": { "type": "boolean", "default": false }
  }
}
```

### 自动触发规则

通过 `.skills-plugin-config.json` 配置自动触发：

| 触发器 | 行为 |
|--------|------|
| `trigger: "always"` + `inject: true` | 每条消息自动注入角色状态和一致性守护 |
| 关键词匹配 | 匹配到写作关键词时自动路由到对应 skill |

## 目录结构

```
mimoCode-story/
├── skills/
│   ├── story/                    # 主入口路由
│   ├── story-setup/              # 环境部署（支持版本控制可选）
│   ├── story-long-write/         # 长篇写作（核心）
│   │   ├── references/           # 专属参考文档
│   │   └── scripts/              # 自动化脚本
│   │       ├── consistency-check.js   # 一致性检查
│   │       ├── foreshadow-check.js    # 伏笔检查
│   │       ├── style-lint.js          # 文风检查
│   │       ├── normalize-punctuation.js # 标点规范化
│   │       └── detect-python.js       # 跨平台Python检测
│   ├── story-short-write/        # 短篇写作
│   ├── story-long-analyze/       # 长篇拆文
│   ├── story-short-analyze/      # 短篇拆文
│   ├── story-long-scan/          # 长篇扫榜选题
│   ├── story-short-scan/         # 短篇扫榜选题
│   ├── story-scan/               # 扫榜选题（通用）
│   ├── story-import/             # 逆向导入已有小说
│   ├── story-deslop/             # 去AI味
│   ├── story-review/             # 审稿
│   ├── story-cover/              # 封面
│   ├── browser-cdp/              # 浏览器操控（CDP 协议）
│   └── _shared/                  # 共享资源
│       ├── references/           # 共享参考文件（60个）
│       │   └── INDEX.md          # 知识库索引
│       ├── templates/            # 写作模板库（4个）
│       ├── examples/             # 专家案例库（3个）
│       └── checklists/           # 写作检查清单（4个）
├── .githooks/                    # Git Hooks（防遗漏，可选）
│   ├── pre-commit                # 提交前检查
│   └── post-commit               # 提交后提醒
├── .mimocode/                    # MiMo Code 配置
│   └── mimocode.json             # 项目配置（版本控制/记忆/检查点）
├── openclaw.plugin.json          # 插件清单
├── .skills-plugin-config.json    # 技能触发配置
├── demo/                         # 使用示例
├── AGENTS.md                     # AI agent 指令文件
└── README.md
```

## 专家级写作辅助

### 知识库索引系统

`_shared/references/INDEX.md` 提供按场景快速检索功能：

- 写对话时 → `dialogue-mastery.md`
- 设计反派时 → `villain-and-reveal.md`
- 构建世界观时 → `genre-core-mechanics.md`
- 设计情感线时 → `emotional-arc-design.md`

### 写作模板库

`_shared/templates/` 提供常见场景的写作模板：

- `dialogue-scene.md` - 对话场景模板
- `emotional-arc.md` - 情感线模板
- `villain-introduction.md` - 反派出场模板
- `worldbuilding-intro.md` - 世界观构建模板

### 专家案例库

`_shared/examples/` 提供经典作品的写作案例：

- `dialogue-examples.md` - 对话案例
- `emotion-examples.md` - 情感线案例
- `villain-examples.md` - 反派案例

### 写作检查清单

`_shared/checklists/` 提供写作质量自检清单：

- `dialogue-checklist.md` - 对话质量检查
- `emotion-checklist.md` - 情感线检查
- `villain-checklist.md` - 反派设计检查
- `world-checklist.md` - 世界观检查

### 自动化检查脚本

`story-long-write/scripts/` 提供写作质量自动检测：

| 脚本 | 功能 | 用法 |
|------|------|------|
| `consistency-check.js` | 一致性检查（物品/环境/角色状态） | `node scripts/consistency-check.js 正文/第XXX章.md` |
| `foreshadow-check.js` | 伏笔健康检查（超期伏笔预警） | `node scripts/foreshadow-check.js 正文/第XXX章.md` |
| `style-lint.js` | 文风检查（禁用词/排比/AI腔） | `node scripts/style-lint.js 正文/第XXX章.md` |
| `detect-python.js` | 跨平台Python检测 | `node scripts/detect-python.js` |

### Git Hooks（防遗漏，可选）

`.githooks/` 提供提交时自动检查（仅当 version_control=true）：

- `pre-commit`：检查章节文件格式和完整性
- `post-commit`：提醒更新追踪文件

### 角色性格锚点

`追踪/角色状态.md` 中的「性格锚点」字段防止跨章节性格漂移：
- 核心性格（2-3个关键词）
- 说话风格（口头禅、用词习惯）
- 行为模式（遇事反应方式）
- 禁忌（绝对不会做的事）

## 与原版的区别

| 维度 | 原版 (oh-story-claudecode) | 本版 (mimocode-story) |
|------|---------------------------|----------------------|
| 平台 | Claude Code / OpenClaw | **MiMo Code** |
| Hooks | 6 个 shell hooks | **2 个 git hooks**（可选）+ **插件触发器** |
| Agents | 7 个 Claude Code agents | **MiMo Code 子智能体** |
| 插件格式 | `.claude-plugin/marketplace.json` | **openclaw.plugin.json** |
| 安装方式 | `npx skills add` | **git clone + 手动加载** |
| 知识库 | 100+ 份方法论文档 | **完整保留**（60 份共享参考） |
| Memory | 无 | **MiMo Code 持久化记忆** |
| 任务追踪 | 无 | **MiMo Code 树状任务系统** |
| 上下文管理 | 无 | **MiMo Code 智能上下文管理** |
| 版本控制 | 强制 | **可选**（用户选择是否启用） |
| 自我进化 | 无 | **Dream & Distill** |

## 核心功能

### 写作流程

```
扫榜选题 → 拆文学习 → 开书写作 → 去AI味 → 审稿 → 发布
   ↓          ↓          ↓          ↓        ↓
story-scan  story-*   story-*   story-   story-
            analyze    write     deslop   review
```

### 知识库

包含完整的网文写作知识体系（60份共享参考文档）：

- **题材与市场**：题材框架、核心梗设计、读者心理、扫榜选题
- **人物设计**：角色设定、关系映射、动机链、反派系统
- **剧情与结构**：大纲方法、矛盾设计、节奏把控、情绪弧线
- **写作技法**：钩子设计、悬念设计、对话技法、写作公式
- **质量控制**：去AI味、禁用词表、质量检查、一致性追踪
- **千万字支持**：结构化索引、故事线管理、跨卷追踪、版本管理
- **数据分析**：写作指标、爽点密度、伏笔健康度、AI腔趋势
- **用户体验**：项目仪表盘、快捷恢复、写作反馈

## 使用示例

### 写长篇

```
用户：/story-long-write
MiMo：你想让读者什么感觉？有没有喜欢的书想对标？

用户：想写玄幻，对标《斗破苍穹》
MiMo：好的，让我帮你搭建大纲...
```

### 写短篇

```
用户：/story-short-write
MiMo：你想让读者读完什么感觉？

用户：意难平，想让读者哭
MiMo：好的，情绪目标确定。让我们构思核心框架...
```

### 去AI味

```
用户：/story-deslop
MiMo：请提供要处理的文本...

用户：[贴入文本]
MiMo：检测到中度AI味，正在处理...
      - 禁用词替换：12处
      - 句式调整：8处
      - 心理外化：5处
```

## License

MIT

## 致谢

- [oh-story-claudecode](https://github.com/nihaoshi/oh-story-claudecode) - 原版网文写作技能包
- [MiMo Code](https://github.com/XiaomiMiMo/MiMo-Code) - MiMo Code 平台
