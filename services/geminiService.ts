import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateShaderExplanation = async (code: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain this GLSL fragment shader code to a beginner. Focus on the mathematical concepts and visual outcome. Keep it concise (under 150 words) but informative.\n\nCode:\n${code}`,
    });
    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to connect to AI service.";
  }
};

export const generateShaderFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a GLSL fragment shader compatible with WebGL 1.0 (GLSL ES 1.00) based on this request: "${prompt}".
      
      Requirements:
      - Use 'precision mediump float;'
      - Uniforms available: 'uniform vec2 u_resolution;', 'uniform float u_time;', 'uniform vec2 u_mouse;'
      - Output to 'gl_FragColor'
      - ONLY return the raw shader code. Do not include markdown backticks or explanations outside the code.
      - Ensure the code compiles.`,
    });
    
    let text = response.text || "";
    // Cleanup potential markdown formatting
    text = text.replace(/```glsl/g, '').replace(/```/g, '').trim();
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "// Error generating shader. Please try again.";
  }
};

export const fixShaderCode = async (code: string, errorMsg: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `This GLSL shader has a compilation error. Fix it.
      
      Error: ${errorMsg}
      
      Code:
      ${code}
      
      Return ONLY the fixed code without markdown backticks.`,
    });
    let text = response.text || code;
    text = text.replace(/```glsl/g, '').replace(/```/g, '').trim();
    return text;
  } catch (err) {
    return code; // Return original if failed
  }
}
