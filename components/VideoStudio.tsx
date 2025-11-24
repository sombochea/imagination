
import React, { useState, useEffect, useRef } from 'react';
import { StorySegment, SceneTransition, VisualTransform, VideoConfig, OverlayElement } from '../types';
import { Button } from './Button';
import { Play, Pause, X, ChevronLeft, ChevronRight, Sliders, Image as ImageIcon, Maximize, Scissors, Layers, Clock, MonitorPlay, Film, Zap, Undo, Redo, Video, Type, Box, Upload, Trash2, Move } from 'lucide-react';

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

type SidebarTab = 'elements' | 'media';

export const VideoStudio: React.FC<VideoStudioProps> = ({ segments, onUpdateSegment, onClose, onExport }) => {
    const [selectedId, setSelectedId] = useState<string>(segments[0]?.id || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState<SidebarTab>('elements');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    
    // Select the current segment object
    const selectedSegment = segments.find(s => s.id === selectedId);
    const selectedIndex = segments.findIndex(s => s.id === selectedId);

    // History State for Transforms
    const [transformHistory, setTransformHistory] = useState<Record<string, { past: VisualTransform[], future: VisualTransform[] }>>({});

    // Refs for Playback Loop to avoid stale closures
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isPlayingRef = useRef(false);
    const playbackStartRef = useRef<number>(0);
    const pausedElapsedRef = useRef<number>(0); 
    const currentSegmentDurationRef = useRef<number>(0);
    const segmentsRef = useRef(segments);
    const selectedIdRef = useRef(selectedId);

    // Sync Refs
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { segmentsRef.current = segments; }, [segments]);
    useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

    // Defaults
    const activeTransform = selectedSegment?.visualTransform || { scale: 1, x: 0, y: 0 };
    const activeDuration = selectedSegment?.customDuration || 5;
    const activeFilter = selectedSegment?.videoConfig?.filter || 'none';
    const videoConfig = selectedSegment?.videoConfig || {};
    const activeElements = selectedSegment?.elements || [];

    // Reset playback timer when segment changes
    useEffect(() => {
        setIsPlaying(false);
        playbackStartRef.current = Date.now();
        pausedElapsedRef.current = 0;
        
        // Calculate expected duration
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

    // Handle Video Element Metadata
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
        }
    }, [selectedSegment?.videoUrl]);

    // Main Render Loop
    useEffect(() => {
        if (!canvasRef.current || !selectedSegment) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load visual source
        const imgUrl = (selectedSegment.imageUrls && selectedSegment.imageUrls.length > 0) 
            ? selectedSegment.imageUrls[selectedSegment.previewIndex || 0] 
            : selectedSegment.imageUrl;
        
        const img = new Image();
        let animationFrame: number;

        const advanceTrack = () => {
            const currentIdx = segmentsRef.current.findIndex(s => s.id === selectedIdRef.current);
            const nextIndex = currentIdx + 1;
            if (nextIndex < segmentsRef.current.length) {
                setIsPlaying(false); // Briefly pause to state update
                setSelectedId(segmentsRef.current[nextIndex].id);
                // We rely on the useEffect[selectedId] to reset timers, then we can auto-play if needed
                // For safety in this simpler impl, we stop playback on scene change
            } else {
                setIsPlaying(false);
                pausedElapsedRef.current = 0;
            }
        };

        const render = () => {
            if (!ctx) return;
            
            // Clear Canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const isVideo = !!selectedSegment.videoUrl && videoRef.current;
            const visualSource = isVideo ? videoRef.current! : img;
            const playing = isPlayingRef.current;

            // --- Playback Time Management ---
            if (playing) {
                if (isVideo) {
                    // Video logic
                    const end = videoConfig.trimEnd || videoRef.current?.duration || 10;
                    if (videoRef.current && videoRef.current.currentTime >= end - 0.1) {
                         advanceTrack();
                         return;
                    }
                    if (videoRef.current?.paused) videoRef.current.play().catch(() => {});
                    
                    // Video Loop/Trim Constraints
                    const start = videoConfig.trimStart || 0;
                    if (videoRef.current && videoRef.current.currentTime < start) {
                        videoRef.current.currentTime = start;
                    }
                    if (videoRef.current) {
                        videoRef.current.playbackRate = videoConfig.playbackRate || 1;
                    }
                } else {
                    // Image Logic
                    // If we just started playing, reset reference
                    if (playbackStartRef.current === 0) playbackStartRef.current = Date.now();
                    
                    const now = Date.now();
                    // Adjust start time if we were paused
                    if (pausedElapsedRef.current > 0) {
                        playbackStartRef.current = now - pausedElapsedRef.current;
                        pausedElapsedRef.current = 0;
                    }

                    const elapsed = (now - playbackStartRef.current) / 1000;
                    if (elapsed >= currentSegmentDurationRef.current) {
                        advanceTrack();
                        return;
                    }
                }
            } else {
                // Not playing
                if (isVideo && videoRef.current && !videoRef.current.paused) {
                    videoRef.current.pause();
                }
                // Update paused elapsed if needed
                 if (playbackStartRef.current > 0) {
                     // We store it in state effect typically, but safe here
                 }
            }

            // --- Drawing Layers ---
            
            // 1. Background Visual
            if (imgUrl || isVideo) {
                ctx.filter = activeFilter;
                
                // Draw Background Blur
                ctx.save();
                ctx.filter = `blur(20px) brightness(0.5) ${activeFilter !== 'none' ? activeFilter : ''}`;
                if (visualSource instanceof HTMLVideoElement && visualSource.readyState >= 2) {
                     ctx.drawImage(visualSource, 0, 0, canvas.width, canvas.height);
                } else if (visualSource instanceof HTMLImageElement && visualSource.complete) {
                     ctx.drawImage(visualSource, 0, 0, canvas.width, canvas.height);
                }
                ctx.restore();

                // Draw Visual with Transform
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
                    srcW = visualSource.width;
                    srcH = visualSource.height;
                }

                if (srcW && srcH) {
                    const aspect = srcW / srcH;
                    const canvasAspect = canvas.width / canvas.height;
                    let drawW = canvas.width;
                    let drawH = canvas.height;
                    if (aspect > canvasAspect) drawH = canvas.width / aspect;
                    else drawW = canvas.height * aspect;
                    
                    if (visualSource instanceof HTMLVideoElement && visualSource.readyState >= 2) {
                         ctx.drawImage(visualSource, -drawW / 2, -drawH / 2, drawW, drawH);
                    } else if (visualSource instanceof HTMLImageElement && visualSource.complete) {
                         ctx.drawImage(visualSource, -drawW / 2, -drawH / 2, drawW, drawH);
                    }
                }
                ctx.restore();
            } else {
                ctx.fillStyle = '#222';
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("No Media", canvas.width/2, canvas.height/2);
            }

            // 2. Overlays (Drag & Drop Elements)
            activeElements.forEach(el => {
                ctx.save();
                // Determine position
                const x = (el.x / 100) * canvas.width;
                const y = (el.y / 100) * canvas.height;
                
                if (el.type === 'text') {
                    const fontSize = el.style?.fontSize || 40;
                    ctx.font = `bold ${fontSize}px ${el.style?.fontFamily || 'Arial'}`;
                    ctx.fillStyle = el.style?.color || 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.textBaseline = 'top';
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 4;
                    
                    ctx.strokeText(el.content, x, y);
                    ctx.fillText(el.content, x, y);

                    // Selection highlight
                    if (el.id === selectedElementId) {
                         const dims = ctx.measureText(el.content);
                         ctx.strokeStyle = '#f59e0b'; // Brand color
                         ctx.lineWidth = 2;
                         ctx.strokeRect(x - 5, y - 5, dims.width + 10, fontSize + 10);
                    }
                }
                ctx.restore();
            });

            // 3. Playback UI Overlay
            if (playing && !isVideo) {
                 const elapsed = (Date.now() - playbackStartRef.current) / 1000;
                 const pct = Math.min(1, elapsed / currentSegmentDurationRef.current);
                 ctx.fillStyle = '#fbbf24';
                 ctx.fillRect(0, canvas.height - 4, canvas.width * pct, 4);
            }

            animationFrame = requestAnimationFrame(render);
        };

        if (imgUrl && !selectedSegment.videoUrl) {
            img.src = imgUrl;
            img.onload = render;
            // Fallback if load fails or cached
            if (img.complete) render();
        } else {
            render();
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [selectedSegment, activeTransform, activeFilter, videoConfig, activeElements, selectedElementId]);


    // --- Handlers ---

    // History Logic
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

    const handleUndo = () => {
        if (!selectedId) return;
        const currentHistory = transformHistory[selectedId];
        if (!currentHistory || currentHistory.past.length === 0) return;
        const previous = currentHistory.past[currentHistory.past.length - 1];
        const newPast = currentHistory.past.slice(0, -1);
        setTransformHistory(prev => ({ ...prev, [selectedId]: { past: newPast, future: [activeTransform, ...currentHistory.future] } }));
        onUpdateSegment(selectedId, 'visualTransform', previous);
    };

    const handleRedo = () => {
        if (!selectedId) return;
        const currentHistory = transformHistory[selectedId];
        if (!currentHistory || currentHistory.future.length === 0) return;
        const next = currentHistory.future[0];
        const newFuture = currentHistory.future.slice(1);
        setTransformHistory(prev => ({ ...prev, [selectedId]: { past: [...currentHistory.past, activeTransform], future: newFuture } }));
        onUpdateSegment(selectedId, 'visualTransform', next);
    };

    const handleTransformChange = (field: keyof VisualTransform, value: number) => {
        if (!selectedId) return;
        const newTransform = { ...activeTransform, [field]: value };
        onUpdateSegment(selectedId, 'visualTransform', newTransform);
    };

    const handleVideoConfigChange = (field: keyof VideoConfig, value: any) => {
        if (!selectedId) return;
        const newConfig = { ...(selectedSegment?.videoConfig || {}), [field]: value };
        onUpdateSegment(selectedId, 'videoConfig', newConfig);
    };

    // --- Drag & Drop Handlers ---
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

        // Calculate drop position relative to canvas
        const rect = canvasRef.current.getBoundingClientRect();
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;

        const newElement: OverlayElement = {
            id: Date.now().toString(),
            type,
            content,
            x: Math.max(0, Math.min(90, xPct)),
            y: Math.max(0, Math.min(90, yPct)),
            style: {
                fontSize: 40,
                color: '#ffffff'
            }
        };

        const currentElements = selectedSegment?.elements || [];
        onUpdateSegment(selectedId, 'elements', [...currentElements, newElement]);
        setSelectedElementId(newElement.id);
    };

    const handleUpdateElement = (elId: string, updates: Partial<OverlayElement['style']>) => {
        const currentElements = selectedSegment?.elements || [];
        const newElements = currentElements.map(el => 
            el.id === elId ? { ...el, style: { ...el.style, ...updates } } : el
        );
        onUpdateSegment(selectedId, 'elements', newElements);
    };
    
    const handleDeleteElement = (elId: string) => {
         const currentElements = selectedSegment?.elements || [];
         onUpdateSegment(selectedId, 'elements', currentElements.filter(el => el.id !== elId));
         setSelectedElementId(null);
    };

    const canUndo = selectedId && transformHistory[selectedId]?.past.length > 0;
    const canRedo = selectedId && transformHistory[selectedId]?.future.length > 0;

    return (
        <div className="fixed inset-0 z-50 bg-[#1e1e1e] text-gray-200 flex flex-col font-sans animate-fade-in">
            <video ref={videoRef} className="hidden" muted playsInline />
            
            {/* Header */}
            <div className="h-14 border-b border-gray-700 bg-[#252525] flex items-center justify-between px-4 shadow-md z-10">
                <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-brand-500" />
                    <span className="font-bold text-gray-100">Video Studio</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">Beta</span>
                </div>
                <div className="flex items-center gap-3">
                    {onExport && (
                         <Button onClick={onExport} size="sm" className="bg-indigo-600 hover:bg-indigo-500 border-0 text-white shadow-lg shadow-indigo-600/30">
                            <Video className="w-4 h-4" /> Export Video
                         </Button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT SIDEBAR: Library / Assets */}
                <div className="w-16 md:w-64 bg-[#252525] border-r border-gray-700 flex flex-col">
                     <div className="flex flex-col md:flex-row border-b border-gray-700">
                         <button 
                            onClick={() => setActiveTab('elements')}
                            className={`flex-1 p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase ${activeTab === 'elements' ? 'bg-[#333] text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Type className="w-4 h-4" /> <span className="hidden md:inline">Text</span>
                         </button>
                         <button 
                            onClick={() => setActiveTab('media')}
                            className={`flex-1 p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase ${activeTab === 'media' ? 'bg-[#333] text-brand-500 border-b-2 border-brand-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            <ImageIcon className="w-4 h-4" /> <span className="hidden md:inline">Media</span>
                         </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 space-y-4">
                         {activeTab === 'elements' && (
                             <>
                                <div className="text-xs text-gray-500 font-bold uppercase mb-2">Typography</div>
                                <div 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, 'text', 'Heading Text')}
                                    className="bg-[#333] p-3 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing hover:bg-[#444] transition-colors"
                                >
                                    <h4 className="font-bold text-white text-lg pointer-events-none">Heading Text</h4>
                                </div>
                                <div 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, 'text', 'Body Text')}
                                    className="bg-[#333] p-3 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing hover:bg-[#444] transition-colors"
                                >
                                    <p className="text-gray-300 text-sm pointer-events-none">Simple body text block</p>
                                </div>
                                <div 
                                    draggable 
                                    onDragStart={(e) => handleDragStart(e, 'text', 'Subtitle')}
                                    className="bg-[#333] p-3 rounded-lg border border-gray-600 cursor-grab active:cursor-grabbing hover:bg-[#444] transition-colors"
                                >
                                    <p className="text-brand-400 italic font-serif pointer-events-none">Subtitle Style</p>
                                </div>
                             </>
                         )}
                         {activeTab === 'media' && (
                             <div className="text-center py-10 text-gray-500">
                                 <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                 <p className="text-xs">Drag Media Here</p>
                                 <p className="text-[10px] opacity-50">(To timeline)</p>
                             </div>
                         )}
                     </div>
                </div>

                {/* MIDDLE: Preview Area */}
                <div className="flex-1 flex flex-col relative bg-[#121212]">
                    <div 
                        className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDropOnCanvas}
                    >
                        <div className="relative shadow-2xl">
                             <canvas 
                                ref={canvasRef} 
                                width={854} 
                                height={480} 
                                className="bg-black max-w-full max-h-[60vh] aspect-video border border-gray-800"
                             />
                             <div className="absolute top-0 left-0 p-2 text-white/20 pointer-events-none">
                                 <Move className="w-4 h-4" />
                             </div>
                        </div>
                    </div>
                    
                    {/* Transport Controls */}
                    <div className="h-14 border-t border-gray-700 bg-[#1e1e1e] flex items-center justify-center gap-4 z-20">
                        <button 
                            onClick={() => {
                                setIsPlaying(false);
                                const prev = Math.max(0, selectedIndex - 1);
                                setSelectedId(segments[prev].id);
                            }}
                            className="p-2 hover:text-white text-gray-400"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => {
                                if (isPlaying) {
                                    setIsPlaying(false);
                                    pausedElapsedRef.current = Date.now() - playbackStartRef.current;
                                } else {
                                    setIsPlaying(true);
                                }
                            }}
                            className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        <button 
                             onClick={() => {
                                setIsPlaying(false);
                                const next = Math.min(segments.length - 1, selectedIndex + 1);
                                setSelectedId(segments[next].id);
                            }}
                            className="p-2 hover:text-white text-gray-400"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* RIGHT: Inspector / Properties */}
                <div className="w-80 bg-[#252525] border-l border-gray-700 flex flex-col overflow-y-auto">
                    {/* Element Inspector if selected */}
                    {selectedElementId && activeElements.find(el => el.id === selectedElementId) ? (
                        <div className="p-4 border-b border-gray-700 bg-[#2a2a2a]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-500">Text Properties</h3>
                                <button onClick={() => setSelectedElementId(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400">Content</label>
                                    <input 
                                        type="text"
                                        value={activeElements.find(el => el.id === selectedElementId)?.content}
                                        onChange={(e) => {
                                             const newEls = activeElements.map(el => el.id === selectedElementId ? {...el, content: e.target.value} : el);
                                             onUpdateSegment(selectedId, 'elements', newEls);
                                        }}
                                        className="w-full bg-[#111] border border-gray-600 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400">Color</label>
                                    <div className="flex gap-2">
                                        {['#ffffff', '#000000', '#f59e0b', '#ef4444', '#3b82f6'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => handleUpdateElement(selectedElementId, { color: c })}
                                                className="w-6 h-6 rounded-full border border-gray-600"
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-400">Size</label>
                                    <input 
                                        type="range" min="10" max="100" 
                                        value={activeElements.find(el => el.id === selectedElementId)?.style?.fontSize || 40}
                                        onChange={(e) => handleUpdateElement(selectedElementId, { fontSize: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                    />
                                </div>
                                <Button size="sm" variant="danger" onClick={() => handleDeleteElement(selectedElementId)} className="w-full mt-2">
                                    <Trash2 className="w-3 h-3" /> Delete Element
                                </Button>
                            </div>
                        </div>
                    ) : (
                    <div className="p-4 border-b border-gray-700">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Global Inspector</h3>
                        <p className="font-bold text-white truncate">{selectedIndex + 1}. {selectedSegment?.videoUrl ? 'Video Clip' : 'Image Scene'}</p>
                    </div>
                    )}

                    {selectedSegment && !selectedElementId && (
                        <div className="p-4 space-y-6">
                            
                            {/* Video Specific Controls */}
                            {selectedSegment.videoUrl && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-brand-400">
                                        <Scissors className="w-4 h-4" />
                                        <span className="text-sm font-bold">Trim & Speed</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 space-y-3">
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Trim Start</span> 
                                                <span className="text-white font-mono">{videoConfig.trimStart || 0}s</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max={videoRef.current?.duration || 10} step="0.1"
                                                value={videoConfig.trimStart || 0}
                                                onChange={(e) => handleVideoConfigChange('trimStart', parseFloat(e.target.value))}
                                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Trim End</span> 
                                                <span className="text-white font-mono">{videoConfig.trimEnd || videoRef.current?.duration?.toFixed(1) || 10}s</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max={videoRef.current?.duration || 10} step="0.1"
                                                value={videoConfig.trimEnd || videoRef.current?.duration || 10}
                                                onChange={(e) => handleVideoConfigChange('trimEnd', parseFloat(e.target.value))}
                                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>Playback Speed</span> 
                                                <span className="text-white font-mono">{videoConfig.playbackRate || 1}x</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[0.5, 1, 1.5, 2].map(rate => (
                                                    <button 
                                                        key={rate}
                                                        onClick={() => handleVideoConfigChange('playbackRate', rate)}
                                                        className={`flex-1 text-[10px] py-1 rounded border ${videoConfig.playbackRate === rate || (!videoConfig.playbackRate && rate === 1) ? 'bg-brand-900 border-brand-500 text-brand-200' : 'border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                                                    >
                                                        {rate}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Duration Control */}
                            {!selectedSegment.videoUrl && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-brand-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-bold">Duration</span>
                                    </div>
                                    <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700">
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Length</span>
                                            <span className="text-white font-mono">{activeDuration.toFixed(1)}s</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="2" max="20" step="0.5"
                                            value={activeDuration}
                                            onChange={(e) => onUpdateSegment(selectedId, 'customDuration', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Transform / Crop */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                        <Maximize className="w-4 h-4" />
                                        <span className="text-sm font-bold">Transform</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={handleUndo} 
                                            disabled={!canUndo}
                                            className={`p-1 rounded ${canUndo ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700 cursor-not-allowed'}`}
                                            title="Undo"
                                        >
                                            <Undo className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={handleRedo}
                                            disabled={!canRedo}
                                            className={`p-1 rounded ${canRedo ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700 cursor-not-allowed'}`}
                                            title="Redo"
                                        >
                                            <Redo className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Scale</span> <span className="text-white">{activeTransform.scale.toFixed(1)}x</span></div>
                                        <input 
                                            type="range" min="1" max="3" step="0.1"
                                            value={activeTransform.scale}
                                            onPointerDown={recordHistory}
                                            onChange={(e) => handleTransformChange('scale', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Pos X</span> <span className="text-white">{activeTransform.x}%</span></div>
                                        <input 
                                            type="range" min="-50" max="50" step="1"
                                            value={activeTransform.x}
                                            onPointerDown={recordHistory}
                                            onChange={(e) => handleTransformChange('x', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Pos Y</span> <span className="text-white">{activeTransform.y}%</span></div>
                                        <input 
                                            type="range" min="-50" max="50" step="1"
                                            value={activeTransform.y}
                                            onPointerDown={recordHistory}
                                            onChange={(e) => handleTransformChange('y', parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Transitions */}
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                    <Layers className="w-4 h-4" />
                                    <span className="text-sm font-bold">Transition</span>
                                </div>
                                <select 
                                    value={selectedSegment.transition || 'fade'}
                                    onChange={(e: any) => onUpdateSegment(selectedId, 'transition', e.target.value)}
                                    className="w-full bg-[#1a1a1a] text-white text-xs p-2 rounded border border-gray-700 focus:border-emerald-500 outline-none"
                                >
                                    {TRANSITIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            
                            {/* Filters */}
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-pink-400">
                                    <Sliders className="w-4 h-4" />
                                    <span className="text-sm font-bold">Effect Filter</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {FILTERS.map(f => (
                                        <button
                                            key={f.label}
                                            onClick={() => handleVideoConfigChange('filter', f.value)}
                                            className={`text-xs p-2 rounded border transition-colors ${activeFilter === f.value ? 'bg-pink-900/30 border-pink-500 text-pink-200' : 'bg-[#1a1a1a] border-transparent text-gray-400 hover:border-gray-600'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom: Timeline */}
            <div className="h-40 bg-[#121212] border-t border-gray-700 flex flex-col">
                <div className="h-8 bg-[#1e1e1e] border-b border-gray-700 flex items-center px-4 justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Track</span>
                    {isPlaying && <span className="text-[10px] text-brand-500 animate-pulse font-bold">PLAYING</span>}
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar p-4 flex gap-1 items-center">
                    {segments.map((seg, idx) => {
                        const img = (seg.imageUrls && seg.imageUrls.length > 0) ? seg.imageUrls[seg.previewIndex || 0] : seg.imageUrl;
                        const isActive = seg.id === selectedId;
                        const duration = seg.customDuration || (seg.videoConfig ? ((seg.videoConfig.trimEnd || 5) - (seg.videoConfig.trimStart || 0)) : 5);
                        const width = Math.max(80, duration * 20); 

                        return (
                            <div 
                                key={seg.id}
                                onClick={() => {
                                    setIsPlaying(false);
                                    setSelectedId(seg.id);
                                }}
                                className={`relative h-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group ${isActive ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-gray-700 opacity-70 hover:opacity-100 hover:border-gray-500'}`}
                                style={{ width: `${width}px` }}
                            >
                                {seg.videoUrl ? (
                                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                                        <video src={seg.videoUrl} className="w-full h-full object-cover opacity-50" />
                                        <Film className="w-4 h-4 text-white absolute" />
                                    </div>
                                ) : img ? (
                                    <img src={img} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 w-full bg-black/70 px-1 py-0.5 text-[9px] text-white truncate font-mono">
                                    {idx + 1}. {duration.toFixed(1)}s
                                </div>
                                {seg.elements && seg.elements.length > 0 && (
                                     <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-brand-500" title="Has Overlays"></div>
                                )}
                            </div>
                        );
                    })}
                    <div className="w-20 flex-shrink-0"></div>
                </div>
            </div>
        </div>
    );
};
