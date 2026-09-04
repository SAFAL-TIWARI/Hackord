export function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-transparent pointer-events-none">
      {/* Perspective Grid Background Overlay */}
      <div className="absolute inset-0 [perspective:1000px] pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dzvy8unq3/image/upload/v1709405625/grid_1_q1g0b0.png')] bg-center [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] [transform:rotateX(60deg)_translateY(-200px)_scale(2)] opacity-15" />
      </div>
    </div>
  );
}

