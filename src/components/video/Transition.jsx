import { useCurrentFrame, interpolate, Easing } from 'remotion';

const Transition = ({ 
  type = 'fade',
  startFrame = 0,
  duration = 30,
  color = '#000000',
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  const isInTransition = frame >= startFrame && frame <= startFrame + duration;
  
  if (!isInTransition) return null;
  
  let opacity = 0;
  let transform = 'translateX(0)';
  
  switch (type) {
    case 'fade':
      opacity = interpolate(
        frame,
        [startFrame, startFrame + duration / 2, startFrame + duration],
        [0, 1, 0]
      );
      break;
      
    case 'slide-left':
      transform = interpolate(
        frame,
        [startFrame, startFrame + duration],
        ['100%', '-100%']
      );
      opacity = 1;
      break;
      
    case 'slide-right':
      transform = interpolate(
        frame,
        [startFrame, startFrame + duration],
        ['-100%', '100%']
      );
      opacity = 1;
      break;
      
    case 'slide-up':
      transform = interpolate(
        frame,
        [startFrame, startFrame + duration],
        ['100%', '-100%']
      );
      opacity = 1;
      break;
      
    case 'slide-down':
      transform = interpolate(
        frame,
        [startFrame, startFrame + duration],
        ['-100%', '100%']
      );
      opacity = 1;
      break;
      
    case 'zoom-in':
      opacity = interpolate(
        frame,
        [startFrame, startFrame + duration],
        [0, 1]
      );
      const scale = interpolate(
        frame,
        [startFrame, startFrame + duration],
        [0.5, 1]
      );
      transform = `scale(${scale})`;
      break;
      
    case 'zoom-out':
      opacity = interpolate(
        frame,
        [startFrame, startFrame + duration],
        [1, 0]
      );
      const scaleOut = interpolate(
        frame,
        [startFrame, startFrame + duration],
        [1, 1.5]
      );
      transform = `scale(${scaleOut})`;
      break;
      
    default:
      opacity = interpolate(
        frame,
        [startFrame, startFrame + duration / 2, startFrame + duration],
        [0, 1, 0]
      );
  }
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: color,
        opacity,
        transform,
        pointerEvents: 'none',
        ...style
      }}
    />
  );
};

export default Transition;
