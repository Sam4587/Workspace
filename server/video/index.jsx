/**
 * Remotion项目入口文件
 * 注册所有视频模板组件
 */

import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import React from 'react';

// 导入视频模板组件
import { ArticleVideo, articleVideoConfig } from './compositions/ArticleVideo.jsx';
import { MicroVideo, microVideoConfig } from './compositions/MicroVideo.jsx';

// 根组件
const RemotionRoot = () => {
  return (
    <>
      {/* 文章视频模板 */}
      <Composition
        id={articleVideoConfig.id}
        component={ArticleVideo}
        durationInFrames={articleVideoConfig.durationInFrames}
        fps={articleVideoConfig.fps}
        width={articleVideoConfig.width}
        height={articleVideoConfig.height}
        defaultProps={articleVideoConfig.defaultProps || {
          title: '默认文章标题',
          subtitle: '默认副标题',
          content: '这是默认的文章内容...',
          images: []
        }}
      />

      {/* 微头条视频模板 */}
      <Composition
        id={microVideoConfig.id}
        component={MicroVideo}
        durationInFrames={microVideoConfig.durationInFrames}
        fps={microVideoConfig.fps}
        width={microVideoConfig.width}
        height={microVideoConfig.height}
        defaultProps={microVideoConfig.defaultProps || {
          title: '默认微头条标题',
          content: '这是默认的微头条内容...',
          username: '创作者'
        }}
      />
    </>
  );
};

// 注册根组件
registerRoot(RemotionRoot);