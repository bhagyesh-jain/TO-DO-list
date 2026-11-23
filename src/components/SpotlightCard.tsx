import React, { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  as?: 'section' | 'div';
  isDark?: boolean;
  spotlightColorDark?: string;
  spotlightColorLight?: string;
  borderGlowColorDark?: string;
  borderGlowColorLight?: string;
  enableHoverLift?: boolean;
  isDimmed?: boolean;
  onMouseEnterCard?: () => void;
  onMouseLeaveCard?: () => void;
}

/**
 * 70% Japanese Field Journal + 30% Tactile Braun Hardware Surface Card:
 * - Light Mode: Matte Washi Card (#FCFBF7), 1px Hairline Border (#E4DFD3), subtle paper shadow
 * - Dark Mode: Matte Sumi Card (#1E1D1A), 1px Hairline Border (#2C2A26), subtle hardware bevel highlight
 * - Warm paper/vermilion radial pointer illumination without neon/glassmorphism
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  ariaLabel,
  as = 'section',
  isDark = true,
  spotlightColorDark = 'rgba(236, 232, 223, 0.035)',
  spotlightColorLight = 'rgba(217, 74, 43, 0.04)',
  borderGlowColorDark = 'rgba(232, 93, 63, 0.28)',
  borderGlowColorLight = 'rgba(217, 74, 43, 0.24)',
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

  const activeSpotlight = isDark ? spotlightColorDark : spotlightColorLight;
  const activeBorderGlow = isDark ? borderGlowColorDark : borderGlowColorLight;

  const surfaceBackground = useMotionTemplate`radial-gradient(460px circle at ${mouseX}px ${mouseY}px, ${activeSpotlight}, transparent 75%)`;
  const borderBackground = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, ${activeBorderGlow}, transparent 80%)`;

  const Component = as === 'section' ? motion.section : motion.div;

  return (
    <Component
      ref={cardRef as React.RefObject<HTMLDivElement>}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        y: isHovered && enableHoverLift ? -1.5 : 0,
        opacity: isDimmed ? 0.68 : 1,
        scale: isDimmed ? 0.996 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className={`group/card relative rounded-xl border border-[#E4DFD3] dark:border-[#2C2A26] bg-[#FCFBF7] dark:bg-[#1E1D1A] shadow-[0_2px_6px_-2px_rgba(35,33,30,0.06),0_1px_0_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_4px_14px_-4px_rgba(0,0,0,0.55),0_1px_0_0_rgba(236,232,223,0.05)_inset] transition-colors duration-300 hover:border-[#D0C9B8] dark:hover:border-[#3D3A34] ${className}`}
    >
      {/* Cursor-Tracking Tactile Border Illumination */}
      <motion.div
        aria-hidden="true"
        style={{ background: borderBackground }}
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      />

      {/* Inner Matte Washi / Sumi Paper Surface Mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1px] rounded-[11px] bg-[#FCFBF7] dark:bg-[#1E1D1A] transition-colors duration-300"
      />

      {/* Subtle Warm Desk Lamp Radial Spotlight */}
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
 * Tactile Braun Hardware Key Button:
 * - Crisp spring press (whileTap={{ scale: 0.96 }}, whileHover={{ scale: 1.02 }}, stiffness 400, damping 25)
 * - Subtle magnetic cursor alignment
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  magneticStrength = 0.16,
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

  const springX = useSpring(rawX, { stiffness: 380, damping: 24, mass: 0.4 });
  const springY = useSpring(rawY, { stiffness: 380, damping: 24, mass: 0.4 });

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
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
        {children}
      </span>
    </motion.button>
  );
};
