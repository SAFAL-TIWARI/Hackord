import { useEffect, useRef, useState } from "react";

export function HeroBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden bg-background lg:bg-transparent pointer-events-none"
    >
      {/* Dynamic Mouse Spotlight Glow */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[140px] opacity-25 pointer-events-none transition-all duration-300 ease-out"
        style={{
          background: "radial-gradient(circle, var(--color-brand) 0%, var(--color-brand-2) 50%, transparent 80%)",
          left: mousePosition.x - 400,
          top: mousePosition.y - 400,
        }}
      />

      {/* Perspective Grid Background Overlay */}
      <div className="absolute inset-0 [perspective:1000px] pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dzvy8unq3/image/upload/v1709405625/grid_1_q1g0b0.png')] bg-center [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] [transform:rotateX(60deg)_translateY(-200px)_scale(2)] opacity-15" />
      </div>
    </div>
  );
}
