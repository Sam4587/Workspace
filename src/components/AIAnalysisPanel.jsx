import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Brain, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

export const AIAnalysisPanel = ({ analysis }) => {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a topic to see AI analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Brain className="h-4 w-4" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Trend Score</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${analysis.score || 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {analysis.score || 0}/100
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Sentiment</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {analysis.sentiment || 'Neutral'}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Suggestions</span>
          </div>
          <ul className="space-y-1">
            {(analysis.suggestions || []).map((suggestion, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAnalysisPanel;
