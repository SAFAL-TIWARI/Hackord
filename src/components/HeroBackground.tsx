import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const BACKGROUND_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=380&fit=crop",
    title: "Team Sprint",
    pos: "top-[12%] left-[3%] xl:left-[5%]",
    rotate: "-rotate-6",
    size: "w-60 h-36 sm:w-72 sm:h-44",
    anim: "animate-float",
  },
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=380&fit=crop",
    title: "Hackathon Arena",
    pos: "top-[10%] right-[3%] xl:right-[5%]",
    rotate: "rotate-6",
    size: "w-60 h-36 sm:w-72 sm:h-44",
    anim: "animate-float-delayed",
  },
  {
    src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=380&fit=crop",
    title: "Live Pair Programming",
    pos: "bottom-[15%] left-[2%] xl:left-[4%]",
    rotate: "rotate-3",
    size: "w-56 h-32 sm:w-64 sm:h-40",
    anim: "animate-float-delayed",
  },
  {
    src: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=380&fit=crop",
    title: "Demo Night",
    pos: "bottom-[12%] right-[2%] xl:right-[4%]",
    rotate: "-rotate-3",
    size: "w-56 h-32 sm:w-64 sm:h-40",
    anim: "animate-float",
  },
];

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
      className="absolute inset-0 z-0 overflow-hidden bg-background pointer-events-none"
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

      {/* CREATIVE BACKGROUND PHOTO MESH (Floating Tiles) */}
      <div className="absolute inset-0 hidden lg:block opacity-40">
        {BACKGROUND_PHOTOS.map((photo, i) => (
          <div
            key={i}
            className={cn(
              "absolute overflow-hidden rounded-2xl border border-white/15 bg-card/40 shadow-2xl backdrop-blur-md transition-all duration-700 hover:opacity-100 hover:scale-110 hover:z-20",
              photo.pos,
              photo.rotate,
              photo.size,
              photo.anim
            )}
          >
            <img
              src={photo.src}
              alt={photo.title}
              className="h-full w-full object-cover opacity-80 transition-all duration-500 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-semibold text-white/90">
              <span className="rounded-md glass px-2 py-0.5 backdrop-blur-sm border border-white/10">
                {photo.title}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Perspective Grid Background Overlay */}
      <div className="absolute inset-0 [perspective:1000px] pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dzvy8unq3/image/upload/v1709405625/grid_1_q1g0b0.png')] bg-center [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] [transform:rotateX(60deg)_translateY(-200px)_scale(2)] opacity-15" />
      </div>

      {/* Top & Bottom Fade Gradients */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
