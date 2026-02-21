import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HotTopicVisualization from '../components/HotTopicVisualization';
import RecentActivity from '../components/RecentActivity';
import WorkflowPanel from '../components/WorkflowPanel';
import TopicCard from '../components/TopicCard';
import { CheckSquare, Square, ArrowRight, TrendingUp } from 'lucide-react';
import api from '../lib/api';

const Index = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicsList, setShowTopicsList] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getHotTopics({ hours: 24, limit: 10, sortBy: 'heat', sortOrder: 'desc' });
        if (response.success) {
          const data = response.data || [];
          setTopics(data);
          if (data.length > 0 && !selectedTopic) {
            setSelectedTopic(data[0]);
          }
        }
      } catch (error) {
        console.error('获取热点数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleContentGenerated = (contentId) => {
    if (contentId) {
      navigate('/content-creation', { state: { contentId } });
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-4">
        <h1 className="text-4xl font-bold text-gray-900">总览</h1>
        <p className="mt-2 text-gray-600">查看和管理您的内容创作流程</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                热门话题
              </h3>
              <button
                onClick={() => setShowTopicsList(!showTopicsList)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showTopicsList ? '收起' : '展开'}
              </button>
            </div>
            
            {showTopicsList && (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">加载中...</p>
                  </div>
                ) : topics.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">暂无热点话题</p>
                  </div>
                ) : (
                  topics.map((topic) => (
                    <div
                      key={topic._id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedTopic?._id === topic._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTopic(selectedTopic?._id === topic._id ? null : topic);
                          }}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {selectedTopic?._id === topic._id ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{topic.title}</h4>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-orange-500" />
                              {topic.heat}
                            </span>
                            <span>{new Date(topic.publishedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <RecentActivity />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <HotTopicVisualization topics={topics} loading={loading} />
          
          <WorkflowPanel 
            topic={selectedTopic} 
            onContentGenerated={handleContentGenerated}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
