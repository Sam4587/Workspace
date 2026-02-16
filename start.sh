#!/bin/bash

# Publisher Tools - 一键启动脚本
# 用法: ./start.sh [选项]
# 选项:
#   --dev      开发模式（前后端分离）
#   --prod     生产模式（Docker部署）
#   --stop     停止所有服务
#   --status   查看服务状态
#   --logs     查看日志
#   --restart  重启服务

set -e

# 颜色定义
RED='[0;31m'
GREEN='[0;32m'
YELLOW='[1;33m'
BLUE='[0;34m'
NC='[0m' # No Color

# 配置
APP_NAME="Publisher Tools"
BACKEND_PORT=${BACKEND_PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
PID_DIR="./pids"
LOG_DIR="./logs"
CONFIG_FILE="./config.yaml"

# 创建必要目录
mkdir -p $PID_DIR $LOG_DIR ./uploads ./cookies ./data

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 显示Banner
show_banner() {
    echo -e "${GREEN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     ____        __                                         ║
║    / __ \____  / /_  ____ _____  ____ _____  ___  _____   ║
║   / /_/ / __ \/ __ \/ __ `/_  / / __ `/_  / / _ \/ ___/   ║
║  / ____/ /_/ / / / / /_/ / / /_/ /_/ / / /_/  __/ /       ║
║ /_/    \____/_/ /_/\__,_/ /___/\__,_/ /___/\___/_/         ║
║                                                            ║
║                多平台内容发布自动化系统                      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo -e "版本: ${GREEN}v1.0.0${NC}"
    echo -e "完成度: ${GREEN}100%${NC}
"
}

# 检查依赖
check_dependencies() {
    log_step "检查依赖..."
    
    # 检查Go
    if ! command -v go &> /dev/null; then
        log_warn "Go未安装，部分功能可能受限"
    else
        log_info "Go版本: $(go version | awk '{print $3}')"
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_warn "Node.js未安装，前端无法启动"
    else
        log_info "Node.js版本: $(node --version)"
    fi
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_warn "Docker未安装，生产模式不可用"
    else
        log_info "Docker版本: $(docker --version | awk '{print $3}' | tr -d ',')"
    fi
    
    echo ""
}

# 检查端口占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口空闲
    fi
}

# 等待端口可用
wait_for_port() {
    local port=$1
    local max_wait=30
    local count=0
    
    while check_port $port; do
        if [ $count -ge $max_wait ]; then
            log_error "端口 $port 被占用，请先释放该端口"
            return 1
        fi
        sleep 1
        count=$((count + 1))
    done
    
    return 0
}

