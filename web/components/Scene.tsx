"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Color, Mesh, MeshStandardMaterial, Quaternion, Vector3, type Object3D } from "three";
import { motionFor, type Interaction, type Motion } from "@/lib/interactions";
import motor from "@/content/motor-inline4.parts.json";
import tezgah from "@/content/tezgah.parts.json";
import atolye from "@/content/atolye.parts.json";
import kabin from "@/content/kabin.parts.json";
import elektrik from "@/content/elektrik.parts.json";
import lastik from "@/content/lastik.parts.json";
import direksiyon from "@/content/direksiyon.parts.json";
import aksesuar from "@/content/aksesuar.parts.json";
import kaporta from "@/content/kaporta.parts.json";

/**
 * Bir varlık: sahne GLB'sindeki bir mesh ya da yanına yüklenen hazır bir glTF.
 * `at` varlığın TABAN MERKEZİNİN gideceği nokta; yüksekliği çalışma anında
 * Box3 ile ölçülür, çünkü indirilen modellerin kendi orijinleri tutarsız.
 */
type Prop = {
  file: string;
  at: [number, number, number];
  /** Radyan. rotateX çoğu el aletini yatırmak için gerekir: dik modellenmişler. */
  rotateX?: number;
  rotateY?: number;
  scale?: number;
  credit?: string;
};

type Manifest = {
  model: string;
  file: string;
  license: { author: string; license: string; url: string };
  parts: Record<string, string>;
  props?: Record<string, Prop>;
};

const MANIFESTS = [motor, tezgah, atolye, kabin, elektrik, lastik, direksiyon, aksesuar, kaporta] as Manifest[];

/** part.* -> hangi modelin hangi mesh'i ya da hangi hazır varlığı. Sözleşme parts.json'dadır. */
const OWNER = new Map<string, { manifest: Manifest; mesh?: string; prop?: Prop }>();
for (const manifest of MANIFESTS) {
  for (const [part, mesh] of Object.entries(manifest.parts)) OWNER.set(part, { manifest, mesh });
  for (const [part, prop] of Object.entries(manifest.props ?? {})) OWNER.set(part, { manifest, prop });
}

const UP = new Vector3(0, 1, 0);
const HIGHLIGHT = new Color("#f59e0b");

const EKSEN: Record<Motion["axis"], Vector3> = {
  x: new Vector3(1, 0, 0),
  y: UP,
  z: new Vector3(0, 0, 1),
};

/**
 * Hedef mesh: vurgulanır ve tur sayısına göre kendi ekseninde döner + geri çıkar.
 * Dönüş yerel eksende uygulanır (baseQuat * spin), çünkü yatay cıvatalar düğüm
 * quaternion'ıyla yatırılmıştır; global Y'de döndürmek onları eğerdi.
 */
function useTargetTransform(node: Object3D | undefined, hareket: Motion | null, vurgula: boolean) {
  const base = useRef<{ pos: Vector3; quat: Quaternion }>(null);

  useEffect(() => {
    if (!node) return;
    const rest = { pos: node.position.clone(), quat: node.quaternion.clone() };
    base.current = rest;
    // Vurgu yalnizca hedefe uygulanir. Hazir varlik (dekor) kokunu de
    // vurgulamak butun aracin turuncu yanmasina yol aciyordu: emissive
    // gerceklik neyse onun uzerine binip dokuyu tamamen yutuyor.
    if (!vurgula) return;

    // Hedef tek bir mesh olabilir (kod ile üretilen sahne) ya da birden çok
    // mesh'ten oluşan bir grup (indirilen hazır varlık); ikisinde de aynı vurgu.
    const geri: Array<[Mesh, MeshStandardMaterial]> = [];
    node.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const original = o.material as MeshStandardMaterial;
      const lit = original.clone();
      lit.emissive = HIGHLIGHT;
      lit.emissiveIntensity = 0.6;
      o.material = lit;
      geri.push([o, original]);
    });

    return () => {
      node.position.copy(rest.pos);
      node.quaternion.copy(rest.quat);
      for (const [o, original] of geri) {
        (o.material as MeshStandardMaterial).dispose();
        o.material = original;
      }
    };
  }, [node, vurgula]);

  const tur = hareket?.turns ?? 0;
  const kayma = hareket?.slide ?? 0;
  const eksenAdi = hareket?.axis ?? "y";

  useEffect(() => {
    if (!node || !base.current) return;
    const { pos, quat } = base.current;
    node.quaternion.copy(quat).multiply(new Quaternion().setFromAxisAngle(UP, tur * Math.PI * 2));
    node.position.copy(pos).addScaledVector(EKSEN[eksenAdi].clone().applyQuaternion(quat), kayma);
  }, [node, tur, kayma, eksenAdi]);
}

