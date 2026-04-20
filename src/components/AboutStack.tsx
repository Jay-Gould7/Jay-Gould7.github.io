'use client';

import ScrollStack, { ScrollStackItem } from './reactbits/ScrollStack';

/* =========================================================
   About page — three-card ScrollStack, pinned via window scroll.
   Order is Projects -> Posts -> Life, i.e. build -> think -> live.
   Each card is the same glass surface; the ambient glow colour
   is what tells them apart:
   - warm orange (projects) — top-left
   - cool blue    (life)     — top-right
   - dusk purple  (posts)    — bottom-centre
   The inner <a> absorbs clicks across the full card surface.
   ========================================================= */

export default function AboutStack() {
  return (
    <div className="about-stack-wrap">
      <ScrollStack
        useWindowScroll
        baseScale={0.82}
        itemScale={0.06}
        itemStackDistance={40}
        itemDistance={120}
        stackPosition="20%"
        scaleEndPosition="10%"
      >
        <ScrollStackItem itemClassName="about-stack-card about-stack-card--projects">
          <a href="/projects/" className="about-stack-link" aria-label="Open projects">
            <span className="about-stack-glow" aria-hidden="true" />
            <div className="about-stack-content">
              <p className="about-stack-eyebrow">PROJECTS</p>
              <h2 className="about-stack-title">Things I've built.</h2>
              <p className="about-stack-desc">
                A living shelf of experiments, tools and products — from tiny
                weekend hacks to longer-running products.
              </p>
              <span className="about-stack-cta">ENTER →</span>
            </div>
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

        <ScrollStackItem itemClassName="about-stack-card about-stack-card--life">
          <a href="/life/" className="about-stack-link" aria-label="Open life">
            <span className="about-stack-glow" aria-hidden="true" />
            <div className="about-stack-content">
              <p className="about-stack-eyebrow">LIFE</p>
              <h2 className="about-stack-title">Through my lens.</h2>
              <p className="about-stack-desc">
                Photo journal — places, light, and small moments worth keeping,
                each with a short note on where and why.
              </p>
              <span className="about-stack-cta">ENTER →</span>
            </div>
          </a>
        </ScrollStackItem>
      </ScrollStack>
    </div>
  );
}
