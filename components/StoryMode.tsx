import React, { useState, useEffect, useRef } from 'react';
import { generateStorySegments, generateProImage, generateSpeech, generateVideo } from '../services/gemini';
import { saveStoryToDB, getStoriesFromDB, deleteStoryFromDB, exportStoryToJson, importStoryFromJson, saveDraft, getDraft } from '../services/storage';
import { generateStoryPDF } from '../services/pdf';
import { StorySegment, ImageSize, AspectRatio, Language, SavedStory, TextAnimation, Character, SceneTransition, VideoConfig, PresentationConfig } from '../types';
import { Button } from './Button';
import { BookOpen, Image as ImageIcon, Sparkles, RefreshCw, PlayCircle, Save, FolderOpen, Trash2, X, Clock, Volume2, Mic, Music, Upload, Video, Plus, Download, FileUp, Settings2, CheckCircle2, UserPlus, Users, GripVertical, LayoutTemplate, Camera, Film, ArrowLeft, ArrowRight, Wand2, Calendar, MoreVertical, Edit3, Speech, UserCog, Cloud, CloudOff, Scissors, Sliders, FileText, ChevronDown, Play, Type, Gauge, MoreHorizontal, FileBox, Disc, MonitorPlay, Zap, Move, Pause, Lightbulb } from 'lucide-react';
import { Slideshow } from './Slideshow';
import { VideoStudio } from './VideoStudio';

// Constants
const SAMPLE_TRACKS = [
  { name: "Morning Forest", url: "https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg" },
  { name: "Gentle Stream", url: "https://actions.google.com/sounds/v1/water/gentle_stream.ogg" },
  { name: "Arcade Beeps", url: "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg" }, 
];

const ANIMATION_OPTIONS: { label: string; value: TextAnimation }[] = [
    { label: 'Fade In', value: 'fade' },
    { label: 'Slide Up', value: 'slide-up' },
    { label: 'Slide Right', value: 'slide-right' },
    { label: 'Pop In', value: 'pop' },
];

const TRANSITION_OPTIONS: { label: string; value: SceneTransition }[] = [
    { label: 'Fade', value: 'fade' },
    { label: 'Slide', value: 'slide' },
    { label: 'Zoom', value: 'zoom' },
    { label: 'Flip', value: 'flip' },
    { label: 'Curtain', value: 'curtain' },
];

const VOICE_OPTIONS = [
    { label: 'Puck (Playful)', value: 'Puck' },
    { label: 'Zephyr (Calm)', value: 'Zephyr' },
    { label: 'Charon (Deep)', value: 'Charon' },
    { label: 'Kore (Gentle)', value: 'Kore' },
    { label: 'Fenrir (Strong)', value: 'Fenrir' },
];

const VIDEO_FILTERS = [
    { label: 'None', value: 'none' },
    { label: 'Cinematic', value: 'contrast(1.1) saturate(1.2)' },
    { label: 'B&W', value: 'grayscale(100%)' },
    { label: 'Vintage', value: 'sepia(0.5) contrast(1.1)' },
    { label: 'Soft', value: 'brightness(1.1) contrast(0.9)' },
];

const FONT_OPTIONS = [
    { group: 'Storytelling', label: 'Comic Neue', value: '"Comic Neue", cursive' },
    { group: 'Storytelling', label: 'Playpen Sans', value: '"Playpen Sans", cursive' },
    { group: 'Storytelling', label: 'Nunito Rounded', value: '"Nunito", sans-serif' },
    { group: 'Classic', label: 'Merriweather', value: '"Merriweather", serif' },
    { group: 'Classic', label: 'Roboto', value: '"Roboto", sans-serif' },
    { group: 'Display', label: 'Lobster', value: '"Lobster", display' },
    { group: 'Khmer', label: 'Kantumruy Pro', value: '"Kantumruy Pro", sans-serif' },
    { group: 'Khmer', label: 'Battambang', value: '"Battambang", system-ui' },
    { group: 'Khmer', label: 'Siemreap', value: '"Siemreap", serif' },
    { group: 'Khmer', label: 'Moul (Header)', value: '"Moul", display' },
    { group: 'Khmer', label: 'Nokora', value: '"Nokora", sans-serif' },
    { group: 'Khmer', label: 'Fasthand', value: '"Fasthand", cursive' },
];

const STORY_STARTERS: Record<Language, string[]> = {
  'English': [
    "The Amazing Water Cycle",
    "A Day in the Life of a Bee",
    "Gravity: What Goes Up Must Come Down",
    "The Lion and the Mouse",
    "Exploring the Solar System"
  ],
  'Khmer': [
    "រឿងទន្សាយនិងអណ្តើក (The Rabbit and Turtle)",
    "ប្រវត្តិបុណ្យចូលឆ្នាំខ្មែរ (History of Khmer New Year)",
    "ដំណើរផ្សងព្រេងក្នុងព្រៃ (Adventure in the Jungle)",
    "សារៈសំខាន់នៃការលាងដៃ (Importance of Washing Hands)",
    "រឿងកូនជ្រូកបីក្បាល (The Three Little Pigs)"
  ]
};

type ViewMode = 'dashboard' | 'editor';
type GenerationMode = 'topic' | 'custom';

// --- HELPER COMPONENTS (Moved outside to prevent re-creation) ---

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white text-gray-800 placeholder-gray-400 ${props.className}`} 
  />
);

const StyledTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props} 
    className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white text-gray-800 placeholder-gray-400 resize-none ${props.className}`} 
  />
);

