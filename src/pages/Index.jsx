import React, { useEffect, useState } from 'react';
import HotTopicVisualization from '../components/HotTopicVisualization';
import RecentActivity from '../components/RecentActivity';
import WorkflowPanel from '../components/WorkflowPanel';
import api from '../lib/api';

const Index = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getHotTopics({ hours: 24 });
        if (response.success) {
          setTopics(response.data || []);
        }
      } catch (error) {
        console.error('获取热点数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="pb-4">
        <h1 className="text-4xl font-bold text-gray-900">总览</h1>
        <p className="mt-2 text-gray-600">查看和管理您的内容创作流程</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <HotTopicVisualization topics={topics} loading={loading} />
        </div>
        <div className="space-y-8">
          <RecentActivity />
          <WorkflowPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
