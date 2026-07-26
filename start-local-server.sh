#!/usr/bin/env bash
# Startet einen einfachen statischen Webserver für die Anwendung.
# Nutzung: ./start-local-server.sh [port]
set -e
PORT="${1:-8080}"
cd "$(dirname "$0")"
echo "Öffne im Browser: http://localhost:${PORT}"
python3 -m http.server "$PORT"
