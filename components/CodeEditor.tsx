import React, { useRef } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  errorLine?: number;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, errorLine }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlight = (text: string) => {
    // 1. Escape HTML entities first to prevent XSS and rendering issues
    const safeText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Define tokens
    const keywords = [
      'void', 'float', 'int', 'bool', 'vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4',
      'uniform', 'precision', 'mediump', 'highp', 'lowp',
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'pow', 'exp', 'log', 'sqrt', 'abs', 'sign', 'floor', 'ceil', 'fract', 'mod', 'min', 'max', 'clamp', 'mix', 'step', 'smoothstep', 'length', 'distance', 'dot', 'cross', 'normalize', 'reflect', 'refract',
      'gl_FragCoord', 'gl_FragColor', 'texture2D',
      'return', 'if', 'else', 'for', 'while', 'do', 'break', 'continue',
      'const', 'attribute', 'varying'
    ];
    
    // Create a combined regex for keywords and numbers
    // This allows us to replace them in one pass, avoiding the issue where
    // a number regex matches the '400' in 'text-purple-400' class name.
    const keywordRegexPart = keywords.join('|');
    const numberRegexPart = '\\b\\d+(\\.\\d+)?\\b';
    const tokenRegex = new RegExp(`\\b(${keywordRegexPart})\\b|(${numberRegexPart})`, 'g');

    return safeText.split('\n').map(line => {
      // Find comment start to ignore highlighting inside comments
      const commentIdx = line.indexOf('//');
      let codePart = line;
      let commentPart = '';
      
      if (commentIdx !== -1) {
        codePart = line.substring(0, commentIdx);
        commentPart = line.substring(commentIdx);
      }
      
      // Highlight only the code part
      const highlightedCode = codePart.replace(tokenRegex, (match, keyword, number) => {
        if (keyword) {
          return `<span class="text-purple-400 font-bold">${keyword}</span>`;
        }
        if (number || match) { 
           // If it matched the second group (number) or just generally matched the union
           return `<span class="text-orange-400">${match}</span>`;
        }
        return match;
      });
      
      if (commentPart) {
        return `${highlightedCode}<span class="text-zinc-500">${commentPart}</span>`;
      }
      return highlightedCode;
    }).join('\n');
  };

  return (
    <div className="relative w-full h-full font-mono text-sm bg-zinc-950 overflow-hidden">
      {/* Background Highlighter */}
      <pre
        ref={preRef}
        className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre overflow-hidden"
        style={{ fontFamily: 'inherit', lineHeight: '1.5' }}
      >
        <code 
            dangerouslySetInnerHTML={{ __html: highlight(code) + '\n' }} 
            className="block min-h-full"
        />
      </pre>

      {/* Foreground Input */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="absolute inset-0 w-full h-full p-4 m-0 bg-transparent text-transparent caret-white resize-none border-none outline-none whitespace-pre overflow-auto"
        style={{ fontFamily: 'inherit', lineHeight: '1.5' }}
      />
      
      {/* Error Indicator */}
      {errorLine && errorLine > 0 && (
         <div 
            className="absolute left-0 w-full bg-red-500/20 pointer-events-none border-l-4 border-red-500"
            style={{ 
                top: `${(errorLine - 1) * 1.5 + 1}rem`, 
                height: '1.5rem' 
            }}
         />
      )}
    </div>
  );
};

export default CodeEditor;