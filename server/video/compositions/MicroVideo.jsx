import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, Sequence } from 'remotion';

// 竖版视频容器
const VerticalContainer = ({ children }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 30px',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  );
};

// 头部信息组件
const HeaderInfo = ({ avatar, username, time }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const translateY = interpolate(frame, [0, 15], [20, 0]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '30px',
      opacity,
      transform: `translateY(${translateY}px)`,
      width: '100%',
    }}>
      {avatar && (
        <img 
          src={avatar} 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            marginRight: '15px',
            border: '2px solid #ffffff',
          }}
          alt=""
        />
      )}
      <div>
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '5px',
        }}>
          {username || '创作者'}
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#cccccc',
        }}>
          {time || '刚刚'}
        </div>
      </div>
    </div>
  );
};

// 竖版文字内容组件
const VerticalText = ({ text, startFrame, duration }) => {
  const frame = useCurrentFrame();
  const showFrame = frame >= startFrame;
  const hideFrame = frame >= startFrame + duration;
  
  if (!showFrame || hideFrame) return null;

  // 逐行显示效果
  const lines = text.split('\n').filter(line => line.trim());
  const currentLine = Math.floor(interpolate(frame, [startFrame, startFrame + duration], [0, lines.length]));
  
  return (
    <div style={{
      width: '100%',
      textAlign: 'left',
    }}>
      {lines.slice(0, currentLine + 1).map((line, index) => {
        const lineProgress = index === currentLine ? 
          interpolate(frame, [startFrame + (index * duration / lines.length), startFrame + ((index + 1) * duration / lines.length)], [0, 1]) : 
          1;
          
        return (
          <div 
            key={index}
            style={{
              fontSize: '1.6rem',
              lineHeight: '1.8',
              color: '#ffffff',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              marginBottom: '20px',
              opacity: lineProgress,
              transform: `translateX(${(1 - lineProgress) * 30}px)`,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};

// 底部操作栏
const ActionBar = ({ likes, comments, shares }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const translateY = interpolate(frame, [0, 30], [20, 0]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      left: '30px',
      right: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      opacity,
      transform: `translateY(${translateY}px)`,
    }}>
      <ActionButton icon="❤️" count={likes || 0} />
      <ActionButton icon="💬" count={comments || 0} />
      <ActionButton icon="↗️" count={shares || 0} />
      <ActionButton icon="⭐" count="" />
    </div>
  );
};

const ActionButton = ({ icon, count }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}>
    <div style={{
      fontSize: '1.8rem',
      marginBottom: '5px',
    }}>
      {icon}
    </div>
    {count !== "" && (
      <div style={{
        fontSize: '0.9rem',
        color: '#ffffff',
      }}>
        {count}
      </div>
    )}
  </div>
);

// 微头条视频主组件
export const MicroVideo = ({ 
  title, 
  content, 
  avatar, 
  username, 
  time,
  likes = 0,
  comments = 0,
  shares = 0 
}) => {
  const frame = useCurrentFrame();
  
  // 竖版视频背景
  const backgroundGradient = 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 100%)';

  return (
    <AbsoluteFill style={{ 
      background: backgroundGradient,
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
    }}>
      <VerticalContainer>
        {/* 头部信息 */}
        <HeaderInfo avatar={avatar} username={username} time={time} />
        
        {/* 标题 */}
        <Sequence from={30} durationInFrames={60}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#ffffff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            marginBottom: '30px',
            textAlign: 'left',
            width: '100%',
          }}>
            {title}
          </div>
        </Sequence>
        
        {/* 内容展示 */}
        <VerticalText 
          text={content} 
          startFrame={90} 
          duration={180} 
        />
      </VerticalContainer>
      
      {/* 底部操作栏 */}
      <ActionBar likes={likes} comments={comments} shares={shares} />
    </AbsoluteFill>
  );
};

// 导出composition配置
export const microVideoConfig = {
  id: 'MicroVideo',
  component: MicroVideo,
  durationInFrames: 300, // 10秒 (30fps)
  fps: 30,
  width: 1080, // 竖版视频宽度
  height: 1920, // 竖版视频高度
};