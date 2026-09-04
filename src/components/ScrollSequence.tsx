import { useEffect, useRef, useState, useCallback } from "react";

interface ScrollSequenceProps {
  frameCount?: number;
  className?: string;
}

export function ScrollSequence({ frameCount = 204, className = "" }: ScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isFirstFrameLoaded, setIsFirstFrameLoaded] = useState(false);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  // Animation & scroll state refs to avoid React re-render overhead in 60/120fps loops
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const isDrawingRef = useRef(false);

  // Helper to get frame path: bg00086400.jpg -> bg00086603.jpg
  const getFramePath = useCallback((index: number) => {
    const frameNumber = String(86400 + index).padStart(8, "0");
    return `/assets/scroll_hero/bg${frameNumber}.jpg`;
  }, []);

  // 1. Check if desktop device (>= 1024px screen width)
  useEffect(() => {
    const checkDesktop = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      setIsDesktop(isLargeScreen);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // 2. High-Performance Canvas Drawer
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const boundedIndex = Math.min(frameCount - 1, Math.max(0, Math.round(frameIndex)));
    const img = imagesRef.current[boundedIndex];

    // If target frame isn't loaded yet, try finding the closest loaded frame
    let renderImg = img;
    if (!renderImg) {
      for (let offset = 1; offset < frameCount; offset++) {
        if (imagesRef.current[boundedIndex - offset]) {
          renderImg = imagesRef.current[boundedIndex - offset];
          break;
        }
        if (imagesRef.current[boundedIndex + offset]) {
          renderImg = imagesRef.current[boundedIndex + offset];
          break;
        }
      }
    }

    if (!renderImg || !renderImg.complete || renderImg.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = renderImg.naturalWidth;
    const ih = renderImg.naturalHeight;

    // Aspect ratio "cover" calculation
    const ratio = Math.max(cw / iw, ch / ih);
    const nw = iw * ratio;
    const nh = ih * ratio;
    const x = (cw - nw) / 2;
    const y = (ch - nh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(renderImg, x, y, nw, nh);
  }, [frameCount]);

  // 3. Smooth Lerp Animation Loop
  const updateCanvas = useCallback(() => {
    // Smooth dampening towards target frame
    const diff = targetFrameRef.current - currentFrameRef.current;

    if (Math.abs(diff) > 0.05) {
      currentFrameRef.current += diff * 0.15; // Smooth spring/lerp factor
      drawFrame(currentFrameRef.current);
      animationFrameIdRef.current = requestAnimationFrame(updateCanvas);
    } else {
      currentFrameRef.current = targetFrameRef.current;
      drawFrame(currentFrameRef.current);
      isDrawingRef.current = false;
      animationFrameIdRef.current = null;
    }
  }, [drawFrame]);

  const requestUpdate = useCallback(() => {
    if (!isDrawingRef.current) {
      isDrawingRef.current = true;
      animationFrameIdRef.current = requestAnimationFrame(updateCanvas);
    }
  }, [updateCanvas]);

  // 4. Preload Images only on Desktop
  useEffect(() => {
    if (!isDesktop) {
      imagesRef.current = [];
      setIsFirstFrameLoaded(false);
      setIsFullyLoaded(false);
      return;
    }

    let isCancelled = false;
    imagesRef.current = new Array(frameCount).fill(null);

    // Step A: Load Frame 0 immediately for instant paint
    const firstImg = new Image();
    firstImg.src = getFramePath(0);
    firstImg.onload = () => {
      if (isCancelled) return;
      imagesRef.current[0] = firstImg;
      setIsFirstFrameLoaded(true);
      drawFrame(0);
    };

    // Step B: Load all remaining frames asynchronously in batches
    let loadedCount = 0;
    const batchSize = 12;

    const loadBatch = (startIndex: number) => {
      if (isCancelled || startIndex >= frameCount) {
        if (!isCancelled && loadedCount >= frameCount - 1) {
          setIsFullyLoaded(true);
        }
        return;
      }

      const endIndex = Math.min(startIndex + batchSize, frameCount);
      const batchPromises: Promise<void>[] = [];

      for (let i = startIndex; i < endIndex; i++) {
        if (i === 0) continue; // Already loaded

        const p = new Promise<void>((resolve) => {
          const img = new Image();
          img.src = getFramePath(i);
          img.onload = () => {
            if (!isCancelled) {
              imagesRef.current[i] = img;
              loadedCount++;
            }
            resolve();
          };
          img.onerror = () => {
            if (!isCancelled) {
              loadedCount++;
            }
            resolve();
          };
        });
        batchPromises.push(p);
      }

      Promise.all(batchPromises).then(() => {
        if (!isCancelled) {
          loadBatch(endIndex);
        }
      });
    };

    // Start batch loading after first frame begins
    loadBatch(1);

    return () => {
      isCancelled = true;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isDesktop, frameCount, getFramePath, drawFrame]);

  // 5. Scroll Listener: Maps document scroll progress (0..1) to frame index (0..203)
  useEffect(() => {
    if (!isDesktop) return;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
      
      // Calculate target frame
      const targetIndex = progress * (frameCount - 1);
      targetFrameRef.current = targetIndex;

      requestUpdate();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger initial calculation
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isDesktop, frameCount, requestUpdate]);

  // 6. Resize Handler
  useEffect(() => {
    if (!isDesktop) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      drawFrame(currentFrameRef.current);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [isDesktop, drawFrame]);

  // Do not render anything on mobile / non-desktop devices
  if (!isDesktop) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 w-full h-screen pointer-events-none overflow-hidden bg-[#060813] z-0 transition-colors duration-500 ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover transition-opacity duration-700 ease-out"
        style={{
          opacity: isFirstFrameLoaded ? 1 : 0,
          filter: "contrast(1.08) brightness(0.85) saturate(1.1)",
        }}
      />

      {/* Deep Obsidian Radial Vignette for Content Readability */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,8,19,0.5)_50%,rgba(6,8,19,0.85)_100%)] transition-opacity duration-500" />

      {/* Ambient Base Dimming */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[#060813] transition-opacity duration-500" />
    </div>
  );
}

export default ScrollSequence;