function Model({ url, mesh, hareket }: { url: string; mesh?: string; hareket: Motion | null }) {
  const { scene } = useGLTF(url);
  // Klon: useGLTF sahneyi önbellekte paylaşır, hedefi doğrudan oynatmak diğer
  // sahneleri de bozardı.
  const root = useMemo(() => scene.clone(true), [scene]);
  const node = useMemo(() => (mesh ? root.getObjectByName(mesh) : undefined), [root, mesh]);

  useTargetTransform(node, hareket, true);

  return <primitive object={root} />;
}

/** Hazır varlık: taban merkezi `at` noktasına oturtulur, hedefse hareketi alır. */
function PropModel({ prop, hareket, hedef }: { prop: Prop; hareket: Motion | null; hedef: boolean }) {
  const { scene } = useGLTF(prop.file);
  const { at, rotateX = 0, rotateY = 0, scale = 1 } = prop;

  const root = useMemo(() => {
    const clone = scene.clone(true);
    clone.scale.setScalar(scale);
    clone.rotation.set(rotateX, rotateY, 0);
    clone.updateMatrixWorld(true);

    const kutu = new Box3().setFromObject(clone);
    const merkez = kutu.getCenter(new Vector3());
    clone.position.set(at[0] - merkez.x, at[1] - kutu.min.y, at[2] - merkez.z);
    return clone;
  }, [scene, at, rotateX, rotateY, scale]);

  useTargetTransform(root, hareket, hedef);

  return <primitive object={root} />;
}

function Placeholder() {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.66, 0.42, 0.4]} />
      <meshStandardMaterial color="#4a5568" metalness={0.7} roughness={0.45} />
    </mesh>
  );
}

class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <Placeholder /> : this.props.children;
  }
}

export default function Scene({
  bench,
  interaction,
  amount,
}: {
  bench: boolean;
  interaction?: Interaction;
  amount: number;
}) {
  const target = interaction?.target;
  const hareket = motionFor(interaction, amount);
  const owner = target ? OWNER.get(target) : undefined;
  const manifest = owner?.manifest ?? ((bench ? tezgah : motor) as Manifest);
  const { file, license } = manifest;
  const props = Object.entries(manifest.props ?? {});

  // Kod ile üretilen sahnenin ve indirilen varlıkların atıfları birlikte gösterilir.
  const krediler = [...new Set([
    license.author ? `${license.author} — ${license.license}` : "",
    ...props.map(([, p]) => p.credit ?? ""),
  ])].filter(Boolean);

  return (
    <div className="relative h-full w-full touch-none">
      <Canvas shadows camera={{ position: [1.6, 1.3, 1.9], fov: 45 }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 8, 5]} intensity={1.6} castShadow />

        <Bounds fit clip observe margin={1.35}>
          <ModelBoundary key={file}>
            <Suspense fallback={<Placeholder />}>
              {file ? <Model url={file} mesh={owner?.mesh} hareket={hareket} /> : <Placeholder />}
              {props.map(([id, prop]) => (
                <PropModel key={id} prop={prop} hareket={id === target ? hareket : null} hedef={id === target} />
              ))}
            </Suspense>
          </ModelBoundary>
        </Bounds>

        <Environment preset="warehouse" />
        <OrbitControls enableDamping makeDefault />
      </Canvas>

      {!file && (
        <p className="pointer-events-none absolute left-3 top-3 text-xs text-zinc-500">
          Yer tutucu — {manifest.model} modeli henüz yüklenmedi
        </p>
      )}

      {target && !owner && (
        <p className="pointer-events-none absolute left-3 top-3 text-xs text-amber-500/80">
          {target} hiçbir modelde eşli değil
        </p>
      )}

      {krediler.length > 0 && (
        <span className="absolute bottom-0 right-0 max-w-[60%] p-3 text-right text-[11px] leading-snug text-zinc-500">
          Model: {krediler.join(" · ")}
        </span>
      )}
    </div>
  );
}
