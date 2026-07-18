import { useEffect, useRef, useState, useCallback } from "react";

/** Check WebGL support without throwing. Returns true if the browser can create a context. */
function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    return !!ctx;
  } catch {
    return false;
  }
}

// ─── Three.js scene (only called when WebGL is confirmed available) ──────────
async function mountThreeScene(
  mount: HTMLDivElement,
  W: number,
  H: number,
  floatRef: React.MutableRefObject<number>,
  mouseRef: React.MutableRefObject<{ x: number; y: number }>,
  posRef: React.MutableRefObject<{ x: number; y: number }>,
): Promise<() => void> {
  const THREE = await import("three");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);
  mount.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0.3, 5);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(2, 4, 3);
  scene.add(dir);
  const fill = new THREE.PointLight(0x8b5cf6, 0.8, 10);
  fill.position.set(-2, 1, 2);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  // Materials
  const bodyMat  = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.3, metalness: 0.4 });
  const faceMat  = new THREE.MeshStandardMaterial({ color: 0xede9fe, roughness: 0.4, metalness: 0.1 });
  const eyeWMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.2, metalness: 0.6 });
  const antMat   = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.1, metalness: 0.8, emissive: new THREE.Color(0xf59e0b), emissiveIntensity: 0.4 });
  const armMat   = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.3, metalness: 0.4 });
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.6, transparent: true, opacity: 0.7 });

  // Body + Head
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 0.5, 8, 16), bodyMat);
  body.position.y = -0.4;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 24), bodyMat);
  head.position.y = 0.55;
  group.add(head);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 20), faceMat);
  face.position.set(0, 0.55, 0.35);
  face.scale.set(1, 0.85, 0.5);
  group.add(face);

  // Eyes
  const pupils: THREE.Mesh[] = [];
  ([-0.18, 0.18] as number[]).forEach((ex) => {
    const ec = new THREE.Group();
    ec.position.set(ex, 0.62, 0.74);
    group.add(ec);
    ec.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), eyeWMat));
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), pupilMat);
    p.position.z = 0.06;
    ec.add(p);
    pupils.push(p);
  });

  // Cheeks
  ([-0.25, 0.25] as number[]).forEach((cx) => {
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.08, 16), cheekMat);
    c.position.set(cx, 0.42, 0.76);
    group.add(c);
  });

  // Mouth
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.018, 8, 20, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.5 }),
  );
  mouth.position.set(0, 0.34, 0.76);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  // Antenna
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.35, 8), accentMat);
  stem.position.set(0, 1.22, 0);
  group.add(stem);
  const antBall = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), antMat);
  antBall.position.set(0, 1.42, 0);
  group.add(antBall);

  // Ears
  ([-0.64, 0.64] as number[]).forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), accentMat);
    ear.position.set(ex, 0.55, 0);
    ear.scale.z = 0.5;
    group.add(ear);
  });

  // Arms
  ([-0.72, 0.72] as number[]).forEach((ax, i) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 6, 10), armMat);
    arm.position.set(ax, -0.25, 0);
    arm.rotation.z = i === 0 ? 0.5 : -0.5;
    group.add(arm);
  });

  // Badge
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 6), antMat);
  badge.position.set(0, -0.25, 0.55);
  badge.rotation.y = Math.PI / 6;
  group.add(badge);

  group.scale.setScalar(0.78);

  const targetRot = { x: 0, y: 0 };
  const curRot    = { x: 0, y: 0 };
  let animId = 0;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    floatRef.current += 0.025;
    group.position.y = Math.sin(floatRef.current) * 0.06;

    const cx = posRef.current.x + W / 2;
    const cy = posRef.current.y + H / 2;
    const dx = (mouseRef.current.x - cx) / window.innerWidth;
    const dy = (mouseRef.current.y - cy) / window.innerHeight;

    targetRot.y = dx * 0.5;
    targetRot.x = -dy * 0.3;
    curRot.x += (targetRot.x - curRot.x) * 0.08;
    curRot.y += (targetRot.y - curRot.y) * 0.08;
    group.rotation.x = curRot.x;
    group.rotation.y = curRot.y;

    pupils.forEach((p) => {
      p.position.x = dx * 0.04;
      p.position.y = -dy * 0.04;
    });

    const pulse = (Math.sin(floatRef.current * 3) + 1) / 2;
    (antBall.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2 + pulse * 0.8;
    renderer.render(scene, camera);
  };
  animate();

  return () => {
    cancelAnimationFrame(animId);
    renderer.dispose();
    if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
  };
}

