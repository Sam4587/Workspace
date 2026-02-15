# MCP 发布工具 Makefile

.PHONY: build clean test

# 默认目标
all: build

# 编译所有工具
build: build-xiaohongshu build-douyin-toutiao

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

# 测试抖音工具
test-douyin:
	cd douyin-toutiao && go test ./... -v

# 测试小红书工具
test-xiaohongshu:
	cd xiaohongshu-publisher && go test ./... -v

# 安装依赖
deps:
	cd xiaohongshu-publisher && go mod tidy
	cd douyin-toutiao && go mod tidy

# 显示帮助
help:
	@echo "MCP 发布工具构建命令:"
	@echo "  make build              - 编译所有工具"
	@echo "  make build-xiaohongshu  - 编译小红书工具"
	@echo "  make build-douyin-toutiao - 编译抖音/头条工具"
	@echo "  make clean              - 清理编译产物"
	@echo "  make deps               - 安装依赖"
	@echo "  make test-douyin        - 测试抖音工具"
	@echo "  make test-xiaohongshu   - 测试小红书工具"
