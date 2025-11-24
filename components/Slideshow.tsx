
import React, { useState, useEffect, useRef } from 'react';
import { StorySegment, PresentationConfig, Character, VisualTransform } from '../types';
import { Button } from './Button';
import { X, ChevronRight, ChevronLeft, Play, Pause, Volume2, VolumeX, Video, Download, Settings, Film } from 'lucide-react';

interface SlideshowProps {
  segments: StorySegment[];
  topic?: string;
  onClose: () => void;
  backgroundMusic?: string | null;
  autoExport?: boolean;
  presentationConfig?: PresentationConfig;
  characters?: Character[];
}

interface ExportConfig {
    resolution: '720p' | '1080p';
    quality: 'high' | 'balanced' | 'low';
    fps: 30 | 60;
}

// Helper component for smooth text animations
const AnimatedText: React.FC<{ text: string; type: string; speed: string }> = ({ text, type, speed }) => {
  const [visibleChars, setVisibleChars] = useState(0);
  
  // Determine speeds based on config
  const typeSpeed = speed === 'slow' ? 60 : speed === 'fast' ? 15 : 30;
  const wordDelay = speed === 'slow' ? 0.15 : speed === 'fast' ? 0.04 : 0.08;

  if (type === 'typewriter') {
      useEffect(() => {
          setVisibleChars(0);
          const interval = setInterval(() => {
              setVisibleChars(prev => {
                  if (prev >= text.length) {
                      clearInterval(interval);
                      return prev;
                  }
                  return prev + 1;
              });
          }, typeSpeed);
          return () => clearInterval(interval);
      }, [text, typeSpeed]);

      return (
          <span className="whitespace-pre-wrap break-words">
              {text.slice(0, visibleChars)}
              <span className="animate-pulse text-brand-300">|</span>
          </span>
      );
  }

  // For other animations, split by words for a staggered effect
  const words = text.split(' ');
  return (
      <span className="whitespace-pre-wrap break-words">
          {words.map((word, i) => (
              <span 
                  key={i} 
                  className={`inline-block mr-[0.25em] opacity-0 ${
                      type === 'pop' ? 'animate-pop' : 
                      type === 'slide-right' ? 'animate-slide-right' : 
                      type === 'slide-up' ? 'animate-slide-up' : 
                      'animate-fade-in'
                  }`}
                  style={{ 
                      animationDelay: `${i * wordDelay + 0.1}s`, 
                      animationFillMode: 'forwards' 
                  }}
              >
                  {word}
              </span>
          ))}
      </span>
  );
};

