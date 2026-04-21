'use client';

import { useEffect, useRef } from 'react';
import ScrollStack, { ScrollStackItem } from './reactbits/ScrollStack';

/** URL-encoded because the file names contain Chinese + a middot.
    Both sources are scrub-optimised variants produced by ffmpeg:
    - re-encoded with keyint=1 so every frame is an I-frame -> seeks
      are near-instant and never stall between GOP boundaries
    - audio track stripped (not needed for scroll-driven playback)
    - H.264 baseline/high profile -> broad browser support
      (the original `敲·代码.mp4` was HEVC which Firefox can't decode) */
const PROJECTS_VIDEO_SRC = '/vido/%E6%95%B2%C2%B7%E4%BB%A3%E7%A0%81-scrub.mp4';
const LIFE_VIDEO_SRC = '/vido/%E6%8B%8D%E7%85%A7-scrub.mp4';

/* =========================================================
   About page — three-card ScrollStack, pinned via window scroll.
   Order is Projects -> Life -> Posts, i.e. build -> live -> think.
   Each card is the same glass surface; the ambient glow colour
   is what tells them apart:
   - warm orange (projects) — top-left
   - cool blue    (life)     — top-right
   - dusk purple  (posts)    — bottom-centre
   Projects and Life each host their own scroll-scrubbed video
   on the right side; Posts is text-only.
   ========================================================= */

export default function AboutStack() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const projectsVideoRef = useRef<HTMLVideoElement>(null);
  const lifeVideoRef = useRef<HTMLVideoElement>(null);

  /* Scroll-scrub every video on the stack.
     Each video is paired with its own card element and its progress
     is measured against that card's on-screen life: 0 when the card
     top reaches the viewport bottom, 1 when the card bottom passes
     the viewport top. This prevents later cards (Life) from already
     being near the end of playback by the time they first appear.
     `offsetTop` is used instead of getBoundingClientRect because
     ScrollStack pins cards via CSS transform and getBoundingClientRect
     would freeze during the pin window, stalling the scrub. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    type Pair = { video: HTMLVideoElement; card: HTMLElement };
    const pairs: Pair[] = [];
    for (const v of [projectsVideoRef.current, lifeVideoRef.current]) {
      if (!v) continue;
      const card = v.closest('.about-stack-card') as HTMLElement | null;
      if (card) pairs.push({ video: v, card });
    }
    if (pairs.length === 0) return;

    // Sum of offsetTop up the offsetParent chain -> document-relative Y.
    // Unaffected by CSS transforms, so it remains stable while the card
    // is pinned/translated by ScrollStack.
    const getDocTop = (el: HTMLElement): number => {
      let top = 0;
      let cur: HTMLElement | null = el;
      while (cur) {
        top += cur.offsetTop;
        cur = cur.offsetParent as HTMLElement | null;
      }
      return top;
    };

    let rafId: number | null = null;
    const targets = new WeakMap<HTMLVideoElement, number>();

    const recompute = () => {
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      for (const { video, card } of pairs) {
        const cardTop = getDocTop(card);
        const cardHeight = card.offsetHeight;
        const span = vh + cardHeight;
        if (span <= 0) continue;
        const p = Math.max(0, Math.min(1, (scrollY + vh - cardTop) / span));
        const d = Number.isFinite(video.duration) ? video.duration : 0;
        if (d > 0) targets.set(video, p * d);
      }
    };

    const trySeek = (v: HTMLVideoElement) => {
      if (v.seeking) return;
      const t = targets.get(v);
      if (t == null) return;
      if (Math.abs(v.currentTime - t) > 0.02) v.currentTime = t;
    };

    const trySeekAll = () => {
      for (const { video } of pairs) trySeek(video);
    };

    const onScroll = () => {
      recompute();
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        trySeekAll();
      });
    };

    const seekedHandlers = pairs.map(({ video }) => {
      const h = () => trySeek(video);
      video.addEventListener('seeked', h);
      return [video, h] as const;
    });

    const startHandlers = pairs.map(({ video }) => {
      const h = () => {
        // iOS Safari and some Android Chrome builds refuse to paint a
        // video frame until play() has been called at least once.
        // With scroll-scrubbed playback we never otherwise call play,
        // so the <video> shows the "tap to play" placeholder instead
        // of the current frame. Kick it once and immediately pause
        // — `muted` + `playsInline` makes this autoplay-policy-safe.
        const unlock = video.play();
        if (unlock && typeof unlock.then === 'function') {
          unlock.then(() => video.pause()).catch(() => {});
        } else {
          video.pause();
        }
        recompute();
        trySeek(video);
      };
      if (video.readyState >= 1) h();
      else video.addEventListener('loadedmetadata', h, { once: true });
      return [video, h] as const;
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      for (const [v, h] of seekedHandlers) v.removeEventListener('seeked', h);
      for (const [v, h] of startHandlers) v.removeEventListener('loadedmetadata', h);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="about-stack-wrap" ref={wrapRef}>
      <ScrollStack
        useWindowScroll
        baseScale={0.82}
        itemScale={0.06}
        itemStackDistance={56}
        itemDistance={120}
        stackPosition="20%"
        scaleEndPosition="10%"
      >
        <ScrollStackItem itemClassName="about-stack-card about-stack-card--projects">
          <a href="/projects/" className="about-stack-link" aria-label="Open projects">
            <span className="about-stack-glow" aria-hidden="true" />
            <div className="about-stack-content">
              <p className="about-stack-eyebrow">PROJECTS</p>
              <h2 className="about-stack-title">LAB</h2>
              <p className="about-stack-desc">
                Experiments, hackathon MVPs, and endless explorations.
              </p>
              <span className="about-stack-cta">ENTER →</span>
            </div>
            <video
              ref={projectsVideoRef}
              className="about-stack-media"
              src={PROJECTS_VIDEO_SRC}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />
          </a>
        </ScrollStackItem>

        <ScrollStackItem itemClassName="about-stack-card about-stack-card--life">
          <a href="/life/" className="about-stack-link" aria-label="Open life">
            <span className="about-stack-glow" aria-hidden="true" />
            <div className="about-stack-content">
              <p className="about-stack-eyebrow">LIFE</p>
              <h2 className="about-stack-title">PATH</h2>
              <p className="about-stack-desc">
                Offline adventures, chasing light, and finding inspiration
                outside the screen.
              </p>
              <span className="about-stack-cta">ENTER →</span>
            </div>
            <video
              ref={lifeVideoRef}
              className="about-stack-media"
              src={LIFE_VIDEO_SRC}
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />
          </a>
        </ScrollStackItem>

        <ScrollStackItem itemClassName="about-stack-card about-stack-card--posts">
          <a href="/blog/" className="about-stack-link" aria-label="Open posts">
            <span className="about-stack-glow" aria-hidden="true" />
            <div className="about-stack-content">
              <p className="about-stack-eyebrow">POSTS</p>
              <h2 className="about-stack-title">Writing things down.</h2>
              <p className="about-stack-desc">
                Notes on design, web experiments, and the occasional long-form
                essay when a thought is worth stating in full.
              </p>
              <span className="about-stack-cta">ENTER →</span>
            </div>
          </a>
        </ScrollStackItem>
      </ScrollStack>
    </div>
  );
}
