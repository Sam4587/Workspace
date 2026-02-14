import { useCurrentFrame, interpolate, Easing } from 'remotion';

const TextOverlay = ({ 
  text, 
  startFrame = 0,
  duration = 120,
  fontSize = 36,
  color = '#cccccc',
  backgroundColor = 'transparent',
  position = 'center',
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  const fadeInEnd = startFrame + 20;
  const fadeOutStart = startFrame + duration - 20;
  
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
  
  const translateY = interpolate(
    frame,
    [startFrame, startFrame + 30],
    [20, 0]
  );
  
  const isVisible = frame >= startFrame && frame <= startFrame + duration;
  
  if (!isVisible) return null;
  
  const positionStyles = {
    top: position === 'top' ? '10%' : position === 'bottom' ? '70%' : '40%',
    left: '15%',
    right: '15%',
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${translateY}px)`,
        backgroundColor,
        padding: '20px',
        borderRadius: 8,
        ...style
      }}
    >
      <p
        style={{
          fontSize,
          color,
          lineHeight: 1.6,
          margin: 0,
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {text}
      </p>
    </div>
  );
};

export default TextOverlay;
