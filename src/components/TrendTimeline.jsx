import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Clock, ArrowUpRight } from 'lucide-react';

export const TrendTimeline = ({ trends = [] }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Trend Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trend data available
            </p>
          ) : (
            trends.map((trend, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {index < trends.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{trend.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(trend.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{trend.source}</span>
                    <span className="flex items-center text-xs text-green-500">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {trend.hotScore || 0}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendTimeline;
