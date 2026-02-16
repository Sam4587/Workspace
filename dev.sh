#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/pids"
LOG_DIR="$SCRIPT_DIR/logs"

mkdir -p "$PID_DIR" "$LOG_DIR" cookies uploads

start_backend() {
    if [ -f "$PID_DIR/server.pid" ]; then
        PID=$(cat "$PID_DIR/server.pid")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Backend already running (PID: $PID)"
            return 0
        fi
        rm -f "$PID_DIR/server.pid"
    fi
    
    echo "Starting backend server..."
    "$SCRIPT_DIR/bin/publisher-server" -port 8080 > "$LOG_DIR/server.log" 2>&1 &
    echo $! > "$PID_DIR/server.pid"
    sleep 1
    
    if kill -0 $(cat "$PID_DIR/server.pid") 2>/dev/null; then
        echo "Backend started on http://localhost:8080"
        return 0
    else
        echo "Failed to start backend. Check logs/server.log"
        return 1
    fi
}

start_frontend() {
    if [ -f "$PID_DIR/web.pid" ]; then
        PID=$(cat "$PID_DIR/web.pid")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Frontend already running (PID: $PID)"
            return 0
        fi
        rm -f "$PID_DIR/web.pid"
    fi
    
    echo "Starting frontend server..."
    cd "$SCRIPT_DIR/publisher-web" && npm run dev > "$LOG_DIR/web.log" 2>&1 &
    echo $! > "$PID_DIR/web.pid"
    sleep 2
    
    echo "Frontend started on http://localhost:5173"
    return 0
}

stop_all() {
    echo "Stopping services..."
    
    if [ -f "$PID_DIR/server.pid" ]; then
        PID=$(cat "$PID_DIR/server.pid")
        kill "$PID" 2>/dev/null && echo "Backend stopped"
        rm -f "$PID_DIR/server.pid"
    fi
    
    if [ -f "$PID_DIR/web.pid" ]; then
        PID=$(cat "$PID_DIR/web.pid")
        kill "$PID" 2>/dev/null && echo "Frontend stopped"
        rm -f "$PID_DIR/web.pid"
    fi
    
    pkill -f "publisher-server" 2>/dev/null
    pkill -f "vite" 2>/dev/null
}

show_status() {
    echo "=== Service Status ==="
    
    if [ -f "$PID_DIR/server.pid" ]; then
        PID=$(cat "$PID_DIR/server.pid")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Backend:  RUNNING (PID: $PID) - http://localhost:8080"
        else
            echo "Backend:  STOPPED (stale PID)"
        fi
    else
        echo "Backend:  STOPPED"
    fi
    
    if [ -f "$PID_DIR/web.pid" ]; then
        PID=$(cat "$PID_DIR/web.pid")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Frontend: RUNNING (PID: $PID) - http://localhost:5173"
        else
            echo "Frontend: STOPPED (stale PID)"
        fi
    else
        echo "Frontend: STOPPED"
    fi
}

build_all() {
    echo "Building backend..."
    cd "$SCRIPT_DIR/publisher-core"
    go mod tidy
    go build -o "$SCRIPT_DIR/bin/publisher-server" ./cmd/server
    go build -o "$SCRIPT_DIR/bin/publisher" ./cmd/cli
    echo "Build complete!"
}

show_logs() {
    if [ "$1" = "backend" ]; then
        tail -f "$LOG_DIR/server.log"
    elif [ "$1" = "frontend" ]; then
        tail -f "$LOG_DIR/web.log"
    else
        tail -f "$LOG_DIR/server.log" "$LOG_DIR/web.log"
    fi
}

case "${1:-help}" in
    start)
        start_backend
        start_frontend
        echo ""
        echo "===================================="
        echo "  Development environment ready!"
        echo "  Backend:  http://localhost:8080"
        echo "  Frontend: http://localhost:5173"
        echo "===================================="
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_all
        sleep 1
        start_backend
        start_frontend
        ;;
    status)
        show_status
        ;;
    build)
        build_all
        ;;
    logs)
        show_logs "$2"
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    help|*)
        echo "Usage: $0 {start|stop|restart|status|build|logs|backend|frontend}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all services (backend + frontend)"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  status    - Show service status"
        echo "  build     - Build backend binaries"
        echo "  logs      - Show logs (all/backend/frontend)"
        echo "  backend   - Start only backend"
        echo "  frontend  - Start only frontend"
        ;;
esac
