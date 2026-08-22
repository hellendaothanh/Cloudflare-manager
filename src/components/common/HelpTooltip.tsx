'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

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
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <button
        type="button"
        aria-label="Help & Explanation"
        className="text-gray-400 hover:text-cyan-400 focus:text-cyan-400 focus:outline-none transition-colors cursor-help p-0.5"
      >
        <HelpCircle className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
      </button>

      {isVisible && (
        <div 
          className={`absolute z-50 w-64 md:w-72 p-3 rounded-xl bg-gray-950/95 backdrop-blur-md border border-cyan-500/30 text-gray-200 text-[11px] leading-relaxed shadow-2xl shadow-black/80 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 ${getPositionClasses()}`}
        >
          {title && (
            <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5 border-b border-gray-800 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{title}</span>
            </div>
          )}
          <div className="text-gray-300 font-normal">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
