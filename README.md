# mimocode-story

MiMo Code 网文写作技能包。覆盖长篇与短篇网络小说的扫榜、拆文、写作、去AI味、审稿全流程。

基于 [oh-story-claudecode](https://github.com/nihaoshi/oh-story-claudecode) 适配，专为 [MiMo Code](https://github.com/XiaomiMiMo) 设计。

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
| `/story-long-scan` | 长篇扫榜选题 |
| `/story-short-scan` | 短篇扫榜选题 |
| `/story-scan` | 扫榜选题（通用） |
| `/story-import` | 逆向导入已有小说 |
| `/story-deslop` | 去AI味 |
| `/story-review` | 多角度审稿 |
| `/story-cover` | 生成封面 |
| `/browser-cdp` | 浏览器操控（CDP 协议） |

### 快速开始

```
# 1. 初始化项目
/story-setup

# 2. 开始写长篇
/story-long-write

# 或者写短篇
/story-short-write
```

## 目录结构

```
mimoCode-story/
├── skills/
│   ├── story/                    # 主入口路由
│   ├── story-setup/              # 环境部署
│   ├── story-long-write/         # 长篇写作（核心）
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
│   └── _shared/
│       ├── references/           # 共享参考文件（48个）
│       │   └── INDEX.md          # 知识库索引
│       ├── templates/            # 写作模板库
│       │   ├── dialogue-scene.md     # 对话场景模板
│       │   ├── emotional-arc.md      # 情感线模板
│       │   ├── villain-introduction.md # 反派出场模板
│       │   └── worldbuilding-intro.md # 世界观构建模板
│       ├── examples/             # 专家案例库
│       │   ├── dialogue-examples.md  # 对话案例
│       │   ├── emotion-examples.md   # 情感线案例
│       │   └── villain-examples.md   # 反派案例
│       └── checklists/           # 写作检查清单
│           ├── dialogue-checklist.md # 对话质量检查
│           ├── emotion-checklist.md  # 情感线检查
│           ├── villain-checklist.md  # 反派设计检查
│           └── worldchecklist.md     # 世界观检查
├── demo/                         # 使用示例
├── README.md
└── LICENSE
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
- `worldchecklist.md` - 世界观检查

## 与原版的区别

| 维度 | 原版 (oh-story-claudecode) | 本版 (mimocode-story) |
|------|---------------------------|----------------------|
| 平台 | Claude Code / OpenClaw | **MiMo Code** |
| Hooks | 6 个 shell hooks | **去掉**（用 MiMo Code 原生能力） |
| Agents | 7 个 Claude Code agents | **去掉**（用 actor 替代） |
| 插件格式 | `.claude-plugin/marketplace.json` | **MiMo Code skills 目录** |
| 安装方式 | `npx skills add` | **git clone + 手动加载** |
| 知识库 | 100+ 份方法论文档 | **完整保留**（48 份共享参考） |
| Memory | 无 | **支持**（跨会话状态持久化） |
| Web 搜索 | 无 | **支持**（扫榜集成 webfetch） |

## 核心功能

### 写作流程

```
扫榜选题 → 拆文学习 → 开书写作 → 去AI味 → 审稿 → 发布
   ↓          ↓          ↓          ↓        ↓
story-scan  story-*   story-*   story-   story-
            analyze    write     deslop   review
```

### 知识库

包含完整的网文写作知识体系：

- **题材与市场**：题材框架、核心梗设计、读者心理
- **人物设计**：角色设定、关系映射、动机链
- **剧情与结构**：大纲方法、矛盾设计、节奏把控
- **写作技法**：钩子设计、悬念设计、对话技法
- **质量控制**：去AI味、禁用词表、质量检查

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
- [MiMo Code](https://github.com/XiaomiMiMo) - MiMo Code 平台
