
import React, { useState } from 'react';
import { StoryDashboard, StoryEditor } from './components/StoryMode';
import { ImageStudio } from './components/ImageStudio';
import { BookOpen, Palette, Sparkles, Heart, Info, X, Zap, Video, Mic, Image as ImageIcon, Layers, MonitorPlay } from 'lucide-react';

type AppView = 'dashboard' | 'editor' | 'studio';

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

const Footer: React.FC<{ onOpenInfo: () => void }> = ({ onOpenInfo }) => (
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

      <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span>Powered by <strong>Google DeepMind</strong></span>
      </div>
    </div>
  </footer>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

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
      <Footer onOpenInfo={() => setShowInfoModal(true)} />

      {/* About Modal */}
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}

    </div>
  );
};

export default App;
