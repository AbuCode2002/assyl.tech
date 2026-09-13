"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type Ref } from "react";
import * as THREE from "three";
import { BRACKET_STROKE, LOGO_BOX, LOGO_PATHS } from "@/components/ui/logo-paths";
import { roundedRectShape, roundedSlab } from "./screen";

/** Screen aspect matches the 1280×672 web recordings (≈1.905). */
export const LAPTOP = {
  w: 3.1,
  baseD: 2.12,
  baseH: 0.075,
  lidH: 2.02,
  lidT: 0.042,
  radius: 0.12,
  screenW: 2.84,
  screenH: 1.491,
  screenY: 1.04,
};

function logoTexture() {
  const scale = 2;
  const c = document.createElement("canvas");
  c.width = LOGO_BOX.width * scale;
  c.height = LOGO_BOX.height * scale;
  const ctx = c.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.shadowColor = "rgba(59,123,255,0.9)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#e9efff";
  ctx.fill(new Path2D(LOGO_PATHS.leftLeg));
  ctx.fill(new Path2D(LOGO_PATHS.rightLeg));
  const grad = ctx.createLinearGradient(0, 400, 430, 200);
  grad.addColorStop(0, "#5a5cff");
  grad.addColorStop(1, "#3b82ff");
  ctx.fillStyle = grad;
  ctx.fill(new Path2D(LOGO_PATHS.swoosh));
  ctx.strokeStyle = "#5b74ff";
  ctx.lineWidth = BRACKET_STROKE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(LOGO_PATHS.brackets));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Laptop({ screen, lidRef, ref }: { screen: THREE.ShaderMaterial; lidRef: Ref<THREE.Group>; ref?: Ref<THREE.Group> }) {
  const keys = useRef<THREE.InstancedMesh>(null);

  const parts = useMemo(() => {
    const base = roundedSlab(LAPTOP.w, LAPTOP.baseD, LAPTOP.baseH, LAPTOP.radius, 0.02);
    base.rotateX(-Math.PI / 2);
    const lid = roundedSlab(LAPTOP.w, LAPTOP.lidH, LAPTOP.lidT, LAPTOP.radius, 0.012);
    lid.translate(0, LAPTOP.lidH / 2, 0);
    const bezel = new THREE.ShapeGeometry(roundedRectShape(LAPTOP.w - 0.05, LAPTOP.lidH - 0.05, LAPTOP.radius - 0.02), 20);
    bezel.translate(0, LAPTOP.lidH / 2, 0);
    const screenGeo = new THREE.PlaneGeometry(LAPTOP.screenW, LAPTOP.screenH);
    const key = new THREE.BoxGeometry(0.17, 0.018, 0.165);
    const well = new THREE.ShapeGeometry(roundedRectShape(2.78, 1.02, 0.04), 8);
    well.rotateX(-Math.PI / 2);
    const pad = new THREE.ShapeGeometry(roundedRectShape(1.12, 0.66, 0.06), 12);
    pad.rotateX(-Math.PI / 2);
    const hinge = new THREE.CylinderGeometry(0.035, 0.035, LAPTOP.w - 0.6, 16);
    hinge.rotateZ(Math.PI / 2);
    const logoPlane = new THREE.PlaneGeometry(0.62, 0.42);

    const alu = new THREE.MeshStandardMaterial({ color: "#262a33", metalness: 0.95, roughness: 0.32 });
    const bezelMat = new THREE.MeshStandardMaterial({ color: "#030305", metalness: 0.2, roughness: 0.08 });
    const keyMat = new THREE.MeshStandardMaterial({ color: "#0b0c10", metalness: 0.3, roughness: 0.62 });
    const wellMat = new THREE.MeshBasicMaterial({ color: "#1d3a8f", transparent: true, opacity: 0.55 });
    const padMat = new THREE.MeshStandardMaterial({ color: "#1b1e25", metalness: 0.7, roughness: 0.22 });
    const logoMat = new THREE.MeshBasicMaterial({ map: logoTexture(), transparent: true, toneMapped: false });
    return { base, lid, bezel, screenGeo, key, well, pad, hinge, logoPlane, alu, bezelMat, keyMat, wellMat, padMat, logoMat };
  }, []);

  useEffect(
    () => () => {
      parts.logoMat.map?.dispose();
      Object.values(parts).forEach((p) => (p as THREE.BufferGeometry | THREE.Material).dispose());
    },
    [parts],
  );

  // keyboard layout: 6 rows, last row has a wide space bar
  const layout = useMemo(() => {
    const out: { x: number; z: number; sx: number }[] = [];
    const pitch = 0.2;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 13; c++) out.push({ x: (c - 6) * pitch, z: -0.78 + r * pitch, sx: 1 });
    }
    const z = -0.78 + 5 * pitch;
    [-6, -5, -4].forEach((c) => out.push({ x: c * pitch, z, sx: 1 }));
    out.push({ x: 0, z, sx: 5.9 });
    [4, 5, 6].forEach((c) => out.push({ x: c * pitch, z, sx: 1 }));
    return out;
  }, []);

  useLayoutEffect(() => {
    const m = keys.current;
    if (!m) return;
    const o = new THREE.Object3D();
    layout.forEach((k, i) => {
      o.position.set(k.x, LAPTOP.baseH / 2 + 0.01, k.z + 0.05);
      o.scale.set(k.sx, 1, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [layout]);

  return (
    <group ref={ref}>
      {/* base */}
      <mesh geometry={parts.base} material={parts.alu} />
      <mesh geometry={parts.well} material={parts.wellMat} position={[0, LAPTOP.baseH / 2 + 0.001, -0.33]} />
      <instancedMesh ref={keys} args={[parts.key, parts.keyMat, layout.length]} />
      <mesh geometry={parts.pad} material={parts.padMat} position={[0, LAPTOP.baseH / 2 + 0.002, 0.64]} />
      <mesh geometry={parts.hinge} material={parts.alu} position={[0, 0.02, -LAPTOP.baseD / 2 + 0.02]} />

      {/* lid pivots on the back edge; rotation.x = π/2 closed, ≈ -0.25 open */}
      <group ref={lidRef} position={[0, LAPTOP.baseH / 2, -LAPTOP.baseD / 2 + 0.03]}>
        {/* offset so the closed lid rests above the keys instead of intersecting the base */}
        <group position={[0, 0, -(LAPTOP.lidT / 2 + 0.024)]}>
          <mesh geometry={parts.lid} material={parts.alu} />
          <mesh geometry={parts.bezel} material={parts.bezelMat} position={[0, 0, LAPTOP.lidT / 2 + 0.0008]} />
          <mesh geometry={parts.screenGeo} material={screen} position={[0, LAPTOP.screenY, LAPTOP.lidT / 2 + 0.0018]} />
          <mesh
            geometry={parts.logoPlane}
            material={parts.logoMat}
            position={[0, LAPTOP.lidH / 2, -LAPTOP.lidT / 2 - 0.002]}
            rotation={[0, Math.PI, 0]}
          />
        </group>
      </group>
    </group>
  );
}
