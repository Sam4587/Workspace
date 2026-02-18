import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter } from 'lucide-react';

const sources = [
  { id: 'all', label: '全部来源' },
  { id: 'weibo', label: '微博热搜' },
  { id: 'zhihu', label: '知乎' },
  { id: 'toutiao', label: '今日头条' },
  { id: 'baidu', label: '百度热搜' },
  { id: 'douyin', label: '抖音' },
  { id: 'bilibili', label: '哔哩哔哩' },
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'tieba', label: '贴吧热议' },
  { id: 'thepaper', label: '澎湃新闻' },
  { id: 'ifeng', label: '凤凰网' },
  { id: 'wallstreetcn-hot', label: '华尔街见闻' },
  { id: 'cls-hot', label: '财联社热门' },
  { id: 'bilibili-hot-search', label: 'B站热搜' },
];

const categories = [
  { id: 'all', label: '全部分类' },
  { id: 'hot', label: '热门' },
  { id: 'social', label: '社会' },
  { id: 'tech', label: '科技' },
  { id: 'entertainment', label: '娱乐' },
];

export const FilterPanel = ({ filters, setFilters, onApply, onReset }) => {
  const handleSourceChange = (value) => {
    setFilters({ ...filters, source: value });
  };

  const handleCategoryChange = (value) => {
    setFilters({ ...filters, category: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          筛选条件
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-2 block">来源</label>
          <Select
            value={filters.source || 'all'}
            onValueChange={handleSourceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择来源" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-xs font-medium mb-2 block">分类</label>
          <Select
            value={filters.category || 'all'}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReset}
          className="w-full"
        >
          重置筛选
        </Button>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
