export interface Lesson {
  id: string;
  title: string;
  description: string;
  guide: string; // HTML content for the teaching section
  visualizer?: 'sin' | 'cos' | 'tan' | 'abs_sin' | 'fract' | 'smoothstep';
  code: string;
  category: 'basics' | 'shaping' | '3d' | 'patterns' | 'advanced';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ShaderError {
  line: number;
  message: string;
}

export interface MathFunctionData {
  x: number;
  y: number;
}