import { AbsoluteFill, useVideoConfig } from 'remotion';
import TitleCard from './TitleCard';
import TextOverlay from './TextOverlay';
import ImageSlide from './ImageSlide';
import BGM from './BGM';
import Transition from './Transition';

const ArticleVideo = ({ 
  title = '',
  subtitle = '',
  content = '',
  images = [],
  backgroundMusic = null,
  backgroundColor = '#000000',
  primaryColor = '#ffffff',
  accentColor = '#3b82f6',
  titleFontSize = 72,
  contentFontSize = 32,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  
  const contentLines = content ? content.split('\n').filter(line => line.trim()) : [];
  
  const titleEndFrame = fps * 3;
  const contentStartFrame = fps * 4;
  const contentDuration = fps * 8;
  const imageStartFrame = fps * 13;
  const imageDuration = fps * 5;
  const endTransitionStart = durationInFrames - fps * 2;
  
  const renderContentLines = () => {
    if (contentLines.length === 0) {
      return (
        <TextOverlay
          text="这是一段示例内容，用于展示文章视频模板的效果。"
          startFrame={contentStartFrame}
          duration={contentDuration}
          fontSize={contentFontSize}
          color="#cccccc"
          position="center"
        />
      );
    }
    
    return contentLines.map((line, index) => {
      const lineStartFrame = contentStartFrame + (index * fps * 2);
      const lineDuration = fps * 3;
      
      return (
        <TextOverlay
          key={index}
          text={line}
          startFrame={lineStartFrame}
          duration={lineDuration}
          fontSize={contentFontSize}
          color="#cccccc"
          position="center"
        />
      );
    });
  };
  
  const renderImages = () => {
    if (images.length === 0) {
      return (
        <ImageSlide
          image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&h=1080&fit=crop"
          alt="Default background"
          startFrame={imageStartFrame}
          duration={imageDuration}
          fit="cover"
        />
      );
    }
    
    return images.map((image, index) => {
      const imgStartFrame = imageStartFrame + (index * imageDuration);
      return (
        <ImageSlide
          key={index}
          image={image}
          alt={`Image ${index + 1}`}
          startFrame={imgStartFrame}
          duration={imageDuration}
          fit="cover"
        />
      );
    });
  };
  
  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <Transition type="fade" startFrame={0} duration={fps} color={backgroundColor} />
      
      <TitleCard
        title={title || '视频标题'}
        subtitle={subtitle}
        startFrame={0}
        duration={titleEndFrame}
      />
      
      {renderContentLines()}
      
      {renderImages()}
      
      {backgroundMusic && (
        <BGM
          src={backgroundMusic}
          volume={0.3}
          fadeInDuration={fps}
          fadeOutDuration={fps}
          startFrame={0}
          durationInFrames={durationInFrames}
        />
      )}
      
      <Transition 
        type="fade" 
        startFrame={endTransitionStart} 
        duration={fps * 2} 
        color={backgroundColor} 
      />
    </AbsoluteFill>
  );
};

export default ArticleVideo;
