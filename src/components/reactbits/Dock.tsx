'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence
} from 'motion/react';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  wrapperClassName?: string;
  position?: 'bottom' | 'inline';
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  children,
  className = '',
  onClick,
  style,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
        borderRadius: '999px',
        background: 'rgba(12, 19, 31, 0.62)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
        color: '#ffffff',
        cursor: 'pointer',
        outline: 'none',
        ...style
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={className}
      tabIndex={0}
      role="button"
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {Children.map(children, child =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
          : child
      )}
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 10 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={className}
          role="tooltip"
          style={{
            x: '-50%',
            position: 'absolute',
            top: '100%',
            marginTop: 10,
            left: '50%',
            width: 'max-content',
            whiteSpace: 'pre',
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.14)',
            background: 'rgba(6, 12, 22, 0.9)',
            padding: '4px 8px',
            fontSize: 12,
            lineHeight: 1,
            color: '#ffffff',
            pointerEvents: 'none'
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type DockIconProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = '' }: DockIconProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = '',
  wrapperClassName = '',
  position = 'bottom',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 64,
  dockHeight = 256,
  baseItemSize = 50
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => Math.max(dockHeight, magnification + magnification / 2 + 4), [magnification]);
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{
        height,
        scrollbarWidth: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
        width: position === 'inline' ? 'max-content' : 'auto'
      }}
      className={wrapperClassName}
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={className}
        style={{
          height: panelHeight,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 16,
          width: 'max-content',
          maxWidth: '100%',
          padding: '0 8px 8px',
          position: position === 'bottom' ? 'absolute' : 'relative',
          left: position === 'bottom' ? '50%' : undefined,
          bottom: position === 'bottom' ? 8 : undefined,
          transform: position === 'bottom' ? 'translateX(-50%)' : undefined
        }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            style={item.style}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
