'use client';

import React from 'react';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  children,
  className = '',
}) => {
  return (
    <span className={`magic-gradient-text ${className}`.trim()}>{children}</span>
  );
};
