import React from 'react';

interface FaviconProps {
  size?: number;
}

export const HackCubesFavicon: React.FC<FaviconProps> = ({ size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylized Cube - centered and scaled for favicon */}
      <g transform="translate(4, 4) scale(1)">
        {/* Top face */}
        <path
          d="M8 12 L20 6 L32 12 L20 18 Z"
          fill="url(#cubeGradient1)"
          stroke="#00FF7F"
          strokeWidth="1"
        />
        {/* Left face */}
        <path
          d="M8 12 L8 30 L20 36 L20 18 Z"
          fill="url(#cubeGradient2)"
          stroke="#00FF7F"
          strokeWidth="1"
        />
        {/* Right face */}
        <path
          d="M20 18 L20 36 L32 30 L32 12 Z"
          fill="url(#cubeGradient3)"
          stroke="#3BE8FF"
          strokeWidth="1"
        />
      </g>
      
      {/* Gradients */}
      <defs>
        <linearGradient id="cubeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FF7F" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3BE8FF" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="cubeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FF7F" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1A1D23" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="cubeGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3BE8FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1A1D23" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
};
