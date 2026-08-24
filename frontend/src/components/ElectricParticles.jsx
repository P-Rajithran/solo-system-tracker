import { useEffect, useRef } from 'react';

const ElectricParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: -Math.random() * 1.5 - 0.2,
      opacity: Math.random() * 0.8 + 0.2,
      pulse: Math.random() * 0.05 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw floating electric energy particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += Math.sin(Date.now() * 0.005) * 0.01;

        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 212, 255, ${Math.max(0.1, Math.min(1, p.opacity))})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#2dd4ff';
        ctx.fill();
        ctx.restore();
      });

      // Draw occasional electric arc bursts across the canvas
      if (Math.random() < 0.08) {
        ctx.save();
        ctx.strokeStyle = 'rgba(45, 212, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#2dd4ff';
        ctx.beginPath();

        let startX = Math.random() * width;
        let startY = Math.random() * height;
        ctx.moveTo(startX, startY);

        for (let i = 0; i < 4; i++) {
          startX += (Math.random() - 0.5) * 40;
          startY += (Math.random() - 0.5) * 40;
          ctx.lineTo(startX, startY);
        }
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 opacity-70"
    />
  );
};

export default ElectricParticles;