import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateData = (func: (x: number) => number, rangeMax: number = Math.PI * 4) => {
  const data = [];
  for (let x = 0; x <= rangeMax; x += 0.2) {
    data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(func(x).toFixed(2)) });
  }
  return data;
};

interface MathVisualizerProps {
  type: 'sin' | 'cos' | 'tan' | 'abs_sin' | 'fract' | 'smoothstep';
}

const MathVisualizer: React.FC<MathVisualizerProps> = ({ type }) => {
  let data;
  let title;
  
  switch(type) {
    case 'sin':
      data = generateData(Math.sin);
      title = "y = sin(x)";
      break;
    case 'cos':
      data = generateData(Math.cos);
      title = "y = cos(x)";
      break;
    case 'tan':
      // Custom generation for tan to handle asymptotes visually
      data = [];
      for (let x = 0; x <= Math.PI * 2; x += 0.1) {
          let y = Math.tan(x);
          // Clamp values so the chart doesn't flatten out interesting parts
          if (y > 5) y = 5;
          if (y < -5) y = -5;
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
      }
      title = "y = tan(x) (clamped)";
      break;
    case 'abs_sin':
      data = generateData((x) => Math.abs(Math.sin(x)));
      title = "y = abs(sin(x))";
      break;
    case 'fract':
      data = generateData((x) => x - Math.floor(x));
      title = "y = fract(x)";
      break;
    case 'smoothstep':
        // Show smoothstep between 0 and 1 over a range
        data = [];
        for(let x = -1; x <= 2; x+=0.1) {
             // Basic smoothstep implementation for JS visualization
             const t = Math.max(0, Math.min(1, (x - 0) / (1 - 0)));
             const y = t * t * (3 - 2 * t);
             data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
        }
        title = "y = smoothstep(0, 1, x)";
      break;
    default:
      data = generateData(Math.sin);
      title = "sin(x)";
  }

  return (
    <div className="w-full h-32 bg-zinc-900/50 rounded-lg p-2 border border-zinc-800 my-4">
      <div className="text-xs text-zinc-400 mb-1 font-mono">{title}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="x" hide />
          <YAxis hide domain={[-2, 2]}/>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', fontSize: '12px' }}
            itemStyle={{ color: '#e4e4e7' }}
          />
          <Line type="monotone" dataKey="y" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MathVisualizer;