"use client";

import { Environment, Lightformer, PerformanceMonitor, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { projects } from "@/content/projects";
import { Laptop, LAPTOP } from "./devices/laptop";
import { Phone, PHONE } from "./devices/phone";
import { createScreenMaterial, useScreenSource } from "./devices/screen";

const byId = (id: string) => projects.find((p) => p.id === id)!;
const CLIPS = {
  storeplan: byId("storeplan"),
  krovla: byId("krovla"),
  dashboard: byId("farabi-dashboard"),
  assistant: byId("farabi-assistant"),
};

// ───────── timeline helpers ─────────
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = THREE.MathUtils.lerp;

const floorVertex = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const floorFragment = /* glsl */ `
  uniform float uTime;
  uniform float uGlow;
  varying vec2 vUv;
  float line(float x, float w){ float d = abs(fract(x) - 0.5); return smoothstep(w, 0.0, 0.5 - d); }
  void main(){
    vec2 p = (vUv - 0.5) * 27.0;
    float g = max(line(p.x, 0.02), line(p.y + uTime * 0.25, 0.02));
    float r = length(vUv - 0.5) * 2.0;
    float fade = smoothstep(0.55, 0.0, r);
    vec3 col = vec3(0.23, 0.48, 1.0) * g * fade * 0.55;
    col += vec3(0.16, 0.3, 1.0) * smoothstep(0.28, 0.0, r) * 0.35 * uGlow;
    gl_FragColor = vec4(col, (g * 0.6 + 0.4) * fade);
  }
`;

function Floor({ progress }: { progress: RefObject<number> }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: floorVertex,
        fragmentShader: floorFragment,
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uGlow: { value: 0.5 } },
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, d) => {
    mat.uniforms.uTime!.value += d;
    mat.uniforms.uGlow!.value = 0.6 + Math.sin(progress.current * Math.PI * 4) * 0.2;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.72, 0]} material={mat}>
      <planeGeometry args={[16, 16]} />
    </mesh>
  );
}

