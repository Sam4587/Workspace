"""
AI 内容创作系统 MCP 服务器
借鉴 TrendRadar FastMCP 设计，暴露标准化工具和资源
"""

import httpx
from mcp.server.fastmcp import FastMCP

# 创建 MCP 服务器实例
mcp = FastMCP("AI-Content-Creator")

# 后端 API 基础地址
API_BASE_URL = "http://localhost:5001/api"


async def call_api(method: str, endpoint: str, data: dict = None):
    """调用后端 API"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"{API_BASE_URL}{endpoint}"
        if method == "GET":
            response = await client.get(url)
        elif method == "POST":
            response = await client.post(url, json=data)
        elif method == "PUT":
            response = await client.put(url, json=data)
        elif method == "DELETE":
            response = await client.delete(url)
        else:
            raise ValueError(f"Unsupported method: {method}")
        return response.json()


# ==================== 热点相关工具 ====================

@mcp.tool()
async def get_hot_topics(source: str = "all", limit: int = 20) -> dict:
    """获取热点话题列表

    Args:
        source: 数据源 (weibo/toutiao/zhihu/all)
        limit: 返回数量限制

    Returns:
        热点话题列表
    """
    params = {"limit": limit}
    if source != "all":
        params["source"] = source

    result = await call_api("GET", f"/hot-topics?{'&'.join(f'{k}={v}' for k, v in params.items())}")
    return result


@mcp.tool()
async def update_hot_topics() -> dict:
    """手动触发热点数据更新

    Returns:
        更新结果
    """
    return await call_api("POST", "/hot-topics/update")


@mcp.tool()
async def analyze_topic(topic_id: str) -> dict:
    """AI 分析热点话题

    Args:
        topic_id: 话题 ID

    Returns:
        AI 分析结果
    """
    return await call_api("GET", f"/hot-topics/{topic_id}")


@mcp.tool()
async def get_topic_trend(topic_id: str, days: int = 7) -> dict:
    """获取热点话题趋势

    Args:
        topic_id: 话题 ID
        days: 统计天数

    Returns:
        趋势分析数据
    """
    return await call_api("GET", f"/hot-topics/trends/timeline/{topic_id}?days={days}")


@mcp.tool()
async def get_cross_platform_analysis(title: str) -> dict:
    """跨平台热点分析

    Args:
        title: 热点标题关键词

    Returns:
        跨平台分析结果
    """
    import urllib.parse
    encoded_title = urllib.parse.quote(title)
    return await call_api("GET", f"/hot-topics/trends/cross-platform/{encoded_title}")


# ==================== 内容生成相关工具 ====================

@mcp.tool()
async def generate_content(
    topic: str,
    content_type: str = "article",
    style: str = "professional",
    length: int = 1000,
    keywords: list = None
) -> dict:
    """基于热点生成内容

    Args:
        topic: 热点话题或标题
        content_type: 内容类型 (article/micro_post/video_script/audio_script)
        style: 内容风格 (professional/casual/humorous/formal)
        length: 目标字数
        keywords: 关键词列表

    Returns:
        生成的内容
    """
    data = {
        "formData": {
            "topic": topic,
            "type": content_type,
            "style": style,
            "length": length,
            "keywords": keywords or []
        },
        "type": content_type
    }
    return await call_api("POST", "/content/generate", data)


@mcp.tool()
async def get_content_list(page: int = 1, limit: int = 20, status: str = None) -> dict:
    """获取内容列表

    Args:
        page: 页码
        limit: 每页数量
        status: 状态筛选 (draft/published/pending)

    Returns:
        内容列表
    """
    params = {"page": page, "limit": limit}
    if status:
        params["status"] = status

    return await call_api("GET", f"/content?{'&'.join(f'{k}={v}' for k, v in params.items())}")


@mcp.tool()
async def get_content_detail(content_id: str) -> dict:
    """获取内容详情

    Args:
        content_id: 内容 ID

    Returns:
        内容详情
    """
    return await call_api("GET", f"/content/{content_id}")


@mcp.tool()
async def update_content(content_id: str, title: str = None, content: str = None) -> dict:
    """更新内容

    Args:
        content_id: 内容 ID
        title: 新标题
        content: 新内容

    Returns:
        更新结果
    """
    data = {}
    if title:
        data["title"] = title
    if content:
        data["content"] = content

    return await call_api("PUT", f"/content/{content_id}", data)


# ==================== 发布相关工具 ====================

@mcp.tool()
async def publish_to_platform(content_id: str, platform: str = "toutiao", scheduled_time: str = None) -> dict:
    """发布内容到平台

    Args:
        content_id: 内容 ID
        platform: 目标平台 (toutiao/douyin/weibo)
        scheduled_time: 定时发布时间 (ISO 8601 格式)

    Returns:
        发布结果
    """
    data = {"contentId": content_id}
    if scheduled_time:
        data["scheduledTime"] = scheduled_time

    return await call_api("POST", f"/publish/{platform}", data)


@mcp.tool()
async def get_publish_queue(page: int = 1, limit: int = 20) -> dict:
    """获取发布队列

    Args:
        page: 页码
        limit: 每页数量

    Returns:
        发布队列列表
    """
    return await call_api("GET", f"/publish/queue?page={page}&limit={limit}")


@mcp.tool()
async def get_publish_history(page: int = 1, limit: int = 20) -> dict:
    """获取发布历史

    Args:
        page: 页码
        limit: 每页数量

    Returns:
        发布历史列表
    """
    return await call_api("GET", f"/publish/history?page={page}&limit={limit}")


# ==================== 数据分析相关工具 ====================

@mcp.tool()
async def get_analytics_overview() -> dict:
    """获取数据分析概览

    Returns:
        数据分析概览
    """
    return await call_api("GET", "/analytics/overview")


@mcp.tool()
async def get_views_trend(days: int = 7) -> dict:
    """获取浏览量趋势

    Args:
        days: 统计天数

    Returns:
        浏览量趋势数据
    """
    return await call_api("GET", f"/analytics/views-trend?days={days}")


@mcp.tool()
async def get_top_content(limit: int = 10) -> dict:
    """获取热门内容排行

    Args:
        limit: 返回数量

    Returns:
        热门内容列表
    """
    return await call_api("GET", f"/analytics/top-content?limit={limit}")


@mcp.tool()
async def get_content_type_distribution() -> dict:
    """获取内容类型分布

    Returns:
        内容类型分布数据
    """
    return await call_api("GET", "/analytics/content-types")


# ==================== MCP 资源定义 ====================

@mcp.resource("analytics://overview")
async def get_analytics_overview_resource() -> dict:
    """数据分析概览资源"""
    return await call_api("GET", "/analytics/overview")


@mcp.resource("trends://daily")
async def get_daily_trends_resource() -> dict:
    """每日热点趋势资源"""
    return await call_api("GET", "/hot-topics?limit=20")


@mcp.resource("content://templates")
async def get_content_templates_resource() -> dict:
    """内容模板资源"""
    return {
        "templates": [
            {
                "type": "article",
                "name": "长文章",
                "description": "深度分析类长文章，适合今日头条、微信公众号"
            },
            {
                "type": "micro_post",
                "name": "微头条",
                "description": "短小精悍的微头条，适合快速传播"
            },
            {
                "type": "video_script",
                "name": "视频脚本",
                "description": "短视频脚本，适合抖音、快手"
            },
            {
                "type": "audio_script",
                "name": "音频脚本",
                "description": "播客/音频内容脚本"
            }
        ]
    }


# ==================== 启动服务器 ====================

if __name__ == "__main__":
    mcp.run()
