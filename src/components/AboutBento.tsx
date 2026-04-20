'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { motion, useMotionValue, useSpring, type SpringOptions } from 'motion/react';
import { useRef, useState } from 'react';
import type { Group } from 'three';

/* =========================================================
   About page — Bento grid of two cards:
   - Projects: R3F canvas with floating cubes, hover accelerates
   - Life: vertical photo marquee, hover on tile shows caption
   Both cards carry pointer-driven 3D tilt and viewport entrance.
   ========================================================= */

const TILT_SPRING: SpringOptions = { damping: 28, stiffness: 140, mass: 1.6 };
const ROTATE_AMPLITUDE = 8;

type LifePhoto = {
  src: string;
  caption: string;
};

type AboutBentoProps = {
  lifePhotos: LifePhoto[];
};

/* ---------- R3F scene ---------- */

function FloatingCubes({ accelerate }: { accelerate: boolean }) {
  const groupRef = useRef<Group>(null);

  const cubes = [
    { pos: [-1.6, 0.8, 0] as const, color: '#1a1a1a', size: 0.9 },
    { pos: [1.5, -0.4, -0.5] as const, color: '#ffb26b', size: 1.1 },
    { pos: [0.3, 1.1, -1.2] as const, color: '#d7d7d7', size: 0.7 },
    { pos: [-0.9, -1.0, 0.8] as const, color: '#ff8a5c', size: 0.6 },
    { pos: [1.9, 0.9, 0.6] as const, color: '#1a1a1a', size: 0.5 },
    { pos: [-2.0, -0.2, -1.0] as const, color: '#ffd7b0', size: 0.8 },
  ];

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const speed = accelerate ? 0.7 : 0.18;
    g.rotation.y += delta * speed;
    g.rotation.x += delta * speed * 0.35;
    // subtle bob
    g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });

  return (
    <group ref={groupRef}>
      {cubes.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={[i * 0.3, i * 0.5, 0]}>
          <boxGeometry args={[c.size, c.size, c.size]} />
          <meshStandardMaterial
            color={c.color}
            metalness={0.35}
            roughness={0.45}
          />
        </mesh>
      ))}
    </group>
  );
}

function ProjectsCanvas({ hovered }: { hovered: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <directionalLight position={[-3, -2, 3]} intensity={0.5} color="#ffb26b" />
      <FloatingCubes accelerate={hovered} />
    </Canvas>
  );
}

/* ---------- Tilt hook ---------- */

function useTilt() {
  const ref = useRef<HTMLAnchorElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, TILT_SPRING);
  const rotateY = useSpring(ry, TILT_SPRING);

  const onMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ox = e.clientX - rect.left - rect.width / 2;
    const oy = e.clientY - rect.top - rect.height / 2;
    rx.set((oy / (rect.height / 2)) * -ROTATE_AMPLITUDE);
    ry.set((ox / (rect.width / 2)) * ROTATE_AMPLITUDE);
  };

  const onMouseLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

/* ---------- Bento ---------- */

export default function AboutBento({ lifePhotos }: AboutBentoProps) {
  const [projectsHovered, setProjectsHovered] = useState(false);

  const projects = useTilt();
  const life = useTilt();

  // Duplicate photos so the vertical marquee loops seamlessly (translateY -50%).
  const marqueeItems = [...lifePhotos, ...lifePhotos];

  return (
    <section className="about-bento">
      {/* Projects */}
      <motion.a
        ref={projects.ref}
        href="/projects/"
        className="about-bento__card about-bento__card--projects"
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          opacity: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 },
          y:       { duration: 0.55, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 },
          scale:   { type: 'spring', damping: 22, stiffness: 180, mass: 1, delay: 0.05 },
        }}
        style={{
          rotateX: projects.rotateX,
          rotateY: projects.rotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={() => setProjectsHovered(true)}
        onMouseLeave={() => {
          setProjectsHovered(false);
          projects.onMouseLeave();
        }}
        onMouseMove={projects.onMouseMove}
      >
        <div className="about-bento__canvas-wrap">
          <ProjectsCanvas hovered={projectsHovered} />
        </div>

        <div className="about-bento__body">
          <p className="about-bento__eyebrow">PROJECTS</p>
          <h2 className="about-bento__title">Things I've built.</h2>
          <p className="about-bento__desc">
            A living shelf of experiments, tools and products — from tiny
            weekend hacks to longer-running products.
          </p>
          <span className="about-bento__arrow">ENTER →</span>
        </div>
      </motion.a>

      {/* Life */}
      <motion.a
        ref={life.ref}
        href="/life/"
        className="about-bento__card about-bento__card--life"
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          opacity: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: 0.18 },
          y:       { duration: 0.55, ease: [0.2, 0.8, 0.2, 1], delay: 0.18 },
          scale:   { type: 'spring', damping: 22, stiffness: 180, mass: 1, delay: 0.18 },
        }}
        style={{
          rotateX: life.rotateX,
          rotateY: life.rotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={life.onMouseMove}
        onMouseLeave={life.onMouseLeave}
      >
        <div className="life-marquee" aria-hidden="true">
          <div className="life-marquee__track">
            {marqueeItems.map((photo, i) => (
              <figure className="life-marquee__item" key={`${photo.src}-${i}`}>
                <img src={photo.src} alt="" loading="lazy" />
                <figcaption className="life-marquee__caption">{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>

        <div className="about-bento__body">
          <p className="about-bento__eyebrow">LIFE</p>
          <h2 className="about-bento__title">Through my lens.</h2>
          <p className="about-bento__desc">
            Photo journal — places, light, and small moments worth keeping.
          </p>
          <span className="about-bento__arrow">ENTER →</span>
        </div>
      </motion.a>
    </section>
  );
}
