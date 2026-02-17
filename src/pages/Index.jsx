import React from 'react';
import HotTopicVisualization from '../components/HotTopicVisualization';
import { RecentActivity } from '../components/RecentActivity';
import { WorkflowPanel } from '../components/WorkflowPanel';

const Index = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HotTopicVisualization />
        <RecentActivity />
      </div>
      <WorkflowPanel />
    </div>
  );
};

export default Index;
