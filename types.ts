
export interface StorySegment {
  id: string;
  text: string;
  suggestedPrompt: string;
  imageUrl?: string; // Deprecated in favor of imageUrls
  imageUrls?: string[]; // New: Multiple images
  previewIndex?: number; // New: Selected image in editor (UI state)
  isGeneratingImage: boolean;
  
  // Audio
  audioUrl?: string; // Blob URL (session only)
  audioData?: string; // Base64 Data (persistent)
  isGeneratingAudio?: boolean;
  narratorId?: string; // ID of the character narrating this segment (or 'default')
  
  // Video (Animation)
  videoUrl?: string; // Blob URL (session)
  videoData?: string; // Base64 Data (persistent)
  isGeneratingVideo?: boolean;
  videoConfig?: VideoConfig; // New: Editing settings

  animation?: TextAnimation;
  transition?: SceneTransition; // New: Transition style
}

export interface VideoConfig {
    trimStart?: number; // seconds
    trimEnd?: number; // seconds
    filter?: string; // css filter string
}

export type TextAnimation = 'fade' | 'slide-up' | 'pop' | 'typewriter' | 'slide-right';
export type SceneTransition = 'fade' | 'slide' | 'zoom' | 'flip' | 'curtain';

export interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl?: string; // New: visual representation
  isGenerating?: boolean; // UI state
  voiceName?: string; // New: Specific voice for TTS (e.g. 'Puck', 'Kore')
  voicePitch?: number; // -20 to 20 (Not fully supported by API yet, stored for future)
  voiceSpeed?: number; // 0.25 to 4.0 (Applied via playbackRate)
}

export interface PresentationConfig {
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large' | 'xl';
    animationSpeed: 'slow' | 'medium' | 'fast';
}

export enum ImageSize {
  Size1K = '1K',
  Size2K = '2K',
  Size4K = '4K',
}

export enum AspectRatio {
  Square = '1:1',
  Landscape = '16:9',
  Portrait = '9:16',
}

export enum AppMode {
  Story = 'story',
  Studio = 'studio',
}

export type Language = 'English' | 'Khmer';

export interface SavedStory {
  id: string;
  topic: string;
  timestamp: number;
  segments: StorySegment[];
  characters: Character[];
  language: Language;
  backgroundMusic?: string; // Data URL for the audio file
  presentationConfig?: PresentationConfig;
}
