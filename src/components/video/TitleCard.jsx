import { useCurrentFrame, interpolate, spring } from 'remotion';

const TitleCard = ({ 
  title, 
  subtitle,
  startFrame = 0,
  duration = 60,
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 30],
    [0, 1]
  );
  
  const scale = spring({
    frame,
    from: 0.8,
    to: 1,
    config: { damping: 15, stiffness: 100 }
  });
  
  const isVisible = frame >= startFrame && frame <= startFrame + duration;
  
  if (!isVisible) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        right: '10%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity,
        transform: `scale(${scale})`,
        ...style
      }}
    >
      <h1
        style={{
          fontSize: 72,
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center',
          margin: 0,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: 32,
            color: '#cccccc',
            marginTop: 16,
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default TitleCard;
