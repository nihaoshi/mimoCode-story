#!/usr/bin/env bash
set -euo pipefail

# MiMo Code Story Skill Pack Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/nihaoshi/mimoCode-story/main/install.sh | bash

REPO="https://github.com/nihaoshi/mimoCode-story.git"
INSTALL_DIR="${HOME}/mimoCode-story"
SKILL_DIR="${HOME}/.config/mimocode/skills"

echo "=== MiMo Code Story Skill Pack ==="
echo ""

if ! command -v mimo &>/dev/null; then
  echo "Error: mimo not found. Install MiMo Code first:"
  echo "  npm install -g @mimo-ai/cli"
  exit 1
fi

if ! command -v git &>/dev/null; then
  echo "Error: git not found. Install Git first."
  exit 1
fi

echo "[1/5] Cloning repo..."
if [ -d "$INSTALL_DIR" ]; then
  echo "  Directory exists, pulling latest..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  if ! git clone --quiet "$REPO" "$INSTALL_DIR"; then
    echo "Error: git clone failed. Check network."
    echo "  Download ZIP manually:"
    echo "  https://github.com/nihaoshi/mimoCode-story/archive/refs/heads/main.zip"
    exit 1
  fi
fi

if [ ! -d "$INSTALL_DIR/skills" ]; then
  echo "Error: skills directory not found after clone."
  exit 1
fi

echo "[2/5] Creating skill directory..."
mkdir -p "$SKILL_DIR"

echo "[3/5] Copying skills..."
cp -r "$INSTALL_DIR"/skills/* "$SKILL_DIR/"

echo "[4/5] Checking agent-browser..."
if ! command -v agent-browser &>/dev/null; then
  echo "  Installing agent-browser (rank scraper dependency)..."
  if npm install -g agent-browser 2>/dev/null; then
    echo "  agent-browser installed."
  else
    echo "  WARNING: agent-browser install failed. Rank scraping will not work."
    echo "  Try manually: npm install -g agent-browser"
  fi
else
  echo "  agent-browser already installed."
fi

echo "[5/5] Verifying..."
SKILLS=(story story-setup story-long-write story-short-write story-long-analyze story-short-analyze story-scan story-long-scan story-short-scan story-deslop story-review story-cover story-import browser-cdp)
MISSING=()
for s in "${SKILLS[@]}"; do
  if [ ! -f "$SKILL_DIR/$s/SKILL.md" ]; then
    MISSING+=("$s")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "Error: Missing skills: ${MISSING[*]}"
  exit 1
fi

echo ""
echo "=== Done ==="
echo "Installed ${#SKILLS[@]} skills to: $SKILL_DIR"
echo ""
echo "Restart MiMo Code, then use:"
echo "  /story           - Main entry"
echo "  /story-setup     - Init project"
echo "  /story-long-write  - Long fiction"
echo "  /story-short-write - Short fiction"