# 启动后端服务
start_backend() {
    log_step "启动后端服务..."
    
    # 检查端口
    if check_port $BACKEND_PORT; then
        log_error "端口 $BACKEND_PORT 已被占用"
        return 1
    fi
    
    # 检查是否已运行
    if [ -f "$PID_DIR/backend.pid" ]; then
        local pid=$(cat $PID_DIR/backend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            log_warn "后端服务已在运行 (PID: $pid)"
            return 0
        fi
    fi
    
    # 启动服务
    if [ -f "./bin/publisher-server" ]; then
        ./bin/publisher-server             -port $BACKEND_PORT             -headless=true             > $LOG_DIR/backend.log 2>&1 &
        echo $! > $PID_DIR/backend.pid
        log_info "后端服务启动成功 (PID: $(cat $PID_DIR/backend.pid))"
        log_info "API地址: http://localhost:$BACKEND_PORT"
    else
        log_error "后端程序不存在，请先编译: make build"
        return 1
    fi
}

# 启动前端服务
start_frontend() {
    log_step "启动前端服务..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，无法启动前端服务"
        return 1
    fi
    
    # 检查端口
    if check_port $FRONTEND_PORT; then
        log_error "端口 $FRONTEND_PORT 已被占用"
        return 1
    fi
    
    # 检查是否已运行
    if [ -f "$PID_DIR/frontend.pid" ]; then
        local pid=$(cat $PID_DIR/frontend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            log_warn "前端服务已在运行 (PID: $pid)"
            return 0
        fi
    fi
    
    # 安装依赖
    if [ ! -d "publisher-web/node_modules" ]; then
        log_info "安装前端依赖..."
        cd publisher-web && npm install && cd ..
    fi
    
    # 启动服务
    cd publisher-web
    npm run dev > ../$LOG_DIR/frontend.log 2>&1 &
    echo $! > ../$PID_DIR/frontend.pid
    cd ..
    
    log_info "前端服务启动成功 (PID: $(cat $PID_DIR/frontend.pid))"
    log_info "前端地址: http://localhost:$FRONTEND_PORT"
}

# Docker启动
start_docker() {
    log_step "使用Docker启动服务..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装"
        return 1
    fi
    
    docker-compose up -d
    log_info "Docker服务启动成功"
    log_info "访问地址: http://localhost:$BACKEND_PORT"
}

# 停止所有服务
stop_services() {
    log_step "停止所有服务..."
    
    # 停止后端
    if [ -f "$PID_DIR/backend.pid" ]; then
        local pid=$(cat $PID_DIR/backend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid && log_info "后端服务已停止"
        fi
        rm -f $PID_DIR/backend.pid
    fi
    
    # 停止前端
    if [ -f "$PID_DIR/frontend.pid" ]; then
        local pid=$(cat $PID_DIR/frontend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid && log_info "前端服务已停止"
        fi
        rm -f $PID_DIR/frontend.pid
    fi
    
    # 停止Docker
    if command -v docker-compose &> /dev/null; then
        if docker-compose ps -q 2>/dev/null | grep -q .; then
            docker-compose down && log_info "Docker服务已停止"
        fi
    fi
    
    log_info "所有服务已停止"
}

# 显示服务状态
show_status() {
    log_step "服务状态:"
    echo ""
    
    # 后端状态
    echo -e "${BLUE}[后端服务]${NC}"
    if [ -f "$PID_DIR/backend.pid" ]; then
        local pid=$(cat $PID_DIR/backend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "  状态: ${GREEN}运行中${NC}"
            echo -e "  PID: $pid"
            echo -e "  地址: http://localhost:$BACKEND_PORT"
            echo -e "  健康检查: $(curl -s http://localhost:$BACKEND_PORT/health | jq -r '.status' 2>/dev/null || echo 'N/A')"
        else
            echo -e "  状态: ${RED}已停止${NC}"
        fi
    else
        echo -e "  状态: ${RED}未启动${NC}"
    fi
    echo ""
    
    # 前端状态
    echo -e "${BLUE}[前端服务]${NC}"
    if [ -f "$PID_DIR/frontend.pid" ]; then
        local pid=$(cat $PID_DIR/frontend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "  状态: ${GREEN}运行中${NC}"
            echo -e "  PID: $pid"
            echo -e "  地址: http://localhost:$FRONTEND_PORT"
        else
            echo -e "  状态: ${RED}已停止${NC}"
        fi
    else
        echo -e "  状态: ${RED}未启动${NC}"
    fi
    echo ""
    
    # Docker状态
    if command -v docker-compose &> /dev/null; then
        echo -e "${BLUE}[Docker服务]${NC}"
        if docker-compose ps -q 2>/dev/null | grep -q .; then
            echo -e "  状态: ${GREEN}运行中${NC}"
            docker-compose ps
        else
            echo -e "  状态: ${RED}未启动${NC}"
        fi
        echo ""
    fi
    
    # 端口状态
    echo -e "${BLUE}[端口占用]${NC}"
    check_port $BACKEND_PORT && echo -e "  $BACKEND_PORT: ${GREEN}已使用${NC}" || echo -e "  $BACKEND_PORT: ${YELLOW}空闲${NC}"
    check_port $FRONTEND_PORT && echo -e "  $FRONTEND_PORT: ${GREEN}已使用${NC}" || echo -e "  $FRONTEND_PORT: ${YELLOW}空闲${NC}"
    echo ""
}

# 查看日志
show_logs() {
    local service=${1:-"all"}
    
    case $service in
        "backend"|"b")
            log_info "后端日志 (Ctrl+C 退出):"
            tail -f $LOG_DIR/backend.log
            ;;
        "frontend"|"f")
            log_info "前端日志 (Ctrl+C 退出):"
            tail -f $LOG_DIR/frontend.log
            ;;
        "all"|*)
            log_info "所有日志 (Ctrl+C 退出):"
            tail -f $LOG_DIR/*.log
            ;;
    esac
}

# 重启服务
restart_services() {
    stop_services
    sleep 2
    start_dev
}

# 开发模式启动
start_dev() {
    show_banner
    check_dependencies
    start_backend
    echo ""
    start_frontend
    echo ""
    
    log_info "========================================="
    log_info "所有服务启动完成！"
    log_info "========================================="
    log_info "后端API: http://localhost:$BACKEND_PORT"
    log_info "前端界面: http://localhost:$FRONTEND_PORT"
    log_info "健康检查: http://localhost:$BACKEND_PORT/health"
    log_info "API文档: 查看 README.md"
    log_info "========================================="
    log_info "使用 ./start.sh --status 查看状态"
    log_info "使用 ./start.sh --logs 查看日志"
    log_info "使用 ./start.sh --stop 停止服务"
    log_info "========================================="
}

# 主函数
main() {
    case "${1:-""}" in
        --dev|-d)
            start_dev
            ;;
        --prod|-p)
            show_banner
            start_docker
            ;;
        --stop|-s)
            stop_services
            ;;
        --status)
            show_status
            ;;
        --logs|-l)
            show_logs $2
            ;;
        --restart|-r)
            restart_services
            ;;
        --help|-h)
            show_banner
            echo "用法: ./start.sh [选项]"
            echo ""
            echo "选项:"
            echo "  --dev, -d       开发模式启动（前后端分离）"
            echo "  --prod, -p      生产模式启动（Docker部署）"
            echo "  --stop, -s      停止所有服务"
            echo "  --status        查看服务状态"
            echo "  --logs, -l      查看日志 [backend|frontend|all]"
            echo "  --restart, -r   重启服务"
            echo "  --help, -h      显示帮助信息"
            echo ""
            echo "示例:"
            echo "  ./start.sh --dev        # 开发模式启动"
            echo "  ./start.sh --status     # 查看状态"
            echo "  ./start.sh --logs backend  # 查看后端日志"
            echo ""
            ;;
        *)
            start_dev
            ;;
    esac
}

# 运行主函数
main "$@"
