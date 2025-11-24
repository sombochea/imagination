import React, { useState } from 'react';
import { StoryMode } from './components/StoryMode';
import { ImageStudio } from './components/ImageStudio';
import { AppMode } from './types';
import { BookOpen, Palette, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Story);

  return (
    <div className="min-h-screen bg-brand-50 text-gray-900 font-sans selection:bg-brand-200">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 transform -rotate-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-comic text-brand-900 tracking-tight">
              Teacher's Imagination
            </h1>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMode(AppMode.Story)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                mode === AppMode.Story 
                ? 'bg-white text-brand-700 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Lesson Story</span>
            </button>
            <button
              onClick={() => setMode(AppMode.Studio)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                mode === AppMode.Studio 
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {mode === AppMode.Story ? <StoryMode /> : <ImageStudio />}
      </main>

    </div>
  );
};

export default App;