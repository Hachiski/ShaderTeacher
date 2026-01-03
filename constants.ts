import { Lesson } from './types';

export const DEFAULT_VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const INITIAL_FRAGMENT_SHADER = `precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

void main() {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    // Time varying pixel color
    vec3 color = 0.5 + 0.5*cos(u_time + st.xyx + vec3(0,2,4));

    gl_FragColor = vec4(color, 1.0);
}`;

export const LESSONS: Lesson[] = [
  {
    id: 'intro',
    title: 'Hello World',
    category: 'basics',
    description: 'Understand the pixel-parallel nature of shaders.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Thinking in Parallel</h3>
      <p class="mb-4">Welcome to Shader programming. The most important concept to grasp is that <strong>this code runs for every single pixel at the same time</strong>.</p>
      
      <p class="mb-4">There are no standard loops that draw a shape from top to bottom. Instead, you are given the coordinate of the current pixel (<code>gl_FragCoord</code>), and your job is to return a color (<code>gl_FragColor</code>).</p>

      <h4 class="font-bold text-purple-400 mt-4 mb-2">Key Variables:</h4>
      <ul class="list-disc pl-5 space-y-1 text-zinc-300">
        <li><code>u_resolution</code>: The width and height of the canvas.</li>
        <li><code>st</code>: We usually divide the coordinate by resolution to get a value between 0.0 and 1.0. This is called "normalizing".</li>
      </ul>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    // 1. Normalize coordinates
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    // 2. Map X and Y to Red and Green
    // Top-right is yellow (Red + Green)
    // Bottom-left is black (0, 0)
    gl_FragColor = vec4(st.x, st.y, 0.0, 1.0);
}`
  },
  {
    id: 'color_mix',
    title: 'Mixing Colors',
    category: 'basics',
    visualizer: 'smoothstep',
    description: 'Blend colors gracefully using mix() and smoothstep().',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">The Mix Function</h3>
      <p class="mb-4">Linear interpolation is done via <code>mix(x, y, a)</code>. It returns <code>x * (1-a) + y * a</code>.</p>
      
      <p class="mb-4">By calculating a "weight" or mask using <code>smoothstep</code>, we can blend two colors based on geometry.</p>
      
      <h4 class="font-bold text-purple-400 mt-4 mb-2">Technique:</h4>
      <p>1. Create a mask (0.0 to 1.0) using geometric distance.<br/>
      2. Define two colors.<br/>
      3. Mix them using the mask.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    // Define Colors
    vec3 purple = vec3(0.6, 0.0, 1.0);
    vec3 orange = vec3(1.0, 0.6, 0.0);
    
    // Create a mask pattern (diagonal stripe)
    // We use smoothstep to make the transition soft
    float pattern = smoothstep(0.4, 0.6, st.x + st.y * 0.5 + sin(u_time)*0.2);
    
    // Mix based on pattern
    // 0.0 = purple, 1.0 = orange
    vec3 color = mix(purple, orange, pattern);

    gl_FragColor = vec4(color, 1.0);
}`
  },
  {
    id: 'rotation',
    title: 'Rotating Space',
    category: 'basics',
    visualizer: 'sin',
    description: 'Rotate shapes by transforming the coordinate system.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">2D Rotation Matrix</h3>
      <p class="mb-4">To rotate a shape, we don't rotate the shape itself; we rotate the coordinate system (the paper) before drawing.</p>
      
      <p class="mb-4 text-xs font-mono bg-zinc-800 p-2 rounded">
      mat2 rotate(float angle) {<br/>
      &nbsp;&nbsp;return mat2(cos(angle), -sin(angle),<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sin(angle),  cos(angle));<br/>
      }
      </p>
      
      <p class="mt-2">We center the coordinates, apply the matrix multiplication, and then draw as usual.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

mat2 rotate(float angle) {
    return mat2(cos(angle), -sin(angle),
                sin(angle),  cos(angle));
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    // 1. Move space to center (0,0)
    st -= 0.5;
    
    // 2. Rotate space
    st *= rotate(u_time);
    
    // 3. Draw a square
    // A square in 0,0 is defined by bounds in X and Y
    // step(0.2, x) means black if x < 0.2
    
    vec2 size = vec2(0.2);
    vec2 bl = step(-size, st); // bottom-left limits
    vec2 tr = step(-size, -st); // top-right limits (flipped)
    
    float square = bl.x * bl.y * tr.x * tr.y;

    vec3 color = vec3(square);
    
    // Add some flair
    color *= vec3(st.x + 0.5, st.y + 0.5, 1.0);

    gl_FragColor = vec4(color, 1.0);
}`
  },
  {
    id: 'sin_wave',
    title: 'The Pulse of Sine',
    category: 'basics',
    visualizer: 'sin',
    description: 'Use sin() to create oscillation and animation.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">The Heartbeat of Shaders</h3>
      <p class="mb-4">Static images are boring. To add life, we use <code>sin(x)</code>.</p>
      
      <p class="mb-4">The Sine function oscillates smoothly between -1.0 and 1.0. By passing <code>u_time</code> into sin, we get a value that breathes over time.</p>
      
      <p class="mb-4 text-zinc-400"><em>Note: Since colors can't be negative, we often map the output from [-1, 1] to [0, 1] using: <code>0.5 + 0.5 * sin(time)</code></em></p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    // 1. Basic Oscillation (black to white)
    // float brightness = sin(u_time); 
    // Problem: brightness goes negative (black) half the time.

    // 2. Remapped Oscillation (0.0 to 1.0)
    float brightness = 0.5 + 0.5 * sin(u_time * 2.0);

    // 3. Space + Time
    // By adding st.x, the "phase" of the sine wave changes across the screen
    float wave = 0.5 + 0.5 * sin(u_time * 3.0 + st.x * 10.0);

    vec3 color = vec3(wave, 0.0, 1.0 - wave);

    gl_FragColor = vec4(color, 1.0);
}`
  },
  {
    id: 'cos_mixing',
    title: 'Colors with Cosine',
    category: 'basics',
    visualizer: 'cos',
    description: 'Mixing colors using offset cosine waves.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Rainbows from Math</h3>
      <p class="mb-4"><code>cos(x)</code> is just like sine, but shifted. By combining three cosine waves with different "phases" (offsets) for Red, Green, and Blue, we can create beautiful gradients.</p>
      
      <p class="mb-4">This technique is famously known as the "Cosine Gradient" (or Palette). It's very cheap to compute and looks organic.</p>
      
      <p class="text-xs font-mono bg-zinc-800 p-2 rounded">
      Color = a + b * cos( 6.28318 * (c * t + d) )
      </p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    // Create a value that changes over space and time
    float t = u_time * 0.2 + st.x;

    // PALETTE FORMULA
    // We oscillate R, G, and B with different offsets (phases)
    
    vec3 a = vec3(0.5, 0.5, 0.5); // Center
    vec3 b = vec3(0.5, 0.5, 0.5); // Amplitude
    vec3 c = vec3(1.0, 1.0, 1.0); // Frequency
    vec3 d = vec3(0.00, 0.33, 0.67); // Phase offset (0, 1/3, 2/3)

    vec3 color = a + b * cos( 6.28318 * (c * t + d) );

    gl_FragColor = vec4(color, 1.0);
}`
  },
  {
    id: 'tan_distort',
    title: 'Tangent Distortion',
    category: 'basics',
    visualizer: 'tan',
    description: 'Creating wild effects with the asymptotes of tan().',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Controlled Chaos</h3>
      <p class="mb-4">Unlike sin and cos which are safe and smooth, <code>tan(x)</code> shoots off to infinity. This creates hard contrasts and "glitchy" lines when used in a shader.</p>
      
      <p class="mb-4">When the value goes beyond 1.0 or below 0.0, the color simply clamps, creating large blocks of solid color.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    // Zoom out
    st *= 4.0;
    
    // Use tan for coordinate distortion
    // We add the tangent of Y to X
    float distortion = tan(st.y + u_time);
    
    // Create a pattern using the distorted coordinates
    float pattern = sin(st.x * 5.0 + distortion);
    
    // Sharp cutoff
    pattern = step(0.0, pattern);

    vec3 color = vec3(pattern);
    
    // Add a weird purple glow where the values explode
    color += vec3(0.5, 0.0, 1.0) * abs(distortion) * 0.1;

    gl_FragColor = vec4(color, 1.0);
}`
  },
  {
    id: 'smoothstep',
    title: 'The Art of Smoothstep',
    category: 'shaping',
    visualizer: 'smoothstep',
    description: 'Master the most important function in shader art.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Beyond If/Else</h3>
      <p class="mb-4">In shaders, we try to avoid <code>if</code> statements because they can be slow on GPUs. Instead, we use math functions to mix values.</p>
      
      <p class="mb-4"><code>smoothstep(edge0, edge1, x)</code> is the bread and butter of shader art. It performs Hermite interpolation between two values.</p>

      <h4 class="font-bold text-purple-400 mt-4 mb-2">How it works:</h4>
      <ul class="list-disc pl-5 space-y-1 text-zinc-300">
        <li>If <strong>x < edge0</strong>: Returns 0.0</li>
        <li>If <strong>x > edge1</strong>: Returns 1.0</li>
        <li>In between: Returns a smooth curve from 0 to 1.</li>
      </ul>
      
      <p class="mt-4">In this example, we use it to create a soft-edged circle without using a single if-statement.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st = st * 2.0 - 1.0;
    st.x *= u_resolution.x/u_resolution.y;

    // Distance from center
    float d = length(st);

    // TRY CHANGING THESE VALUES
    // step(0.5, d) would be jagged and aliased
    // smoothstep allows us to control the "blur" width
    float radius = 0.5;
    float blur = 0.02; 
    
    // We reverse the edges (radius + blur, radius - blur)
    // to flip the colors (white inside, black outside)
    float circle = smoothstep(radius + blur, radius - blur, d);

    // Colorize
    vec3 color = vec3(circle) * vec3(0.4, 0.6, 1.0);

    gl_FragColor = vec4(color, 1.0);
}`
  },
  {
    id: 'glow',
    title: 'Glow & Light',
    category: 'shaping',
    description: 'Create glowing lights using inverse distance.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">The Glow Formula</h3>
      <p class="mb-4">Light falls off exponentially. In 2D shaders, a cheap way to simulate a point light is the inverse function.</p>
      
      <p class="text-center font-mono text-xl my-4">brightness = 1.0 / distance</p>
      
      <p>As the distance approaches 0, the brightness approaches infinity (white hot). As distance increases, it fades to black.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    
    vec2 center = vec2(0.5);
    
    // Make the light move
    center += vec2(sin(u_time), cos(u_time)) * 0.2;

    float dist = distance(st, center);
    
    // Glow calculation
    // 0.02 controls the radius/intensity
    float glow = 0.02 / dist;
    
    // Colorize
    // Multiply white glow by a color vector
    vec3 color = vec3(glow) * vec3(0.2, 0.5, 1.0);
    
    // Tone mapping (optional, prevents hard clipping)
    color = color / (color + 1.0);

    gl_FragColor = vec4(color, 1.0);
}`
  },
  {
    id: 'patterns',
    title: 'Tiling & Patterns',
    category: 'patterns',
    visualizer: 'fract',
    description: 'Use the fract() function to repeat space.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Infinite Repetition</h3>
      <p class="mb-4">You don't need loops to draw multiple objects. You can fold space itself.</p>
      
      <p class="mb-4">The <code>fract(x)</code> function returns the fractional part of a number (e.g., fract(1.2) = 0.2). By multiplying our coordinates and then taking the fract, we create a sawtooth wave that resets from 0 to 1 repeatedly.</p>
      
      <p class="mt-2">This effectively splits the canvas into a grid where every cell thinks it is the entire coordinate system.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    // 1. Scale up space (Creates 5x5 grid)
    st *= 5.0;

    // 2. Tile space
    // fract() makes st go from 0.0-0.99 repeatedly
    vec2 gridSt = fract(st);
    
    // 3. Center inside each tile
    // 0,0 becomes center of the tile
    gridSt = gridSt * 2.0 - 1.0;

    // Draw a circle in *every* tile
    float d = length(gridSt);
    float c = smoothstep(0.4, 0.3, d);

    // Add some color based on the integer ID of the tile
    // floor(st) gives us the coordinate of the grid cell (0,1,2,3...)
    vec2 id = floor(st);
    vec3 color = vec3(c);
    
    // Checkerboard variation
    if (mod(id.x + id.y, 2.0) == 0.0) {
        color *= vec3(1.0, 0.0, 0.5); // Pink
    } else {
        color *= vec3(0.0, 1.0, 1.0); // Cyan
    }

    gl_FragColor = vec4(color, 1.0);
}`
  },
    {
    id: 'noise_grain',
    title: 'Digital Noise',
    category: 'patterns',
    visualizer: 'fract',
    description: 'Generating pseudo-randomness from sine waves.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Pseudo-Randomness</h3>
      <p class="mb-4">Computers can't generate true randomness. In shaders, we use "Hash" functions that take a coordinate and return a deterministic but chaotic value.</p>
      
      <p class="mb-4">A common one-liner for randomness involves multiplying the coordinate by a huge number and taking the <code>fract()</code> of the sine.</p>
      
      <p class="text-xs text-zinc-400">Note: This is "White Noise". For clouds, we would use "Value Noise" or "Perlin Noise".</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
    // Animate the noise by adding time to the input
    // floor() makes it "blocky" if we scaled it up, 
    // but here we just use raw pixels or time
    
    float rnd = random(st + u_time * 0.1);

    gl_FragColor = vec4(vec3(rnd), 1.0);
}`
  },
    {
    id: 'box_blur',
    title: 'Procedural Blur',
    category: 'advanced',
    description: 'Simulating blur by averaging multiple samples.',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Smoothing via Averaging</h3>
      <p class="mb-4">Blurring is essentially averaging colors around a pixel.</p>
      
      <p class="mb-4">Since we are drawing procedurally, we can "sample" our pattern at slightly offset coordinates and take the average. This is expensive!</p>
      
      <p>In this example, we draw a sharp circle, but run a loop to sample it 16 times with random offsets to create a blur.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

// A simple sharp shape function
float scene(vec2 st) {
    vec2 pos = vec2(0.5) + vec2(sin(u_time), cos(u_time))*0.2;
    return step(length(st - pos), 0.2);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    float color = 0.0;
    
    // Blur Radius
    float blurSize = 0.02;
    
    // Take 16 samples
    // Note: In real games we use textures and optimized kernels (Gaussian)
    // This is a naive "Monte Carlo" style blur
    float total = 0.0;
    
    for(float i = 0.0; i < 4.0; i++) {
        for(float j = 0.0; j < 4.0; j++) {
            // Create an offset based on loop index
            vec2 offset = vec2(i, j) / 4.0 - 0.5;
            
            // Sample the scene
            color += scene(st + offset * blurSize);
            total += 1.0;
        }
    }
    
    color /= total;

    gl_FragColor = vec4(vec3(color), 1.0);
}`
  },
  {
    id: 'raymarching',
    title: 'Basic Raymarching',
    category: '3d',
    description: 'Render 3D geometry using Signed Distance Functions (SDFs).',
    guide: `
      <h3 class="text-lg font-bold text-white mb-2">Rendering 3D without Polygons</h3>
      <p class="mb-4">Raymarching is a technique to render 3D scenes by "marching" a ray from the camera into the scene step-by-step.</p>
      
      <h4 class="font-bold text-purple-400 mt-4 mb-2">The Algorithm:</h4>
      <ol class="list-decimal pl-5 space-y-2 text-zinc-300">
        <li><strong>The Ray:</strong> For every pixel, we shoot a ray forward (Z axis).</li>
        <li><strong>SDF (Signed Distance Function):</strong> We use math formulas to calculate the distance to the nearest object in the scene from the tip of our ray.</li>
        <li><strong>The March:</strong> We move the ray forward by that distance. We repeat this until we get very close to an object (a hit) or go too far (miss).</li>
      </ol>

      <p class="mt-4 text-xs bg-zinc-800 p-2 rounded">This example renders a sphere using the SDF equation: <code>length(p) - radius</code>.</p>
    `,
    code: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

// 1. SIGNED DISTANCE FUNCTION
// Returns distance from point p to surface of a sphere
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// 2. SCENE MAPPING
// Describes the entire world
float map(vec3 p) {
    // Animate the sphere position
    vec3 spherePos = vec3(0.0, 0.0, 0.0); // Center of world
    return sdSphere(p - spherePos, 1.0);
}

void main() {
    // Center coordinates: 0,0 is middle of screen
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // Initialization
    vec3 ro = vec3(0.0, 0.0, -3.0);     // Ray Origin (Camera pos)
    vec3 rd = normalize(vec3(uv, 1.0)); // Ray Direction (Field of View)
    vec3 col = vec3(0.0);               // Background color (Black)

    float t = 0.0; // Total distance traveled

    // 3. RAYMARCHING LOOP
    for(int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;     // Current position along ray
        float d = map(p);         // Get distance to nearest object

        t += d;                   // March forward safely
        
        if(d < 0.001 || t > 100.0) break; // Hit or Miss
    }

    // 4. COLORING
    if(t < 100.0) {
        // We hit something!
        vec3 p = ro + rd * t;
        
        // Calculate simple lighting (Normal)
        // We approximate the normal by sampling points slightly around the hit
        vec2 e = vec2(0.001, 0.0);
        vec3 normal = normalize(vec3(
            map(p + e.xyy) - map(p - e.xyy),
            map(p + e.yxy) - map(p - e.yxy),
            map(p + e.yyx) - map(p - e.yyx)
        ));
        
        // Basic lighting
        vec3 lightSource = vec3(2.0, 2.0, -3.0);
        vec3 lightDir = normalize(lightSource - p);
        float diff = max(dot(normal, lightDir), 0.0);
        
        col = vec3(diff) * vec3(1.0, 0.4, 0.2); // Orange sphere
    }

    gl_FragColor = vec4(col, 1.0);
}`
  }
];