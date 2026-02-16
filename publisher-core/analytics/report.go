package analytics

import (
	"encoding/json"
	"fmt"
	"time"
)

// ReportGenerator 报告生成器
type ReportGenerator struct {
	storage MetricsStorage
}

// NewReportGenerator 创建报告生成器
func NewReportGenerator(storage MetricsStorage) *ReportGenerator {
	return &ReportGenerator{
		storage: storage,
	}
}

// Report 报告结构
type Report struct {
	GeneratedAt time.Time      `json:"generated_at"`
	Period      TimeRange      `json:"period"`
	Summary     ReportSummary  `json:"summary"`
	Platforms   []PlatformData `json:"platforms"`
	TopPosts    []*PostMetrics `json:"top_posts"`
	Insights    []string       `json:"insights"`
}

// ReportSummary 报告摘要
type ReportSummary struct {
	TotalPosts      int64   `json:"total_posts"`
	TotalViews      int64   `json:"total_views"`
	TotalLikes      int64   `json:"total_likes"`
	TotalComments   int64   `json:"total_comments"`
	TotalShares     int64   `json:"total_shares"`
	AvgEngagement   float64 `json:"avg_engagement"`
	GrowthRate      float64 `json:"growth_rate"`
}

// PlatformData 平台数据
type PlatformData struct {
	Platform        Platform `json:"platform"`
	Posts           int64    `json:"posts"`
	Views           int64    `json:"views"`
	Likes           int64    `json:"likes"`
	Comments        int64    `json:"comments"`
	Engagement      float64  `json:"engagement"`
	BestPerforming  string   `json:"best_performing"`
	GrowthRate      float64  `json:"growth_rate"`
}

// GenerateWeeklyReport 生成周报
func (g *ReportGenerator) GenerateWeeklyReport() (*Report, error) {
	end := time.Now()
	start := end.AddDate(0, 0, -7)
	
	return g.GenerateReport(TimeRange{Start: start, End: end})
}

// GenerateMonthlyReport 生成月报
func (g *ReportGenerator) GenerateMonthlyReport() (*Report, error) {
	end := time.Now()
	start := end.AddDate(0, -1, 0)
	
	return g.GenerateReport(TimeRange{Start: start, End: end})
}

// GenerateReport 生成报告
func (g *ReportGenerator) GenerateReport(period TimeRange) (*Report, error) {
	report := &Report{
		GeneratedAt: time.Now(),
		Period:      period,
		Platforms:   []PlatformData{},
		TopPosts:    []*PostMetrics{},
		Insights:    []string{},
	}

	// 收集各平台数据
	platforms := []Platform{PlatformDouyin, PlatformXiaohongshu, PlatformToutiao}
	
	for _, platform := range platforms {
		stats, err := g.storage.GetDailyStats(platform, period.Start, period.End)
		if err != nil {
			continue
		}
		
		platformData := PlatformData{
			Platform: platform,
		}
		
		for _, s := range stats {
			platformData.Posts += int64(s.PostsCount)
			platformData.Views += s.TotalViews
			platformData.Likes += s.TotalLikes
			platformData.Comments += s.TotalComments
			
			report.Summary.TotalPosts += int64(s.PostsCount)
			report.Summary.TotalViews += s.TotalViews
			report.Summary.TotalLikes += s.TotalLikes
			report.Summary.TotalComments += s.TotalComments
			report.Summary.TotalShares += s.TotalShares
		}
		
		if platformData.Views > 0 {
			platformData.Engagement = CalculateEngagement(
				platformData.Likes,
				platformData.Comments,
				0,
				platformData.Views,
			)
		}
		
		report.Platforms = append(report.Platforms, platformData)
	}

	// 计算平均互动率
	if report.Summary.TotalViews > 0 {
		report.Summary.AvgEngagement = CalculateEngagement(
			report.Summary.TotalLikes,
			report.Summary.TotalComments,
			report.Summary.TotalShares,
			report.Summary.TotalViews,
		)
	}

	// 获取热门帖子
	for _, platform := range platforms {
		posts, err := g.storage.ListPostMetrics(platform, 5)
		if err == nil && len(posts) > 0 {
			report.TopPosts = append(report.TopPosts, posts...)
		}
	}

	// 生成洞察
	report.Insights = g.generateInsights(report)

	return report, nil
}

// generateInsights 生成洞察
func (g *ReportGenerator) generateInsights(report *Report) []string {
	insights := []string{}
	
	// 总体表现
	if report.Summary.TotalPosts > 0 {
		avgViews := report.Summary.TotalViews / report.Summary.TotalPosts
		insights = append(insights,
			fmt.Sprintf("本周期共发布 %d 条内容，平均每条获得 %d 次浏览",
				report.Summary.TotalPosts, avgViews))
	}
	
	// 互动率分析
	if report.Summary.AvgEngagement > 5.0 {
		insights = append(insights,
			"整体互动率表现优秀，内容质量较高")
	} else if report.Summary.AvgEngagement > 2.0 {
		insights = append(insights,
			"互动率处于中等水平，可尝试优化内容形式")
	} else {
		insights = append(insights,
			"互动率偏低，建议加强内容质量和发布时机优化")
	}
	
	// 平台对比
	if len(report.Platforms) > 0 {
		bestPlatform := report.Platforms[0]
		for _, p := range report.Platforms {
			if p.Views > bestPlatform.Views {
				bestPlatform = p
			}
		}
		insights = append(insights,
			fmt.Sprintf("%s 平台表现最佳，建议加大该平台内容投入",
				bestPlatform.Platform))
	}
	
	return insights
}

// ExportJSON 导出JSON格式报告
func (g *ReportGenerator) ExportJSON(report *Report) (string, error) {
	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ExportMarkdown 导出Markdown格式报告
func (g *ReportGenerator) ExportMarkdown(report *Report) string {
	md := fmt.Sprintf("# 数据分析报告

")
	md += fmt.Sprintf("**生成时间**: %s

", report.GeneratedAt.Format("2006-01-02 15:04:05"))
	md += fmt.Sprintf("**报告周期**: %s 至 %s

",
		report.Period.Start.Format("2006-01-02"),
		report.Period.End.Format("2006-01-02"))
	
	md += "## 总体概览

"
	md += fmt.Sprintf("- 总发布数: %d
", report.Summary.TotalPosts)
	md += fmt.Sprintf("- 总浏览量: %d
", report.Summary.TotalViews)
	md += fmt.Sprintf("- 总点赞数: %d
", report.Summary.TotalLikes)
	md += fmt.Sprintf("- 总评论数: %d
", report.Summary.TotalComments)
	md += fmt.Sprintf("- 平均互动率: %.2f%%

", report.Summary.AvgEngagement)
	
	md += "## 平台数据

"
	for _, p := range report.Platforms {
		md += fmt.Sprintf("### %s

", p.Platform)
		md += fmt.Sprintf("- 发布数: %d
", p.Posts)
		md += fmt.Sprintf("- 浏览量: %d
", p.Views)
		md += fmt.Sprintf("- 点赞数: %d
", p.Likes)
		md += fmt.Sprintf("- 互动率: %.2f%%

", p.Engagement)
	}
	
	md += "## 数据洞察

"
	for i, insight := range report.Insights {
		md += fmt.Sprintf("%d. %s
", i+1, insight)
	}
	
	return md
}
