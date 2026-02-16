import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';

// 标题卡片组件
const TitleCard = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 30], [0, 1]);
  const titleScale = spring({ frame, from: 0.8, to: 1, fps: 30 });

  return (
    <div style={{
      position: 'absolute',
      top: '20%',
      left: '10%',
      right: '10%',
      textAlign: 'center',
      opacity: titleOpacity,
      transform: `scale(${titleScale})`,
    }}>
      <h1 style={{
        fontSize: '4rem',
        fontWeight: 'bold',
        color: '#ffffff',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        margin: '0 0 20px 0',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{
          fontSize: '1.5rem',
          color: '#cccccc',
          margin: 0,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

// 文字覆盖组件
const TextOverlay = ({ text, startFrame, duration }) => {
  const frame = useCurrentFrame();
  const showFrame = frame >= startFrame;
  const hideFrame = frame >= startFrame + duration;
  
  if (!showFrame || hideFrame) return null;

  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1]);
  const opacity = Math.min(progress * 2, 1);
  const translateY = interpolate(progress, [0, 1], [50, 0]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '20%',
      left: '10%',
      right: '10%',
      opacity,
      transform: `translateY(${translateY}px)`,
    }}>
      <p style={{
        fontSize: '1.8rem',
        lineHeight: '1.6',
        color: '#ffffff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        textAlign: 'center',
        margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
};

// 图片幻灯片组件
const ImageSlide = ({ image, startFrame, duration }) => {
  const frame = useCurrentFrame();
  const showFrame = frame >= startFrame;
  const hideFrame = frame >= startFrame + duration;
  
  if (!showFrame || hideFrame) return null;

  const progress = interpolate(frame, [startFrame, startFrame + 15, startFrame + duration - 15, startFrame + duration], [0, 1, 1, 0]);
  const opacity = Math.min(progress * 2, 1, (1 - progress) * 2);
  const scale = interpolate(progress, [0, 1], [0.9, 1]);

  return (
    <div style={{
      position: 'absolute',
      top: '30%',
      left: '15%',
      right: '15%',
      height: '40%',
      opacity,
      transform: `scale(${scale})`,
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <img 
        src={image} 
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        alt=""
      />
    </div>
  );
};

// 背景音乐组件
const BGM = ({ src }) => {
  // 在实际实现中，这里会处理音频播放
  return null;
};

// 主要的文章视频组件
export const ArticleVideo = ({ title, subtitle, content, images = [], backgroundMusic }) => {
  const frame = useCurrentFrame();
  
  // 背景渐变
  const backgroundGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <AbsoluteFill style={{ 
      background: backgroundGradient,
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* 标题展示 (0-90帧) */}
      <TitleCard title={title} subtitle={subtitle} />
      
      {/* 内容展示 (90-210帧) */}
      {content && (
        <TextOverlay 
          text={content} 
          startFrame={90} 
          duration={120} 
        />
      )}
      
      {/* 图片轮播 (210帧开始) */}
      {images.map((image, index) => (
        <ImageSlide
          key={index}
          image={image}
          startFrame={210 + index * 90}
          duration={90}
        />
      ))}
      
      {/* 背景音乐 */}
      {backgroundMusic && <BGM src={backgroundMusic} />}
    </AbsoluteFill>
  );
};

// 导出composition配置
export const articleVideoConfig = {
  id: 'ArticleVideo',
  component: ArticleVideo,
  durationInFrames: 300, // 10秒 (30fps)
  fps: 30,
  width: 1920,
  height: 1080,
};