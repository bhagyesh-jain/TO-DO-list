import React, { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  as?: 'section' | 'div';
  spotlightColor?: string;
  borderGlowColor?: string;
  enableHoverLift?: boolean;
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

/**
 * Linear / Raycast-inspired translucent surface card with:
 * - Cursor-tracking radial surface spotlight & 1px border illumination
 * - Top-edge specular highlight (border-white/10 + inset highlight)
 * - Subtle hover elevation (y: -2px) and sibling focus dimming support
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  ariaLabel,
  as = 'section',
  spotlightColor = 'rgba(99, 102, 241, 0.13)',
  borderGlowColor = 'rgba(165, 180, 252, 0.38)',
  enableHoverLift = true,
  isDimmed = false,
  onMouseEnterCard,
  onMouseLeaveCard,
}) => {
  const cardRef = useRef<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onMouseEnterCard?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onMouseLeaveCard?.();
  };

  const surfaceBackground = useMotionTemplate`radial-gradient(520px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 75%)`;
  const borderBackground = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, ${borderGlowColor}, transparent 80%)`;

  const Component = as === 'section' ? motion.section : motion.div;

  return (
    <Component
      ref={cardRef as React.RefObject<HTMLDivElement>}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        y: isHovered && enableHoverLift ? -2 : 0,
        opacity: isDimmed ? 0.62 : 1,
        scale: isDimmed ? 0.993 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`group/card relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-[0_12px_36px_-12px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.12)] transition-colors duration-200 hover:border-white/20 ${className}`}
    >
      {/* 1px Specular Top Edge Highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-75 transition-opacity duration-300 group-hover/card:opacity-100"
      />

      {/* Cursor-Tracking Radial Border Glow */}
      <motion.div
        aria-hidden="true"
        style={{ background: borderBackground }}
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      />

      {/* Inner Dark Mask to keep border crisp while showing radial surface spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1px] rounded-[11px] bg-zinc-950/40"
      />

      {/* Cursor-Tracking Surface Radial Spotlight */}
      <motion.div
        aria-hidden="true"
        style={{ background: surfaceBackground }}
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      />

      {/* Content Layer */}
      <div className="relative z-10">{children}</div>
    </Component>
  );
};

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  magneticStrength?: number;
  withShimmer?: boolean;
}

/**
 * Tactile Linear/Raycast button with:
 * - Spring press physics (whileTap={{ scale: 0.96 }}, whileHover={{ scale: 1.02 }}, stiffness 400, damping 25)
 * - Subtle magnetic cursor pull toward the pointer
 * - Optional animated light sweep / shimmer across primary CTAs on hover
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  magneticStrength = 0.22,
  withShimmer = false,
  onClick,
  type = 'button',
  title,
  disabled,
  'aria-label': ariaLabel,
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springX = useSpring(rawX, { stiffness: 360, damping: 22, mass: 0.4 });
  const springY = useSpring(rawY, { stiffness: 360, damping: 22, mass: 0.4 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current || disabled) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    rawX.set((e.clientX - centerX) * magneticStrength);
    rawY.set((e.clientY - centerY) * magneticStrength);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.button
      ref={btnRef}
      type={type}
      title={title}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group/btn relative overflow-hidden cursor-pointer ${className}`}
    >
      {withShimmer && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
        {children}
      </span>
    </motion.button>
  );
};
