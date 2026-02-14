import { useCurrentFrame, interpolate } from 'remotion';

const BGM = ({ 
  src, 
  volume = 0.3,
  fadeInDuration = 30,
  fadeOutDuration = 30,
  startFrame = 0,
  durationInFrames = 900,
  style = {}
}) => {
  const frame = useCurrentFrame;
  
  const fadeInEnd = startFrame + fadeInDuration;
  const fadeOutStart = durationInFrames - fadeOutDuration;
  
  const currentVolume = interpolate(
    frame,
    [startFrame, fadeInEnd, fadeOutStart, durationInFrames],
    [0, volume, volume, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    }
  );
  
  if (!src || frame < startFrame) return null;
  
  return (
    <div style={{ display: 'none', ...style }}>
      <audio
        ref={(ref) => {
          if (ref) {
            ref.volume = currentVolume;
            if (frame === startFrame) {
              ref.play().catch(() => {});
            }
          }
        }}
      >
        <source src={src} type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default BGM;
