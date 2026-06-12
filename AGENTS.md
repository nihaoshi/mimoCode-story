# AGENTS.md

## What This Repo Is

纯 Markdown 技能定义仓库，为 MiMo Code 提供网文写作全流程 skill。无构建系统、无测试、无包管理器。`skills/` 下每个目录是一个 skill，由 `SKILL.md` 定义行为。

## Skill Structure Convention

每个 skill 目录：
```
skill-name/
├── SKILL.md          # 必需。skill 定义（触发词、流程、规则）
├── references/       # 可选。该 skill 专属的参考文档
└── scripts/          # 可选。自动化脚本（Node.js）
```

共享资源在 `skills/_shared/`（references/templates/examples/checklists），所有 skill 引用但不修改。

## Key Architecture Facts

- `skills/story/SKILL.md` 是路由入口，根据关键词分发到具体 skill
- `skills/story-long-write/SKILL.md` 是最核心的 skill（553行），定义5阶段写作流程
- Skill 间依赖：`story-import` 调用 `story-long-analyze` / `story-short-analyze` 的拆解管道
- `demo/` 是示例数据（拆文库+写作项目），非 skill 代码

## When Editing a Skill

1. 先读该 skill 的 `SKILL.md` 理解完整流程
2. 引用 `_shared/references/` 中的文档时，通过 `references/文件名.md` 相对路径引用
3. 新增共享文档放 `_shared/references/`，新增 skill 专属文档放 skill 自己的 `references/`
4. 脚本放 skill 的 `scripts/` 目录，用 Node.js 编写

## Demo Directory

`demo/` 包含完整示例，修改 skill 时可参考 demo 中的实际产出格式：
- `拆文库-*/` — 拆文管道的完整输出
- `*/正文/` — 写作项目的实际章节文件
- 修改输出模板时，同步检查 demo 中对应的产物文件是否需要更新

## Gotchas

- 所有 skill 用中文编写，遵循《中文文案排版指北》
- SKILL.md frontmatter 的 `name` 字段必须与目录名一致
- `references/` 中的大文件（30KB+）按场景按需加载，不要在 SKILL.md 中要求一次全部加载
