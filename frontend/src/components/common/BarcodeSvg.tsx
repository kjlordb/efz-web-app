import React from 'react';

interface BarcodeSvgProps {
  value: string | number;
  height?: number;
  className?: string;
  showText?: boolean;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  height = 36,
  className = '',
  showText = true
}) => {
  const str = String(value);

  // Generate deterministic pseudo-code bar pattern from string
  const getBars = (input: string) => {
    const bars: { width: number; isSpace: boolean }[] = [];
    // Start guard bars
    bars.push({ width: 2, isSpace: false });
    bars.push({ width: 1, isSpace: true });
    bars.push({ width: 2, isSpace: false });
    bars.push({ width: 1, isSpace: true });

    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      const w1 = ((code * 3) % 3) + 1;
      const s1 = ((code * 5) % 2) + 1;
      const w2 = ((code * 7) % 3) + 1;
      const s2 = ((code * 11) % 2) + 1;

      bars.push({ width: w1, isSpace: false });
      bars.push({ width: s1, isSpace: true });
      bars.push({ width: w2, isSpace: false });
      bars.push({ width: s2, isSpace: true });
    }

    // Stop guard bars
    bars.push({ width: 2, isSpace: false });
    bars.push({ width: 1, isSpace: true });
    bars.push({ width: 3, isSpace: false });

    return bars;
  };

  const bars = getBars(str);
  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={totalWidth * 1.5}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        className="shape-rendering-crispEdges"
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (bar.isSpace) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width}
              height={height}
              fill="#0f172a"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[9px] tracking-widest text-slate-700 uppercase mt-0.5 select-none">
          *{str}*
        </span>
      )}
    </div>
  );
};
