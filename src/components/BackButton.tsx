import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export interface BackButtonProps {
  label?: string;
  className?: string;
  variant?: 'default' | 'secondary';
  onClick?: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  className = '',
  variant = 'default',
  onClick,
}) => {
  const { goBack } = useNavigation();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      goBack();
    }
  };

  const isSecondary = variant === 'secondary';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all duration-300 ease-out select-none active:scale-[0.97] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#BE185D]/40 ${
        isSecondary
          ? 'bg-transparent text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-300 hover:bg-stone-50/60 hover:-translate-y-0.5'
          : 'bg-[#FFF5F7]/90 hover:bg-[#FFF0F4] text-[#381B24] hover:text-[#BE185D] border border-[#F5D5DF] hover:border-[#E8A5B8] shadow-2xs hover:shadow-xs hover:shadow-[#F9CAD5]/40 hover:-translate-y-0.5'
      } ${className}`}
    >
      <ArrowLeft
        className="w-3.5 h-3.5 text-current transition-transform duration-300 ease-out group-hover:-translate-x-1"
        strokeWidth={2}
      />
      <span className="tracking-wide">{label}</span>
    </button>
  );
};
