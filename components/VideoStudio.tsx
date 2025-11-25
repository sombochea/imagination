
import React, { useState, useEffect, useRef } from 'react';
import { StorySegment, SceneTransition, VisualTransform, VideoConfig, OverlayElement } from '../types';
import { Button } from './Button';
import { Play, Pause, X, ChevronLeft, ChevronRight, Sliders, Image as ImageIcon, Maximize, Scissors, Layers, Clock, MonitorPlay, Film, Zap, Undo, Redo, Video, Type, Box, Upload, Trash2, Move, MousePointer2, Eye, EyeOff, ArrowUp, ArrowDown, Plus, Grid3X3, Timer, Shapes, Sticker, Smile } from 'lucide-react';

interface VideoStudioProps {
    segments: StorySegment[];
    onUpdateSegment: (id: string, field: keyof StorySegment, value: any) => void;
    onClose: () => void;
    onExport?: () => void;
}

const TRANSITIONS: { label: string; value: SceneTransition }[] = [
    { label: 'Fade', value: 'fade' },
    { label: 'Slide', value: 'slide' },
    { label: 'Zoom', value: 'zoom' },
    { label: 'Flip', value: 'flip' },
    { label: 'Curtain', value: 'curtain' },
];

const FILTERS = [
    { label: 'None', value: 'none' },
    { label: 'Cinematic', value: 'contrast(1.1) saturate(1.2)' },
    { label: 'B&W', value: 'grayscale(100%)' },
    { label: 'Vintage', value: 'sepia(0.5) contrast(1.1)' },
    { label: 'Dreamy', value: 'blur(0.5px) brightness(1.1)' },
    { label: 'Vivid', value: 'saturate(1.5)' },
];

type SidebarTab = 'elements' | 'media' | 'library';

// --- Helpers ---

const svgToDataUri = (svgString: string) => `data:image/svg+xml;base64,${btoa(svgString)}`;

