import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { usePathtracer } from "@react-three/gpu-pathtracer";

export function CalculatingLabel({ maxSamples = 32 }: { maxSamples?: number }) {
  const { pathtracer } = usePathtracer();
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.textContent = "sampling inner bvh...";
    Object.assign(el.style, {
      position: "fixed",
      bottom: "25px",
      left: "25px",
      color: "rgba(255,255,255,1.0)",
      fontSize: "8px",
      pointerEvents: "none",
      opacity: "0",
      animation: "pulse 2s ease-in-out infinite",
    });

    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    (el as any)._style = style;
    document.body.appendChild(el);
    elRef.current = el;
    return () => {
      document.body.removeChild(el);
      document.head.removeChild(style);
    };
  }, []);

  useFrame(() => {
    if (elRef.current) {
      const show = pathtracer.samples < maxSamples && pathtracer.samples > 0;
      elRef.current.style.display = show ? "block" : "none";
    }
  });

  return null;
}
