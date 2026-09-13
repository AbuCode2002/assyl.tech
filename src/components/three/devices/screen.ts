"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;
  uniform float uTime;
  uniform float uPower;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uIsland;
  uniform float uBrightness;
  varying vec2 vUv;

  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  vec3 sampleSplit(sampler2D tex, vec2 uv, float split) {
    return vec3(
      texture2D(tex, uv + vec2(split, 0.0)).r,
      texture2D(tex, uv).g,
      texture2D(tex, uv - vec2(split, 0.0)).b
    );
  }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = sdRoundRect(p, uSize * 0.5, uRadius);
    float aa = fwidth(d) * 1.2;
    float mask = 1.0 - smoothstep(-aa, aa, d);
    if (mask <= 0.001) discard;

    // glitch strength peaks in the middle of a transition
    float g = sin(clamp(uMix, 0.0, 1.0) * 3.14159);
    float row = floor(vUv.y * 28.0);
    float jitter = step(0.62, hash(vec2(row, floor(uTime * 16.0)))) * g;
    vec2 uv = vUv;
    uv.x += (hash(vec2(row * 1.7, floor(uTime * 24.0))) - 0.5) * 0.09 * jitter;
    float split = 0.014 * g;

    vec3 a = sampleSplit(uTexA, uv, split);
    vec3 b = sampleSplit(uTexB, uv, split);

    // blocky noise dissolve sweeping top → bottom
    float n = hash(floor(vUv * vec2(18.0, 36.0)));
    float s = (1.0 - vUv.y) * 0.55 + n * 0.45;
    float k = smoothstep(uMix - 0.04, uMix + 0.04, s * 0.92 + 0.04);
    vec3 col = mix(b, a, k);
    float edge = (1.0 - abs(k - 0.5) * 2.0) * step(0.001, uMix) * step(uMix, 0.999);
    col += vec3(0.34, 0.88, 1.0) * edge * 0.9;

    // subtle scanlines + glass sheen
    col *= 0.955 + 0.045 * sin(gl_FragCoord.y * 1.6);
    col *= uBrightness;
    col += vec3(0.05, 0.07, 0.11) * smoothstep(0.35, 0.0, abs(vUv.x - vUv.y * 0.6 - 0.15)) * 0.6;

    // CRT-style power on: a bright line opens into the full picture
    float on = clamp(uPower, 0.0, 1.0);
    float lineW = smoothstep(0.0, 0.3, on);
    float lineH = mix(0.006, 1.0, smoothstep(0.3, 0.85, on));
    vec2 c = abs(vUv - 0.5) * 2.0;
    float vis = step(c.x, lineW) * step(c.y, lineH);
    float flash = (1.0 - smoothstep(0.55, 1.0, on)) * vis;
    col = col * vis + vec3(0.55, 0.75, 1.0) * flash * 0.85;

    // dynamic island
    if (uIsland > 0.5) {
      vec2 ip = p - vec2(0.0, uSize.y * 0.5 - 0.062);
      float di = sdRoundRect(ip, vec2(0.11, 0.032), 0.032);
      col = mix(vec3(0.0), col, smoothstep(-aa, aa, di));
    }

    gl_FragColor = vec4(col, mask);
  }
`;

export function createScreenMaterial(size: [number, number], radius: number, island = false) {
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  blank.needsUpdate = true;
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uTexA: { value: blank },
      uTexB: { value: blank },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uPower: { value: 1 },
      uSize: { value: new THREE.Vector2(size[0], size[1]) },
      uRadius: { value: radius },
      uIsland: { value: island ? 1 : 0 },
      uBrightness: { value: 1 },
    },
  });
}

export type ScreenSource = {
  texture: THREE.Texture;
  video: HTMLVideoElement;
};

/**
 * Poster texture first, swapped for a live VideoTexture once the clip can play.
 * Raw (non-colour-managed) textures so the shader outputs the video's pixels untouched.
 */
export function useScreenSource(src: string, poster: string, load: boolean): ScreenSource {
  const video = useMemo(() => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "none";
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");
    return v;
  }, []);

  const posterTexture = useMemo(() => {
    const tex = new THREE.TextureLoader().load(poster);
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [poster]);

  const videoTexture = useMemo(() => {
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [video]);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!load || video.src) return;
    video.src = src;
    video.preload = "auto";
    const onReady = () => setReady(true);
    video.addEventListener("loadeddata", onReady, { once: true });
    video.load();
    return () => video.removeEventListener("loadeddata", onReady);
  }, [load, src, video]);

  useEffect(
    () => () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      posterTexture.dispose();
      videoTexture.dispose();
    },
    [video, posterTexture, videoTexture],
  );

  return { texture: ready ? videoTexture : posterTexture, video };
}

/** Rounded rectangle outline centred at the origin. */
export function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Extruded rounded slab centred on all axes, thickness along Z. */
export function roundedSlab(w: number, h: number, depth: number, radius: number, bevel = 0.012) {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w - bevel * 2, h - bevel * 2, Math.max(0.001, radius - bevel)), {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 20,
  });
  geo.translate(0, 0, -(depth - bevel * 2) / 2);
  geo.computeVertexNormals();
  return geo;
}
