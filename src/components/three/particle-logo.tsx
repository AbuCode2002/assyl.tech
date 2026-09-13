"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { BRACKET_STROKE, LOGO_BOX, LOGO_PATHS } from "@/components/ui/logo-paths";

export type HeroSceneState = {
  /** 0 = cloud, 1 = logo */
  morph: number;
  /** 0 = logo, 1 = fully dispersed (driven by scroll) */
  scatter: number;
};

type Sample = { logo: Float32Array; colors: Float32Array };

const COLORS = {
  a: new THREE.Color("#e6edff"),
  aTint: new THREE.Color("#9cb8ff"),
  swooshStart: new THREE.Color("#5a5cff"),
  swooshEnd: new THREE.Color("#3b8bff"),
  brackets: new THREE.Color("#6a7dff"),
  ion: new THREE.Color("#56e1ff"),
};

/** Rasterise the logo into a canvas (one colour channel per part) and pick random filled pixels. */
function sampleLogo(count: number, worldWidth: number): Sample {
  const { width: W, height: H } = LOGO_BOX;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#ff0000";
  ctx.fill(new Path2D(LOGO_PATHS.leftLeg));
  ctx.fill(new Path2D(LOGO_PATHS.rightLeg));
  ctx.fillStyle = "#00ff00";
  ctx.fill(new Path2D(LOGO_PATHS.swoosh));
  ctx.strokeStyle = "#0000ff";
  ctx.lineWidth = BRACKET_STROKE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(LOGO_PATHS.brackets));
  const data = ctx.getImageData(0, 0, W, H).data;

  const candidates: number[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3]! < 128) continue;
      const kind = data[i]! > 128 ? 0 : data[i + 1]! > 128 ? 1 : 2;
      candidates.push(x, y, kind);
    }
  }

  const scale = worldWidth / W;
  const logo = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  const total = candidates.length / 3;
  for (let n = 0; n < count; n++) {
    const k = ((Math.random() * total) | 0) * 3;
    const px = candidates[k]! + Math.random();
    const py = candidates[k + 1]! + Math.random();
    const kind = candidates[k + 2]!;
    logo[n * 3] = (px - W / 2) * scale;
    logo[n * 3 + 1] = -(py - H / 2) * scale;
    logo[n * 3 + 2] = (Math.random() - 0.5) * (kind === 1 ? 0.28 : 0.18);
    if (kind === 0) c.copy(COLORS.a).lerp(COLORS.aTint, Math.random() * 0.6);
    else if (kind === 1) c.copy(COLORS.swooshStart).lerp(COLORS.swooshEnd, px / 430);
    else c.copy(COLORS.brackets);
    if (Math.random() < 0.04) c.copy(COLORS.ion);
    colors.set([c.r, c.g, c.b], n * 3);
  }
  return { logo, colors };
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uScatter;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  attribute vec3 aLogo;
  attribute vec3 aCloud;
  attribute vec4 aRand;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // staggered morph so particles arrive in waves
    float m = clamp(uMorph * 1.6 - aRand.x * 0.6, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);

    // cloud slowly swirls
    float ang = uTime * 0.08 + aRand.y * 0.4;
    mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    vec3 cloud = aCloud;
    cloud.xz = rot * cloud.xz;

    vec3 p = mix(cloud, aLogo, m);

    // cheap organic drift: per-particle phases + a spatial term so neighbours move coherently
    // (3 simplex-noise calls per vertex per frame were too heavy for integrated GPUs)
    float t = uTime;
    vec3 drift = vec3(
      sin(t * 0.55 + aRand.y * 6.2832 + p.y * 0.9),
      cos(t * 0.47 + aRand.z * 6.2832 + p.x * 0.9),
      sin(t * 0.38 + aRand.w * 6.2832 + p.x * 0.5)
    );
    float amp = mix(0.42, 0.028, m) + uScatter * 0.9;
    p += drift * amp;

    // disperse outward on scroll
    vec3 dir = normalize(aRand.xyz - 0.5 + 1e-4);
    p += dir * uScatter * (1.5 + aRand.w * 7.0);
    p.z += uScatter * (aRand.x - 0.2) * 6.0;

    // cursor repulsion field
    vec2 d = p.xy - uMouse.xy;
    float dist = length(d);
    float force = smoothstep(1.25, 0.0, dist) * uMouseStrength * m;
    p.xy += normalize(d + 1e-4) * force * 0.6;
    p.z += force * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float twinkle = 0.7 + 0.3 * sin(uTime * 2.3 + aRand.y * 60.0);
    gl_PointSize = uSize * (0.45 + aRand.z * 1.1) * uPixelRatio * twinkle / -mv.z;

    vColor = aColor * (1.0 + force * 1.6) + vec3(0.1, 0.25, 0.6) * force;
    vAlpha = (0.45 + 0.55 * aRand.w) * (1.0 - uScatter * 0.9);
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.8);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

