'use client';

import { motion, useInView, useMotionValue, useSpring, useTransform, type MotionValue, type SpringOptions } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const TILT_SPRING: SpringOptions = { damping: 30, stiffness: 120, mass: 2 };
const ROTATE_AMPLITUDE = 10;
const SCALE_ON_HOVER = 1.04;

// Gyroscope mapping (touch devices)
const GYRO_SENSITIVITY = 0.45; // deg of card tilt per deg of device tilt
const GYRO_CLAMP = 12; // max card rotation from gyro

type HeroImage = {
  src: string;
  width: number;
  height: number;
};

export type BlogCard = {
  id: string;
  title: string;
  description: string;
  pubDate: string; // ISO string, serialised by Astro
  hero: HeroImage | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

type CardProps = {
  card: BlogCard;
  index: number;
  selected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
  gyroX: MotionValue<number>;
  gyroY: MotionValue<number>;
};

function AnimatedBlogCard({ card, index, selected, onMouseEnter, onClick, gyroX, gyroY }: CardProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  // Re-fires every time the card enters/leaves the viewport (AnimatedList-style)
  const inView = useInView(ref, { amount: 0.5, once: false });

  // Desktop: rotation driven by this card's pointer position
  const mouseRX = useMotionValue(0);
  const mouseRY = useMotionValue(0);

  // Combined source = per-card mouse + shared device gyro. Only one is
  // ever non-zero on a given device, so summing is safe.
  const combinedRX = useTransform<number, number>([mouseRX, gyroX], ([m, g]) => m + g);
  const combinedRY = useTransform<number, number>([mouseRY, gyroY], ([m, g]) => m + g);

  const rotateX = useSpring(combinedRX, TILT_SPRING);
  const rotateY = useSpring(combinedRY, TILT_SPRING);

  // Reset pointer rotation when deselected
  useEffect(() => {
    if (!selected) {
      mouseRX.set(0);
      mouseRY.set(0);
    }
  }, [selected, mouseRX, mouseRY]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Touch devices use gyro; skip pointer math there
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    mouseRX.set((offsetY / (rect.height / 2)) * -ROTATE_AMPLITUDE);
    mouseRY.set((offsetX / (rect.width / 2)) * ROTATE_AMPLITUDE);
  };

  const handleMouseLeave = () => {
    mouseRX.set(0);
    mouseRY.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={`/blog/${card.id}/`}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.88, y: 24 }}
      animate={{
        opacity: inView ? 1 : 0,
        scale: inView ? (selected ? SCALE_ON_HOVER : 1) : 0.88,
        y: inView ? 0 : 24,
      }}
      transition={{
        opacity: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] },
        y: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
        scale: { type: 'spring', damping: 22, stiffness: 180, mass: 1 },
      }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={`blog-card${selected ? ' blog-card--selected' : ''}`}
    >
      {card.hero && (
        <div className="blog-card__media">
          <img
            src={card.hero.src}
            width={card.hero.width}
            height={card.hero.height}
            alt=""
            loading={index < 3 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      )}
      <div className="blog-card__body">
        <p className="blog-card__date">{formatDate(card.pubDate)}</p>
        <h2 className="blog-card__title">{card.title}</h2>
        <p className="blog-card__desc">{card.description}</p>
      </div>
      <span className="blog-card__arrow" aria-hidden="true">
        <ArrowIcon />
      </span>
    </motion.a>
  );
}

export default function BlogList({ cards }: { cards: BlogCard[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);

  // Shared gyroscope source for every card on touch devices.
  const gyroX = useMotionValue(0);
  const gyroY = useMotionValue(0);

  // Wire up device orientation (mobile) with iOS 13+ permission handshake.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: none)').matches) return;
    if (typeof DeviceOrientationEvent === 'undefined') return;

    let baselineBeta: number | null = null;
    let baselineGamma: number | null = null;
    let detach: (() => void) | null = null;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (baselineBeta == null || baselineGamma == null) {
        baselineBeta = e.beta;
        baselineGamma = e.gamma;
        return;
      }
      const dBeta = e.beta - baselineBeta;
      const dGamma = e.gamma - baselineGamma;
      const rx = Math.max(-GYRO_CLAMP, Math.min(GYRO_CLAMP, -dBeta * GYRO_SENSITIVITY));
      const ry = Math.max(-GYRO_CLAMP, Math.min(GYRO_CLAMP, dGamma * GYRO_SENSITIVITY));
      gyroX.set(rx);
      gyroY.set(ry);
    };

    const attach = () => {
      window.addEventListener('deviceorientation', handleOrientation);
      detach = () => window.removeEventListener('deviceorientation', handleOrientation);
    };

    const AnyDOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof AnyDOE.requestPermission === 'function') {
      // iOS 13+: permission must be requested from a user gesture
      const onGesture = () => {
        AnyDOE.requestPermission!()
          .then((state) => {
            if (state === 'granted') attach();
          })
          .catch(() => {});
      };
      window.addEventListener('touchstart', onGesture, { once: true });
      return () => {
        window.removeEventListener('touchstart', onGesture);
        detach?.();
      };
    }

    attach();
    return () => detach?.();
  }, [gyroX, gyroY]);

  const handleMouseEnter = useCallback((i: number) => setSelectedIndex(i), []);
  const handleCardClick = useCallback((i: number) => setSelectedIndex(i), []);

  // Keyboard navigation: up/down arrow to move, Enter to open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || active?.isContentEditable) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, cards.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => (prev <= 0 ? 0 : prev - 1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        const card = cards[selectedIndex];
        if (card) {
          e.preventDefault();
          window.location.assign(`/blog/${card.id}/`);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cards, selectedIndex]);

  // Scroll the keyboard-selected card into view
  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <ul ref={listRef} className="blog-grid">
      {cards.map((card, i) => (
        <li key={card.id} className="blog-card-wrap">
          <AnimatedBlogCard
            card={card}
            index={i}
            selected={selectedIndex === i}
            onMouseEnter={() => handleMouseEnter(i)}
            onClick={() => handleCardClick(i)}
            gyroX={gyroX}
            gyroY={gyroY}
          />
        </li>
      ))}
    </ul>
  );
}
