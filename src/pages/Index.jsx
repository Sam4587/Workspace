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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">总览</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HotTopicVisualization topics={topics} loading={loading} />
        <RecentActivity />
      </div>
      <WorkflowPanel />
    </div>
  );
};

export default Index;