// ─── CSS fallback mascot ─────────────────────────────────────────────────────
function CssBuddy({
  mouseX, mouseY, posX, posY,
}: { mouseX: number; mouseY: number; posX: number; posY: number }) {
  const eyeOffX = Math.max(-4, Math.min(4, (mouseX - posX - 55) / 50));
  const eyeOffY = Math.max(-3, Math.min(3, (mouseY - posY - 50) / 50));

  return (
    <div style={{ width: 110, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Head */}
      <div style={{ position: "absolute", top: 0, width: 76, height: 76, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Face plate */}
        <div style={{ width: 54, height: 48, background: "#ede9fe", borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 4 }}>
          <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1.5px #c4b5fd" }}>
                <div style={{ width: 8, height: 8, background: "#1e1b4b", borderRadius: "50%", transform: `translate(${eyeOffX}px,${eyeOffY}px)`, transition: "transform 0.1s" }} />
              </div>
            ))}
          </div>
          <div style={{ width: 22, height: 10, borderBottom: "3px solid #7c3aed", borderRadius: "0 0 12px 12px", marginTop: 2 }} />
        </div>
        {/* Cheeks */}
        <div style={{ position: "absolute", bottom: 16, left: 8, width: 10, height: 8, background: "#f9a8d4", borderRadius: "50%", opacity: 0.8 }} />
        <div style={{ position: "absolute", bottom: 16, right: 8, width: 10, height: 8, background: "#f9a8d4", borderRadius: "50%", opacity: 0.8 }} />
        {/* Antenna */}
        <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 12, height: 12, background: "#f59e0b", borderRadius: "50%", boxShadow: "0 0 8px #f59e0b" }} />
          <div style={{ width: 4, height: 10, background: "#a78bfa" }} />
        </div>
        {/* Ears */}
        <div style={{ position: "absolute", left: -10, top: "28%", width: 14, height: 14, background: "#a78bfa", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: -10, top: "28%", width: 14, height: 14, background: "#a78bfa", borderRadius: "50%" }} />
      </div>
      {/* Body */}
      <div style={{ position: "absolute", bottom: 0, width: 64, height: 62, background: "linear-gradient(135deg,#7c3aed,#a78bfa)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Arms */}
        <div style={{ position: "absolute", left: -14, top: 8, width: 12, height: 30, background: "#6d28d9", borderRadius: 8, transform: "rotate(15deg)" }} />
        <div style={{ position: "absolute", right: -14, top: 8, width: 12, height: 30, background: "#6d28d9", borderRadius: 8, transform: "rotate(-15deg)" }} />
        {/* Badge */}
        <div style={{ width: 20, height: 20, background: "#f59e0b", borderRadius: "50%", boxShadow: "0 0 6px #f59e0b88" }} />
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function Buddy3D() {
  const mountRef  = useRef<HTMLDivElement>(null);
  const floatRef  = useRef(0);
  const mouseRef  = useRef({ x: 0, y: 0 });
  const posRef    = useRef({ x: 0, y: 0 });

  const [pos, setPos]           = useState(() => ({ x: window.innerWidth - 140, y: window.innerHeight - 170 }));
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered]   = useState(false);
  // true = WebGL 3D, false = CSS fallback, null = not yet detected
  const [mode, setMode]         = useState<"3d" | "css" | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  posRef.current = pos;

  // Keep mouse ref updated for eye-tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Detect WebGL synchronously, then mount Three.js if supported
  useEffect(() => {
    if (!canUseWebGL()) {
      setMode("css");
      return;
    }
    // WebGL available — mount the Three.js scene
    if (!mountRef.current) return;
    let cleanup: (() => void) | undefined;
    setMode("3d");

    mountThreeScene(mountRef.current, 110, 130, floatRef, mouseRef, posRef)
      .then((fn) => { cleanup = fn; })
      .catch(() => setMode("css")); // last-resort fallback

    return () => cleanup?.();
  }, []);

  // CSS fallback: re-render on mouse move (RAF throttled) so eyes follow pointer
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (mode !== "css") return;
    let rafId = 0;
    const tick = () => { forceUpdate((n) => n + 1); rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode]);

  // Drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    dragOffset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth  - 120, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 140, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [dragging]);

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top:  pos.y,
        zIndex: 9999,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
        filter: hovered
          ? "drop-shadow(0 0 18px #7c3aed)"
          : "drop-shadow(0 4px 18px rgba(124,58,237,0.45))",
        transition: dragging ? "none" : "filter 0.3s",
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Drag me anywhere!"
    >
      {/* WebGL canvas — rendered only in 3D mode */}
      {mode === "3d" && <div ref={mountRef} style={{ width: 110, height: 130 }} />}

      {/* CSS mascot — rendered when WebGL is unavailable */}
      {mode === "css" && (
        <CssBuddy
          mouseX={mouseRef.current.x}
          mouseY={mouseRef.current.y}
          posX={pos.x}
          posY={pos.y}
        />
      )}

      {/* Hidden mount point for 3D mode ref attachment (keeps ref stable) */}
      {mode === null && <div ref={mountRef} style={{ width: 110, height: 130 }} />}

      {hovered && !dragging && (
        <div style={{
          position: "absolute", bottom: "100%", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(124,58,237,0.92)", color: "#fff",
          borderRadius: 8, padding: "4px 10px", fontSize: 11,
          whiteSpace: "nowrap", marginBottom: 4, pointerEvents: "none",
        }}>
          👾 Drag me!
        </div>
      )}
    </div>
  );
}
