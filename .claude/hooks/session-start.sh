#!/bin/bash
# SessionStart: deixa o agent-browser pronto nas sessões do Claude Code na nuvem.
# Usa o Chromium que já vem no container em vez de baixar o Chrome for Testing (~190 MB).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

AGENT_BROWSER_VERSION="0.27.0"
CHROMIUM="/opt/pw-browsers/chromium"
CONFIG="$HOME/.agent-browser/config.json"

if ! command -v agent-browser >/dev/null 2>&1; then
  npm install -g "agent-browser@${AGENT_BROWSER_VERSION}" >&2
fi

if [ -x "$CHROMIUM" ]; then
  # Config de usuário: vale em qualquer shell, não só nos que herdam o ambiente da sessão.
  if [ ! -f "$CONFIG" ]; then
    mkdir -p "$(dirname "$CONFIG")"
    printf '{"executablePath": "%s"}\n' "$CHROMIUM" > "$CONFIG"
  fi
elif ! ls "$HOME"/.agent-browser/browsers/chrome-* >/dev/null 2>&1; then
  # Sem Chromium no container: cai para o download do Chrome for Testing.
  agent-browser install >&2
fi

echo "agent-browser $(agent-browser --version | awk '{print $2}') disponível para automação de navegador (ver: agent-browser skills get core)."
