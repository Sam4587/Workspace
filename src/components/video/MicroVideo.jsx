import { AbsoluteFill, useVideoConfig } from 'remotion';
import TitleCard from './TitleCard';
import TextOverlay from './TextOverlay';
import ImageSlide from './ImageSlide';
import BGM from './BGM';
import Transition from './Transition';

const MicroVideo = ({ 
  text = '',
  image = null,
  backgroundMusic = null,
  backgroundColor = '#000000',
  textColor = '#ffffff',
  accentColor = '#3b82f6',
  fontSize = 28,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  
  const titleEndFrame = fps * 1.5;
  const contentStartFrame = fps * 2;
  const contentDuration = fps * 8;
  const imageStartFrame = fps * 11;
  const endTransitionStart = durationInFrames - fps * 1.5;
  
  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <Transition type="fade" startFrame={0} duration={15} color={backgroundColor} />
      
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '5%',
          right: '5%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 60,
            height: 4,
            backgroundColor: accentColor,
            borderRadius: 2,
          }}
        />
        <span
          style={{
            fontSize: 16,
            color: accentColor,
            marginTop: 8,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          热点聚焦
        </span>
      </div>
      
      <TitleCard
        title={text ? text.slice(0, 50) : '今日热点'}
        startFrame={0}
        duration={titleEndFrame}
        style={{
          top: '18%',
        }}
      />
      
      <TextOverlay
        text={text || '这是微头条视频的内容区域，用于快速展示热点资讯。'}
        startFrame={contentStartFrame}
        duration={contentDuration}
        fontSize={fontSize}
        color={textColor}
        position="center"
        style={{
          top: '35%',
        }}
      />
      
      {image && (
        <ImageSlide
          image={image}
          alt="Content image"
          startFrame={imageStartFrame}
          duration={fps * 3}
          fit="contain"
          style={{
            top: '55%',
            height: '40%',
          }}
        />
      )}
      
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '5%',
          right: '5%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#666', fontSize: 14 }}>
          AI 内容创作系统
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ color: '#666', fontSize: 14 }}>
            {new Date().toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>
      
      {backgroundMusic && (
        <BGM
          src={backgroundMusic}
          volume={0.25}
          fadeInDuration={15}
          fadeOutDuration={15}
          startFrame={0}
          durationInFrames={durationInFrames}
        />
      )}
      
      <Transition 
        type="fade" 
        startFrame={endTransitionStart} 
        duration={30} 
        color={backgroundColor} 
      />
    </AbsoluteFill>
  );
};

export default MicroVideo;