const LIBRARY_ASSETS = [
    {
        category: 'Shapes',
        icon: <Shapes className="w-4 h-4" />,
        items: [
            { id: 'circle-color', type: 'image', label: 'Circle', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#f59e0b" /></svg>') },
            { id: 'rect-color', type: 'image', label: 'Box', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="#3b82f6" rx="10" /></svg>') },
            { id: 'arrow-right', type: 'image', label: 'Arrow', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>') },
             { id: 'star-filled', type: 'image', label: 'Star', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#eab308"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>') },
             { id: 'triangle', type: 'image', label: 'Triangle', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2L1 21h22L12 2z"/></svg>') },
        ]
    },
    {
        category: 'Stickers',
        icon: <Sticker className="w-4 h-4" />,
        items: [
             { id: 'smile-sticker', type: 'image', label: 'Smile', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#000" stroke-width="2" fill="none" /><circle cx="9" cy="9" r="1.5" fill="#000" /><circle cx="15" cy="9" r="1.5" fill="#000" /></svg>') },
             { id: 'badge-new', type: 'image', label: 'New', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect width="100" height="50" rx="10" fill="#ef4444"/><text x="50" y="35" font-family="sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle">NEW</text></svg>') },
             { id: 'check-mark', type: 'image', label: 'Check', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>') },
             { id: 'heart-sticker', type: 'image', label: 'Love', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ec4899"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>') },
             { id: 'like-sticker', type: 'image', label: 'Like', content: svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/></svg>') },
        ]
    },
    {
        category: 'Emoji',
        icon: <Smile className="w-4 h-4" />,
        items: [
            { id: 'emo-smile', type: 'text', label: 'Smile', content: '😊' },
            { id: 'emo-sunglasses', type: 'text', label: 'Cool', content: '😎' },
            { id: 'emo-rocket', type: 'text', label: 'Rocket', content: '🚀' },
            { id: 'emo-idea', type: 'text', label: 'Idea', content: '💡' },
            { id: 'emo-fire', type: 'text', label: 'Fire', content: '🔥' },
            { id: 'emo-party', type: 'text', label: 'Party', content: '🎉' },
            { id: 'emo-star', type: 'text', label: 'Star', content: '⭐' },
            { id: 'emo-100', type: 'text', label: '100', content: '💯' },
        ]
    }
];

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

const getElementRect = (ctx: CanvasRenderingContext2D, el: OverlayElement, canvasWidth: number, canvasHeight: number) => {
    const x = (el.x / 100) * canvasWidth;
    const y = (el.y / 100) * canvasHeight;
    let width = 0;
    let height = 0;

    if (el.type === 'text') {
        const fontSize = el.style?.fontSize || 40;
        ctx.font = `bold ${fontSize}px ${el.style?.fontFamily || 'Arial'}`;
        
        // Use defined width percentage if available, otherwise constrain to canvas width
        const maxWidth = el.width ? (el.width / 100) * canvasWidth : (canvasWidth - x - 20); 
        
        const lines = wrapText(ctx, el.content, maxWidth);
        
        // Calculate max width from actual lines
        let maxLineWidth = 0;
        lines.forEach(line => {
            const m = ctx.measureText(line);
            if (m.width > maxLineWidth) maxLineWidth = m.width;
        });
        
        width = maxLineWidth;
        height = lines.length * (fontSize * 1.2); // Line height approximation
        
        // Add a little padding to the rect if background is present
        if (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent') {
             width += 20; 
             height += 10; 
        }

    } else {
        width = el.width ? (el.width / 100) * canvasWidth : 200;
        height = el.height ? (el.height / 100) * canvasHeight : 200;
    }
    return { x, y, width, height };
};

// Snapping Helper
const applySnapping = (val: number, useGrid: boolean, canvasSize?: number) => {
    let snapped = val;
    let isSnapped = false;
    
    // 1. Grid Snapping (Shift Key) - Priority
    if (useGrid) {
        const GRID_SIZE = 5; // 5% grid
        snapped = Math.round(val / GRID_SIZE) * GRID_SIZE;
        return { val: snapped, snapped: true };
    }

    // 2. Magnetic Snapping (Center/Edges)
    const MAGNET_THRESHOLD = 2; // 2% threshold
    const targets = [0, 50, 100];
    
    for (const target of targets) {
        if (Math.abs(val - target) < MAGNET_THRESHOLD) {
            snapped = target;
            isSnapped = true;
            break;
        }
    }

    return { val: snapped, snapped: isSnapped };
};


// Robust Input Component
const LiveInput = ({ 
    label,
    value, 
    onUpdate, 
    className,
    ...props 
}: { 
    label?: string;
    value: string; 
    onUpdate: (val: string) => void; 
    className?: string;
    [key: string]: any;
}) => {
    const [localValue, setLocalValue] = useState(value);

    // Sync from parent if parent changes significantly and we aren't typing (optional, 
    // but simpler to just rely on local state and push updates up)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalValue(val);
        onUpdate(val);
    };

    return (
        <div className="space-y-1.5">
            {label && <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</label>}
            <input 
                value={localValue} 
                onChange={handleChange}
                className={className} 
                {...props} 
            />
        </div>
    );
};

export const VideoStudio: React.FC<VideoStudioProps> = ({ segments, onUpdateSegment, onClose, onExport }) => {
    const [selectedId, setSelectedId] = useState<string>(segments[0]?.id || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState<SidebarTab>('elements');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    
    // Dragging State
    const [dragMode, setDragMode] = useState<'none' | 'move' | 'resize'>('none');
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const initialDragStateRef = useRef<{w: number, h: number, fontSize: number} | null>(null);

    // Snapping Visuals
    const snapLinesRef = useRef<{x?: number, y?: number}>({});

    // Media Upload State
    const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
    const mediaInputRef = useRef<HTMLInputElement>(null);

    const selectedSegment = segments.find(s => s.id === selectedId);
    const selectedIndex = segments.findIndex(s => s.id === selectedId);
    const activeElements = selectedSegment?.elements || [];
    const selectedElement = selectedElementId ? activeElements.find(el => el.id === selectedElementId) : null;

    const activeTransform = selectedSegment?.visualTransform || { scale: 1, x: 0, y: 0 };
    const activeDuration = selectedSegment?.customDuration || 5;
    const activeFilter = selectedSegment?.videoConfig?.filter || 'none';
    const videoConfig = selectedSegment?.videoConfig || {};

    const [transformHistory, setTransformHistory] = useState<Record<string, { past: VisualTransform[], future: VisualTransform[] }>>({});

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isPlayingRef = useRef(false);
    const playbackStartRef = useRef<number>(0);
    const pausedElapsedRef = useRef<number>(0); 
    const currentSegmentDurationRef = useRef<number>(0);
    const segmentsRef = useRef(segments);
    const selectedIdRef = useRef(selectedId);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { segmentsRef.current = segments; }, [segments]);
    useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

    useEffect(() => {
        setIsPlaying(false);
        playbackStartRef.current = Date.now();
        pausedElapsedRef.current = 0;
        if (selectedSegment) {
            if (selectedSegment.videoUrl && selectedSegment.videoConfig) {
                 const start = selectedSegment.videoConfig.trimStart || 0;
                 const end = selectedSegment.videoConfig.trimEnd || 5; 
                 const speed = selectedSegment.videoConfig.playbackRate || 1;
                 currentSegmentDurationRef.current = (end - start) / speed;
            } else {
                currentSegmentDurationRef.current = selectedSegment.customDuration || 5;
            }
        }
    }, [selectedId]);

    useEffect(() => {
        if (selectedSegment?.videoUrl && videoRef.current) {
             videoRef.current.src = selectedSegment.videoUrl;
             videoRef.current.load();
             videoRef.current.onloadedmetadata = () => {
                 if (selectedSegment.videoConfig) {
                     const start = selectedSegment.videoConfig.trimStart || 0;
                     const end = selectedSegment.videoConfig.trimEnd || videoRef.current!.duration;
                     const speed = selectedSegment.videoConfig.playbackRate || 1;
                     currentSegmentDurationRef.current = (end - start) / speed;
                 }
             };
        } else if (videoRef.current) {
            // Fix: Clear source to prevent "no supported source" error
            videoRef.current.removeAttribute('src');
            videoRef.current.load();
        }
    }, [selectedSegment?.videoUrl]);

    useEffect(() => {
        if (!canvasRef.current || !selectedSegment) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imgUrl = (selectedSegment.imageUrls && selectedSegment.imageUrls.length > 0) 
            ? selectedSegment.imageUrls[selectedSegment.previewIndex || 0] 
            : selectedSegment.imageUrl;
        
        const img = new Image();
        let animationFrame: number;

        const advanceTrack = () => {
            const currentIdx = segmentsRef.current.findIndex(s => s.id === selectedIdRef.current);
            const nextIndex = currentIdx + 1;
            if (nextIndex < segmentsRef.current.length) {
                setIsPlaying(false); 
                setSelectedId(segmentsRef.current[nextIndex].id);
            } else {
                setIsPlaying(false);
                pausedElapsedRef.current = 0;
            }
        };

        const render = () => {
            if (!ctx) return;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const isVideo = !!selectedSegment.videoUrl && videoRef.current && videoRef.current.getAttribute('src');
            const visualSource = isVideo ? videoRef.current! : img;
            const playing = isPlayingRef.current;

            let currentSegmentTime = 0;
            if (playing) {
                if (isVideo && videoRef.current) {
                    // Video time logic
                    const end = videoConfig.trimEnd || videoRef.current?.duration || 10;
                    if (videoRef.current.currentTime >= end - 0.1) {
                         advanceTrack();
                         return;
                    }
                    if (videoRef.current.paused) videoRef.current.play().catch(() => {});
                    
                    const start = videoConfig.trimStart || 0;
                    if (videoRef.current.currentTime < start) {
                        videoRef.current.currentTime = start;
                    }
                    videoRef.current.playbackRate = videoConfig.playbackRate || 1;
                    
                    // Approximate segment time for video for overlays
                    const speed = videoConfig.playbackRate || 1;
                    currentSegmentTime = (videoRef.current.currentTime - start) / speed;

                } else {
                    if (playbackStartRef.current === 0) playbackStartRef.current = Date.now();
                    const now = Date.now();
                    if (pausedElapsedRef.current > 0) {
                        playbackStartRef.current = now - pausedElapsedRef.current;
                        pausedElapsedRef.current = 0;
                    }
                    const elapsed = (now - playbackStartRef.current) / 1000;
                    currentSegmentTime = elapsed;
                    if (elapsed >= currentSegmentDurationRef.current) {
                        advanceTrack();
                        return;
                    }
                }
            } else {
                if (isVideo && videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                }
                // Calculate paused time for overlay preview
                currentSegmentTime = pausedElapsedRef.current / 1000;
            }
            
            // Draw Background Visual
            if ((imgUrl || isVideo) && (visualSource instanceof HTMLVideoElement ? visualSource.readyState >= 2 : (visualSource as HTMLImageElement).complete)) {
                ctx.filter = activeFilter;
                ctx.save();
                ctx.filter = `blur(20px) brightness(0.5) ${activeFilter !== 'none' ? activeFilter : ''}`;
                ctx.drawImage(visualSource as any, 0, 0, canvas.width, canvas.height);
                ctx.restore();

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(activeTransform.scale, activeTransform.scale);
                const offsetX = (activeTransform.x / 100) * canvas.width;
                const offsetY = (activeTransform.y / 100) * canvas.height;
                ctx.translate(offsetX, offsetY);

                let srcW = 0, srcH = 0;
                if (visualSource instanceof HTMLVideoElement) {
                    srcW = visualSource.videoWidth;
                    srcH = visualSource.videoHeight;
                } else {
                    srcW = (visualSource as HTMLImageElement).width;
                    srcH = (visualSource as HTMLImageElement).height;
                }

                if (srcW && srcH) {
                    const aspect = srcW / srcH;
                    const canvasAspect = canvas.width / canvas.height;
                    let drawW = canvas.width;
                    let drawH = canvas.height;
                    if (aspect > canvasAspect) drawH = canvas.width / aspect;
                    else drawW = canvas.height * aspect;
                    
                    ctx.drawImage(visualSource as any, -drawW / 2, -drawH / 2, drawW, drawH);
                }
                ctx.restore();
            } else {
                ctx.fillStyle = '#222';
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("No Media", canvas.width/2, canvas.height/2);
            }

            // Draw Overlays
            activeElements.forEach(el => {
                if (el.visible === false) return;

                // Timing Check
                const startTime = el.startTime || 0;
                const endTime = el.endTime || currentSegmentDurationRef.current;
                
                const isVisibleTime = currentSegmentTime >= startTime && currentSegmentTime <= endTime;
                const isSelected = el.id === selectedElementId;

                // If not in time range and not selected, skip. If selected, draw transparently.
                if (!isVisibleTime && !isSelected) return;

                ctx.save();
                if (!isVisibleTime && isSelected) {
                    ctx.globalAlpha = 0.5; // Ghosted if out of time but editing
                }

                const rect = getElementRect(ctx, el, canvas.width, canvas.height);
                const { x, y } = rect;
                
                if (el.type === 'text') {
                    const fontSize = el.style?.fontSize || 40;
                    ctx.font = `bold ${fontSize}px ${el.style?.fontFamily || 'Arial'}`;
                    
                    let contentWidth = el.width ? (el.width / 100) * canvas.width : (canvas.width - x - 20);
                    if (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent') {
                        contentWidth -= 20; 
                    }
                    
                    const lines = wrapText(ctx, el.content, contentWidth);
                    const lineHeight = fontSize * 1.2;
                    
                    if (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent') {
                        ctx.fillStyle = el.style.backgroundColor;
                        const r = 8;
                        ctx.beginPath();
                        ctx.roundRect(x, y, rect.width, rect.height, r);
                        ctx.fill();
                    }

                    ctx.fillStyle = el.style?.color || 'white';
                    ctx.textBaseline = 'top';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 4;

                    const padX = (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent') ? 10 : 0;
                    const padY = (el.style?.backgroundColor && el.style.backgroundColor !== 'transparent') ? 5 : 0;

                    lines.forEach((line, i) => {
                        ctx.fillText(line, x + padX, y + padY + (i * lineHeight));
                    });

                } else if (el.type === 'image') {
                    const imgOverlay = new Image();
                    imgOverlay.src = el.content;
                    if (imgOverlay.complete) {
                        ctx.drawImage(imgOverlay, x, y, rect.width, rect.height);
                    } else {
                        ctx.fillStyle = '#333';
                        ctx.fillRect(x, y, rect.width, rect.height);
                    }
                }

                if (el.id === selectedElementId) {
                     const padding = 6;
                     ctx.strokeStyle = '#f59e0b'; 
                     ctx.lineWidth = 2;
                     ctx.setLineDash([5, 5]);
                     ctx.strokeRect(x - padding, y - padding, rect.width + padding*2, rect.height + padding*2);
                     
                     // Resize Handle
                     ctx.fillStyle = '#f59e0b';
                     ctx.setLineDash([]);
                     const handleSize = 12;
                     ctx.fillRect(x + rect.width + padding - (handleSize/2), y + rect.height + padding - (handleSize/2), handleSize, handleSize);
                }
                
                ctx.restore();
            });

            // Draw Snapping Guides
            if (dragMode === 'move') {
                 const { x, y } = snapLinesRef.current;
                 ctx.strokeStyle = '#06b6d4'; // cyan-500
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 if (x !== undefined) {
                     const xPos = (x / 100) * canvas.width;
                     ctx.moveTo(xPos, 0);
                     ctx.lineTo(xPos, canvas.height);
                 }
                 if (y !== undefined) {
                     const yPos = (y / 100) * canvas.height;
                     ctx.moveTo(0, yPos);
                     ctx.lineTo(canvas.width, yPos);
                 }
                 ctx.stroke();
            }

            // Playhead Progress
            if (playing && !isVideo) {
                 const pct = Math.min(1, currentSegmentTime / currentSegmentDurationRef.current);
                 ctx.fillStyle = '#f59e0b';
                 ctx.fillRect(0, canvas.height - 4, canvas.width * pct, 4);
            }

            animationFrame = requestAnimationFrame(render);
        };

        if (imgUrl && !selectedSegment.videoUrl) {
            img.src = imgUrl;
            img.onload = render;
            if (img.complete) render();
        } else {
            render();
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [selectedSegment, activeTransform, activeFilter, videoConfig, activeElements, selectedElementId]);

    // ... Interaction Handlers ...
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !selectedSegment) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Check Resize Handle
        if (selectedElementId) {
            const el = selectedSegment.elements?.find(e => e.id === selectedElementId);
            if (el && el.visible !== false) {
                const elRect = getElementRect(ctx, el, canvasRef.current.width, canvasRef.current.height);
                const padding = 6;
                const handleSize = 12;
                const handleX = elRect.x + elRect.width + padding - (handleSize/2);
                const handleY = elRect.y + elRect.height + padding - (handleSize/2);
                
                if (clickX >= handleX && clickX <= handleX + handleSize &&
                    clickY >= handleY && clickY <= handleY + handleSize) {
                        setDragMode('resize');
                        initialDragStateRef.current = { 
                            w: elRect.width, 
                            h: elRect.height, 
                            fontSize: el.style?.fontSize || 40 
                        };
                        dragOffsetRef.current = { x: clickX, y: clickY };
                        return;
                }
            }
        }

        // Check Element Hit
        const elements = [...(selectedSegment.elements || [])].reverse();
        let hitId = null;
        for (const el of elements) {
             if (el.visible === false) continue;
             const elRect = getElementRect(ctx, el, canvasRef.current.width, canvasRef.current.height);
             const padding = 5;
             if (clickX >= elRect.x - padding && clickX <= elRect.x + elRect.width + padding &&
                 clickY >= elRect.y - padding && clickY <= elRect.y + elRect.height + padding) {
                     hitId = el.id;
                     break;
             }
        }

        if (hitId) {
            setSelectedElementId(hitId);
            setDragMode('move');
            const el = selectedSegment.elements?.find(e => e.id === hitId)!;
            const elRect = getElementRect(ctx, el, canvasRef.current.width, canvasRef.current.height);
            dragOffsetRef.current = { x: clickX - elRect.x, y: clickY - elRect.y };
        } else {
            setSelectedElementId(null);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || dragMode === 'none' || !selectedElementId || !selectedSegment) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        if (dragMode === 'move') {
            const newPixelX = mouseX - dragOffsetRef.current.x;
            const newPixelY = mouseY - dragOffsetRef.current.y;
            
            let rawPctX = (newPixelX / canvasRef.current.width) * 100;
            let rawPctY = (newPixelY / canvasRef.current.height) * 100;
            
            // Apply Snapping
            const snapX = applySnapping(rawPctX, e.shiftKey);
            const snapY = applySnapping(rawPctY, e.shiftKey);

            // Update Visual Guide State
            snapLinesRef.current = {
                x: snapX.snapped ? snapX.val : undefined,
                y: snapY.snapped ? snapY.val : undefined
            };

            // Clamp
            const finalX = Math.max(-20, Math.min(120, snapX.val));
            const finalY = Math.max(-20, Math.min(120, snapY.val));

            const newElements = selectedSegment.elements?.map(el => 
                el.id === selectedElementId ? { ...el, x: finalX, y: finalY } : el
            ) || [];
            onUpdateSegment(selectedId, 'elements', newElements);
        } 
        else if (dragMode === 'resize') {
             const deltaX = mouseX - dragOffsetRef.current.x;
             const el = selectedSegment.elements?.find(e => e.id === selectedElementId);
             
             if (el && initialDragStateRef.current) {
                 const startState = initialDragStateRef.current;
                 if (el.type === 'text') {
                     const ratio = (startState.w + deltaX) / startState.w;
                     let newFontSize = Math.max(10, startState.fontSize * ratio);
                     if (e.shiftKey) newFontSize = Math.round(newFontSize / 4) * 4;

                     const newElements = selectedSegment.elements?.map(e => 
                        e.id === selectedElementId ? { ...e, style: { ...e.style, fontSize: newFontSize } } : e
                     ) || [];
                     onUpdateSegment(selectedId, 'elements', newElements);
                 } else {
                     const newWidthPx = Math.max(20, startState.w + deltaX);
                     const ratio = newWidthPx / startState.w;
                     const newHeightPx = startState.h * ratio;
                     let newWidthPct = (newWidthPx / canvasRef.current.width) * 100;
                     let newHeightPct = (newHeightPx / canvasRef.current.height) * 100;
                     
                     if (e.shiftKey) {
                         newWidthPct = Math.round(newWidthPct / 5) * 5;
                         newHeightPct = Math.round(newHeightPct / 5) * 5;
                     }
                     const newElements = selectedSegment.elements?.map(e => 
                        e.id === selectedElementId ? { ...e, width: newWidthPct, height: newHeightPct } : e
                     ) || [];
                     onUpdateSegment(selectedId, 'elements', newElements);
                 }
             }
        }
    };

    const handleCanvasMouseUp = () => {
        setDragMode('none');
        snapLinesRef.current = {}; // Clear guides
    };

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUploadedMedia(prev => [reader.result as string, ...prev]);
                };
                reader.readAsDataURL(file as Blob);
            });
        }
    };

    // --- Data Handlers ---
    const handleUndo = () => {
        if (!selectedId || !transformHistory[selectedId]?.past.length) return;
        const currentHistory = transformHistory[selectedId];
        const previous = currentHistory.past[currentHistory.past.length - 1];
        const newPast = currentHistory.past.slice(0, -1);
        setTransformHistory(prev => ({ ...prev, [selectedId]: { past: newPast, future: [activeTransform, ...currentHistory.future] } }));
        onUpdateSegment(selectedId, 'visualTransform', previous);
    };

    const handleRedo = () => {
        if (!selectedId || !transformHistory[selectedId]?.future.length) return;
        const currentHistory = transformHistory[selectedId];
        const next = currentHistory.future[0];
        const newFuture = currentHistory.future.slice(1);
        setTransformHistory(prev => ({ ...prev, [selectedId]: { past: [...currentHistory.past, activeTransform], future: newFuture } }));
        onUpdateSegment(selectedId, 'visualTransform', next);
    };

    const recordHistory = () => {
        if (!selectedId) return;
        setTransformHistory(prev => {
            const currentHistory = prev[selectedId] || { past: [], future: [] };
            return {
                ...prev,
                [selectedId]: {
                    past: [...currentHistory.past, activeTransform],
                    future: []
                }
            };
        });
    };

    const handleTransformChange = (field: keyof VisualTransform, value: number) => {
        if (!selectedId) return;
        const newTransform = { ...activeTransform, [field]: value };
        onUpdateSegment(selectedId, 'visualTransform', newTransform);
    };

    const handleDragStart = (e: React.DragEvent, type: 'text' | 'image', content: string) => {
        e.dataTransfer.setData('type', type);
        e.dataTransfer.setData('content', content);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDropOnCanvas = (e: React.DragEvent) => {
        e.preventDefault();
        if (!selectedId || !canvasRef.current) return;
        const type = e.dataTransfer.getData('type') as 'text' | 'image';
        const content = e.dataTransfer.getData('content');
        if (!type || !content) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;

        const newElement: OverlayElement = {
            id: Date.now().toString(),
            type,
            content,
            visible: true,
            x: Math.max(0, Math.min(90, xPct)),
            y: Math.max(0, Math.min(90, yPct)),
            width: type === 'image' ? 25 : undefined,
            height: type === 'image' ? 25 : undefined, 
            style: {
                fontSize: type === 'text' && content.length < 5 ? 80 : 40,
                color: '#ffffff',
                fontFamily: 'Comic Neue'
            }
        };
        const currentElements = selectedSegment?.elements || [];
        onUpdateSegment(selectedId, 'elements', [...currentElements, newElement]);
        setSelectedElementId(newElement.id);
    };

    const handleQuickAddAsset = (type: 'text' | 'image', content: string) => {
        if (!selectedId) return;
        const newElement: OverlayElement = {
            id: Date.now().toString(),
            type,
            content,
            visible: true,
            x: 50, // 50% from left
            y: 10, // 10% from top
            width: type === 'image' ? 25 : undefined,
            height: type === 'image' ? 25 : undefined,
             style: {
                fontSize: type === 'text' && content.length < 5 ? 80 : 40,
                color: '#ffffff',
                fontFamily: 'Comic Neue'
            }
        };
        const currentElements = selectedSegment?.elements || [];
        onUpdateSegment(selectedId, 'elements', [...currentElements, newElement]);
        setSelectedElementId(newElement.id);
    };

    const handleAddStoryText = () => {
        if (!selectedSegment) return;
        const newElement: OverlayElement = {
            id: Date.now().toString(),
            type: 'text',
            content: selectedSegment.text,
            visible: true,
            x: 5,
            y: 80, width: 90, 
            style: {
                fontSize: 28,
                color: '#ffffff',
                fontFamily: 'Comic Neue',
                backgroundColor: 'rgba(0,0,0,0.5)'
            }
        };
        const currentElements = selectedSegment?.elements || [];
        onUpdateSegment(selectedId, 'elements', [...currentElements, newElement]);
        setSelectedElementId(newElement.id);
    };

    const handleUpdateElement = (elId: string, updates: Partial<OverlayElement>) => {
        const currentElements = selectedSegment?.elements || [];
        const newElements = currentElements.map(el => {
            if (el.id === elId) {
                // Handle style updates specifically if passed
                if ('style' in updates) {
                    return { ...el, ...updates, style: { ...el.style, ...updates.style } };
                }
                return { ...el, ...updates };
            }
            return el;
        });
        onUpdateSegment(selectedId, 'elements', newElements);
    };
    
    const handleDeleteElement = (elId: string) => {
         const currentElements = selectedSegment?.elements || [];
         onUpdateSegment(selectedId, 'elements', currentElements.filter(el => el.id !== elId));
         setSelectedElementId(null);
    };

    const handleToggleVisibility = (elId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const currentElements = selectedSegment?.elements || [];
        const newElements = currentElements.map(el => el.id === elId ? { ...el, visible: el.visible === false ? true : false } : el);
        onUpdateSegment(selectedId, 'elements', newElements);
    };

    const handleMoveLayer = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        const currentElements = [...(selectedSegment?.elements || [])];
        if (direction === 'up' && index < currentElements.length - 1) {
            [currentElements[index], currentElements[index + 1]] = [currentElements[index + 1], currentElements[index]];
        } else if (direction === 'down' && index > 0) {
            [currentElements[index], currentElements[index - 1]] = [currentElements[index - 1], currentElements[index]];
        }
        onUpdateSegment(selectedId, 'elements', currentElements);
    };

    const canUndo = selectedId && !!transformHistory[selectedId]?.past.length;
    const canRedo = selectedId && !!transformHistory[selectedId]?.future.length;

    return (
        <div className="fixed inset-0 z-50 bg-[#1e1e1e] text-gray-200 flex flex-col font-sans animate-fade-in">
            <video ref={videoRef} className="hidden" muted playsInline />
            
            <div className="h-14 border-b border-gray-700 bg-[#252525] flex items-center justify-between px-4 shadow-md z-10">
                <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-brand-500" />
                    <span className="font-bold text-gray-100">Video Studio</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400 border border-gray-600">Beta</span>
                </div>
                <div className="flex items-center gap-3">
                    {onExport && (
                         <Button onClick={onExport} size="sm" className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white shadow-lg shadow-indigo-600/30 rounded-lg text-xs uppercase tracking-wide font-bold">
                            <Video className="w-4 h-4" /> Export Video
                         </Button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT SIDEBAR */}
                <div className="w-16 md:w-64 bg-[#252525] border-r border-gray-700 flex flex-col">
                     <div className="flex flex-col md:flex-row border-b border-gray-700">
                         <button 
                            onClick={() => setActiveTab('elements')}
                            className={`flex-1 p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase transition-colors ${activeTab === 'elements' ? 'bg-[#333] text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Type className="w-4 h-4" /> <span className="hidden md:inline">Text</span>
                         </button>
                         <button 
                            onClick={() => setActiveTab('library')}
                            className={`flex-1 p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase transition-colors ${activeTab === 'library' ? 'bg-[#333] text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Shapes className="w-4 h-4" /> <span className="hidden md:inline">Library</span>
                         </button>
                         <button 
                            onClick={() => setActiveTab('media')}
                            className={`flex-1 p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase transition-colors ${activeTab === 'media' ? 'bg-[#333] text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            <ImageIcon className="w-4 h-4" /> <span className="hidden md:inline">Media</span>
                         </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                         {activeTab === 'elements' && (
                             <>
                                <button onClick={handleAddStoryText} className="w-full bg-brand-900/30 border border-brand-700 hover:bg-brand-900/50 p-2.5 rounded-lg text-brand-400 text-xs font-bold flex items-center justify-center gap-2 mb-4 transition-colors hover:border-brand-600">
                                    <Type className="w-3.5 h-3.5" /> Import Story Text
                                </button>
                                
                                <div className="text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-wider">Typography</div>
                                <div draggable onDragStart={(e) => handleDragStart(e, 'text', 'Heading Text')} className="bg-[#333] p-4 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing hover:bg-[#444] transition-colors mb-2 group shadow-sm">
                                    <h4 className="font-bold text-white text-lg pointer-events-none group-hover:text-brand-200">Heading Text</h4>
                                </div>
                                <div draggable onDragStart={(e) => handleDragStart(e, 'text', 'Body Text')} className="bg-[#333] p-4 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing hover:bg-[#444] transition-colors mb-2 group shadow-sm">
                                    <p className="text-gray-300 text-sm pointer-events-none group-hover:text-gray-100">Simple body text block</p>
                                </div>
                             </>
                         )}
                         {activeTab === 'library' && (
                             <div className="space-y-6">
                                 {LIBRARY_ASSETS.map((cat, i) => (
                                     <div key={i}>
                                         <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase mb-2 tracking-wider">
                                             {cat.icon} {cat.category}
                                         </div>
                                         <div className="grid grid-cols-3 gap-2">
                                             {cat.items.map((item) => (
                                                 <div 
                                                    key={item.id} 
                                                    draggable 
                                                    onDragStart={(e) => handleDragStart(e, item.type as 'text'|'image', item.content)} 
                                                    onClick={() => handleQuickAddAsset(item.type as 'text'|'image', item.content)}
                                                    className="aspect-square bg-[#333] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#444] border border-transparent hover:border-gray-600 transition-all p-2 group"
                                                    title={item.label}
                                                 >
                                                     {item.type === 'image' ? (
                                                         <img src={item.content} className="w-full h-full object-contain pointer-events-none group-hover:scale-110 transition-transform" />
                                                     ) : (
                                                         <span className="text-2xl select-none group-hover:scale-110 transition-transform">{item.content}</span>
                                                     )}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                         {activeTab === 'media' && (
                             <div className="space-y-4">
                                 <div onClick={() => mediaInputRef.current?.click()} className="border-2 border-dashed border-gray-600 hover:border-brand-500 hover:bg-[#333] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                                    <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" multiple accept="image/*" />
                                    <Upload className="w-8 h-8 text-gray-500 group-hover:text-brand-500 mb-2 transition-colors" />
                                    <span className="text-xs text-gray-400 font-bold group-hover:text-gray-200">Upload Images</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     {uploadedMedia.map((url, idx) => (
                                         <div key={idx} draggable onDragStart={(e) => handleDragStart(e, 'image', url)} className="aspect-square bg-[#333] rounded-lg overflow-hidden border border-gray-700 cursor-grab active:cursor-grabbing hover:border-gray-500 transition-all hover:scale-105 shadow-sm">
                                             <img src={url} className="w-full h-full object-cover" />
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                     </div>
                </div>

                {/* MIDDLE: Preview Area */}
                <div className="flex-1 flex flex-col relative bg-[#121212]">
                    <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden select-none bg-dots-pattern" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnCanvas}>
                        <div className="relative shadow-2xl border border-gray-800 bg-black">
                             <canvas 
                                ref={canvasRef} 
                                width={854} 
                                height={480} 
                                className={`bg-black max-w-full max-h-[60vh] aspect-video ${dragMode !== 'none' ? 'cursor-grabbing' : 'cursor-default'}`}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                             />
                        </div>
                        {/* Canvas Instructions */}
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded text-[10px] text-gray-400 font-mono border border-gray-800 pointer-events-none">
                            Hold SHIFT to snap to Grid
                        </div>
                    </div>
                    {/* Transport Controls */}
                    <div className="h-14 border-t border-gray-700 bg-[#1e1e1e] flex items-center justify-center gap-6 z-20">
                        <button onClick={() => { setIsPlaying(false); const prev = Math.max(0, selectedIndex - 1); setSelectedId(segments[prev].id); }} className="p-2 hover:text-white text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <button onClick={() => { if (isPlaying) { setIsPlaying(false); pausedElapsedRef.current = Date.now() - playbackStartRef.current; } else { setIsPlaying(true); } }} className="w-12 h-12 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 transform active:scale-95 transition-all">
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <button onClick={() => { setIsPlaying(false); const next = Math.min(segments.length - 1, selectedIndex + 1); setSelectedId(segments[next].id); }} className="p-2 hover:text-white text-gray-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* RIGHT: Inspector */}
                <div className="w-80 bg-[#252525] border-l border-gray-700 flex flex-col overflow-y-auto custom-scrollbar">
                    {selectedElement ? (
                        <div className="p-5 bg-[#2a2a2a] border-b border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-500">{selectedElement.type === 'text' ? 'Text Properties' : 'Element Properties'}</h3>
                                <button onClick={() => setSelectedElementId(null)} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-6">
                                {selectedElement.type === 'text' && (
                                    <>
                                        <LiveInput 
                                            key={selectedElement.id} 
                                            label="Content"
                                            value={selectedElement.content}
                                            onUpdate={(val) => {
                                                const newEls = activeElements.map(el => el.id === selectedElementId ? {...el, content: val} : el);
                                                onUpdateSegment(selectedId, 'elements', newEls);
                                            }}
                                            className="w-full bg-[#181818] border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-500 outline-none transition-colors focus:ring-1 focus:ring-brand-500"
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Text Color</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {['#ffffff', '#000000', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'].map(c => (
                                                    <button key={c} onClick={() => handleUpdateElement(selectedElementId!, { style: { ...selectedElement.style, color: c } })} className="w-6 h-6 rounded-full border border-gray-600 hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Background</label>
                                            <div className="flex gap-2 flex-wrap">
                                                <button onClick={() => handleUpdateElement(selectedElementId!, { style: { ...selectedElement.style, backgroundColor: 'transparent' } })} className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center relative bg-transparent hover:scale-110 transition-transform group" title="None">
                                                    <div className="w-0.5 h-full bg-red-500 transform rotate-45"></div>
                                                </button>
                                                {['rgba(0,0,0,0.5)', '#ffffff', '#f59e0b', '#ef4444', '#3b82f6', '#10b981'].map(c => (
                                                    <button key={c} onClick={() => handleUpdateElement(selectedElementId!, { style: { ...selectedElement.style, backgroundColor: c } })} className="w-6 h-6 rounded-full border border-gray-600 hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Font Size</label> <span className="text-[10px] text-gray-500 font-mono">{selectedElement.style?.fontSize}px</span></div>
                                            <input type="range" min="10" max="100" value={selectedElement.style?.fontSize || 40} onChange={(e) => handleUpdateElement(selectedElementId!, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) } })} className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500" />
                                        </div>
                                    </>
                                )}
                                
                                <div className="space-y-3 pt-4 border-t border-gray-700">
                                    <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1"><Timer className="w-3 h-3" /> Timing</h4>
                                    <div className="bg-[#222] p-3 rounded-lg border border-gray-600 space-y-3">
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1 text-gray-400"><span>Start</span> <span className="text-white font-mono">{selectedElement.startTime?.toFixed(1) || 0}s</span></div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={currentSegmentDurationRef.current} 
                                                step="0.1" 
                                                value={selectedElement.startTime || 0} 
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (val < (selectedElement.endTime || currentSegmentDurationRef.current)) {
                                                        handleUpdateElement(selectedElementId!, { startTime: val });
                                                    }
                                                }}
                                                className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500" 
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] mb-1 text-gray-400"><span>End</span> <span className="text-white font-mono">{selectedElement.endTime?.toFixed(1) || currentSegmentDurationRef.current.toFixed(1)}s</span></div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={currentSegmentDurationRef.current} 
                                                step="0.1" 
                                                value={selectedElement.endTime || currentSegmentDurationRef.current} 
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (val > (selectedElement.startTime || 0)) {
                                                        handleUpdateElement(selectedElementId!, { endTime: val });
                                                    }
                                                }}
                                                className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button size="sm" variant="danger" onClick={() => handleDeleteElement(selectedElementId!)} className="w-full mt-4 bg-red-900/10 text-red-400 border-red-900/30 hover:bg-red-900/30 hover:border-red-900/50">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Element
                                </Button>
                            </div>
                        </div>
                    ) : (
                    <div className="p-5 border-b border-gray-700">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Global Inspector</h3>
                        <p className="font-bold text-white truncate text-lg">{selectedIndex + 1}. {selectedSegment?.videoUrl ? 'Video Clip' : 'Image Scene'}</p>
                    </div>
                    )}
                    
                    {/* Layer Panel */}
                    {selectedSegment && activeElements.length > 0 && (
                        <div className="p-5 border-b border-gray-700">
                             <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-1">
                                 <Layers className="w-3 h-3" /> Layers
                             </h3>
                             <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                 {[...activeElements].map((_, i, arr) => arr[arr.length - 1 - i]).map((el) => {
                                     const idx = activeElements.findIndex(e => e.id === el.id);
                                     return (
                                     <div key={el.id} onClick={() => setSelectedElementId(el.id)} className={`flex items-center gap-3 p-2.5 rounded-lg text-xs cursor-pointer group transition-all ${el.id === selectedElementId ? 'bg-brand-900/30 text-brand-100 border border-brand-800' : 'bg-[#333]/50 hover:bg-[#333] text-gray-300 border border-transparent'}`}>
                                         {el.type === 'text' ? <Type className="w-3.5 h-3.5 opacity-70" /> : <ImageIcon className="w-3.5 h-3.5 opacity-70" />}
                                         <span className="flex-1 truncate select-none font-medium">{el.type === 'image' ? 'Image Overlay' : el.content}</span>
                                         <button onClick={(e) => handleToggleVisibility(el.id, e)} className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">{el.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                                         <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={(e) => handleMoveLayer(idx, 'up', e)} disabled={idx === activeElements.length - 1} className="hover:text-white disabled:opacity-20 disabled:hover:text-gray-600"><ArrowUp className="w-2.5 h-2.5" /></button>
                                             <button onClick={(e) => handleMoveLayer(idx, 'down', e)} disabled={idx === 0} className="hover:text-white disabled:opacity-20 disabled:hover:text-gray-600"><ArrowDown className="w-2.5 h-2.5" /></button>
                                         </div>
                                     </div>
                                 )})}
                             </div>
                        </div>
                    )}

                    {selectedSegment && !selectedElement && (
                        <div className="p-5 space-y-8">
                            {/* Transform / Crop */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                        <Maximize className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-wide">Transform</span>
                                    </div>
                                    <div className="flex gap-1 bg-black/30 p-1 rounded">
                                        <button onClick={handleUndo} disabled={!canUndo} className={`p-1.5 rounded transition-colors ${canUndo ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700 cursor-not-allowed'}`} title="Undo"><Undo className="w-3.5 h-3.5" /></button>
                                        <button onClick={handleRedo} disabled={!canRedo} className={`p-1.5 rounded transition-colors ${canRedo ? 'hover:bg-gray-600 text-gray-300' : 'text-gray-700 cursor-not-allowed'}`} title="Redo"><Redo className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 space-y-5">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-2"><span>Scale</span> <span className="text-white">{activeTransform.scale.toFixed(1)}x</span></div>
                                        <input type="range" min="1" max="3" step="0.1" value={activeTransform.scale} onPointerDown={recordHistory} onChange={(e) => handleTransformChange('scale', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-2"><span>Pos X</span> <span className="text-white">{activeTransform.x}%</span></div>
                                        <input type="range" min="-50" max="50" step="1" value={activeTransform.x} onPointerDown={recordHistory} onChange={(e) => handleTransformChange('x', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-2"><span>Pos Y</span> <span className="text-white">{activeTransform.y}%</span></div>
                                        <input type="range" min="-50" max="50" step="1" value={activeTransform.y} onPointerDown={recordHistory} onChange={(e) => handleTransformChange('y', parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Timeline */}
            <div className="h-40 bg-[#121212] border-t border-gray-700 flex flex-col">
                <div className="h-9 bg-[#1e1e1e] border-b border-gray-700 flex items-center px-4 justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Video className="w-3 h-3" /> Main Track</span>
                    {isPlaying && <span className="text-[10px] text-brand-500 animate-pulse font-bold tracking-widest">PLAYING</span>}
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar p-4 flex gap-1.5 items-center">
                    {segments.map((seg, idx) => {
                        const img = (seg.imageUrls && seg.imageUrls.length > 0) ? seg.imageUrls[seg.previewIndex || 0] : seg.imageUrl;
                        const isActive = seg.id === selectedId;
                        const duration = seg.customDuration || (seg.videoConfig ? ((seg.videoConfig.trimEnd || 5) - (seg.videoConfig.trimStart || 0)) : 5);
                        const width = Math.max(80, duration * 20); 

                        return (
                            <div key={seg.id} onClick={() => { setIsPlaying(false); setSelectedId(seg.id); }} className={`relative h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group ${isActive ? 'border-brand-500 ring-2 ring-brand-500/30 scale-[1.02] z-10' : 'border-gray-700 opacity-70 hover:opacity-100 hover:border-gray-500'}`} style={{ width: `${width}px` }}>
                                {seg.videoUrl ? <div className="w-full h-full bg-black flex items-center justify-center relative"><video src={seg.videoUrl} className="w-full h-full object-cover opacity-60" /><Film className="w-4 h-4 text-white absolute" /></div> : img ? <img src={img} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-600" /></div>}
                                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 to-transparent pt-4 px-1.5 pb-1 text-[9px] text-gray-300 truncate font-mono font-bold">{idx + 1}. {duration.toFixed(1)}s</div>
                                {seg.elements && seg.elements.length > 0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 shadow-sm ring-2 ring-black/20" title="Has Overlays"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
