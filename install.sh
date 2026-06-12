#!/usr/bin/env bash
set -euo pipefail

# MiMo Code 网文写作技能包 安装脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/nihaoshi/mimoCode-story/main/install.sh | bash

REPO="https://github.com/nihaoshi/mimoCode-story.git"
INSTALL_DIR="${HOME}/mimoCode-story"
SKILL_DIR="${HOME}/.config/mimocode/skills"

echo "=== MiMo Code 网文写作技能包 安装 ==="
echo ""

# 检查 MiMo Code 是否安装
if ! command -v mimo &>/dev/null; then
  echo "错误: 未找到 mimo 命令。请先安装 MiMo Code:"
  echo "  npm install -g @mimo-ai/cli"
  echo "  或: curl -fsSL https://mimo.xiaomi.com/install | bash"
  exit 1
fi

echo "[1/4] 克隆仓库..."
if [ -d "$INSTALL_DIR" ]; then
  echo "  目录已存在，拉取最新代码..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  git clone --quiet "$REPO" "$INSTALL_DIR"
fi

echo "[2/4] 创建技能目录..."
mkdir -p "$SKILL_DIR"

echo "[3/4] 复制 skills..."
# 复制所有 skill 目录（排除 _shared 以外的隐藏文件）
cp -r "$INSTALL_DIR"/skills/* "$SKILL_DIR/"

echo "[4/4] 验证安装..."
# 检查关键 skill 文件是否存在
SKILLS=(story story-setup story-long-write story-short-write story-long-analyze story-short-analyze story-scan story-long-scan story-short-scan story-deslop story-review story-cover story-import browser-cdp)
MISSING=()
for s in "${SKILLS[@]}"; do
  if [ ! -f "$SKILL_DIR/$s/SKILL.md" ]; then
    MISSING+=("$s")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "错误: 以下 skill 缺失: ${MISSING[*]}"
  exit 1
fi

echo ""
echo "=== 安装完成 ==="
echo "已安装 ${#SKILLS[@]} 个写作 skill 到: $SKILL_DIR"
echo ""
echo "重启 MiMo Code 后可使用以下命令:"
echo "  /story          - 网文工具箱主入口"
echo "  /story-setup    - 初始化写作项目"
echo "  /story-long-write - 写长篇小说"
echo "  /story-short-write - 写短篇小说"
echo ""
echo "验证: mimo debug skill | grep story"
