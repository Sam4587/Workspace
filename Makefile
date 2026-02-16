# MCP 发布工具 Makefile

.PHONY: build clean test all build-core build-web

# 默认目标
all: build

# 编译所有工具（包括新的核心库和前端）
build: build-core build-web build-xiaohongshu build-douyin-toutiao

# 编译核心库和统一工具
build-core:
	@echo "Building publisher-core..."
	cd publisher-core && go mod tidy
	cd publisher-core && go build -o ../bin/publisher ./cmd/cli
	cd publisher-core && go build -o ../bin/publisher-server ./cmd/server

# 编译前端 Web 界面
build-web:
	@echo "Building publisher-web..."
	cd publisher-web && npm install
	cd publisher-web && npm run build

# 编译小红书工具
build-xiaohongshu:
	@echo "Building xiaohongshu-publisher..."
	cd xiaohongshu-publisher && go build -o xhs-publisher .

# 编译抖音/头条工具
build-douyin-toutiao:
	@echo "Building douyin-toutiao publisher..."
	cd douyin-toutiao && go build -o publisher .

# 清理编译产物
clean:
	rm -f xiaohongshu-publisher/xhs-publisher
	rm -f xiaohongshu-publisher/xiaohongshu-publisher
	rm -f douyin-toutiao/publisher
	rm -f douyin-toutiao/xiaohongshu-publisher
	rm -rf bin/
	rm -rf publisher-web/dist/

# 测试
test:
	cd publisher-core && go test ./... -v
	cd douyin-toutiao && go test ./... -v

# 测试抖音工具
test-douyin:
	cd douyin-toutiao && go test ./... -v

# 测试小红书工具
test-xiaohongshu:
	cd xiaohongshu-publisher && go test ./... -v

# 测试核心库
test-core:
	cd publisher-core && go test ./... -v

# 安装依赖
deps:
	cd publisher-core && go mod tidy
	cd xiaohongshu-publisher && go mod tidy
	cd douyin-toutiao && go mod tidy
	cd publisher-web && npm install

# 启动 API 服务
serve:
	./bin/publisher-server -port 8080

# 启动前端开发服务器
serve-web:
	cd publisher-web && npm run dev

# 启动所有服务（后端 + 前端）
dev:
	@echo "Starting development servers..."
	@./bin/publisher-server -port 8080 &
	@cd publisher-web && npm run dev

# 显示帮助
help:
	@echo "MCP 发布工具构建命令:"
	@echo "  make build              - 编译所有工具（包括核心库和前端）"
	@echo "  make build-core         - 编译核心库和统一工具"
	@echo "  make build-web          - 编译前端 Web 界面"
	@echo "  make build-xiaohongshu  - 编译小红书工具"
	@echo "  make build-douyin-toutiao - 编译抖音/头条工具"
	@echo "  make clean              - 清理编译产物"
	@echo "  make deps               - 安装依赖"
	@echo "  make test               - 运行所有测试"
	@echo "  make test-core          - 测试核心库"
	@echo "  make serve              - 启动 API 服务"
	@echo "  make serve-web          - 启动前端开发服务器"
	@echo "  make dev                - 启动所有开发服务"
