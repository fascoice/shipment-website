import React, { useEffect, useRef } from 'react';

export const LiveWallpaper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Global Key Shipping Nodes (Normalized 0..1 coordinates)
    const nodes = [
      { name: 'London', x: 0.48, y: 0.28 },
      { name: 'Sofia (HQ)', x: 0.54, y: 0.34 },
      { name: 'Frankfurt', x: 0.51, y: 0.30 },
      { name: 'New York', x: 0.26, y: 0.35 },
      { name: 'Houston', x: 0.22, y: 0.44 },
      { name: 'Dubai', x: 0.63, y: 0.42 },
      { name: 'Tokyo', x: 0.85, y: 0.36 },
      { name: 'Singapore', x: 0.77, y: 0.56 },
      { name: 'Sydney', x: 0.88, y: 0.78 },
      { name: 'Sao Paulo', x: 0.34, y: 0.72 },
    ];

    // Flight paths connecting nodes
    const paths = [
      { from: 1, to: 0 }, // Sofia to London
      { from: 1, to: 2 }, // Sofia to Frankfurt
      { from: 1, to: 5 }, // Sofia to Dubai
      { from: 0, to: 3 }, // London to New York
      { from: 3, to: 4 }, // New York to Houston
      { from: 5, to: 7 }, // Dubai to Singapore
      { from: 7, to: 6 }, // Singapore to Tokyo
      { from: 3, to: 9 }, // New York to Sao Paulo
      { from: 7, to: 8 }, // Singapore to Sydney
      { from: 4, to: 1 }, // Houston to Sofia
    ];

    // Animated Flight Packets (Cargo jets in transit)
    interface FlightPacket {
      pathIndex: number;
      progress: number;
      speed: number;
      size: number;
      tail: { x: number; y: number }[];
    }

    const packets: FlightPacket[] = paths.map((_, i) => ({
      pathIndex: i,
      progress: Math.random(),
      speed: 0.0015 + Math.random() * 0.002,
      size: 2.5 + Math.random() * 1.5,
      tail: [],
    }));

    // Ambient floating star particles
    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.2 + 0.05,
    }));

    let radarAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Subtle Stars
      stars.forEach((star) => {
        star.y -= star.speed;
        if (star.y < 0) star.y = height;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${star.alpha})`;
        ctx.fill();
      });

      // 2. Draw Curved Flight Route Corridors
      paths.forEach((p) => {
        const fromNode = nodes[p.from];
        const toNode = nodes[p.to];
        const x1 = fromNode.x * width;
        const y1 = fromNode.y * height;
        const x2 = toNode.x * width;
        const y2 = toNode.y * height;

        // Arching bezier curve
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.15;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 3. Draw Moving Air Cargo Flight Pulses along curves
      packets.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1) pkt.progress = 0;

        const path = paths[pkt.pathIndex];
        const p0 = { x: nodes[path.from].x * width, y: nodes[path.from].y * height };
        const p2 = { x: nodes[path.to].x * width, y: nodes[path.to].y * height };
        const p1 = { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 - Math.abs(p2.x - p0.x) * 0.15 };

        // Quadratic Bezier interpolation
        const t = pkt.progress;
        const curX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
        const curY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

        // Tail trail
        pkt.tail.push({ x: curX, y: curY });
        if (pkt.tail.length > 8) pkt.tail.shift();

        // Draw glowing tail
        ctx.beginPath();
        pkt.tail.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cargo Flight Node Head
        ctx.beginPath();
        ctx.arc(curX, curY, pkt.size, 0, Math.PI * 2);
        ctx.fillStyle = '#FB923C'; // bright amber-orange
        ctx.shadowColor = '#F97316';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Major Global Shipping Hubs (Pulsing Rings)
      nodes.forEach((node, idx) => {
        const nx = node.x * width;
        const ny = node.y * height;
        const isHQ = idx === 1; // Sofia HQ

        // Outer pulse ring
        const pulse = (Date.now() / 1000 + idx) % 2;
        ctx.beginPath();
        ctx.arc(nx, ny, 4 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = isHQ ? `rgba(249, 115, 22, ${1 - pulse / 2})` : `rgba(56, 189, 248, ${0.7 - pulse / 3})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Hub Core Dot
        ctx.beginPath();
        ctx.arc(nx, ny, isHQ ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isHQ ? '#F97316' : '#38BDF8';
        ctx.fill();

        // City Label
        ctx.font = '9px monospace';
        ctx.fillStyle = isHQ ? '#FED7AA' : 'rgba(224, 242, 254, 0.65)';
        ctx.fillText(node.name, nx + 7, ny + 3);
      });

      // 5. Subtle Radar Sweep Effect from Sofia HQ
      radarAngle += 0.015;
      const hqX = nodes[1].x * width;
      const hqY = nodes[1].y * height;
      const sweepLength = Math.min(width, height) * 0.45;

      const grad = ctx.createRadialGradient(hqX, hqY, 5, hqX, hqY, sweepLength);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.beginPath();
      ctx.moveTo(hqX, hqY);
      ctx.arc(hqX, hqY, sweepLength, radarAngle, radarAngle + 0.35);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-70"
      />
      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-transparent to-transparent"></div>
    </div>
  );
};
