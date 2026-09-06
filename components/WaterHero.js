import { useEffect, useRef } from "react";

const VERT_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_ripples[16];

const vec3 NAVY = vec3(0.1216, 0.2196, 0.3922);
const vec3 TEAL = vec3(0.0588, 0.4314, 0.3882);
const vec3 GOLD = vec3(0.6118, 0.4784, 0.1608);

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = uv;
  p.x *= aspect;

  float height = 0.0;
  vec2 grad = vec2(0.0);

  for (int i = 0; i < 16; i++) {
    vec4 r = u_ripples[i];
    if (r.w < 0.5) continue;
    vec2 rp = r.xy;
    rp.x *= aspect;
    float dist = length(p - rp);
    float t = u_time - r.z;
    if (t < 0.0) continue;
    float wave = sin(dist * 45.0 - t * 9.0) * exp(-dist * 3.2) * exp(-t * 0.9);
    height += wave;
    vec2 dir = (p - rp) / (dist + 0.0001);
    grad += dir * wave * 0.9;
  }

  float ambient = sin(uv.x * 5.0 + u_time * 0.25) * 0.015
                + sin(uv.y * 7.0 - u_time * 0.18) * 0.015;
  height += ambient;

  vec3 base = mix(NAVY, TEAL, clamp(uv.y * 0.8 + height * 0.6, 0.0, 1.0));

  vec3 normal = normalize(vec3(-grad.x, -grad.y, 1.0));
  vec3 lightDir = normalize(vec3(0.35, 0.55, 0.75));
  float diff = max(dot(normal, lightDir), 0.0);
  float spec = pow(diff, 24.0);

  vec3 color = base + vec3(1.0) * spec * 0.55 + GOLD * spec * 0.25;

  float vign = smoothstep(1.1, 0.3, length(uv - 0.5) * 1.3);
  color *= mix(0.85, 1.0, vign);

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function WaterHero({ children, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    const vertShader = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const quad = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u_resolution = gl.getUniformLocation(program, "u_resolution");
    const u_time = gl.getUniformLocation(program, "u_time");
    const u_ripples = gl.getUniformLocation(program, "u_ripples");

    const MAX_RIPPLES = 16;
    const rippleData = new Float32Array(MAX_RIPPLES * 4);
    let rippleIndex = 0;
    const startTime = performance.now();

    function addRipple(x, y) {
      const t = (performance.now() - startTime) / 1000;
      const base = rippleIndex * 4;
      rippleData[base] = x;
      rippleData[base + 1] = y;
      rippleData[base + 2] = t;
      rippleData[base + 3] = 1.0;
      rippleIndex = (rippleIndex + 1) % MAX_RIPPLES;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    let lastMoveAdd = 0;
    function pointerToUV(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      const y = 1.0 - (clientY - rect.top) / rect.height;
      return [x, y];
    }
    function onPointerDown(e) {
      const [x, y] = pointerToUV(e.clientX, e.clientY);
      addRipple(x, y);
    }
    function onPointerMove(e) {
      const now = performance.now();
      if (now - lastMoveAdd < 90) return;
      lastMoveAdd = now;
      const [x, y] = pointerToUV(e.clientX, e.clientY);
      addRipple(x, y);
    }
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);

    // Gentle idle ripples so the water feels alive before interaction
    addRipple(0.3, 0.6);
    addRipple(0.7, 0.4);
    const idleInterval = setInterval(() => {
      addRipple(0.15 + Math.random() * 0.7, 0.25 + Math.random() * 0.5);
    }, 3800);

    let rafId;
    function render() {
      const t = (performance.now() - startTime) / 1000;
      gl.uniform2f(u_resolution, canvas.width, canvas.height);
      gl.uniform1f(u_time, t);
      gl.uniform4fv(u_ripples, rippleData);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(idleInterval);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