/** Two thin orbit rings behind the hero device. */
function Rings() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (a.current) a.current.rotation.z += d * 0.12;
    if (b.current) b.current.rotation.z -= d * 0.07;
  });
  return (
    <group>
      <mesh ref={a} rotation={[1.2, 0.2, 0]}>
        <torusGeometry args={[1.55, 0.0035, 8, 220]} />
        <meshBasicMaterial color="#3b7bff" transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh ref={b} rotation={[1.35, -0.35, 0]}>
        <torusGeometry args={[1.9, 0.002, 8, 220]} />
        <meshBasicMaterial color="#56e1ff" transparent opacity={0.28} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Stage({ progress, active }: { progress: RefObject<number>; active: boolean }) {
  const { size, camera, gl, scene } = useThree();
  const rig = useRef<THREE.Group>(null);
  const phone = useRef<THREE.Group>(null);
  const laptop = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const ringAnchor = useRef<THREE.Group>(null);
  const smooth = useRef(0);

  const phoneScreen = useMemo(() => createScreenMaterial([PHONE.screenW, PHONE.screenH], PHONE.screenRadius, true), []);
  const laptopScreen = useMemo(() => createScreenMaterial([LAPTOP.screenW, LAPTOP.screenH], 0.02, false), []);
  useEffect(
    () => () => {
      phoneScreen.dispose();
      laptopScreen.dispose();
    },
    [phoneScreen, laptopScreen],
  );

  // Network + decoder warm-up is staggered: phone clips when the section is on screen,
  // laptop clips only once the story gets close to the laptop chapter.
  const [laptopNear, setLaptopNear] = useState(false);
  const sStore = useScreenSource(CLIPS.storeplan.video, CLIPS.storeplan.poster, active);
  const sKrovla = useScreenSource(CLIPS.krovla.video, CLIPS.krovla.poster, active);
  const sDash = useScreenSource(CLIPS.dashboard.video, CLIPS.dashboard.poster, active && laptopNear);
  const sChat = useScreenSource(CLIPS.assistant.video, CLIPS.assistant.poster, active && laptopNear);

  // Compile every shader up front (including the still-hidden laptop) so nothing compiles mid-scroll.
  useEffect(() => {
    if (laptop.current) laptop.current.visible = true;
    gl.compile(scene, camera);
  }, [gl, scene, camera]);

  useEffect(() => {
    phoneScreen.uniforms.uTexA!.value = sStore.texture;
    phoneScreen.uniforms.uTexB!.value = sKrovla.texture;
    laptopScreen.uniforms.uTexA!.value = sDash.texture;
    laptopScreen.uniforms.uTexB!.value = sChat.texture;
  }, [phoneScreen, laptopScreen, sStore.texture, sKrovla.texture, sDash.texture, sChat.texture]);

  // play only the clips that can currently be seen
  const playing = useRef<Record<string, boolean>>({});
  const setPlaying = (key: string, video: HTMLVideoElement, on: boolean) => {
    if (playing.current[key] === on) return;
    playing.current[key] = on;
    if (on) video.play().catch(() => (playing.current[key] = false));
    else video.pause();
  };
  useEffect(() => {
    if (active) return;
    [sStore, sKrovla, sDash, sChat].forEach((s) => s.video.pause());
    playing.current = {};
  }, [active, sStore, sKrovla, sDash, sChat]);

  const mobile = size.width < 768;

  useFrame((state, delta) => {
    smooth.current = THREE.MathUtils.damp(smooth.current, progress.current, 5, delta);
    const p = smooth.current;
    const t = state.clock.elapsedTime;

    phoneScreen.uniforms.uTime!.value = t;
    laptopScreen.uniforms.uTime!.value = t;

    if (active) {
      // at most two decoders run at once, and only around a hand-over
      setPlaying("store", sStore.video, p < 0.37);
      setPlaying("krovla", sKrovla.video, p > 0.35 && p < 0.7);
      setPlaying("dash", sDash.video, p > 0.64 && p < 0.93);
      setPlaying("chat", sChat.video, p > 0.85);
      if (!laptopNear && p > 0.38) setLaptopNear(true);
    }

    // responsive framing: one scale while the phone is the hero, another for the laptop composition
    const cam = camera as THREE.PerspectiveCamera;
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
    const viewW = viewH * cam.aspect;
    const phoneH = PHONE.h * 1.62;
    const phoneFit = Math.min((viewH * (mobile ? 0.46 : 0.62)) / phoneH, (viewW * (mobile ? 0.55 : 0.4)) / (PHONE.w * 1.62));
    const laptopFit = Math.min((viewW * (mobile ? 0.92 : 0.56)) / 4.6, (viewH * (mobile ? 0.5 : 0.72)) / 2.4);
    const stage = easeInOut(seg(p, 0.56, 0.7));

    if (rig.current) {
      const baseX = mobile ? 0 : viewW * 0.17;
      const baseY = mobile ? viewH * 0.17 : 0;
      rig.current.position.x = THREE.MathUtils.damp(rig.current.position.x, baseX + state.pointer.x * 0.12, 3, delta);
      rig.current.position.y = THREE.MathUtils.damp(rig.current.position.y, baseY + state.pointer.y * 0.06, 3, delta);
      rig.current.scale.setScalar(lerp(phoneFit, laptopFit, stage));
      rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, state.pointer.x * 0.08, 2, delta);
    }

    // ── phone ──
    if (phone.current) {
      const enter = easeOut(seg(p, 0, 0.1));
      const spin = easeInOut(seg(p, 0.3, 0.42));
      const aside = easeInOut(seg(p, 0.56, 0.7));
      const float = Math.sin(t * 1.1) * 0.04;

      let ry = lerp(-Math.PI * 1.1, -0.38, enter);
      ry = lerp(ry, 0.3, easeInOut(seg(p, 0.1, 0.3)));
      ry += spin * Math.PI * 2;
      ry = lerp(ry, 0.3 + Math.PI * 2 - 0.6, easeInOut(seg(p, 0.42, 0.56)));
      ry = lerp(ry, Math.PI * 2 + 0.42, aside);

      phone.current.rotation.set(lerp(0.45, 0.06, enter) + aside * 0.02, ry, lerp(-0.1, 0, enter) - aside * 0.05);
      phone.current.position.set(
        lerp(0, mobile ? -1.05 : -2.15, aside),
        lerp(-4.6, 0, enter) + float + lerp(0, mobile ? -0.55 : -0.42, aside),
        lerp(0, 0.9, aside) + spin * (1 - spin) * 1.6,
      );
      // rig scale shrinks for the laptop stage, so compensate to keep the phone a readable companion
      const s = lerp(1.62, mobile ? 1.35 : 1.3, aside);
      phone.current.scale.setScalar(s);

      phoneScreen.uniforms.uMix!.value = spin > 0.5 ? 1 : 0;
      phoneScreen.uniforms.uPower!.value = enter;
    }
    if (ringAnchor.current) {
      const aside = easeInOut(seg(p, 0.56, 0.7));
      ringAnchor.current.position.set(lerp(0, 0.4, aside), lerp(0, 0.25, aside), -0.6);
      ringAnchor.current.scale.setScalar(lerp(1, 1.6, aside) * easeOut(seg(p, 0.02, 0.14)));
    }

    // ── laptop ──
    if (laptop.current && lid.current) {
      const rise = easeOut(seg(p, 0.56, 0.7));
      const open = easeInOut(seg(p, 0.66, 0.77));
      const power = seg(p, 0.73, 0.8);
      const swap = easeInOut(seg(p, 0.86, 0.92));
      const push = easeInOut(seg(p, 0.77, 1));

      laptop.current.visible = p > 0.52;
      laptop.current.position.set(lerp(0.6, 0.35, push), lerp(-5, -0.98, rise) + Math.sin(t * 0.9) * 0.02 * rise, lerp(-1.2, -0.2, rise) + push * 0.35);
      laptop.current.rotation.set(lerp(0.55, 0.22, rise), lerp(-0.9, -0.28, rise) + push * 0.12, 0);
      laptop.current.scale.setScalar(1.02);
      lid.current.rotation.x = lerp(Math.PI / 2, -0.26, open);

      laptopScreen.uniforms.uPower!.value = power;
      laptopScreen.uniforms.uMix!.value = swap;
    }
  });

  return (
    <group ref={rig}>
      <group ref={ringAnchor}>
        <Rings />
      </group>
      <Phone ref={phone} screen={phoneScreen} />
      <Laptop ref={laptop} lidRef={lid} screen={laptopScreen} />
    </group>
  );
}