const StyledSelect = ({ value, onChange, options, className = '' }: any) => (
    <div className={`relative ${className}`}>
        <select 
          value={value}
          onChange={onChange}
          className="w-full appearance-none px-3 py-2 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-white text-gray-800 cursor-pointer pr-8 text-sm"
        >
            {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
);

interface CharacterListProps {
  characters: Character[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Character, value: any) => void;
  onGenerateImage: (id: string) => void;
  allowEdit?: boolean;
}

const CharacterList: React.FC<CharacterListProps> = ({ characters, onRemove, onUpdate, onGenerateImage, allowEdit = false }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
        {characters.map(char => (
            <div key={char.id} className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        {char.imageUrl ? (
                            <img src={char.imageUrl} className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm" />
                        ) : (
                            <div onClick={() => onGenerateImage(char.id)} className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-100 border border-brand-200 transition-colors text-brand-600" title="Generate Appearance">
                                {char.isGenerating ? <div className="w-4 h-4 border-2 border-brand-500 rounded-full border-t-transparent animate-spin"></div> : <Camera className="w-4 h-4" />}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="font-bold text-sm text-gray-800 truncate">{char.name}</div>
                        <div className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed" title={char.description}>{char.description}</div>
                    </div>
                    
                    <button onClick={() => onRemove(char.id)} className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors -mr-1"><X className="w-3.5 h-3.5" /></button>
                </div>

                {/* Settings */}
                <div className="mt-2 pt-2 border-t border-gray-50 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="bg-gray-50 p-1 rounded-md text-gray-400"><Volume2 className="w-3 h-3" /></div>
                        <StyledSelect 
                            value={char.voiceName || 'Puck'} 
                            onChange={(e: any) => onUpdate(char.id, 'voiceName', e.target.value)} 
                            options={VOICE_OPTIONS}
                            className="flex-1 text-xs" 
                        />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

interface AddCharacterFormProps {
  name: string;
  setName: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  voice: string;
  setVoice: (v: string) => void;
  onAdd: (e: React.FormEvent) => void;
}

const AddCharacterForm: React.FC<AddCharacterFormProps> = ({ name, setName, desc, setDesc, voice, setVoice, onAdd }) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-3">
                <StyledInput 
                  placeholder="Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="py-2.5 text-xs"
                />
            </div>
            <div className="md:col-span-5">
                <StyledInput 
                  placeholder="Description" 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)}
                  className="py-2.5 text-xs"
                />
            </div>
            <div className="md:col-span-3">
                <StyledSelect 
                  value={voice} 
                  onChange={(e: any) => setVoice(e.target.value)} 
                  options={VOICE_OPTIONS}
                  className="text-xs"
                />
            </div>
            <div className="md:col-span-1">
                <Button type="button" onClick={onAdd} disabled={!name} className="w-full !py-1.5 !px-0 h-full text-xs">
                  <Plus className="w-4 h-4" />
                </Button>
            </div>
        </div>
    </div>
);

const Dropdown: React.FC<{ 
    trigger: React.ReactNode; 
    children: React.ReactNode; 
    align?: 'left' | 'right';
}> = ({ trigger, children, align = 'left' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>
            {isOpen && (
                <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-slide-up overflow-hidden p-1`}>
                    <div onClick={() => setIsOpen(false)}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const VideoEditorModal: React.FC<{
    segment: StorySegment;
    onUpdate: (config: VideoConfig) => void;
    onClose: () => void;
}> = ({ segment, onUpdate, onClose }) => {
    const [config, setConfig] = useState<VideoConfig>(segment.videoConfig || { trimStart: 0, trimEnd: 0, filter: 'none' });
    const videoRef = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const end = config.trimEnd || duration;
            if (end > 0 && currentTime >= end) {
                videoRef.current.currentTime = config.trimStart || 0;
                if (isPlaying) videoRef.current.play();
            }
        }
    };

    const handleSave = () => {
        onUpdate(config);
        onClose();
    };
    
    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const dur = e.currentTarget.duration;
        setDuration(dur);
        if (!config.trimEnd) {
            setConfig(prev => ({ ...prev, trimEnd: dur }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                 <div className="flex-1 bg-black relative flex items-center justify-center min-h-[300px]">
                     <video 
                        ref={videoRef}
                        src={segment.videoUrl} 
                        className="max-w-full max-h-[50vh] md:max-h-full object-contain"
                        style={{ filter: config.filter }}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onClick={togglePlay}
                     />
                     <button onClick={togglePlay} className="absolute inset-0 m-auto w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-all shadow-lg">
                         {isPlaying ? <div className="w-4 h-4 bg-white rounded-sm" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                     </button>
                 </div>
                 
                 <div className="w-full md:w-80 bg-white p-6 flex flex-col border-l border-gray-100 overflow-y-auto">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-lg font-comic text-gray-800">Edit Video</h3>
                         <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                     </div>
                     
                     <div className="space-y-6 flex-1">
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Trim (Seconds)</label>
                             <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                 <div>
                                     <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600"><span>Start</span> <span className="text-brand-600">{config.trimStart?.toFixed(1)}s</span></div>
                                     <input 
                                        type="range" 
                                        min={0} 
                                        max={duration} 
                                        step={0.1} 
                                        value={config.trimStart || 0} 
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (val < (config.trimEnd || duration)) {
                                                setConfig({...config, trimStart: val});
                                                if(videoRef.current) videoRef.current.currentTime = val;
                                            }
                                        }}
                                        className="w-full accent-brand-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                     />
                                 </div>
                                 <div>
                                     <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-600"><span>End</span> <span className="text-brand-600">{config.trimEnd?.toFixed(1)}s</span></div>
                                     <input 
                                        type="range" 
                                        min={0} 
                                        max={duration} 
                                        step={0.1} 
                                        value={config.trimEnd || duration} 
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (val > (config.trimStart || 0)) {
                                                setConfig({...config, trimEnd: val});
                                                if(videoRef.current) videoRef.current.currentTime = val;
                                            }
                                        }}
                                        className="w-full accent-brand-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                     />
                                 </div>
                             </div>
                         </div>
                         
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Filters</label>
                             <div className="grid grid-cols-2 gap-2">
                                 {VIDEO_FILTERS.map(f => (
                                     <button 
                                        key={f.label}
                                        onClick={() => setConfig({...config, filter: f.value})}
                                        className={`px-3 py-2 text-xs rounded-lg border transition-all text-left ${config.filter === f.value ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50 text-gray-600'}`}
                                     >
                                         {f.label}
                                     </button>
                                 ))}
                             </div>
                         </div>
                     </div>
                     
                     <div className="mt-8 pt-4 border-t border-gray-100">
                         <Button onClick={handleSave} className="w-full py-3 shadow-lg shadow-brand-500/20">Save Changes</Button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

// Split into Dashboard and Editor for Props-based Navigation

interface StoryDashboardProps {
    onNavigate: (view: 'editor', storyId?: string) => void;
}

export const StoryDashboard: React.FC<StoryDashboardProps> = ({ onNavigate }) => {
    const [showGeneratorModal, setShowGeneratorModal] = useState(false);
    const [generationMode, setGenerationMode] = useState<GenerationMode>('topic');
    const [customStoryText, setCustomStoryText] = useState('');
    const [topic, setTopic] = useState('');
    const [educationalGoal, setEducationalGoal] = useState('');
    const [language, setLanguage] = useState<Language>('English');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
    const fileImportRef = useRef<HTMLInputElement>(null);
    const [newCharName, setNewCharName] = useState('');
    const [newCharDesc, setNewCharDesc] = useState('');
    const [newCharVoice, setNewCharVoice] = useState('Puck');
    const [showCharInput, setShowCharInput] = useState(false);

    useEffect(() => {
        loadSavedStories();
    }, []);

    const loadSavedStories = async () => {
        try {
            const stories = await getStoriesFromDB();
            setSavedStories(stories.sort((a, b) => b.timestamp - a.timestamp));
        } catch (e) { console.error("Failed to load stories from DB", e); }
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        importStoryFromJson(file).then(async (story) => {
            await saveStoryToDB(story);
            alert("Project imported successfully!");
            onNavigate('editor', story.id);
        }).catch(err => { console.error(err); alert("Failed to import project. Please ensure the file is valid."); });
        e.target.value = '';
    };

    const handleDeleteStory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(confirm("Are you sure you want to delete this story?")) { 
            await deleteStoryFromDB(id); 
            await loadSavedStories(); 
        }
    };

    const openGenerator = () => {
        setTopic(''); setCharacters([]); setLanguage('English'); setEducationalGoal('');
        setGenerationMode('topic'); setCustomStoryText('');
        setShowGeneratorModal(true); setShowCharInput(true);
    };

    const handleAddCharacter = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCharName.trim() || !newCharDesc.trim()) return;
        const newChar: Character = { id: Date.now().toString(), name: newCharName, description: newCharDesc, voiceName: newCharVoice, voiceSpeed: 1.0, voicePitch: 0 };
        setCharacters([...characters, newChar]);
        setNewCharName(''); setNewCharDesc(''); setNewCharVoice('Puck');
    };

    const handleRemoveCharacter = (id: string) => { setCharacters(characters.filter(c => c.id !== id)); };
    const handleUpdateCharacter = (id: string, field: keyof Character, value: any) => { setCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c)); };

    const handleGenerateStory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (generationMode === 'topic' && !topic.trim()) return;
        if (generationMode === 'custom' && !customStoryText.trim()) return;
        setIsLoading(true); setError(null);
        if (generationMode === 'custom' && !topic) { setTopic(customStoryText.slice(0, 30) + "..."); }
        try {
          const isCustom = generationMode === 'custom';
          // Now passing educationalGoal to the generation service
          const rawSegments = await generateStorySegments(topic, language, characters, isCustom ? customStoryText : undefined, educationalGoal);
          
          const newSegments: StorySegment[] = rawSegments.map((s, i) => ({
            id: Date.now().toString() + i,
            text: s.text,
            suggestedPrompt: s.visualPrompt,
            isGeneratingImage: false, isGeneratingAudio: false, isGeneratingVideo: false,
            animation: 'slide-up' as TextAnimation, transition: 'fade' as SceneTransition,
            imageUrls: [], previewIndex: 0
          }));
          
          const storyId = Date.now().toString();
          const newStory: SavedStory = {
              id: storyId,
              topic: topic,
              timestamp: Date.now(),
              segments: newSegments,
              characters: characters,
              language: language,
              presentationConfig: { fontFamily: '"Comic Neue", cursive', fontSize: 'medium', animationSpeed: 'medium' }
          };
          
          await saveStoryToDB(newStory);
          setShowGeneratorModal(false);
          onNavigate('editor', storyId);
        } catch (err) { setError("Failed to create the story. Please try again."); } finally { setIsLoading(false); }
    };

    return (
          <div className="max-w-7xl mx-auto pb-20">
              <div className="flex justify-between items-center mb-10 animate-fade-in">
                  <div><h2 className="text-4xl font-comic font-bold text-brand-900 mb-2">Your Studio</h2><p className="text-brand-700/60 font-medium">Manage your educational stories and animations</p></div>
                  <div className="flex gap-3">
                     <input type="file" ref={fileImportRef} onChange={handleImportFile} accept="application/json" className="hidden" />
                     <Button variant="outline" onClick={() => fileImportRef.current?.click()}><FileUp className="w-4 h-4" /> Import</Button>
                     <Button onClick={openGenerator} className="shadow-lg shadow-brand-500/20"><Plus className="w-4 h-4" /> New Project</Button>
                  </div>
              </div>
              
              {savedStories.length === 0 ? (
                  <div className="text-center py-24 px-4 bg-white rounded-3xl shadow-sm border border-brand-100 flex flex-col items-center animate-slide-up">
                      <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-brand-500"><Sparkles className="w-10 h-10" /></div>
                      <h3 className="text-3xl font-comic font-bold text-gray-900 mb-3">Welcome to Teacher's Imagination!</h3>
                      <p className="text-gray-500 max-w-lg mx-auto mb-8 text-lg">Turn your lesson ideas into captivating animated stories in seconds. Use the power of Gemini 3 to visualize complex concepts for kids.</p>
                      <Button onClick={openGenerator} size="lg" className="px-8 py-4 text-lg shadow-xl shadow-brand-500/30 hover:scale-105 transition-transform"><Wand2 className="w-5 h-5 mr-2" /> Start Your First Story</Button>
                  </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <div onClick={openGenerator} className="aspect-[4/3] rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/30 hover:bg-brand-50 hover:border-brand-400 cursor-pointer flex flex-col items-center justify-center gap-4 group transition-all">
                      <div className="w-14 h-14 rounded-full bg-brand-100 group-hover:bg-brand-200 text-brand-500 flex items-center justify-center transition-colors shadow-sm"><Plus className="w-6 h-6" /></div>
                      <span className="font-comic font-bold text-brand-700">Create New Story</span>
                  </div>
                  {savedStories.map((story, i) => {
                      const firstImage = story.segments.find(s => s.imageUrls && s.imageUrls.length > 0)?.imageUrls?.[0] || story.segments.find(s => s.imageUrl)?.imageUrl;
                      return (
                          <div key={story.id} onClick={() => onNavigate('editor', story.id)} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden cursor-pointer flex flex-col" style={{ animationDelay: `${(i+1)*50}ms` }}>
                              <div className="aspect-video w-full bg-gray-50 relative overflow-hidden border-b border-gray-50">{firstImage ? <img src={firstImage} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-brand-200 bg-brand-50/50"><ImageIcon className="w-10 h-10" /></div>}</div>
                              <div className="p-4 flex-1 flex flex-col"><h3 className="font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors font-comic">{story.topic}</h3><div className="text-xs text-gray-400 flex items-center gap-3 mb-3"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(story.timestamp).toLocaleDateString()}</span><span className="flex items-center gap-1"><LayoutTemplate className="w-3 h-3" /> {story.segments.length} Scenes</span></div><div className="mt-auto flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">{story.language}</span><button onClick={(e) => handleDeleteStory(story.id, e)} className="p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div></div>
                          </div>
                      );
                  })}
                </div>
              )}
              
              {showGeneratorModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/20 backdrop-blur-sm animate-fade-in">
                      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
                          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
                              <div className="flex justify-between items-start mb-1"><h2 className="text-2xl font-comic font-bold text-brand-900">Start Adventure</h2><button onClick={() => setShowGeneratorModal(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button></div>
                              <p className="text-sm text-gray-500">Gemini 3 will craft an educational story tailored to your goals.</p>
                          </div>
                          <div className="p-6 overflow-y-auto custom-scrollbar">
                              <form onSubmit={handleGenerateStory} className="space-y-6">
                                  <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200"><button type="button" onClick={() => setGenerationMode('topic')} className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${generationMode === 'topic' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Wand2 className="w-4 h-4" /> From Topic</button><button type="button" onClick={() => setGenerationMode('custom')} className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${generationMode === 'custom' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FileText className="w-4 h-4" /> Custom Script</button></div>
                                  
                                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{generationMode === 'topic' ? 'Topic / Lesson Title' : 'Story Title'}</label><StyledInput type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={generationMode === 'topic' ? "e.g. The Water Cycle, Photosynthesis..." : "Story Title"} className="py-3 font-medium" autoFocus={generationMode === 'topic'} required />{generationMode === 'topic' && (<div className="flex flex-wrap gap-2 mt-2">{STORY_STARTERS[language]?.slice(0, 4).map((starter, i) => (<button key={i} type="button" onClick={() => setTopic(starter)} className="text-xs bg-gray-50 border border-gray-100 hover:border-brand-300 hover:bg-brand-50 text-gray-500 hover:text-brand-700 px-2 py-1 rounded-md transition-all">{starter}</button>))}</div>)}</div>
                                  
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-brand-500" /> Educational Goal (Optional)</label>
                                      <StyledInput 
                                          type="text" 
                                          value={educationalGoal} 
                                          onChange={(e) => setEducationalGoal(e.target.value)} 
                                          placeholder="e.g. Explain how plants make food using sunlight." 
                                          className="py-3 font-medium border-brand-200 focus:border-brand-500" 
                                      />
                                  </div>

                                  {generationMode === 'custom' && (<div className="space-y-2 animate-fade-in"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Story Content</label><StyledTextArea value={customStoryText} onChange={(e) => setCustomStoryText(e.target.value)} placeholder="Paste your story here..." className="h-32 text-sm" required /></div>)}
                                  <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Language</label><StyledSelect value={language} onChange={(e: any) => setLanguage(e.target.value as Language)} options={[{value: 'English', label: 'English'}, {value: 'Khmer', label: 'Khmer'}]} /></div>
                                  <div className="border border-brand-100 rounded-xl p-4 bg-brand-50/30"><div className="flex justify-between items-center cursor-pointer" onClick={() => setShowCharInput(!showCharInput)}><div className="flex items-center gap-2"><div className="bg-brand-100 p-1.5 rounded-md text-brand-600"><Users className="w-4 h-4" /></div><span className="font-bold text-sm text-gray-800">Characters ({characters.length})</span></div><ChevronDown className={`w-4 h-4 text-gray-400 transform transition-transform ${showCharInput ? 'rotate-180' : ''}`} /></div>{showCharInput && (<div className="space-y-4 mt-4 animate-fade-in pt-4 border-t border-brand-100/50"><AddCharacterForm name={newCharName} setName={setNewCharName} desc={newCharDesc} setDesc={setNewCharDesc} voice={newCharVoice} setVoice={setNewCharVoice} onAdd={handleAddCharacter} />{characters.length > 0 && <CharacterList characters={characters} onRemove={handleRemoveCharacter} onUpdate={handleUpdateCharacter} onGenerateImage={() => {}} allowEdit={true} />}</div>)}</div>
                                  <Button type="submit" isLoading={isLoading} className="w-full py-3.5 text-base shadow-lg shadow-brand-500/20">{generationMode === 'topic' ? <Wand2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />} {generationMode === 'topic' ? 'Generate Story' : 'Create Scenes'}</Button>
                                  {error && <p className="text-red-500 text-center text-xs bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
                              </form>
                          </div>
                      </div>
                  </div>
              )}
          </div>
    );
};

// Editor Component Props
interface StoryEditorProps {
    storyId: string;
    onNavigate: (view: 'dashboard') => void;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({ storyId, onNavigate }) => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<Language>('English');
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [presentationConfig, setPresentationConfig] = useState<PresentationConfig>({
      fontFamily: '"Comic Neue", cursive',
      fontSize: 'medium',
      animationSpeed: 'medium'
  });
  const [showPresentationSettings, setShowPresentationSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharVoice, setNewCharVoice] = useState('Puck');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showVideoStudio, setShowVideoStudio] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [autoExport, setAutoExport] = useState(false);
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef({ topic, segments, language, backgroundMusic, storyId, characters, presentationConfig });
  
  // Audio Playback
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Audio preview state for Music Modal
  const [playingSampleUrl, setPlayingSampleUrl] = useState<string | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      stateRef.current = { topic, segments, language, backgroundMusic, storyId, characters, presentationConfig };
  }, [topic, segments, language, backgroundMusic, storyId, characters, presentationConfig]);

  useEffect(() => {
      if (storyId) {
          getStoriesFromDB().then(stories => {
              const story = stories.find(s => s.id === storyId);
              if (story) handleLoadStory(story);
              else onNavigate('dashboard');
          });
      }
  }, [storyId, onNavigate]);

  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
        if (stateRef.current.segments.length > 0 || stateRef.current.topic.length > 5) {
             setSaveStatus('saving');
             const cleanSegments = stateRef.current.segments.map(({ audioUrl, videoUrl, isGeneratingAudio, isGeneratingVideo, isGeneratingImage, ...rest }) => ({
                ...rest,
                isGeneratingAudio: false,
                isGeneratingVideo: false,
                isGeneratingImage: false
            }));
            const draftStory: any = {
                id: stateRef.current.storyId || 'draft',
                topic: stateRef.current.topic,
                timestamp: Date.now(),
                segments: cleanSegments,
                language: stateRef.current.language,
                backgroundMusic: stateRef.current.backgroundMusic,
                characters: stateRef.current.characters,
                presentationConfig: stateRef.current.presentationConfig
            };
            try {
                // If it's a real story, save to main DB, else draft
                if (stateRef.current.storyId && stateRef.current.storyId !== 'draft') {
                    await saveStoryToDB(draftStory);
                } else {
                    await saveDraft(draftStory);
                }
                setSaveStatus('saved');
            } catch (e) {
                console.error("Auto-save failed", e);
                setSaveStatus('error');
            }
        }
    }, 15000);
    return () => clearInterval(autoSaveInterval);
  }, []);

  const handleLoadStory = (story: SavedStory) => {
    setTopic(story.topic);
    setCharacters(story.characters || []); 
    
    const hydratedSegments = story.segments.map(s => {
        let audioUrl = undefined;
        if (s.audioData) {
            try {
                const base64Clean = s.audioData.replace(/^data:audio\/[a-z]+;base64,/, "").replace(/\s/g, '');
                const binaryString = atob(base64Clean);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                audioUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
            } catch (e) { console.warn("Failed to hydrate audio", s.id, e); }
        }

        let videoUrl = undefined;
        if (s.videoData) {
             try {
                const base64Clean = s.videoData.replace(/^data:video\/[a-z]+;base64,/, "").replace(/\s/g, '');
                const binaryString = atob(base64Clean);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                videoUrl = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
             } catch(e) { console.warn("Failed to hydrate video", s.id, e); }
        }
        
        let images = s.imageUrls || [];
        if (images.length === 0 && s.imageUrl) images = [s.imageUrl];

        return {
            ...s, 
            audioUrl,
            videoUrl,
            imageUrls: images, 
            isGeneratingImage: false, 
            isGeneratingAudio: false, 
            isGeneratingVideo: false,
            animation: s.animation || 'slide-up', 
            transition: s.transition || 'fade', 
            previewIndex: 0
        };
    });

    setSegments(hydratedSegments);
    setLanguage(story.language);
    setBackgroundMusic(story.backgroundMusic || null);
    if(story.presentationConfig) setPresentationConfig(story.presentationConfig);
  };

  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim() || !newCharDesc.trim()) return;
    const newChar: Character = { id: Date.now().toString(), name: newCharName, description: newCharDesc, voiceName: newCharVoice, voiceSpeed: 1.0, voicePitch: 0 };
    setCharacters([...characters, newChar]);
    setNewCharName(''); setNewCharDesc(''); setNewCharVoice('Puck');
  };

  const handleRemoveCharacter = (id: string) => { setCharacters(characters.filter(c => c.id !== id)); };
  const handleUpdateCharacter = (id: string, field: keyof Character, value: any) => { setCharacters(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c)); };

  const handleGenerateCharacterImage = async (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    setCharacters(prev => prev.map(c => c.id === charId ? { ...c, isGenerating: true } : c));
    try {
        const prompt = `Character Design Sheet: ${char.name}, ${char.description}. Anime style, white background, detailed character portrait, clear facial features.`;
        const imageUrl = await generateProImage(prompt, ImageSize.Size1K, AspectRatio.Square);
        if (imageUrl) { setCharacters(prev => prev.map(c => c.id === charId ? { ...c, imageUrl, isGenerating: false } : c)); } 
        else { throw new Error("No image returned"); }
    } catch (e) { console.error(e); alert("Failed to generate character image."); setCharacters(prev => prev.map(c => c.id === charId ? { ...c, isGenerating: false } : c)); }
  };

  const handleAddSegment = () => {
    const newSegment: StorySegment = {
        id: Date.now().toString(), text: "New story scene...", suggestedPrompt: "Describe the image here...",
        isGeneratingImage: false, isGeneratingAudio: false, isGeneratingVideo: false, animation: 'fade', transition: 'fade', imageUrls: [], previewIndex: 0
    };
    setSegments([...segments, newSegment]);
  };

  const handleRemoveSegment = (id: string) => { setSegments(segments.filter(s => s.id !== id)); };
  const handleUpdateSegment = (id: string, field: keyof StorySegment, value: any) => { setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s)); };

  const insertCharacterPrompt = (segmentId: string, char: Character) => {
      const segment = segments.find(s => s.id === segmentId);
      if (segment) {
          const toAdd = `, ${char.name} (${char.description})`;
          handleUpdateSegment(segmentId, 'suggestedPrompt', segment.suggestedPrompt + toAdd);
      }
  };

  const handleGenerateImageForSegment = async (id: string, prompt: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingImage: true } : s));
    const referencedCharacters = characters.filter(c => c.imageUrl && prompt.toLowerCase().includes(c.name.toLowerCase()));
    const referenceImages = referencedCharacters.map(c => c.imageUrl as string);
    try {
      const imageUrl = await generateProImage(prompt, ImageSize.Size2K, AspectRatio.Landscape, referenceImages);
      if (imageUrl) {
        setSegments(prev => prev.map(s => {
            if (s.id === id) {
                const currentImages = s.imageUrls || (s.imageUrl ? [s.imageUrl] : []);
                const newImages = [...currentImages, imageUrl];
                return { ...s, imageUrls: newImages, isGeneratingImage: false, previewIndex: newImages.length - 1 };
            }
            return s;
        }));
      } else { throw new Error("No image returned"); }
    } catch (err: any) {
      console.error(err);
      alert(err.message?.includes("Requested entity was not found") ? "Please select a valid paid project API key." : "Failed to generate image.");
      setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingImage: false } : s));
    }
  };

  const handleImageUpload = (segmentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const imageUrl = reader.result as string;
              setSegments(prev => prev.map(s => {
                  if (s.id === segmentId) {
                      const newImages = [...(s.imageUrls || []), imageUrl];
                      return { ...s, imageUrls: newImages, previewIndex: newImages.length - 1 };
                  }
                  return s;
              }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleNextImage = (segmentId: string) => {
      setSegments(prev => prev.map(s => {
          if (s.id === segmentId && s.imageUrls && s.imageUrls.length > 1) {
              const current = s.previewIndex || 0;
              return { ...s, previewIndex: (current + 1) % s.imageUrls.length };
          }
          return s;
      }));
  };

  const handlePrevImage = (segmentId: string) => {
      setSegments(prev => prev.map(s => {
          if (s.id === segmentId && s.imageUrls && s.imageUrls.length > 1) {
              const current = s.previewIndex || 0;
              const next = current - 1 < 0 ? s.imageUrls.length - 1 : current - 1;
              return { ...s, previewIndex: next };
          }
          return s;
      }));
  };

  const handleSelectImage = (segmentId: string, index: number) => { handleUpdateSegment(segmentId, 'previewIndex', index); };

  const handleGenerateAudioForSegment = async (id: string, text: string, voiceName: string = 'Puck', narratorId?: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingAudio: true } : s));
    try {
        const result = await generateSpeech(text, voiceName);
        if (result) {
            setSegments(prev => prev.map(s => s.id === id ? { ...s, audioUrl: result.url, audioData: result.data, isGeneratingAudio: false, narratorId } : s));
        } else { throw new Error("Failed to generate audio"); }
    } catch (err) {
        console.error(err); alert("Failed to generate narration.");
        setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingAudio: false } : s));
    }
  };

  const toggleSegmentAudio = (segmentId: string, audioUrl?: string) => {
      if (!audioUrl) return;

      if (playingAudioId === segmentId) {
          // Pause logic
          if (activeAudioRef.current) {
              activeAudioRef.current.pause();
              setPlayingAudioId(null);
          }
      } else {
          // Play logic
          if (activeAudioRef.current) {
              activeAudioRef.current.pause();
              activeAudioRef.current = null;
          }
          const audio = new Audio(audioUrl);
          audio.onended = () => setPlayingAudioId(null);
          activeAudioRef.current = audio;
          audio.play().catch(e => console.error(e));
          setPlayingAudioId(segmentId);
      }
  };

  const handleGenerateVideoForSegment = async (id: string) => {
      const segment = segments.find(s => s.id === id);
      if (!segment) return;
      const currentImages = segment.imageUrls || (segment.imageUrl ? [segment.imageUrl] : []);
      const currentImage = currentImages.length > 0 ? currentImages[segment.previewIndex || 0] : undefined;
      setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingVideo: true } : s));
      try {
          const result = await generateVideo(segment.suggestedPrompt, currentImage);
          if (result) { setSegments(prev => prev.map(s => s.id === id ? { ...s, videoUrl: result.url, videoData: result.data, isGeneratingVideo: false } : s)); } 
          else { throw new Error("Failed to generate video"); }
      } catch (err: any) {
          console.error(err);
          alert(err.message?.includes("Requested entity was not found") ? "Please select a valid paid project API key." : "Failed to generate video.");
          setSegments(prev => prev.map(s => s.id === id ? { ...s, isGeneratingVideo: false } : s));
      }
  };

  const handleDeleteVideo = (id: string) => { setSegments(prev => prev.map(s => s.id === id ? { ...s, videoUrl: undefined, videoData: undefined } : s)); };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { alert("File is too large. Please keep under 10MB."); return; }
      const reader = new FileReader();
      reader.onloadend = () => { setBackgroundMusic(reader.result as string); setShowMusicModal(false); };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSampleMusic = async (url: string) => {
    if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
    }
    setPlayingSampleUrl(null);
    try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onloadend = () => { setBackgroundMusic(reader.result as string); setShowMusicModal(false); };
        reader.readAsDataURL(blob);
    } catch (e) { console.error("Failed to load sample", e); setBackgroundMusic(url); setShowMusicModal(false); }
  };

  const toggleSamplePreview = (url: string) => {
    if (playingSampleUrl === url) {
        sampleAudioRef.current?.pause();
        setPlayingSampleUrl(null);
    } else {
        sampleAudioRef.current?.pause();
        sampleAudioRef.current = new Audio(url);
        sampleAudioRef.current.play().catch(e => console.error("Playback failed", e));
        sampleAudioRef.current.onended = () => setPlayingSampleUrl(null);
        setPlayingSampleUrl(url);
    }
  };

  const handleSaveStory = async () => {
    if (segments.length === 0) return;
    setSaveStatus('saving');
    const cleanSegments = segments.map(({ audioUrl, videoUrl, isGeneratingAudio, isGeneratingVideo, isGeneratingImage, ...rest }) => ({
        ...rest, isGeneratingAudio: false, isGeneratingVideo: false, isGeneratingImage: false
    }));
    const newStory: SavedStory = { id: storyId || Date.now().toString(), topic, timestamp: Date.now(), segments: cleanSegments, characters, language, backgroundMusic: backgroundMusic || undefined, presentationConfig };
    try {
        await saveStoryToDB(newStory);
        setSaveStatus('saved');
        alert("Success! Your project has been saved.");
    } catch (e) { console.error(e); setSaveStatus('error'); alert("Failed to save story. Please try again."); }
  };

  const handleExportToFile = () => {
    if (segments.length === 0) return;
    const cleanSegments = segments.map(({ audioUrl, videoUrl, isGeneratingAudio, isGeneratingVideo, isGeneratingImage, ...rest }) => ({
        ...rest, isGeneratingAudio: false, isGeneratingVideo: false, isGeneratingImage: false
    }));
    const storyToExport: SavedStory = { id: storyId || Date.now().toString(), topic, timestamp: Date.now(), segments: cleanSegments, characters, language, backgroundMusic: backgroundMusic || undefined, presentationConfig };
    exportStoryToJson(storyToExport);
  };
  
  const handleExportPDF = async () => {
    setSaveStatus('saving');
    try {
        await generateStoryPDF(topic, segments, presentationConfig);
        alert("PDF Book downloaded successfully!");
    } catch (e) {
        console.error(e);
        alert("Failed to generate PDF.");
    } finally {
        setSaveStatus('saved');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) { e.preventDefault(); return; }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newSegments = [...segments];
    const [movedItem] = newSegments.splice(draggedIndex, 1);
    newSegments.splice(index, 0, movedItem);
    setSegments(newSegments);
    setDraggedIndex(null);
  };

  const startPresentation = () => { setAutoExport(false); setShowSlideshow(true); };
  const startExport = () => { setAutoExport(true); setShowSlideshow(true); };

  // --- JSX ---
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      {showSlideshow && <Slideshow topic={topic} segments={segments} onClose={() => setShowSlideshow(false)} backgroundMusic={backgroundMusic} autoExport={autoExport} presentationConfig={presentationConfig} characters={characters} />}
      {showVideoStudio && <VideoStudio segments={segments} onUpdateSegment={(id, field, val) => handleUpdateSegment(id, field, val)} onClose={() => setShowVideoStudio(false)} onExport={() => { setShowVideoStudio(false); startExport(); }} />}
      
      {/* Modals omitted for brevity, identical to previous, just ensure they show/hide based on state */}
      {/* Background Music Modal */}
      {showMusicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Music className="w-4 h-4 text-indigo-500" /> Background Music</h3>
                    <button onClick={() => { setShowMusicModal(false); if(sampleAudioRef.current) { sampleAudioRef.current.pause(); setPlayingSampleUrl(null); } }}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-4">
                    <div className="space-y-2 mb-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Upload Your Own</label>
                        <div onClick={() => musicInputRef.current?.click()} className="border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group">
                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 mb-2" />
                            <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600">Click to upload MP3/WAV</span>
                            <input type="file" ref={musicInputRef} onChange={handleMusicUpload} accept="audio/*" className="hidden" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Sample Library</label>
                        <div className="space-y-2">
                            {SAMPLE_TRACKS.map((track, i) => (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${backgroundMusic === track.url ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${backgroundMusic === track.url ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}><Music className="w-4 h-4" /></div>
                                        <div className="text-sm font-bold text-gray-700">{track.name}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleSamplePreview(track.url)} className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors" title={playingSampleUrl === track.url ? "Stop Preview" : "Preview"}>
                                            {playingSampleUrl === track.url ? <div className="w-3 h-3 bg-indigo-600 rounded-sm" /> : <Play className="w-3 h-3 fill-current" />}
                                        </button>
                                        <Button size="sm" onClick={() => handleSelectSampleMusic(track.url)} variant={backgroundMusic === track.url ? 'primary' : 'outline'} className="!py-1.5 !text-xs">Select</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {backgroundMusic && (
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-xs text-gray-500 font-medium">Currently Selected</div>
                            <button onClick={() => setBackgroundMusic(null)} className="text-xs text-red-500 font-bold hover:underline">Remove Music</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Character Manager Modal */}
      {showCharacterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4 text-brand-500" /> Manage Cast</h3>
                      <button onClick={() => setShowCharacterModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                      <AddCharacterForm name={newCharName} setName={setNewCharName} desc={newCharDesc} setDesc={setNewCharDesc} voice={newCharVoice} setVoice={setNewCharVoice} onAdd={handleAddCharacter} />
                      <div className="my-6 border-t border-gray-100"></div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Current Characters</h4>
                      {characters.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl"><UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No characters added yet</p></div>
                      ) : (
                          <CharacterList characters={characters} onRemove={handleRemoveCharacter} onUpdate={handleUpdateCharacter} onGenerateImage={handleGenerateCharacterImage} allowEdit={true} />
                      )}
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <Button onClick={() => setShowCharacterModal(false)}>Done</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Presentation Settings Modal */}
      {showPresentationSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings2 className="w-4 h-4 text-gray-600" /> Presentation Settings</h3>
                      <button onClick={() => setShowPresentationSettings(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Font Family</label>
                          <StyledSelect 
                              value={presentationConfig.fontFamily} 
                              onChange={(e: any) => setPresentationConfig({...presentationConfig, fontFamily: e.target.value})} 
                              options={FONT_OPTIONS} 
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Text Size</label>
                          <div className="flex bg-gray-100 p-1 rounded-lg">
                              {['small', 'medium', 'large', 'xl'].map((s) => (
                                  <button key={s} onClick={() => setPresentationConfig({...presentationConfig, fontSize: s as any})} className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${presentationConfig.fontSize === s ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Animation Speed</label>
                          <div className="flex bg-gray-100 p-1 rounded-lg">
                              {['slow', 'medium', 'fast'].map((s) => (
                                  <button key={s} onClick={() => setPresentationConfig({...presentationConfig, animationSpeed: s as any})} className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${presentationConfig.animationSpeed === s ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                      <Button onClick={() => setShowPresentationSettings(false)}>Save Settings</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 sticky top-20 z-40 backdrop-blur-lg bg-white/95">
        <div className="flex items-center gap-3 flex-1 min-w-0">
             <Button variant="icon" onClick={() => onNavigate('dashboard')} className="text-gray-400 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></Button>
             <div className="min-w-0"><h2 className="text-lg font-bold text-gray-900 line-clamp-1 font-comic">{topic || "Untitled Story"}</h2><div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider"><span>{language}</span><span className="w-1 h-1 rounded-full bg-gray-300"></span><span>{segments.length} Scenes</span><span className={`flex items-center gap-1 ml-2 ${saveStatus === 'saving' ? 'text-brand-500' : saveStatus === 'error' ? 'text-red-500' : 'text-green-500'}`}>{saveStatus === 'saving' && <RefreshCw className="w-3 h-3 animate-spin" />}{saveStatus === 'saved' && <CheckCircle2 className="w-3 h-3" />}{saveStatus === 'error' && <CloudOff className="w-3 h-3" />}</span></div></div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="icon" onClick={() => setShowVideoStudio(true)} className="text-gray-500 hover:text-brand-600 hover:bg-brand-50" title="Open Video Studio"><MonitorPlay className="w-5 h-5" /></Button>
            <Button variant="icon" onClick={() => setShowCharacterModal(true)} className={characters.length > 0 ? 'text-brand-600 bg-brand-50' : ''} title="Characters"><Users className="w-5 h-5" /></Button>
            <Button variant="icon" onClick={() => setShowMusicModal(true)} className={backgroundMusic ? 'text-indigo-600 bg-indigo-50' : ''} title="BGM"><Music className="w-5 h-5" /></Button>
            <Button variant="icon" onClick={() => setShowPresentationSettings(true)} title="Settings"><Settings2 className="w-5 h-5" /></Button>
            <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
            <Dropdown align="right" trigger={<Button variant="outline" size="sm" className="gap-2">Project <ChevronDown className="w-3 h-3 opacity-50" /></Button>}>
                <button onClick={handleSaveStory} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Save className="w-4 h-4" /> Save Project</button>
                <button onClick={handleExportToFile} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><Download className="w-4 h-4" /> Export JSON</button>
                <button onClick={handleExportPDF} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"><FileText className="w-4 h-4" /> Export PDF Book</button>
            </Dropdown>
            <Button onClick={startExport} variant="outline" size="sm" className="gap-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200"><Video className="w-4 h-4" /> <span className="hidden md:inline">Export Video</span></Button>
            <Button onClick={startPresentation} size="sm" className="bg-gray-900 text-white hover:bg-black border-gray-900 shadow-gray-900/20 gap-2"><PlayCircle className="w-4 h-4" /> Present</Button>
        </div>
      </div>

      <div className="space-y-8">
        {segments.map((segment, index) => {
          const images = segment.imageUrls || (segment.imageUrl ? [segment.imageUrl] : []);
          const activeIndex = segment.previewIndex !== undefined ? segment.previewIndex : images.length - 1;
          const displayImage = images.length > 0 ? images[activeIndex] : null;

          return (
          <div key={segment.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} onDragEnd={() => setDraggedIndex(null)} className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row animate-fade-in transition-all duration-300 group ${draggedIndex === index ? 'opacity-50 border-dashed border-2 border-brand-400 scale-[0.99] rotate-1 shadow-none bg-brand-50' : ''}`} style={{ animationDelay: `${index * 100}ms` }}>
            <div className="md:w-1/2 min-h-[350px] bg-gray-50/50 relative flex flex-col border-b md:border-b-0 md:border-r border-gray-100">
                <div className="absolute top-3 left-3 z-20 flex gap-2">
                    <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 border border-gray-100 shadow-sm uppercase tracking-wider">Scene {index + 1}</div>
                    <Dropdown trigger={<button className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 border border-gray-100 shadow-sm hover:text-brand-600 hover:border-brand-200 transition-colors uppercase tracking-wider" title="Scene Entry Animation"><Zap className="w-3 h-3" /> {segment.transition || 'Fade'}</button>}>
                        <div className="p-2 w-32">
                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">Entry Transition</div>
                            <div className="space-y-1">{TRANSITION_OPTIONS.map(opt => (<button key={opt.value} onClick={() => handleUpdateSegment(segment.id, 'transition', opt.value)} className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${segment.transition === opt.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}>{opt.label}</button>))}</div>
                        </div>
                    </Dropdown>
                </div>
                <div className="absolute top-3 right-3 z-20"><Dropdown align="right" trigger={<button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md hover:bg-gray-100 border border-gray-100 shadow-sm transition-colors text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>}><button onClick={() => handleRemoveSegment(segment.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 className="w-3 h-3" /> Delete Scene</button></Dropdown></div>

              <div className="flex-1 w-full relative group/img h-[300px] flex items-center justify-center bg-gray-100/50">
                  {segment.videoUrl ? (
                      <div className="relative w-full h-full bg-black group/vid">
                         <video src={segment.videoUrl} controls className="w-full h-full object-contain" style={{ filter: segment.videoConfig?.filter || 'none' }} autoPlay loop muted />
                         <div className="absolute bottom-4 right-4 z-10 flex gap-2 opacity-0 group-hover/vid:opacity-100 transition-opacity"><Button size="sm" variant="secondary" onClick={() => setEditingVideoId(segment.id)} className="!py-1.5 !px-3 shadow-lg"><Scissors className="w-3 h-3" /> Edit</Button><button onClick={() => handleDeleteVideo(segment.id)} className="bg-red-500 text-white p-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors"><Trash2 className="w-3 h-3" /></button></div>
                      </div>
                  ) : displayImage ? (
                    <><img src={displayImage} alt="Visual" className="w-full h-full object-cover" />{images.length > 1 && (<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); handlePrevImage(segment.id); }} className="text-white hover:text-brand-300"><ArrowLeft className="w-3 h-3" /></button><span className="text-[10px] font-bold text-white tabular-nums">{activeIndex + 1}/{images.length}</span><button onClick={(e) => { e.stopPropagation(); handleNextImage(segment.id); }} className="text-white hover:text-brand-300"><ArrowRight className="w-3 h-3" /></button></div>)}</>
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center gap-2"><ImageIcon className="w-12 h-12 opacity-30" /><span className="text-xs font-medium opacity-50">No image</span></div>
                  )}

                  {!segment.videoUrl && (<div className={`absolute inset-0 flex items-center justify-center ${displayImage ? 'bg-black/20 opacity-0 group-hover/img:opacity-100' : 'opacity-100'} transition-all duration-200`}><Button variant="primary" onClick={() => handleGenerateImageForSegment(segment.id, segment.suggestedPrompt)} isLoading={segment.isGeneratingImage} className={displayImage ? 'shadow-xl scale-95 hover:scale-100' : ''}>{displayImage ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {displayImage ? 'Regenerate' : 'Generate Image'}</Button></div>)}
              </div>

              <div className="bg-white p-3 border-t border-gray-100">
                 <div className="relative mb-2 flex items-center">
                     <input value={segment.suggestedPrompt} onChange={(e) => handleUpdateSegment(segment.id, 'suggestedPrompt', e.target.value)} className="w-full bg-transparent text-xs text-gray-500 border-none focus:ring-0 p-0 placeholder-gray-300 pr-24" placeholder="Visual prompt..." />
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {!segment.videoUrl && (<button onClick={() => handleGenerateVideoForSegment(segment.id)} disabled={segment.isGeneratingVideo} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Animate with Veo">{segment.isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}</button>)}
                        <div className="w-[1px] h-3 bg-gray-200 mx-1"></div>
                        {characters.length > 0 && (<Dropdown align="right" trigger={<button className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors" title="Insert Character"><UserPlus className="w-3.5 h-3.5" /></button>}><div className="p-1"><div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase">Insert Character</div>{characters.map(c => (<button key={c.id} onClick={() => insertCharacterPrompt(segment.id, c)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 rounded-md">{c.name}</button>))}</div></Dropdown>)}
                        <label className="cursor-pointer p-1.5 text-gray-400 hover:text-brand-600 transition-colors" title="Upload Image"><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(segment.id, e)} /><Upload className="w-3.5 h-3.5" /></label>
                     </div>
                 </div>
                 {images.length > 0 && !segment.videoUrl && (<div className="flex items-center justify-between"><div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-full">{images.map((url, idx) => (<div key={idx} onClick={() => handleSelectImage(segment.id, idx)} className={`relative w-8 h-8 rounded-md overflow-hidden cursor-pointer border transition-all flex-shrink-0 ${activeIndex === idx ? 'border-brand-500 ring-1 ring-brand-200' : 'border-gray-200 opacity-60 hover:opacity-100'}`}><img src={url} className="w-full h-full object-cover" /></div>))}</div></div>)}
              </div>
            </div>

            <div className="md:w-1/2 flex flex-col relative">
              <div className="h-10 border-b border-gray-100 flex items-center justify-between px-3 bg-gray-50/30">
                 <div className="drag-handle cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1"><GripVertical className="w-4 h-4" /></div>
                 <div className="flex items-center gap-1">
                    <Dropdown trigger={<button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"><Sliders className="w-3 h-3" /> Text Anim</button>} align="right">
                        <div className="p-2 w-48"><div className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Text Appearance</div><div className="grid grid-cols-2 gap-1">{ANIMATION_OPTIONS.map(o => (<button key={o.value} onClick={() => handleUpdateSegment(segment.id, 'animation', o.value)} className={`text-[10px] px-2 py-1.5 rounded border text-left transition-colors ${segment.animation === o.value ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'border-transparent hover:bg-gray-50 text-gray-600'}`}>{o.label}</button>))}</div></div>
                    </Dropdown>
                    <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                    {segment.audioUrl ? (<div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-sm"><button onClick={() => toggleSegmentAudio(segment.id, segment.audioUrl)} className="text-brand-500 hover:text-brand-600">{playingAudioId === segment.id ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}</button><span className="text-[10px] font-medium text-gray-500">Audio Ready</span><button onClick={() => handleUpdateSegment(segment.id, 'audioUrl', undefined)} className="text-gray-300 hover:text-red-400 ml-1"><X className="w-3 h-3" /></button></div>) : (<Dropdown trigger={<button className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors" disabled={segment.isGeneratingAudio}>{segment.isGeneratingAudio ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />} Narrate</button>} align="right"><div className="p-1"><div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase">Select Voice</div><button onClick={() => handleGenerateAudioForSegment(segment.id, segment.text, 'Puck')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 rounded-md text-gray-700">Default (Storyteller)</button>{characters.map(c => (<button key={c.id} onClick={() => handleGenerateAudioForSegment(segment.id, segment.text, c.voiceName || 'Puck', c.id)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-indigo-50 text-indigo-600 rounded-md font-medium">{c.name}</button>))}</div></Dropdown>)}
                 </div>
              </div>
              <div className="flex-1 relative"><StyledTextArea value={segment.text} onChange={(e) => handleUpdateSegment(segment.id, 'text', e.target.value)} style={{ fontFamily: presentationConfig.fontFamily }} className={`w-full h-full min-h-[200px] text-lg md:text-xl leading-relaxed bg-transparent border-0 focus:ring-0 p-6 resize-none`} placeholder="Write scene text here..." /></div>
            </div>
          </div>
        )})}
        <div className="flex justify-center py-8"><button onClick={handleAddSegment} className="group flex items-center gap-3 px-6 py-4 rounded-2xl border border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50/50 transition-all"><div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-brand-100 text-gray-400 group-hover:text-brand-500 flex items-center justify-center transition-colors"><Plus className="w-5 h-5" /></div><span className="font-bold text-gray-500 group-hover:text-brand-600">Add New Scene</span></button></div>
      </div>
      
      {/* Edit Video Modal */}
      {editingVideoId && (
        <VideoEditorModal 
           segment={segments.find(s => s.id === editingVideoId)!} 
           onUpdate={(cfg) => {
               handleUpdateSegment(editingVideoId, 'videoConfig', cfg);
               setEditingVideoId(null);
           }} 
           onClose={() => setEditingVideoId(null)} 
        />
      )}
    </div>
  );
};

export const StoryMode = () => null; // Placeholder