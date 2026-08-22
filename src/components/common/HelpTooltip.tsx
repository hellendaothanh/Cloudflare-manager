'use client';

import React, { useState } from 'react';
import { HelpCircle, Info, Sparkles } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2.5';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2.5';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2.5';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2.5';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent border-[5px]';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent border-[5px]';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent border-[5px]';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent border-[5px]';
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center align-middle group ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <button
        type="button"
        aria-label="Help & Explanation"
        className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-850/80 hover:bg-cyan-950/60 border border-gray-700/60 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-300 focus:outline-none transition-all duration-200 cursor-help shadow-xs hover:shadow-cyan-500/20 hover:scale-105"
      >
        <span className="text-[11px] font-bold font-sans select-none leading-none opacity-90">?</span>
      </button>

      {isVisible && (
        <div 
          className={`absolute z-50 w-64 md:w-76 p-3.5 rounded-2xl bg-gradient-to-b from-gray-900/98 to-gray-950/98 backdrop-blur-xl border border-cyan-500/30 text-gray-200 text-xs leading-relaxed shadow-2xl shadow-black/90 pointer-events-none transition-all duration-200 animate-in fade-in-0 zoom-in-95 ${getPositionClasses()}`}
        >
          {/* Subtle Glow & Pointer Arrow */}
          <div className={`absolute w-0 h-0 pointer-events-none ${getArrowClasses()}`} />

          {title && (
            <div className="font-bold text-cyan-300 mb-1.5 flex items-center gap-1.5 border-b border-gray-800/80 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              <span className="text-[12px] tracking-tight text-white font-semibold truncate">{title}</span>
            </div>
          )}
          <div className="text-gray-300 font-normal text-[11px] leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
