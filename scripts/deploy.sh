#!/bin/bash

# AI内容流程平台 - 自动化部署脚本
# 支持开发、测试、生产环境的一键部署

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "AI内容流程平台部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --env <environment>    部署环境 (dev|test|prod)"
    echo "  --build               构建项目"
    echo "  --deploy              部署项目"
    echo "  --rollback            回滚到上一版本"
    echo "  --health-check        执行健康检查"
    echo "  --backup              创建备份"
    echo "  --clean               清理旧版本"
    echo "  --help                显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --env prod --build --deploy"
    echo "  $0 --env test --health-check"
    echo "  $0 --rollback"
}

# 检查必要工具
check_requirements() {
    log "检查必要工具..."
    
    local missing_tools=()
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    # 检查Docker (可选)
    if ! command -v docker &> /dev/null; then
        warning "Docker未安装，将使用传统部署方式"
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        missing_tools+=("git")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "缺少必要工具: ${missing_tools[*]}"
        exit 1
    fi
    
    success "所有必要工具检查通过"
}

# 加载环境配置
load_config() {
    local env=$1
    local config_file=""
    
    case $env in
        "dev")
            config_file=".env.development"
            ;;
        "test")
            config_file=".env.test"
            ;;
        "prod")
            config_file=".env.production"
            ;;
        *)
            error "无效的环境: $env"
            exit 1
            ;;
    esac
    
    if [ -f "$config_file" ]; then
        log "加载配置文件: $config_file"
        export $(cat $config_file | xargs)
    else
        warning "配置文件不存在: $config_file，使用默认配置"
    fi
}

# 构建项目
build_project() {
    log "开始构建项目..."
    
    # 清理之前的构建
    log "清理构建目录..."
    rm -rf dist/ build/ .next/
    
    # 安装依赖
    log "安装依赖..."
    npm ci --prefer-offline --no-audit
    
    # 运行测试
    if [ "$SKIP_TESTS" != "true" ]; then
        log "运行测试..."
        npm run test || {
            error "测试失败，停止构建"
            exit 1
        }
    else
        warning "跳过测试"
    fi
    
    # 代码质量检查
    log "代码质量检查..."
    npm run lint
    
    # 构建前端
    log "构建前端..."
    npm run build
    
    # 构建后端 (如果有)
    if [ -f "server/package.json" ]; then
        log "构建后端..."
        cd server
        npm ci --prefer-offline --no-audit
        cd ..
    fi
    
    success "项目构建完成"
}

# 创建备份
create_backup() {
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    
    log "创建备份到: $backup_dir"
    
    mkdir -p "$backup_dir"
    
    # 备份当前部署
    if [ -d "dist" ]; then
        cp -r dist "$backup_dir/"
    fi
    
    if [ -d "server" ]; then
        cp -r server "$backup_dir/"
    fi
    
    # 备份配置文件
    for config in .env*; do
        if [ -f "$config" ]; then
            cp "$config" "$backup_dir/"
        fi
    done
    
    # 备份package.json
    cp package.json "$backup_dir/"
    
    # 创建备份信息文件
    cat > "$backup_dir/backup-info.txt" << EOF
备份时间: $(date)
环境: $ENVIRONMENT
Git分支: $(git branch --show-current 2>/dev/null || echo "unknown")
Git提交: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
EOF
    
    success "备份创建完成: $backup_dir"
}

