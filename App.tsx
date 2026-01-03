import React, { useState, useCallback, useEffect } from 'react';
import { 
  Play, Pause, RefreshCw, AlertCircle, Wand2, 
  MessageSquare, ChevronRight, Code2, BookOpen,
  Activity, Zap, Download, ChevronLeft, ArrowRight
} from 'lucide-react';

import ShaderCanvas from './components/ShaderCanvas';
import CodeEditor from './components/CodeEditor';
import MathVisualizer from './components/MathVisualizer';
import { INITIAL_FRAGMENT_SHADER, LESSONS } from './constants';
import { ShaderError, Lesson } from './types';
import { generateShaderExplanation, generateShaderFromPrompt, fixShaderCode } from './services/geminiService';

const App = () => {
  // State
  const [code, setCode] = useState(INITIAL_FRAGMENT_SHADER);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<ShaderError | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'learn' | 'ai'>('learn');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Debounced Code for Canvas (to prevent aggressive recompiles)
  const [runnableCode, setRunnableCode] = useState(code);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRunnableCode(code);
    }, 800);
    return () => clearTimeout(timer);
  }, [code]);

  const handleError = useCallback((err: ShaderError | null) => {
    setError(err);
  }, []);

  const loadLesson = (lesson: Lesson) => {
    setCode(lesson.code);
    setSelectedLesson(lesson);
    // Note: We don't switch tabs immediately so they can read the guide,
    // but the code updates in the background.
  };

  const backToMenu = () => {
    setSelectedLesson(null);
  }

  const handleAiExplain = async () => {
    setActiveTab('ai');
    setIsAiLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: 'Explain this shader code.' }]);
    
    const explanation = await generateShaderExplanation(code);
    
    setMessages(prev => [...prev, { role: 'model', text: explanation }]);
    setIsAiLoading(false);
  };

  const handleAiGenerate = async () => {
    if (!promptInput.trim()) return;
    
    setIsAiLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `Generate: ${promptInput}` }]);
    
    const newCode = await generateShaderFromPrompt(promptInput);
    
    if (newCode.startsWith('// Error')) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't generate that shader." }]);
    } else {
        setCode(newCode);
        setMessages(prev => [...prev, { role: 'model', text: "I've updated the editor with your request." }]);
    }
    setPromptInput('');
    setIsAiLoading(false);
  };

  const handleAiFix = async () => {
    if (!error) return;
    setIsAiLoading(true);
    const fixedCode = await fixShaderCode(code, error.message);
    setCode(fixedCode);
    setIsAiLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Shader<span className="text-purple-400">Academy</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-800 rounded-lg p-1">
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded-md transition-colors ${isPlaying ? 'bg-zinc-700 text-green-400' : 'text-zinc-400 hover:text-white'}`}
                title={isPlaying ? "Pause" : "Play"}
             >
               {isPlaying ? <Pause size={18} /> : <Play size={18} />}
             </button>
             <button 
                onClick={() => setCode(INITIAL_FRAGMENT_SHADER)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-md transition-colors"
                title="Reset Code"
             >
               <RefreshCw size={18} />
             </button>
          </div>
          
          <button 
            onClick={() => {
                const blob = new Blob([code], {type: 'text/plain'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'shader.frag';
                a.click();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Navigation */}
        <nav className="w-16 border-r border-zinc-800 bg-zinc-900 flex flex-col items-center py-4 gap-4 shrink-0">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'editor' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Code Editor"
          >
            <Code2 size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'learn' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Curriculum"
          >
            <BookOpen size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="AI Assistant"
          >
            <Wand2 size={24} />
          </button>
        </nav>

        {/* Middle Panel: Dynamic Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Overlay Panel (Learn/AI) - Mobile Friendly or Split View */}
          {(activeTab === 'learn' || activeTab === 'ai') && (
             <div className="w-full md:w-96 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden shrink-0 z-10 md:relative absolute h-full shadow-2xl md:shadow-none">
                
                {/* Learn Tab */}
                {activeTab === 'learn' && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <BookOpen size={18} className="text-purple-400"/> 
                                {selectedLesson ? 'Guide' : 'Curriculum'}
                            </h2>
                            {selectedLesson && (
                                <button onClick={backToMenu} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                                    <ChevronLeft size={14} /> Back
                                </button>
                            )}
                        </div>

                        {/* List View */}
                        {!selectedLesson && (
                            <div className="overflow-y-auto flex-1 p-4 space-y-6">
                                {['basics', 'shaping', 'patterns', '3d'].map(cat => (
                                    <div key={cat}>
                                        <h3 className="text-xs uppercase font-bold text-zinc-500 mb-3 tracking-wider">{cat}</h3>
                                        <div className="space-y-2">
                                            {LESSONS.filter(l => l.category === cat).map(lesson => (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => loadLesson(lesson)}
                                                    className="w-full text-left p-3 rounded-lg border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800 transition-all group"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-sm text-zinc-200 group-hover:text-purple-300">{lesson.title}</span>
                                                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 text-purple-500 transition-opacity" />
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{lesson.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Detail View */}
                        {selectedLesson && (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="overflow-y-auto flex-1 p-6">
                                    <h1 className="text-2xl font-bold text-white mb-2">{selectedLesson.title}</h1>
                                    <div className="text-zinc-500 text-sm mb-6 pb-4 border-b border-zinc-800 uppercase tracking-widest font-bold">
                                        {selectedLesson.category}
                                    </div>
                                    
                                    {/* Render HTML Guide Safely */}
                                    <div 
                                        className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-4 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: selectedLesson.guide }} 
                                    />

                                    {/* Interactive Visualizer Embed */}
                                    {selectedLesson.visualizer && (
                                        <div className="mt-8">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Activity size={12} className="text-green-400"/> Visualizer
                                            </h4>
                                            <MathVisualizer type={selectedLesson.visualizer} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur">
                                    <button 
                                        onClick={() => setActiveTab('editor')}
                                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Code2 size={18} />
                                        Go to Editor
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Tab */}
                {activeTab === 'ai' && (
                    <div className="flex flex-col h-full">
                         <div className="p-4 border-b border-zinc-800">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <Wand2 size={18} className="text-purple-400"/> AI Tutor
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                             {messages.length === 0 && (
                                <div className="text-center text-zinc-500 py-8 text-sm">
                                    Ask me to generate a shader, explain the current code, or help fix bugs!
                                </div>
                             )}
                             {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                                        {m.text}
                                    </div>
                                </div>
                             ))}
                             {isAiLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-400 animate-pulse">
                                        Thinking...
                                    </div>
                                </div>
                             )}
                        </div>
                        
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                            <div className="flex gap-2 mb-2">
                                <button 
                                    onClick={handleAiExplain}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-xs py-2 rounded text-zinc-300 border border-zinc-700"
                                >
                                    Explain Code
                                </button>
                                {error && (
                                    <button 
                                        onClick={handleAiFix}
                                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-xs py-2 rounded text-red-300 border border-red-800"
                                    >
                                        Fix Bug
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={promptInput}
                                    onChange={(e) => setPromptInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                    placeholder="Generate a blue fire effect..."
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                                />
                                <button 
                                    onClick={handleAiGenerate}
                                    className="absolute right-2 top-2 p-1 bg-purple-600 rounded hover:bg-purple-500 text-white"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
             </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col h-full border-r border-zinc-800 relative group">
             <div className="absolute top-0 right-0 z-10 bg-zinc-900/80 backdrop-blur px-2 py-1 text-xs text-zinc-500 rounded-bl-lg border-b border-l border-zinc-800 flex items-center gap-2">
                <Code2 size={12} />
                Fragment Shader
             </div>
             <div className="flex-1 relative">
                <CodeEditor 
                    code={code} 
                    onChange={setCode} 
                    errorLine={error?.line}
                />
             </div>
             
             {/* Error Log Console */}
             {error && (
                <div className="h-24 bg-zinc-900 border-t border-zinc-800 p-3 overflow-y-auto shrink-0">
                    <div className="flex items-start gap-2 text-red-400 text-sm font-mono">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <div>
                            <span className="font-bold">Error on line {error.line}:</span>
                            <p className="opacity-80 mt-1 whitespace-pre-wrap">{error.message}</p>
                        </div>
                    </div>
                </div>
             )}
          </div>

          {/* Preview Area */}
          <div className="w-full md:w-1/2 lg:w-[45%] bg-black relative flex flex-col h-1/2 md:h-full shrink-0">
             <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <div className="bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded border border-white/10">
                    {Math.round(performance.now() / 1000)}s
                </div>
             </div>
             <ShaderCanvas 
                fragmentShader={runnableCode}
                onCompileError={handleError}
                isPlaying={isPlaying}
             />
             
             {/* Preview Controls overlay */}
             <div className="absolute bottom-4 right-4 flex gap-2">
                 <div className="bg-black/50 backdrop-blur px-3 py-1.5 rounded-full text-xs text-zinc-400 border border-white/10 flex items-center gap-2">
                    <Zap size={12} className="text-purple-400" />
                    {activeTab === 'learn' ? 'Learning Mode' : 'Live Preview'}
                 </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;