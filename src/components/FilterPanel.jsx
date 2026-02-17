import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter } from 'lucide-react';

const sources = [
  { id: 'all', label: 'All Sources' },
  { id: 'weibo', label: 'Weibo' },
  { id: 'zhihu', label: 'Zhihu' },
  { id: 'toutiao', label: 'Toutiao' },
  { id: 'baidu', label: 'Baidu' },
];

const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'hot', label: 'Hot' },
  { id: 'social', label: 'Social' },
  { id: 'tech', label: 'Tech' },
  { id: 'entertainment', label: 'Entertainment' },
];

export const FilterPanel = ({ filters, onFilterChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-2 block">Source</label>
          <Select
            value={filters.source || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, source: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
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
          <label className="text-xs font-medium mb-2 block">Category</label>
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => onFilterChange({ ...filters, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
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
          onClick={() => onFilterChange({ source: 'all', category: 'all' })}
          className="w-full"
        >
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
