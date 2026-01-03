import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_VERTEX_SHADER } from '../constants';
import { ShaderError } from '../types';

interface ShaderCanvasProps {
  fragmentShader: string;
  onCompileError: (error: ShaderError | null) => void;
  isPlaying: boolean;
}

const ShaderCanvas: React.FC<ShaderCanvasProps> = ({ fragmentShader, onCompileError, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  // Mouse state
  const mouseRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    glRef.current = gl;

    // Handle Resize
    const handleResize = () => {
        if(canvas) {
            canvas.width = canvas.clientWidth * window.devicePixelRatio;
            canvas.height = canvas.clientHeight * window.devicePixelRatio;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Handle Mouse
    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: canvas.height - (e.clientY - rect.top) // Flip Y for GLSL
        };
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Compile Shader
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        
        // Parse error line
        if (type === gl.FRAGMENT_SHADER && info) {
            const match = info.match(/ERROR: \d+:(\d+):/);
            if (match) {
                onCompileError({ line: parseInt(match[1]), message: info });
            } else {
                onCompileError({ line: 0, message: info });
            }
        }
        return null;
      }
      return shader;
    };

    const vs = compileShader(DEFAULT_VERTEX_SHADER, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShader, gl.FRAGMENT_SHADER);

    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    // Cleanup old program
    if (programRef.current) gl.deleteProgram(programRef.current);
    programRef.current = program;
    onCompileError(null);

    // Setup Geometry (Big Triangle or Quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  }, [fragmentShader, onCompileError]);

  // Render Loop
  const animate = (time: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;

    if (gl && program && canvas) {
      gl.useProgram(program);

      // Uniforms
      const uResolution = gl.getUniformLocation(program, "u_resolution");
      const uTime = gl.getUniformLocation(program, "u_time");
      const uMouse = gl.getUniformLocation(program, "u_mouse");

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, (Date.now() - startTimeRef.current) / 1000);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas 
        ref={canvasRef} 
        className="w-full h-full block bg-black"
        style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default ShaderCanvas;
