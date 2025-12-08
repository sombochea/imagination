
import React, { useState, useRef, useEffect } from 'react';
import { generateProImage, editImageWithFlash } from '../services/gemini';
import { ImageSize, AspectRatio } from '../types';
import { Button } from './Button';
import { Wand2, ImagePlus, Download, Eraser, Settings2, Sparkles, ChevronDown, Undo, Redo, RotateCcw, History } from 'lucide-react';

type StudioTab = 'generate' | 'edit';

const StyledTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea 
      {...props} 
      className={`w-full px-4 py-3 rounded-xl border-2 border-brand-100 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white/50 focus:bg-white text-gray-800 placeholder-gray-400 resize-none ${props.className}`} 
    />
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
      {...props} 
      className={`w-full px-4 py-3 rounded-xl border-2 border-brand-100 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white/50 focus:bg-white text-gray-800 placeholder-gray-400 ${props.className}`} 
    />
);

const StyledSelect = ({ value, onChange, options, className = '' }: any) => (
      <div className={`relative ${className}`}>
          <select 
            value={value}
            onChange={onChange}
            className="w-full appearance-none px-4 py-3 rounded-xl border-2 border-brand-100 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all bg-white/50 focus:bg-white text-gray-800 cursor-pointer pr-10 font-medium"
          >
              {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
);


export const ImageStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudioTab>('generate');
  const [isLoading, setIsLoading] = useState(false);
  
  // Generator State
  const [genResultImage, setGenResultImage] = useState<string | null>(null);
  const [genPrompt, setGenPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>(ImageSize.Size1K);
  const [aspect, setAspect] = useState<AspectRatio>(AspectRatio.Square);

  // Editor State
  const [editPrompt, setEditPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // History Management for Edit Tab
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Derived state for editor
  const currentEditImage = historyIndex >= 0 ? history[historyIndex] : null;
  const previousEditImage = historyIndex > 0 ? history[historyIndex - 1] : (historyIndex === 0 ? history[0] : null);

  const handleGenerate = async () => {
    if (!genPrompt) return;
    setIsLoading(true);
    setGenResultImage(null);
    try {
      const url = await generateProImage(genPrompt, size, aspect);
      setGenResultImage(url);
    } catch (e: any) {
        alert(e.message?.includes("Requested entity was not found") 
        ? "Please select a valid paid project API key to use the Pro model." 
        : "Generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setHistory([result]);
        setHistoryIndex(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!currentEditImage || !editPrompt) return;
    setIsLoading(true);
    try {
      const url = await editImageWithFlash(currentEditImage, editPrompt);
      if (url) {
          // If we are in the middle of history and edit, we discard future history
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(url);
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
      } else {
          throw new Error("No image returned");
      }
    } catch (e) {
      alert("Editing failed. Try a simpler prompt or different image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
      }
  };
  
  const handleReset = () => {
      if (history.length > 0) {
          setHistory([history[0]]);
          setHistoryIndex(0);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col gap-2 mb-8 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-900 font-comic text-left">Creative Studio</h2>
            <p className="text-gray-500 font-medium text-left">Advanced tools for creating and editing educational assets</p>
        </div>

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 animate-slide-up">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-5 text-center font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'generate' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <ImagePlus className="w-5 h-5" /> Generate (Pro)
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-5 text-center font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'edit' ? 'bg-brand-50 text-brand-600 border-b-2 border-brand-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
            }`}
          >
            <Wand2 className="w-5 h-5" /> Magic Edit (Flash)
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'generate' ? (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6 flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Sparkles className="w-5 h-5" /></div>
                <div>
                    <h3 className="text-indigo-900 font-bold mb-1">Powered by Gemini 3.0 Pro</h3>
                    <p className="text-indigo-700/80 text-sm">Capable of generating high-fidelity images up to 4K resolution. Requires a paid API key selection.</p>
                </div>
               </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Image Description</label>
                    <StyledTextArea
                      value={genPrompt}
                      onChange={(e) => setGenPrompt(e.target.value)}
                      placeholder="A cute robot teacher pointing at a blackboard, 3d render style..."
                      className="h-32"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resolution</label>
                        <StyledSelect 
                            value={size} 
                            onChange={(e: any) => setSize(e.target.value as ImageSize)}
                            options={[
                                { value: ImageSize.Size1K, label: '1K (Standard)' },
                                { value: ImageSize.Size2K, label: '2K (High Quality)' },
                                { value: ImageSize.Size4K, label: '4K (Ultra HD)' },
                            ]}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
                        <StyledSelect 
                            value={aspect} 
                            onChange={(e: any) => setAspect(e.target.value as AspectRatio)}
                            options={[
                                { value: AspectRatio.Square, label: 'Square (1:1)' },
                                { value: AspectRatio.Landscape, label: 'Landscape (16:9)' },
                                { value: AspectRatio.Portrait, label: 'Portrait (9:16)' },
                            ]}
                        />
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    isLoading={isLoading} 
                    disabled={!genPrompt} 
                    variant="secondary"
                    className="w-full py-4 text-lg shadow-xl shadow-indigo-500/20"
                  >
                    Generate Image
                  </Button>
                </div>
                
                <div className="flex-1 bg-gray-50 rounded-3xl flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-200 relative overflow-hidden group">
                    {genResultImage ? (
                        <div className="relative w-full h-full">
                             <img src={genResultImage} alt="Generated" className="w-full h-full object-contain p-4" />
                             <a href={genResultImage} download={`generated-${Date.now()}.png`} className="absolute top-4 right-4 p-2 bg-white text-indigo-600 rounded-full shadow-lg hover:bg-indigo-50 transition-all" title="Download">
                                <Download className="w-5 h-5" />
                             </a>
                        </div>
                    ) : (
                        <div className="text-gray-300 text-center">
                            <ImagePlus className="w-16 h-16 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Result will appear here</p>
                        </div>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 mb-6 flex items-start gap-3">
                 <div className="bg-brand-100 p-2 rounded-lg text-brand-600"><Wand2 className="w-5 h-5" /></div>
                 <div>
                    <h3 className="text-brand-900 font-bold mb-1">Powered by Gemini 2.5 Flash</h3>
                    <p className="text-brand-800/80 text-sm">Describe how you want to change the image. E.g., "Add a rainbow in the sky" or "Turn the cat into a dog".</p>
                 </div>
               </div>
               
               {/* Toolbar for Undo/Redo */}
               {historyIndex >= 0 && (
                   <div className="flex items-center justify-between pb-2">
                       <div className="flex gap-2">
                           <Button onClick={handleUndo} disabled={historyIndex <= 0 || isLoading} variant="outline" className="!p-2" title="Undo">
                               <Undo className="w-4 h-4" />
                           </Button>
                           <Button onClick={handleRedo} disabled={historyIndex >= history.length - 1 || isLoading} variant="outline" className="!p-2" title="Redo">
                               <Redo className="w-4 h-4" />
                           </Button>
                           <Button onClick={handleReset} disabled={history.length <= 1 || isLoading} variant="ghost" className="!p-2 text-xs" title="Reset to Original">
                               <RotateCcw className="w-4 h-4 mr-1" /> Reset
                           </Button>
                       </div>
                       <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                           <History className="w-4 h-4" /> History: {historyIndex + 1} / {history.length}
                       </div>
                   </div>
               )}

               <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    {/* Active Canvas / Source */}
                    <div 
                        className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50 transition-colors flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                        onClick={() => !currentEditImage && fileInputRef.current?.click()}
                    >
                        {currentEditImage ? (
                            <div className="w-full h-full relative">
                                <img src={currentEditImage} alt="Active Source" className="w-full h-full object-contain p-4" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="absolute bottom-4 right-4 p-2 bg-white/90 rounded-full text-gray-600 shadow-md hover:bg-white hover:text-brand-600 z-10 text-xs font-bold flex items-center gap-1"
                                >
                                    <ImagePlus className="w-4 h-4" /> Replace
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 text-gray-400 group-hover:text-brand-500 transition-colors"><ImagePlus className="w-8 h-8" /></div>
                                <p className="text-gray-600 font-bold">Click to upload base image</p>
                                <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    <div className="flex gap-3">
                        <StyledInput 
                            type="text" 
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="Example: Add a red hat to the character"
                            className="flex-1"
                            disabled={!currentEditImage}
                        />
                        <Button onClick={handleEdit} isLoading={isLoading} disabled={!currentEditImage || !editPrompt} className="px-6">
                            Edit
                        </Button>
                    </div>
                 </div>
                 
                 {/* Result / Preview Area - Always shows the latest current state for clarity in editing flow */}
                 <div className="aspect-square bg-gray-900 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-inner">
                    {currentEditImage ? (
                        <div className="relative w-full h-full">
                             <img src={currentEditImage} alt="Current State" className="w-full h-full object-contain p-4" />
                             <a href={currentEditImage} download={`edited-${Date.now()}.png`} className="absolute top-4 right-4 p-2 bg-white text-brand-600 rounded-full shadow-lg hover:bg-brand-50 transition-all" title="Download Current">
                                <Download className="w-5 h-5" />
                             </a>
                             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-white text-xs font-bold border border-white/10">
                                 Current Version
                             </div>
                        </div>
                    ) : (
                        <div className="text-gray-300 text-center">
                            <Sparkles className="w-16 h-16 mx-auto mb-3 opacity-20" />
                            <p className="opacity-50 font-medium">Edited image will appear here</p>
                        </div>
                    )}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
