import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const VideoPreview = ({ template, config }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const fps = 30;

  useEffect(() => {
    if (!template || !config) return;

    const canvas = document.getElementById('preview-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = template.aspectRatio === '9:16' 
      ? { width: 270, height: 480 } 
      : { width: 480, height: 270 };

    canvas.width = width;
    canvas.height = height;

    const drawFrame = (frame) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const frameRatio = frame / (template.duration * fps);

      if (frameRatio < 0.2) {
        const titleOpacity = Math.min(1, frameRatio * 5);
        const titleScale = 0.8 + (Math.min(1, frameRatio * 5) * 0.2);
        
        ctx.save();
        ctx.translate(width / 2, height * 0.3);
        ctx.scale(titleScale, titleScale);
        ctx.fillStyle = `rgba(255, 255, 255, ${titleOpacity})`;
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(config.title || '视频标题', 0, 0);
        ctx.restore();
      }

      if (frameRatio >= 0.15 && frameRatio < 0.6) {
        const contentRatio = (frameRatio - 0.15) / 0.45;
        const contentOpacity = contentRatio < 0.2 ? contentRatio * 5 : 1;
        
        ctx.fillStyle = `rgba(200, 200, 200, ${contentOpacity})`;
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        
        const lines = (config.content || '视频内容区域').split('\n');
        lines.forEach((line, index) => {
          const y = height * 0.5 + (index * 20);
          ctx.fillText(line.slice(0, 20), width / 2, y);
        });
      }

      if (config.images && config.images.length > 0 && frameRatio >= 0.5) {
        const img = new Image();
        img.src = config.images[0];
        if (img.complete) {
          const imgRatio = (frameRatio - 0.5) / 0.5;
          const imgOpacity = imgRatio < 0.2 ? imgRatio * 5 : 1;
          ctx.globalAlpha = imgOpacity;
          
          const scale = Math.min(width / img.width, height / img.height);
          const imgWidth = img.width * scale;
          const imgHeight = img.height * scale;
          const imgX = (width - imgWidth) / 2;
          const imgY = (height - imgHeight) / 2;
          
          ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
          ctx.globalAlpha = 1;
        }
      }
    };

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const frame = Math.floor((elapsed / 1000) * fps);
      
      if (frame >= template.duration * fps) {
        if (isPlaying) {
          startTimeRef.current = timestamp;
          setCurrentFrame(0);
        }
      } else {
        setCurrentFrame(frame);
        drawFrame(frame);
      }
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      drawFrame(currentFrame);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [template, config, isPlaying, currentFrame, fps]);

  if (!template) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">视频预览</h3>
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">请先选择视频模板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">视频预览</h3>
      
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <canvas
            id="preview-canvas"
            className="w-full h-full"
          />
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (!isPlaying) setCurrentFrame(0);
            }}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={(template.duration * fps) - 1}
              value={isPlaying ? currentFrame : 0}
              onChange={(e) => {
                setCurrentFrame(parseInt(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full"
            />
          </div>
          
          <span className="text-sm text-gray-500">
            {Math.floor(currentFrame / fps)}s / {template.duration}s
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
