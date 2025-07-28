import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const HackCubesLogo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 200, 
  height = 60 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stylized Cube */}
      <g transform="translate(10, 8)">
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
        {/* Inner lines for detail */}
        <line x1="14" y1="9" x2="14" y2="27" stroke="#00FF7F" strokeWidth="0.5" opacity="0.7" />
        <line x1="26" y1="9" x2="26" y2="27" stroke="#3BE8FF" strokeWidth="0.5" opacity="0.7" />
        <line x1="14" y1="15" x2="26" y2="15" stroke="#00FF7F" strokeWidth="0.5" opacity="0.5" />
      </g>
      
      {/* HackCubes Text */}
      <text
        x="55"
        y="25"
        fontFamily="JetBrains Mono, monospace"
        fontSize="16"
        fontWeight="700"
        fill="url(#textGradient)"
      >
        Hack
      </text>
      <text
        x="55"
        y="42"
        fontFamily="JetBrains Mono, monospace"
        fontSize="16"
        fontWeight="700"
        fill="url(#textGradient2)"
      >
        Cubes
      </text>
      
      {/* Binary decoration */}
      <text
        x="140"
        y="20"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill="#00FF7F"
        opacity="0.6"
      >
        01101000
      </text>
      <text
        x="140"
        y="30"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill="#3BE8FF"
        opacity="0.6"
      >
        01100001
      </text>
      <text
        x="140"
        y="40"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill="#00FF7F"
        opacity="0.6"
      >
        01100011
      </text>
      
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
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00FF7F" />
          <stop offset="100%" stopColor="#3BE8FF" />
        </linearGradient>
        <linearGradient id="textGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3BE8FF" />
          <stop offset="100%" stopColor="#00FF7F" />
        </linearGradient>
        
        {/* Glow filters */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};