'use client';

import { useEffect, useState } from 'react';

export const MatrixBackground = () => {
  const [matrixChars, setMatrixChars] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    duration: number;
    char: string;
  }>>([]);

  useEffect(() => {
    setMatrixChars(
      Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 4,
        char: Math.random() > 0.5 ? '1' : '0'
      }))
    );
  }, []);

  if (matrixChars.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-0">
      <div className="matrix-bg">
        {matrixChars.map((item) => (
          <div
            key={item.id}
            className="matrix-char"
            style={{
              left: `${item.left}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
            }}
          >
            {item.char}
          </div>
        ))}
      </div>
    </div>
  );
};