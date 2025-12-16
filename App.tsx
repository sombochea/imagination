
import React, { useState, useEffect } from 'react';
import { StoryDashboard, StoryEditor } from './components/StoryMode';
import { ImageStudio } from './components/ImageStudio';
import { BookOpen, Palette, Sparkles, Heart, Info, X, Zap, Video, Mic, Image as ImageIcon, Layers, MonitorPlay, Database, Save, Server, AlertCircle } from 'lucide-react';
import { getStorageSettings, saveStorageSettings } from './services/assetStore';
import { StorageSettings } from './types';
import { Button } from './components/Button';

type AppView = 'dashboard' | 'editor' | 'studio';

// Reusable Input Component for Settings
const SettingInput = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <input 
      type={type}
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-sm"
    />
  </div>
);

const StorageSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [settings, setSettings] = useState<StorageSettings>({
    provider: 'local',
    region: 'auto',
    bucket: '',
    accessKeyId: '',
    secretAccessKey: '',
    endpoint: '',
    publicUrlBase: ''
  });

  useEffect(() => {
    setSettings(getStorageSettings());
  }, []);

  const handleSave = () => {
    saveStorageSettings(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               <Database className="w-5 h-5 text-brand-600" /> Asset Storage
            </h3>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                 <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                 <p className="text-sm text-blue-700">
                    By default, assets are stored locally in your browser (IndexedDB). For production use, configure an object storage provider (S3, Cloudflare R2, or Google Cloud Storage).
                 </p>
             </div>

             <div className="space-y-3">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Storage Provider</label>
                 <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => setSettings({...settings, provider: 'local'})} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${settings.provider === 'local' ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <MonitorPlay className="w-4 h-4" /> Local Browser
                     </button>
                     <button onClick={() => setSettings({...settings, provider: 's3'})} className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${settings.provider !== 'local' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        <Server className="w-4 h-4" /> Cloud Storage
                     </button>
                 </div>
             </div>

             {settings.provider !== 'local' && (
                 <div className="space-y-4 border-t border-gray-100 pt-6 animate-fade-in">
                      <div className="flex gap-2 mb-2">
                          <button onClick={() => setSettings({...settings, provider: 's3'})} className={`px-3 py-1 rounded-full text-xs font-bold ${settings.provider === 's3' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>AWS S3</button>
                          <button onClick={() => setSettings({...settings, provider: 'r2', region: 'auto'})} className={`px-3 py-1 rounded-full text-xs font-bold ${settings.provider === 'r2' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>Cloudflare R2</button>
                          <button onClick={() => setSettings({...settings, provider: 'gcs', region: 'auto'})} className={`px-3 py-1 rounded-full text-xs font-bold ${settings.provider === 'gcs' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>Google Cloud</button>
                      </div>

                      <SettingInput label="Endpoint (Optional for AWS)" value={settings.endpoint || ''} onChange={(v: string) => setSettings({...settings, endpoint: v})} placeholder="https://<accountid>.r2.cloudflarestorage.com" />
                      <div className="grid grid-cols-2 gap-4">
                           <SettingInput label="Bucket Name" value={settings.bucket} onChange={(v: string) => setSettings({...settings, bucket: v})} placeholder="my-assets-bucket" />
                           <SettingInput label="Region" value={settings.region} onChange={(v: string) => setSettings({...settings, region: v})} placeholder="us-east-1" />
                      </div>
                      <SettingInput label="Access Key ID" value={settings.accessKeyId || ''} onChange={(v: string) => setSettings({...settings, accessKeyId: v})} placeholder="AKIA..." />
                      <SettingInput label="Secret Access Key" type="password" value={settings.secretAccessKey || ''} onChange={(v: string) => setSettings({...settings, secretAccessKey: v})} placeholder="Secret Key..." />
                      
                      <div className="pt-2">
                           <SettingInput label="Public URL Base (Custom Domain)" value={settings.publicUrlBase || ''} onChange={(v: string) => setSettings({...settings, publicUrlBase: v})} placeholder="https://assets.mydomain.com" />
                           <p className="text-[10px] text-gray-400 mt-1">If set, uploaded files will use this domain. Ensure your bucket has public read access or a worker configured.</p>
                      </div>

                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-700">
                             <strong>Security Note:</strong> Credentials are stored in your browser's Local Storage. Ensure your bucket CORS policy allows <code>PUT</code> from this origin.
                          </p>
                      </div>
                 </div>
             )}
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
            <Button onClick={handleSave} className="shadow-lg shadow-brand-500/20">Save Configuration</Button>
        </div>
      </div>
    </div>
  );
};

const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
      <div className="relative h-36 bg-brand-500 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 text-center text-white py-4">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-brand-500 shadow-lg mx-auto mb-2 transform rotate-3">
              <Sparkles className="w-8 h-8" />
           </div>
           <h2 className="text-3xl font-comic font-bold">Teacher's Imagination</h2>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-8 overflow-y-auto custom-scrollbar">
        <div className="mb-8 text-center">
          <p className="text-gray-600 text-lg leading-relaxed">
            <span className="font-bold text-brand-600">Teacher's Imagination</span> is an AI-powered creative suite designed to revolutionize how educators create learning materials. By leveraging the multimodal capabilities of <span className="font-bold text-gray-800">Google's Gemini models</span>, it transforms simple lesson topics into fully visualized, animated, and narrated stories that captivate young minds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100">
             <div className="flex items-center gap-2 mb-2 font-bold text-brand-700">
               <Zap className="w-4 h-4" /> Gemini 3 Storytelling
             </div>
             <p className="text-sm text-gray-600">Advanced reasoning capabilities structure educational narratives with clear learning goals and age-appropriate language.</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
             <div className="flex items-center gap-2 mb-2 font-bold text-indigo-700">
               <ImageIcon className="w-4 h-4" /> Instant Visualization
             </div>
             <p className="text-sm text-gray-600">Generates consistent, high-fidelity anime-style illustrations for every scene using Gemini Pro Vision.</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100">
             <div className="flex items-center gap-2 mb-2 font-bold text-pink-700">
               <Video className="w-4 h-4" /> Veo Animation
             </div>
             <p className="text-sm text-gray-600">Brings static scenes to life with Google's Veo video generation model for immersive engagement.</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
             <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700">
               <Mic className="w-4 h-4" /> AI Narration
             </div>
             <p className="text-sm text-gray-600">Natural-sounding text-to-speech (TTS) with distinct character voices like Puck and Zephyr.</p>
          </div>
           <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
             <div className="flex items-center gap-2 mb-2 font-bold text-orange-700">
               <Layers className="w-4 h-4" /> Creative Studio
             </div>
             <p className="text-sm text-gray-600">A full-featured editor to trim video, add overlays, stickers, and apply visual effects.</p>
          </div>
           <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
             <div className="flex items-center gap-2 mb-2 font-bold text-sky-700">
               <MonitorPlay className="w-4 h-4" /> Multi-Format Export
             </div>
             <p className="text-sm text-gray-600">Present live in the classroom, export as a video (MP4), or print as a PDF Storybook.</p>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-gray-100">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Powered By</p>
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 font-bold text-sm">
             <span className="text-blue-500">G</span>
             <span className="text-red-500">o</span>
             <span className="text-yellow-500">o</span>
             <span className="text-blue-500">g</span>
             <span className="text-green-500">l</span>
             <span className="text-red-500">e</span>
             <span className="ml-1">DeepMind</span>
           </div>
        </div>
      </div>
    </div>
  </div>
);

const Footer: React.FC<{ onOpenInfo: () => void, onOpenStorage: () => void }> = ({ onOpenInfo, onOpenStorage }) => (
  <footer className="mt-auto py-8 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
    <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
      <div className="flex items-center gap-1">
        <span>&copy; {new Date().getFullYear()}</span>
        <button onClick={onOpenInfo} className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors">
          Teacher's Imagination
        </button>
      </div>
      
      <div className="flex items-center gap-1">
        <span>Built with</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
        <span>by <a href="https://github.com/sombochea" className="font-bold text-gray-700 hover:text-brand-600">Sambo Chea</a></span>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onOpenStorage} className="flex items-center gap-1.5 hover:text-brand-600 transition-colors" title="Configure Cloud Storage">
            <Database className="w-3.5 h-3.5" />
            <span>Storage</span>
        </button>
        <div className="w-[1px] h-3 bg-gray-300"></div>
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Powered by <strong>Google DeepMind</strong></span>
        </div>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  const navigateTo = (view: AppView, storyId?: string) => {
    if (storyId) setActiveStoryId(storyId);
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-brand-50 text-gray-900 font-sans selection:bg-brand-200 flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('dashboard')}>
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 transform -rotate-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-comic text-brand-900 tracking-tight">
              Imagination
            </h1>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => navigateTo('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                currentView === 'dashboard' || currentView === 'editor'
                ? 'bg-white text-brand-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Lesson Story</span>
            </button>
            <button
              onClick={() => navigateTo('studio')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                currentView === 'studio' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="hidden md:inline">Creative Studio</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {currentView === 'dashboard' && (
          <StoryDashboard onNavigate={navigateTo} />
        )}
        {currentView === 'editor' && activeStoryId && (
          <StoryEditor storyId={activeStoryId} onNavigate={navigateTo} />
        )}
        {currentView === 'studio' && (
          <ImageStudio />
        )}
      </main>

      {/* Footer */}
      <Footer onOpenInfo={() => setShowInfoModal(true)} onOpenStorage={() => setShowStorageModal(true)} />

      {/* About Modal */}
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
      
      {/* Storage Settings Modal */}
      {showStorageModal && <StorageSettingsModal onClose={() => setShowStorageModal(false)} />}

    </div>
  );
};

export default App;