export default function ShowcaseScene({ progress, active }: { progress: RefObject<number>; active: boolean }) {
  const [dpr, setDpr] = useState(() => Math.min(1.25, typeof window === "undefined" ? 1 : window.devicePixelRatio));
  return (
    <Canvas
      // off-screen: render only on demand (first frame compiles shaders and uploads posters ahead of time)
      frameloop={active ? "always" : "demand"}
      dpr={dpr}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance", stencil: false }}
      camera={{ position: [0, 0.35, 9], fov: 30, near: 0.1, far: 80 }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <PerformanceMonitor onIncline={() => setDpr(Math.min(1.5, window.devicePixelRatio))} onDecline={() => setDpr(1)} flipflops={3} onFallback={() => setDpr(0.85)} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 5]} intensity={1.8} />
      <pointLight position={[-4, 1.5, -2.5]} color="#3b7bff" intensity={60} distance={18} />
      <pointLight position={[4.5, -0.5, -2]} color="#9b6bff" intensity={35} distance={18} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 5]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={5} color="#3b7bff" position={[-6, 0.5, -1]} rotation-y={Math.PI / 2} scale={[8, 5, 1]} />
        <Lightformer form="rect" intensity={3} color="#9b6bff" position={[6, -0.5, -1]} rotation-y={-Math.PI / 2} scale={[8, 5, 1]} />
        <Lightformer form="ring" intensity={4} color="#56e1ff" position={[3, 3, -4]} scale={2.5} />
        <Lightformer form="rect" intensity={1} position={[0, -4, 1]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
      </Environment>

      <Stage progress={progress} active={active} />
      <Floor progress={progress} />
      <Sparkles count={36} scale={[12, 5, 6]} size={2.4} speed={0.25} opacity={0.55} color="#7fa2ff" />
    </Canvas>
  );
}
