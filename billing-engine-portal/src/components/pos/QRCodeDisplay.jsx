import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

export default function QRCodeDisplay({ data, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const qrSize = size;
    canvas.width = qrSize;
    canvas.height = qrSize;
    
    // Simple QR-like pattern generator (visual representation)
    // In production, use a proper QR library
    const moduleCount = 25;
    const moduleSize = qrSize / moduleCount;
    
    // Create deterministic pattern from data
    const hash = data.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, qrSize, qrSize);
    
    ctx.fillStyle = '#000000';
    
    // Position patterns (corners)
    const drawPositionPattern = (x, y) => {
      const s = moduleSize * 7;
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + moduleSize, y + moduleSize, s - moduleSize * 2, s - moduleSize * 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + moduleSize * 2, y + moduleSize * 2, s - moduleSize * 4, s - moduleSize * 4);
    };
    
    drawPositionPattern(0, 0);
    drawPositionPattern(qrSize - moduleSize * 7, 0);
    drawPositionPattern(0, qrSize - moduleSize * 7);
    
    // Data modules
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        // Skip position patterns
        if ((row < 8 && col < 8) || (row < 8 && col > moduleCount - 9) || (row > moduleCount - 9 && col < 8)) continue;
        
        const seed = (hash + row * moduleCount + col) % 100;
        if (seed < 45) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize - 1, moduleSize - 1);
        }
      }
    }
    
    // Add timing patterns
    ctx.fillStyle = '#000000';
    for (let i = 8; i < moduleCount - 8; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize);
        ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize, moduleSize);
      }
    }
  }, [data, size]);

  return (
    <div className="flex justify-center">
      <canvas 
        ref={canvasRef} 
        className="rounded-lg border-4 border-white shadow-lg"
        style={{ width: size, height: size }}
      />
    </div>
  );
}