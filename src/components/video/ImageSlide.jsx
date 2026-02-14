import { useCurrentFrame, interpolate, Easing } from 'remotion';

const ImageSlide = ({ 
  image, 
  alt = '',
  startFrame = 0,
  duration = 90,
  fit = 'cover',
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  const fadeInEnd = startFrame + 15;
  const fadeOutStart = startFrame + duration - 15;
  
  const opacity = interpolate(
    frame,
    [startFrame, fadeInEnd, fadeOutStart, startFrame + duration],
    [0, 1, 1, 0],
    {
      easing: Easing.inOut(Easing.ease),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    }
  );
  
  const scale = interpolate(
    frame,
    [startFrame, startFrame + 30, startFrame + duration - 30, startFrame + duration],
    [1.1, 1, 1, 1.1]
  );
  
  const isVisible = frame >= startFrame && frame <= startFrame + duration;
  
  if (!isVisible || !image) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        overflow: 'hidden',
        ...style
      }}
    >
      <img
        src={image}
        alt={alt}
        style={{
          width: fit === 'cover' ? '100%' : 'auto',
          height: fit === 'cover' ? '100%' : 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: fit,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
};

export default ImageSlide;