export const Slideshow: React.FC<SlideshowProps> = ({ 
    segments, 
    topic, 
    onClose, 
    backgroundMusic, 
    autoExport, 
    presentationConfig = { fontFamily: '"Comic Neue", cursive', fontSize: 'medium', animationSpeed: 'medium' },
    characters = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Inner slide state for multiple images
  const [innerImageIndex, setInnerImageIndex] = useState(0);
  
  // Audio Refs
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  // Video Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Video Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
      resolution: '720p',
      quality: 'balanced',
      fps: 30
  });

  // Initialize Background Music
  useEffect(() => {
    if (backgroundMusic) {
      const bgAudio = new Audio(backgroundMusic);
      bgAudio.loop = true;
      bgAudio.volume = 0.15; // Lower volume for background
      bgMusicRef.current = bgAudio;
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, [backgroundMusic]);

  // Auto Start Export if requested
  useEffect(() => {
    if (autoExport) {
        setShowExportModal(true);
    }
  }, [autoExport]);

  // Reset inner index when slide changes
  useEffect(() => {
      setInnerImageIndex(0);
  }, [currentIndex]);

  // Handle Play/Pause Global state
  useEffect(() => {
    if (bgMusicRef.current) {
      if (isPlaying && !isMuted) {
        bgMusicRef.current.play().catch(e => console.log("BG Play failed:", e));
      } else {
        bgMusicRef.current.pause();
      }
    }
    // Also handle video element
    if (videoRef.current) {
        const segment = segments[currentIndex];
        if (isPlaying && !isMuted) {
            videoRef.current.muted = false; 
            if (segment.videoConfig?.trimStart && videoRef.current.currentTime < segment.videoConfig.trimStart) {
                 videoRef.current.currentTime = segment.videoConfig.trimStart;
            }
            if (segment.videoConfig?.playbackRate) {
                videoRef.current.playbackRate = segment.videoConfig.playbackRate;
            } else {
                videoRef.current.playbackRate = 1.0;
            }
            videoRef.current.play().catch(() => {});
        } else if (isPlaying && isMuted) {
             videoRef.current.muted = true;
             videoRef.current.play().catch(() => {});
        } else {
            videoRef.current.pause();
        }
    }
  }, [isPlaying, isMuted, currentIndex, segments]);

  // Monitor Video Trim during Playback
  useEffect(() => {
      let rafId: number;
      const checkTrim = () => {
          const segment = segments[currentIndex];
          if (videoRef.current && segment.videoConfig && isPlaying) {
              const { trimStart = 0, trimEnd } = segment.videoConfig;
              const duration = videoRef.current.duration;
              const end = trimEnd || duration;
              
              if (videoRef.current.currentTime >= end) {
                  videoRef.current.currentTime = trimStart; // Loop logic within trim
              }
          }
          if (isPlaying) rafId = requestAnimationFrame(checkTrim);
      };
      if (isPlaying) rafId = requestAnimationFrame(checkTrim);
      return () => cancelAnimationFrame(rafId);
  }, [isPlaying, currentIndex, segments]);


  // Handle Inner Image Cycling (Slideshow within slide)
  useEffect(() => {
      const currentSegment = segments[currentIndex];
      // Only cycle images if there is no video
      if (currentSegment.videoUrl) return;

      const images = currentSegment.imageUrls || [];
      
      // If we have multiple images, cycle them
      if (images.length > 1 && isPlaying && !isExporting) {
          const interval = setInterval(() => {
              setInnerImageIndex(prev => (prev + 1) % images.length);
          }, 4000); // Change image every 4 seconds
          return () => clearInterval(interval);
      }
  }, [currentIndex, isPlaying, segments, isExporting]);

  // Handle Narration & Timing
  useEffect(() => {
    // Cleanup previous narration
    if (narrationRef.current) {
        narrationRef.current.pause();
        narrationRef.current = null;
    }

    const segment = segments[currentIndex];
    
    // Auto-play logic
    if (segment.audioUrl && !isMuted && isPlaying && !isExporting) {
        const audio = new Audio(segment.audioUrl);
        narrationRef.current = audio;

        // Apply Speaking Rate if a narratorId is present and matches a character
        if (segment.narratorId && characters) {
            const narrator = characters.find(c => c.id === segment.narratorId);
            if (narrator && narrator.voiceSpeed) {
                audio.playbackRate = narrator.voiceSpeed;
            }
        }

        audio.play().catch(e => console.log("Narration Play failed:", e));
        
        // Sync: move to next slide when audio ends
        audio.onended = () => {
           if (isPlaying) {
             setTimeout(() => {
                 setCurrentIndex(prev => (prev + 1) % segments.length);
             }, 1000);
           }
        };
    } else if (isPlaying && !isExporting) {
        // Fallback timer
        let duration = 8000;
        
        if (segment.customDuration) {
            duration = segment.customDuration * 1000;
        } else if (segment.videoUrl) {
            // Respect Trim Duration & Playback Rate
            if (segment.videoConfig) {
                 const start = segment.videoConfig.trimStart || 0;
                 const end = segment.videoConfig.trimEnd || 5;
                 const speed = segment.videoConfig.playbackRate || 1;
                 duration = ((end - start) / speed) * 1000 + 1000; 
            } else {
                 duration = 6000;
            }
        } else {
             const imagesCount = segment.imageUrls?.length || 1;
             duration = Math.max(8000, imagesCount * 4000);
        }

        const timer = setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % segments.length);
        }, duration);
        return () => clearTimeout(timer);
    }
  }, [currentIndex, isMuted, isPlaying, segments, isExporting, characters]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrentIndex(prev => Math.min(segments.length - 1, prev + 1));
      if (e.key === 'ArrowLeft') setCurrentIndex(prev => Math.max(0, prev - 1));
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [segments.length, onClose]);

  // --- Video Export Logic ---
  
  const handleStartExport = () => {
      setShowExportModal(false);
      processExport();
  };

  const processExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initializing assets...');
    setIsPlaying(false); // Stop playback

    try {
        const { resolution, quality, fps } = exportConfig;
        const width = resolution === '1080p' ? 1920 : 1280;
        const height = resolution === '1080p' ? 1080 : 720;
        
        let videoBits = 2500000; 
        if (resolution === '1080p') {
            videoBits = quality === 'high' ? 8000000 : quality === 'balanced' ? 5000000 : 2500000;
        } else {
            videoBits = quality === 'high' ? 4000000 : quality === 'balanced' ? 2500000 : 1000000;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false }); 
        if (!ctx) throw new Error("Could not get canvas context");

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);

        // --- 1. Audio Setup ---
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const actx = new AudioContext();
        if (actx.state === 'suspended') await actx.resume();

        const dest = actx.createMediaStreamDestination();
        
        let bgSource: AudioBufferSourceNode | null = null;
        let bgGain: GainNode | null = null;
        
        if (backgroundMusic) {
            try {
                const response = await fetch(backgroundMusic);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await actx.decodeAudioData(arrayBuffer);
                bgSource = actx.createBufferSource();
                bgSource.buffer = audioBuffer;
                bgSource.loop = true;
                bgGain = actx.createGain();
                bgGain.gain.value = 0.15;
                bgSource.connect(bgGain);
                bgGain.connect(dest);
                bgSource.start(actx.currentTime);
            } catch (e) {
                console.warn("Failed to load BG music for export", e);
            }
        }

        // --- 2. Stream & Recorder Setup ---
        const frameInterval = 1000 / fps;
        
        const mimeTypes = [
            'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm'
        ];
        let selectedMimeType = 'video/webm';
        for (const t of mimeTypes) {
            if (MediaRecorder.isTypeSupported(t)) {
                selectedMimeType = t;
                break;
            }
        }
        
        const canvasStream = canvas.captureStream(fps);
        
        const combinedTracks = [
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
        ];
        const combinedStream = new MediaStream(combinedTracks);

        const mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType: selectedMimeType,
            videoBitsPerSecond: videoBits
        });
        
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.start();

        // --- 3. Asset Loader ---
        const loadSegmentAssets = async (segment: StorySegment) => {
             const imageUrls = segment.imageUrls && segment.imageUrls.length > 0 ? segment.imageUrls : (segment.imageUrl ? [segment.imageUrl] : []);
             const images: HTMLImageElement[] = [];
             for(const url of imageUrls) {
                 const img = new Image();
                 img.crossOrigin = "anonymous";
                 await new Promise((resolve) => { 
                     img.onload = resolve; 
                     img.onerror = resolve; 
                     img.src = url; 
                 });
                 images.push(img);
             }
             
             let audioBuffer: AudioBuffer | null = null;
             if (segment.audioUrl) {
                 try {
                     const r = await fetch(segment.audioUrl);
                     const b = await r.arrayBuffer();
                     audioBuffer = await actx.decodeAudioData(b);
                 } catch(e) { console.warn("Failed to load narration", e); }
             }
             
             let videoElement: HTMLVideoElement | null = null;
             if (segment.videoUrl) {
                 videoElement = document.createElement('video');
                 videoElement.crossOrigin = "anonymous";
                 videoElement.src = segment.videoUrl;
                 videoElement.muted = true;
                 await new Promise((resolve) => {
                     videoElement!.onloadedmetadata = resolve;
                     videoElement!.onerror = resolve;
                     videoElement!.load();
                 });
             }

             return { images, audioBuffer, videoElement };
        }

        // --- 4. Drawing Functions ---
        
        const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
             ctx.beginPath();
             ctx.moveTo(x + r, y);
             ctx.lineTo(x + w - r, y);
             ctx.quadraticCurveTo(x + w, y, x + w, y + r);
             ctx.lineTo(x + w, y + h - r);
             ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
             ctx.lineTo(x + r, y + h);
             ctx.quadraticCurveTo(x, y + h, x, y + h - r);
             ctx.lineTo(x, y + r);
             ctx.quadraticCurveTo(x, y, x + r, y);
             ctx.closePath();
        };

        const drawLayout = (
            ctx: CanvasRenderingContext2D, 
            bgImage: HTMLImageElement | HTMLVideoElement | null, 
            mainVisual: HTMLImageElement | HTMLVideoElement | null,
            text: string, 
            segmentIndex: number,
            visualScale: number = 1,
            visualTransform: VisualTransform = { scale: 1, x: 0, y: 0 }
        ) => {
             const is1080p = width === 1920;
             const scaleM = is1080p ? 1.5 : 1;

             ctx.save();
             // Draw Background Blur
             if (bgImage) {
                 ctx.filter = `blur(${is1080p ? 30 : 20}px) brightness(0.4)`;
                 const imgAspect = (bgImage instanceof HTMLVideoElement ? bgImage.videoWidth : bgImage.width) / 
                                   (bgImage instanceof HTMLVideoElement ? bgImage.videoHeight : bgImage.height);
                 const canvasAspect = width / height;
                 let dw = width, dh = height;
                 if (imgAspect > canvasAspect) dw = height * imgAspect;
                 else dh = width / imgAspect;
                 ctx.drawImage(bgImage, (width-dw)/2, (height-dh)/2, dw, dh);
             } else {
                 ctx.fillStyle = '#111';
                 ctx.fillRect(0,0, width, height);
             }
             ctx.restore();

             if (mainVisual) {
                 ctx.save();
                 const visW = 600 * scaleM;
                 const visH = 520 * scaleM;
                 const visX = (width * 0.08); 
                 const visY = (height - visH) / 2;
                 
                 // Card Shadow
                 ctx.shadowColor = 'rgba(0,0,0,0.5)';
                 ctx.shadowBlur = 40 * scaleM;
                 ctx.shadowOffsetX = 0;
                 ctx.shadowOffsetY = 15 * scaleM;

                 drawRoundedRect(ctx, visX, visY, visW, visH, 24 * scaleM);
                 ctx.clip();

                 const vW = (mainVisual instanceof HTMLVideoElement ? mainVisual.videoWidth : mainVisual.width);
                 const vH = (mainVisual instanceof HTMLVideoElement ? mainVisual.videoHeight : mainVisual.height);
                 const vAspect = vW / vH;
                 const cAspect = visW / visH;
                 
                 let dW = visW;
                 let dH = visH;
                 
                 if (vAspect > cAspect) dH = visW / vAspect;
                 else dW = visH * vAspect;
                 
                 const dX = visX + (visW - dW)/2;
                 const dY = visY + (visH - dH)/2;
                 
                 // Apply Transform
                 ctx.translate(visX + visW/2, visY + visH/2);
                 const isManualTransform = visualTransform.scale !== 1 || visualTransform.x !== 0 || visualTransform.y !== 0;
                 const finalScale = isManualTransform ? visualTransform.scale : visualScale;
                 const finalX = (visualTransform.x / 100) * visW;
                 const finalY = (visualTransform.y / 100) * visH;
                 
                 ctx.scale(finalScale, finalScale);
                 ctx.translate(finalX, finalY);
                 ctx.translate(-(visX + visW/2), -(visY + visH/2));

                 // Black background behind image
                 ctx.fillStyle = '#000';
                 ctx.fillRect(visX, visY, visW, visH);

                 ctx.drawImage(mainVisual, dX, dY, dW, dH);
                 
                 // Draw Inner Border (Translucent white)
                 ctx.resetTransform();
                 
                 ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                 ctx.lineWidth = 4 * scaleM;
                 drawRoundedRect(ctx, visX, visY, visW, visH, 24 * scaleM);
                 ctx.stroke();

                 ctx.restore();
             }

             // Draw Text Layout
             ctx.save();
             const textW = 460 * scaleM;
             const textX = (width * 0.58);
             const textY = (height * 0.2);
             
             // Scene Label
             ctx.font = `bold ${16 * scaleM}px "Inter", sans-serif`;
             ctx.fillStyle = '#fcd34d'; // brand-300
             ctx.fillText(`SCENE ${segmentIndex + 1}`, textX, textY);
             
             // Main Story Text
             ctx.fillStyle = '#ffffff';
             const rawFont = presentationConfig.fontFamily;
             const family = rawFont.split(',')[0].replace(/['"]/g, '');
             const baseSize = presentationConfig.fontSize === 'small' ? 24 : presentationConfig.fontSize === 'large' ? 40 : presentationConfig.fontSize === 'xl' ? 52 : 32;
             const finalSize = baseSize * scaleM;
             
             ctx.font = `${finalSize}px "${family}", sans-serif`;
             ctx.textBaseline = 'top';
             
             const words = text.split(' ');
             let line = '';
             let y = textY + (50 * scaleM);
             const lineHeight = finalSize * 1.5;

             // Word wrapping
             for(let n = 0; n < words.length; n++) {
                 const testLine = line + words[n] + ' ';
                 const metrics = ctx.measureText(testLine);
                 if (metrics.width > textW && n > 0) {
                     ctx.fillText(line, textX, y);
                     line = words[n] + ' ';
                     y += lineHeight;
                 } else {
                     line = testLine;
                 }
             }
             ctx.fillText(line, textX, y);
             ctx.restore();
        };

        // --- 5. Render Loop ---

        if (topic) {
             setExportStatus("Rendering Title...");
             const titleDuration = 3;
             const frames = titleDuration * fps;
             const rawFont = presentationConfig.fontFamily;
             const fontFamily = rawFont.split(',')[0].replace(/['"]/g, '');
             const is1080p = width === 1920;
             const scaleM = is1080p ? 1.5 : 1;

             for (let f=0; f<frames; f++) {
                 await new Promise(r => setTimeout(r, frameInterval));

                 ctx.fillStyle = "#fefce8"; // brand-50
                 ctx.fillRect(0,0, width, height);
                 
                 ctx.fillStyle = "#713f12"; // brand-900
                 ctx.font = `bold ${60 * scaleM}px "${fontFamily}", sans-serif`;
                 ctx.textAlign = "center";
                 ctx.textBaseline = "middle";
                 
                 ctx.globalAlpha = Math.min(1, f/(fps));
                 ctx.fillText(topic, width/2, height/2);
                 
                 ctx.font = `${30 * scaleM}px 'Inter', sans-serif`;
                 ctx.fillStyle = "#a16207";
                 ctx.fillText("An educational story", width/2, height/2 + (60 * scaleM));
                 ctx.globalAlpha = 1;
             }
        }
        
        let previousFrameCanvas: HTMLCanvasElement | null = null;

        for (let i = 0; i < segments.length; i++) {
            setExportStatus(`Rendering Scene ${i+1}/${segments.length}...`);
            const segment = segments[i];
            const { images, audioBuffer, videoElement } = await loadSegmentAssets(segment);
            
            let segDuration = 5;
            let playbackRate = 1;

            if (segment.narratorId && characters) {
                 const narrator = characters.find(c => c.id === segment.narratorId);
                 if (narrator && narrator.voiceSpeed) playbackRate = narrator.voiceSpeed;
            }

            if (segment.customDuration) {
                segDuration = segment.customDuration;
            } else if (audioBuffer) {
                segDuration = (audioBuffer.duration / playbackRate) + 1.5; 
            } else if (videoElement) {
                const start = segment.videoConfig?.trimStart || 0;
                const end = segment.videoConfig?.trimEnd || videoElement.duration;
                const speed = segment.videoConfig?.playbackRate || 1;
                segDuration = Math.max(2, (end - start) / speed);
            } else if (images.length > 1) {
                segDuration = images.length * 4;
            }

            if (!isFinite(segDuration)) segDuration = 5;

            if (audioBuffer) {
                const node = actx.createBufferSource();
                node.buffer = audioBuffer;
                node.playbackRate.value = playbackRate;
                node.connect(dest); 
                node.start(actx.currentTime);
            }

            if (videoElement) {
                videoElement.currentTime = segment.videoConfig?.trimStart || 0;
                videoElement.playbackRate = segment.videoConfig?.playbackRate || 1;
                videoElement.play().catch(() => {});
                videoElement.loop = true;
            }

            const totalFrames = Math.ceil(segDuration * fps);
            const activeTransform = segment.visualTransform || { scale: 1, x: 0, y: 0 };
            
            // Transition configuration
            const transitionType = segment.transition || 'fade';
            const transitionDuration = 1.0; 
            const transitionFrames = fps * transitionDuration;

            for (let f = 0; f < totalFrames; f++) {
                await new Promise(r => setTimeout(r, frameInterval));
                
                // Clear and background
                ctx.fillStyle = "#000";
                ctx.fillRect(0,0, width, height);

                const segTime = f / fps;
                
                let bgVisual = null;
                let mainVisual = null;
                let scale = 1;

                if (videoElement) {
                    bgVisual = videoElement;
                    mainVisual = videoElement;
                } else if (images.length > 0) {
                     let imgIdx = 0;
                     if (images.length > 1) {
                         imgIdx = Math.floor(segTime / 4) % images.length;
                     }
                     bgVisual = images[imgIdx];
                     mainVisual = images[imgIdx];
                     
                     if (activeTransform.scale === 1 && activeTransform.x === 0 && activeTransform.y === 0) {
                        scale = 1 + (0.05 * (f / totalFrames));
                     }
                }

                // If transitioning in from previous scene (i > 0)
                const isTransitioning = i > 0 && f < transitionFrames && previousFrameCanvas;
                
                if (isTransitioning) {
                    const progress = f / transitionFrames; // 0 to 1
                    
                    // Draw Current Scene first?
                    // For Fade: Previous on top fading out, or Current on top fading in?
                    // Let's put Previous on bottom, Current on top with Alpha?
                    // Or Previous on top with 1-Alpha.
                    
                    if (transitionType === 'fade') {
                        // Draw Current normally
                        drawLayout(ctx, bgVisual, mainVisual, segment.text, i, scale, activeTransform);
                        
                        // Draw Previous on top fading out
                        ctx.save();
                        ctx.globalAlpha = 1 - progress;
                        ctx.drawImage(previousFrameCanvas!, 0, 0);
                        ctx.restore();
                    } 
                    else if (transitionType === 'slide') {
                        // Slide Next in from right
                        const offset = width * (1 - progress); 
                        
                        // Draw Previous (moving left slightly for parallax, or staying static)
                        ctx.drawImage(previousFrameCanvas!, -width * 0.2 * progress, 0); // Parallax exit
                        
                        // Draw Next sliding in
                        ctx.save();
                        ctx.translate(offset, 0);
                        drawLayout(ctx, bgVisual, mainVisual, segment.text, i, scale, activeTransform);
                        ctx.restore();
                    }
                    else if (transitionType === 'curtain') {
                        // Previous slides up revealing Next
                        const offset = height * progress;
                        
                        // Draw Next (static background)
                        drawLayout(ctx, bgVisual, mainVisual, segment.text, i, scale, activeTransform);
                        
                        // Draw Previous sliding up
                        ctx.save();
                        ctx.translate(0, -offset);
                        ctx.drawImage(previousFrameCanvas!, 0, 0);
                        ctx.restore();
                    }
                    else if (transitionType === 'zoom') {
                        // Next zooms in from 0 scale
                        // Draw Previous
                        ctx.drawImage(previousFrameCanvas!, 0, 0);
                        
                        // Draw Next scaling up
                        ctx.save();
                        const s = progress;
                        ctx.translate(width/2, height/2);
                        ctx.scale(s, s);
                        ctx.translate(-width/2, -height/2);
                        // Force alpha fade in too
                        ctx.globalAlpha = progress;
                        drawLayout(ctx, bgVisual, mainVisual, segment.text, i, scale, activeTransform);
                        ctx.restore();
                    }
                    else if (transitionType === 'flip') {
                         // Simple flip effect
                         // 0-0.5: Previous flips out
                         // 0.5-1: Next flips in
                         
                         if (progress < 0.5) {
                             // Draw Previous shrinking width
                             const p = progress * 2; // 0 to 1
                             ctx.save();
                             ctx.translate(width/2, height/2);
                             ctx.scale(1 - p, 1); // Flip horizontal squeeze
                             ctx.translate(-width/2, -height/2);
                             ctx.drawImage(previousFrameCanvas!, 0, 0);
                             ctx.restore();
                         } else {
                             // Draw Next growing width
                             const p = (progress - 0.5) * 2; // 0 to 1
                             ctx.save();
                             ctx.translate(width/2, height/2);
                             ctx.scale(p, 1);
                             ctx.translate(-width/2, -height/2);
                             drawLayout(ctx, bgVisual, mainVisual, segment.text, i, scale, activeTransform);
                             ctx.restore();
                         }
                    }
                    else {
                        // Fallback
                        drawLayout(ctx, bgVisual, mainVisual, segment.text, i, scale, activeTransform);
                    }

                } else {
                    // Normal Draw
                    drawLayout(ctx, bgVisual, mainVisual, segment.text, i, scale, activeTransform);
                }
                
                // Capture last frame for next transition
                if (f === totalFrames - 1) {
                    if (!previousFrameCanvas) {
                        previousFrameCanvas = document.createElement('canvas');
                        previousFrameCanvas.width = width;
                        previousFrameCanvas.height = height;
                    }
                    previousFrameCanvas.getContext('2d')?.drawImage(canvas, 0, 0);
                }
                
                setExportProgress(Math.round(((i * totalFrames + f) / (segments.length * totalFrames)) * 100));
            }

            if (videoElement) {
                videoElement.pause();
                videoElement.remove();
            }
        }

        for(let i=0; i<fps; i++) {
             await new Promise(r => setTimeout(r, frameInterval));
             ctx.fillStyle = `rgba(0,0,0,${i/fps})`;
             ctx.fillRect(0,0, width, height);
        }

        setExportStatus("Finalizing...");
        
        mediaRecorder.stop();
        bgSource?.stop();
        
        await new Promise<void>((resolve) => {
             mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: selectedMimeType });
                if (blob.size < 100) {
                     alert("Export failed: Video file is empty.");
                } else {
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     const ext = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
                     a.download = `story-export-${Date.now()}.${ext}`;
                     a.click();
                     URL.revokeObjectURL(url);
                }
                resolve();
             };
        });

    } catch (e) {
        console.error("Export Error:", e);
        alert("Video export failed. Please check console.");
    } finally {
        setIsExporting(false);
        if (autoExport) onClose();
    }
  };

  const currentSegment = segments[currentIndex];
  
  const getSizeClass = () => {
      let size = "text-2xl md:text-4xl leading-relaxed"; 
      if (presentationConfig.fontSize === 'small') size = "text-lg md:text-2xl leading-normal";
      if (presentationConfig.fontSize === 'large') size = "text-3xl md:text-5xl leading-snug";
      if (presentationConfig.fontSize === 'xl') size = "text-4xl md:text-6xl leading-none";
      return size;
  };
  
  const transitionClass = `animate-scene-${currentSegment.transition || 'fade'}`;

  const images = currentSegment.imageUrls && currentSegment.imageUrls.length > 0 
        ? currentSegment.imageUrls 
        : (currentSegment.imageUrl ? [currentSegment.imageUrl] : []);

  const activeImage = images.length > 0 ? images[innerImageIndex % images.length] : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-fade-in">
      
      {showExportModal && (
          <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                     <h3 className="text-lg font-bold font-comic text-gray-900 flex items-center gap-2">
                        <Film className="w-5 h-5" /> Export Video
                     </h3>
                     <button onClick={() => { setShowExportModal(false); if(autoExport) onClose(); }} className="p-1.5 hover:bg-black/5 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Resolution</label>
                          <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => setExportConfig({...exportConfig, resolution: '720p'})}
                                className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${exportConfig.resolution === '720p' ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                              >
                                  720p (HD)
                                  <span className="block text-[10px] font-normal opacity-70 mt-1">Faster Render</span>
                              </button>
                              <button 
                                onClick={() => setExportConfig({...exportConfig, resolution: '1080p'})}
                                className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${exportConfig.resolution === '1080p' ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                              >
                                  1080p (FHD)
                                  <span className="block text-[10px] font-normal opacity-70 mt-1">Best Quality</span>
                              </button>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Quality & Compression</label>
                          <select 
                            value={exportConfig.quality}
                            onChange={(e: any) => setExportConfig({...exportConfig, quality: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 outline-none text-sm font-medium"
                          >
                              <option value="high">High (Large File)</option>
                              <option value="balanced">Balanced (Recommended)</option>
                              <option value="low">Low (Small File)</option>
                          </select>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Frame Rate</label>
                          <div className="flex gap-3">
                             {[30, 60].map(fps => (
                                 <button
                                    key={fps}
                                    onClick={() => setExportConfig({...exportConfig, fps: fps as any})}
                                    className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${exportConfig.fps === fps ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-200 text-gray-600'}`}
                                 >
                                     {fps} FPS
                                 </button>
                             ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <Button onClick={handleStartExport} className="shadow-lg shadow-brand-500/20">
                          Start Export
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {isExporting && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-white">
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-700">
                <div className="h-full bg-brand-500 transition-all duration-100" style={{ width: `${exportProgress}%` }}></div>
            </div>
            <p className="font-bold text-xl animate-pulse text-brand-300">Rendering Video... {exportProgress}%</p>
            <p className="text-sm text-gray-400 mt-2">{exportStatus}</p>
        </div>
      )}

      {!isExporting && !showExportModal && (
      <div className="absolute top-4 right-4 z-20 flex gap-2">
         <Button 
            variant="secondary" 
            onClick={() => setShowExportModal(true)} 
            disabled={isExporting}
            className="!px-4 !py-2 rounded-full opacity-80 hover:opacity-100 bg-brand-500 hover:bg-brand-600 border-0 text-white flex gap-2"
         >
            <Video className="w-5 h-5" /> <span className="hidden md:inline">Export Video</span>
         </Button>

         <Button variant="secondary" onClick={() => setIsMuted(!isMuted)} className="!p-3 rounded-full opacity-80 hover:opacity-100 bg-white/10 hover:bg-white/20 backdrop-blur-md border-0">
            {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
         </Button>
         <Button variant="secondary" onClick={onClose} className="!p-3 rounded-full opacity-80 hover:opacity-100 bg-white/10 hover:bg-white/20 backdrop-blur-md border-0">
           <X className="w-6 h-6 text-white" />
         </Button>
      </div>
      )}

      <div key={currentSegment.id} className={`w-full h-full relative flex items-center justify-center overflow-hidden ${transitionClass}`}>
        
        {!currentSegment.videoUrl && images.map((img, idx) => (
             <div 
                key={`${currentSegment.id}-img-${idx}`}
                className={`absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ${idx === innerImageIndex ? 'opacity-40 blur-2xl scale-110' : 'opacity-0 scale-100'}`}
                style={{ backgroundImage: `url(${img})` }}
             />
        ))}

        {currentSegment.videoUrl && (
            <video 
                src={currentSegment.videoUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110" 
                style={{ filter: currentSegment.videoConfig?.filter }}
                autoPlay 
                loop 
                muted
            />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-0 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-7xl h-full flex flex-col md:flex-row items-center justify-center p-8 gap-8 md:gap-16">
            <div className="flex-1 w-full max-h-[40vh] md:max-h-[80vh] flex items-center justify-center order-1 md:order-1">
                 {currentSegment.videoUrl ? (
                     <div className="relative rounded-2xl shadow-2xl border-4 border-white/10 overflow-hidden w-full h-full max-w-full flex items-center bg-black">
                         <video 
                            ref={videoRef}
                            src={currentSegment.videoUrl} 
                            className="w-full h-full object-contain"
                            style={{ filter: currentSegment.videoConfig?.filter }}
                            autoPlay
                            loop
                            muted={isMuted}
                         />
                     </div>
                 ) : activeImage ? (
                    <div className="relative rounded-2xl shadow-2xl border-4 border-white/10 overflow-hidden w-auto h-auto max-h-full max-w-full">
                        {images.map((img, idx) => (
                             <img 
                                key={idx}
                                src={img} 
                                alt="Slide visual" 
                                className={`max-h-full max-w-full object-contain animate-ken-burns origin-center absolute inset-0 m-auto transition-opacity duration-1000 ${idx === innerImageIndex ? 'opacity-100 relative' : 'opacity-0'}`}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="w-full aspect-video max-w-2xl bg-gray-800/50 rounded-2xl flex items-center justify-center text-white/50 border border-white/10">
                        <span className="flex items-center gap-2"><div className="animate-pulse w-2 h-2 bg-white rounded-full"></div> Visual not yet generated</span>
                    </div>
                 )}
            </div>

            <div className="flex-1 w-full md:w-auto order-2 md:order-2 flex flex-col justify-center max-w-xl z-20 min-h-0">
                 <div key={`text-${currentSegment.id}`} className="flex flex-col max-h-[40vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 font-bold uppercase tracking-widest text-xs md:text-sm animate-fade-in w-fit">
                        Scene {currentIndex + 1}
                    </div>
                    
                    <div 
                        className={`${getSizeClass()} text-white drop-shadow-md`}
                        style={{ fontFamily: presentationConfig.fontFamily }}
                    >
                         <AnimatedText 
                            text={currentSegment.text} 
                            type={currentSegment.animation || 'slide-up'} 
                            speed={presentationConfig.animationSpeed}
                        />
                    </div>

                    {currentSegment.audioUrl && (
                        <div className="mt-4 flex items-center gap-2 text-white/50 text-sm animate-fade-in" style={{ animationDelay: '500ms' }}>
                            <Volume2 className="w-4 h-4" /> Narration active
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 w-full flex items-center justify-center gap-8 z-30 pb-safe">
        <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-all backdrop-blur-sm group"
        >
            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex flex-col items-center gap-3">
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-5 rounded-full bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/50 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center"
            >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
        </div>

        <button 
            onClick={() => setCurrentIndex(prev => Math.min(segments.length - 1, prev + 1))}
            disabled={currentIndex === segments.length - 1}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-all backdrop-blur-sm group"
        >
            <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      <div className="absolute bottom-0 left-0 h-1 bg-brand-500 transition-all duration-300 z-30" style={{ width: `${((currentIndex + 1) / segments.length) * 100}%` }}></div>
    </div>
  );
};
