import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export type ScrollRevealVariant = 'fade-up' | 'fade' | 'scale-subtle' | 'text';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: ScrollRevealVariant;
  delay?: number; // milliseconds
  duration?: number; // milliseconds
  threshold?: number;
  className?: string;
  as?: React.ElementType;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.1,
  className = '',
  as: Component = 'div',
}) => {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>({
    threshold,
    once: true,
  });

  const getVariantStyles = (): { initial: string; active: string } => {
    switch (variant) {
      case 'fade':
        return {
          initial: 'opacity-0',
          active: 'opacity-100',
        };
      case 'scale-subtle':
        return {
          initial: 'opacity-0 scale-[0.97] translate-y-2',
          active: 'opacity-100 scale-100 translate-y-0',
        };
      case 'text':
        return {
          initial: 'opacity-0 translate-y-3',
          active: 'opacity-100 translate-y-0',
        };
      case 'fade-up':
      default:
        return {
          initial: 'opacity-0 translate-y-5',
          active: 'opacity-100 translate-y-0',
        };
    }
  };

  const { initial, active } = getVariantStyles();

  return (
    <Component
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-all will-change-[opacity,transform] ${
        isVisible ? active : initial
      } ${className}`}
    >
      {children}
    </Component>
  );
};