function LogoParticles({ state, count, width, offset }: { state: RefObject<HeroSceneState>; count: number; width: number; offset: [number, number] }) {
  const points = useRef<THREE.Points>(null);
  const group = useRef<THREE.Group>(null);
  const { camera, size, gl } = useThree();
  const mouse = useRef(new THREE.Vector3(99, 99, 0));
  const mouseStrength = useRef(0);

  const geometry = useMemo(() => {
    const { logo, colors } = sampleLogo(count, width);
    const cloud = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      // thick spherical shell — the "jellyfish" core
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const r = 2.1 + Math.pow(Math.random(), 2.2) * 2.4;
      const s = Math.sqrt(1 - u * u);
      cloud[i * 3] = r * s * Math.cos(phi);
      cloud[i * 3 + 1] = r * u * 0.85;
      cloud[i * 3 + 2] = r * s * Math.sin(phi);
      rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(logo, 3));
    g.setAttribute("aLogo", new THREE.BufferAttribute(logo, 3));
    g.setAttribute("aCloud", new THREE.BufferAttribute(cloud, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    return g;
  }, [count, width]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uScatter: { value: 0 },
          uSize: { value: 58 },
          uPixelRatio: { value: 1 },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
          uMouseStrength: { value: 0 },
        },
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
      const halfW = halfH * cam.aspect;
      mouse.current.set(nx * halfW - offset[0], ny * halfH - offset[1], 0);
      mouseStrength.current = 1;
    };
    const onLeave = () => (mouseStrength.current = 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [camera, gl, offset]);

  useFrame((frame, delta) => {
    const u = material.uniforms;
    u.uTime!.value += delta;
    u.uPixelRatio!.value = gl.getPixelRatio();
    u.uSize!.value = size.width < 768 ? 52 : 66;
    u.uMorph!.value = THREE.MathUtils.damp(u.uMorph!.value, state.current.morph, 1.6, delta);
    u.uScatter!.value = THREE.MathUtils.damp(u.uScatter!.value, state.current.scatter, 6, delta);
    (u.uMouse!.value as THREE.Vector3).lerp(mouse.current, 1 - Math.exp(-delta * 8));
    mouseStrength.current *= Math.exp(-delta * 0.8);
    u.uMouseStrength!.value = THREE.MathUtils.damp(u.uMouseStrength!.value, mouseStrength.current, 4, delta);

    if (group.current) {
      const px = frame.pointer.x;
      const py = frame.pointer.y;
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, px * 0.22, 2.5, delta);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -py * 0.12, 2.5, delta);
    }
  });

  return (
    <group ref={group} position={[offset[0], offset[1], 0]}>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

/** Slow parallax star dust behind the logo. */
function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = -Math.random() * 14 - 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((frame, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.006;
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, -frame.pointer.x * 0.6, 1.5, delta);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, -frame.pointer.y * 0.35, 1.5, delta);
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial size={0.035} color="#7f9dff" transparent opacity={0.55} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Layout({ state }: { state: RefObject<HeroSceneState> }) {
  const { size } = useThree();
  const mobile = size.width < 768;
  const tablet = size.width < 1100;
  const width = mobile ? 4.6 : tablet ? 5.2 : 6.2;
  const offset = useMemo<[number, number]>(() => (mobile ? [0, 1.25] : tablet ? [1.2, 0.5] : [2.6, 0.15]), [mobile, tablet]);
  const count = mobile ? 5000 : 10000;
  return (
    <>
      <LogoParticles key={`${count}-${width}`} state={state} count={count} width={width} offset={offset} />
      <Dust count={mobile ? 250 : 600} />
    </>
  );
}

export default function ParticleLogoCanvas({ state, active }: { state: RefObject<HeroSceneState>; active: boolean }) {
  const [dpr, setDpr] = useState(1);
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false, depth: false }}
      camera={{ position: [0, 0, 9], fov: 45, near: 0.1, far: 60 }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* start cheap, raise resolution only if the device keeps a steady frame rate */}
      <PerformanceMonitor onIncline={() => setDpr(Math.min(1.5, window.devicePixelRatio))} onDecline={() => setDpr(0.8)} flipflops={3} />
      <Layout state={state} />
    </Canvas>
  );
}
