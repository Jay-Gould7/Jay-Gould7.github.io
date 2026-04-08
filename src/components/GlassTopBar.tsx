'use client';

import { type ReactNode, useMemo, useState } from 'react';

import Dock, { type DockItemData } from './reactbits/Dock';
import GlassSurface from './reactbits/GlassSurface';

type NavButton = {
  href: string;
  label: string;
  icon: ReactNode;
};

function NavGlassButton({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <GlassSurface
      width="100%"
      height="100%"
      borderRadius={999}
      borderWidth={0.08}
      displace={0.5}
      distortionScale={-180}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
      brightness={active ? 58 : 50}
      opacity={active ? 0.97 : 0.93}
      blur={12}
      backgroundOpacity={active ? 0.18 : 0.1}
      saturation={1.25}
      mixBlendMode="screen"
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
          color: '#ffffff',
          background: active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
          boxShadow: active
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 12px 22px rgba(15, 23, 42, 0.14)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 18px rgba(15, 23, 42, 0.1)',
        }}
      >
        {children}
      </span>
    </GlassSurface>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 9.75V21h10.5V9.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4.5h9.75A2.25 2.25 0 0 1 18 6.75V19.5H8.25A2.25 2.25 0 0 0 6 21.75V4.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 4.5v15" strokeLinecap="round" />
      <path d="M10 9h4.5" strokeLinecap="round" />
      <path d="M10 12.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5c1.5-3 4-4.5 6.5-4.5s5 1.5 6.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

const NAV_BUTTONS: NavButton[] = [
  { href: '/', label: 'Home', icon: <HomeIcon /> },
  { href: '/blog', label: 'Blog', icon: <BlogIcon /> },
  { href: '/about', label: 'About', icon: <AboutIcon /> },
];

function isActivePath(currentPath: string, href: string) {
  if (href === '/') {
    return currentPath === '/';
  }

  return currentPath.startsWith(href);
}

export default function GlassTopBar() {
  const [currentPath] = useState(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname,
  );

  const items = useMemo<DockItemData[]>(
    () =>
      NAV_BUTTONS.map((item) => {
        const active = isActivePath(currentPath, item.href);

        return {
          icon: <NavGlassButton active={active}>{item.icon}</NavGlassButton>,
          label: item.label,
          onClick: () => {
            if (window.location.pathname !== item.href) {
              window.location.assign(item.href);
            }
          },
          style: {
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            color: '#ffffff',
          },
        };
      }),
    [currentPath],
  );

  return (
    <nav className="hero-spline__topbar" aria-label="Primary navigation">
      <div className="hero-spline__topbar-shell">
        <Dock
          items={items}
          position="inline"
          wrapperClassName="hero-spline__topbar-dock-wrapper"
          className="hero-spline__topbar-dock"
          panelHeight={64}
          dockHeight={92}
          baseItemSize={50}
          magnification={70}
          distance={140}
          spring={{ mass: 0.16, stiffness: 180, damping: 16 }}
        />
      </div>
    </nav>
  );
}
