"use client";

import { useEffect, useMemo, type Ref } from "react";
import * as THREE from "three";
import { roundedRectShape, roundedSlab } from "./screen";

/** Screen aspect matches the 540×1200 phone recordings (0.45). */
export const PHONE = { w: 0.76, h: 1.64, d: 0.086, radius: 0.118, screenW: 0.7, screenH: 1.556, screenRadius: 0.09 };

export function Phone({ screen, ref }: { screen: THREE.ShaderMaterial; ref?: Ref<THREE.Group> }) {
  const parts = useMemo(() => {
    const body = roundedSlab(PHONE.w, PHONE.h, PHONE.d, PHONE.radius, 0.016);
    const glass = new THREE.ShapeGeometry(roundedRectShape(PHONE.w - 0.028, PHONE.h - 0.028, PHONE.radius - 0.012), 24);
    const screenGeo = new THREE.PlaneGeometry(PHONE.screenW, PHONE.screenH);
    const bump = roundedSlab(0.33, 0.33, 0.026, 0.085, 0.008);
    const lens = new THREE.CylinderGeometry(0.052, 0.056, 0.03, 40);
    const lensGlass = new THREE.CircleGeometry(0.036, 32);
    const button = roundedSlab(0.012, 0.16, 0.03, 0.005, 0.003);
    const logo = new THREE.CircleGeometry(0.05, 32);

    const frameMat = new THREE.MeshPhysicalMaterial({
      color: "#2a2e37",
      metalness: 1,
      roughness: 0.26,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: "#020203", metalness: 0.1, roughness: 0.04, clearcoat: 1 });
    const backMat = new THREE.MeshPhysicalMaterial({ color: "#1b1e25", metalness: 0.55, roughness: 0.42, clearcoat: 0.4 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: "#0c0e13", metalness: 0.9, roughness: 0.2 });
    const lensGlassMat = new THREE.MeshPhysicalMaterial({ color: "#0a1633", metalness: 0.4, roughness: 0.02, clearcoat: 1, emissive: "#0b1a44", emissiveIntensity: 0.6 });
    const logoMat = new THREE.MeshBasicMaterial({ color: "#3b7bff", transparent: true, opacity: 0.8 });
    return { body, glass, screenGeo, bump, lens, lensGlass, button, logo, frameMat, glassMat, backMat, lensMat, lensGlassMat, logoMat };
  }, []);

  useEffect(
    () => () => {
      Object.values(parts).forEach((p) => (p as THREE.BufferGeometry | THREE.Material).dispose());
    },
    [parts],
  );

  const zFront = PHONE.d / 2;

  return (
    <group ref={ref}>
      <mesh geometry={parts.body} material={parts.frameMat} />
      {/* front glass + screen */}
      <mesh geometry={parts.glass} material={parts.glassMat} position={[0, 0, zFront + 0.0008]} />
      <mesh geometry={parts.screenGeo} material={screen} position={[0, 0, zFront + 0.0018]} />
      {/* back plate */}
      <mesh geometry={parts.glass} material={parts.backMat} position={[0, 0, -zFront - 0.0008]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={parts.logo} material={parts.logoMat} position={[0, 0.05, -zFront - 0.002]} rotation={[0, Math.PI, 0]} />
      {/* camera module */}
      <group position={[0.17, 0.58, -zFront - 0.012]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={parts.bump} material={parts.backMat} />
        {[
          [-0.07, 0.07],
          [0.07, 0.0],
          [-0.07, -0.07],
        ].map(([x, y], i) => (
          <group key={i} position={[x!, y!, 0.02]}>
            <mesh geometry={parts.lens} material={parts.lensMat} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={parts.lensGlass} material={parts.lensGlassMat} position={[0, 0, 0.0155]} />
          </group>
        ))}
      </group>
      {/* side buttons */}
      <mesh geometry={parts.button} material={parts.frameMat} position={[PHONE.w / 2 + 0.004, 0.28, 0]} />
      <mesh geometry={parts.button} material={parts.frameMat} position={[-PHONE.w / 2 - 0.004, 0.4, 0]} scale={[1, 0.55, 1]} />
      <mesh geometry={parts.button} material={parts.frameMat} position={[-PHONE.w / 2 - 0.004, 0.18, 0]} />
    </group>
  );
}