# 部署项目
deploy_project() {
    log "开始部署项目到 $ENVIRONMENT 环境..."
    
    # 创建备份
    if [ "$CREATE_BACKUP" == "true" ]; then
        create_backup
    fi
    
    # 停止当前服务
    log "停止当前服务..."
    pm2 stop ai-content-flow 2>/dev/null || true
    
    # 复制构建文件
    log "部署文件..."
    mkdir -p /opt/ai-content-flow
    
    if [ -d "dist" ]; then
        rsync -av --delete dist/ /opt/ai-content-flow/dist/
    fi
    
    if [ -d "server" ]; then
        rsync -av --delete server/ /opt/ai-content-flow/server/
    fi
    
    # 复制配置文件
    for config in .env*; do
        if [ -f "$config" ]; then
            cp "$config" /opt/ai-content-flow/
        fi
    done
    
    # 复制package.json
    cp package.json /opt/ai-content-flow/
    
    # 安装生产依赖
    log "安装生产依赖..."
    cd /opt/ai-content-flow
    npm ci --only=production --prefer-offline --no-audit
    
    # 启动服务
    log "启动服务..."
    pm2 start ecosystem.config.js --env $ENVIRONMENT
    
    # 保存PM2配置
    pm2 save
    
    success "项目部署完成"
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    local health_endpoints=(
        "http://localhost:5001/api/monitoring/health"
        "http://localhost:5001/api/monitoring/system"
        "http://localhost:5174"  # 前端
    )
    
    local all_healthy=true
    
    for endpoint in "${health_endpoints[@]}"; do
        log "检查 $endpoint..."
        
        if curl -f -s --max-time 10 "$endpoint" > /dev/null; then
            success "✓ $endpoint 健康"
        else
            error "✗ $endpoint 不健康"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        success "所有服务健康检查通过"
        return 0
    else
        error "部分服务健康检查失败"
        return 1
    fi
}

# 回滚部署
rollback() {
    log "查找最近的备份..."
    
    local backups_dir="backups"
    if [ ! -d "$backups_dir" ]; then
        error "备份目录不存在"
        exit 1
    fi
    
    local latest_backup=$(ls -t "$backups_dir" | head -n 1)
    if [ -z "$latest_backup" ]; then
        error "没有找到备份"
        exit 1
    fi
    
    local backup_path="$backups_dir/$latest_backup"
    log "回滚到备份: $backup_path"
    
    # 停止当前服务
    pm2 stop ai-content-flow 2>/dev/null || true
    
    # 恢复备份
    log "恢复文件..."
    rsync -av --delete "$backup_path/" /opt/ai-content-flow/
    
    # 重新安装依赖
    cd /opt/ai-content-flow
    npm ci --only=production --prefer-offline --no-audit
    
    # 启动服务
    pm2 start ecosystem.config.js
    
    success "回滚完成"
}

# 清理旧版本
cleanup() {
    log "清理旧版本..."
    
    local backups_dir="backups"
    local keep_count=${KEEP_BACKUPS:-5}
    
    if [ ! -d "$backups_dir" ]; then
        warning "备份目录不存在"
        return
    fi
    
    local backup_count=$(ls -1 "$backups_dir" | wc -l)
    if [ "$backup_count" -le "$keep_count" ]; then
        log "备份数量 ($backup_count) 小于保留数量 ($keep_count)，无需清理"
        return
    fi
    
    log "保留最新的 $keep_count 个备份，删除其余备份..."
    
    ls -t "$backups_dir" | tail -n +$((keep_count + 1)) | while read -r backup; do
        log "删除旧备份: $backup"
        rm -rf "$backups_dir/$backup"
    done
    
    success "清理完成"
}

# 主函数
main() {
    # 默认参数
    ENVIRONMENT="dev"
    CREATE_BACKUP="true"
    SKIP_TESTS="false"
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --build)
                BUILD="true"
                shift
                ;;
            --deploy)
                DEPLOY="true"
                shift
                ;;
            --rollback)
                ROLLBACK="true"
                shift
                ;;
            --health-check)
                HEALTH_CHECK="true"
                shift
                ;;
            --backup)
                BACKUP="true"
                shift
                ;;
            --clean)
                CLEAN="true"
                shift
                ;;
            --skip-tests)
                SKIP_TESTS="true"
                shift
                ;;
            --no-backup)
                CREATE_BACKUP="false"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log "开始执行部署流程..."
    log "环境: $ENVIRONMENT"
    
    # 检查必要工具
    check_requirements
    
    # 加载配置
    load_config "$ENVIRONMENT"
    
    # 执行相应操作
    if [ "$BUILD" == "true" ]; then
        build_project
    fi
    
    if [ "$DEPLOY" == "true" ]; then
        deploy_project
    fi
    
    if [ "$HEALTH_CHECK" == "true" ]; then
        health_check
    fi
    
    if [ "$ROLLBACK" == "true" ]; then
        rollback
    fi
    
    if [ "$BACKUP" == "true" ]; then
        create_backup
    fi
    
    if [ "$CLEAN" == "true" ]; then
        cleanup
    fi
    
    success "部署流程执行完成"
}

# 执行主函数
main "$@"