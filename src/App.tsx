import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { Pathtracer } from "@react-three/gpu-pathtracer";
import { AnimatePresence } from "framer-motion";
import { CarModel } from "./CarModel";
import { GroundPlane } from "./GroundPlane";
import { GarageLights } from "./GarageLights";
import { WireframeRasterize } from "./WireframeRasterize";
import { CalculatingLabel } from "./CalculatingLabel";
import { TransformPanel, type Fidelity } from "./TransformPanel";
import { useModelTransform } from "./useModelTransform";
import styles from "./App.module.css";

const FIDELITY_CONFIG = {
  Low: { samples: 24, bounces: 2, resolutionFactor: 0.5 },
  Medium: { samples: 32, bounces: 3, resolutionFactor: 0.75 },
  High: { samples: 64, bounces: 5, resolutionFactor: 1.0 },
} as const;

function dispatchUpload(buffer: ArrayBuffer, filename: string) {
  window.dispatchEvent(
    new CustomEvent("model-upload", {
      detail: { buffer, filename },
    }),
  );
}

function App() {
  const { transform, visible, show, hide, reset, set } = useModelTransform();
  const [fidelity, setFidelity] = useState<Fidelity>("Medium");
  const [ptReady, setPtReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setPtReady(true), 1000);
    return () => clearTimeout(id);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "usdz" && ext !== "glb" && ext !== "gltf") return;
      file.arrayBuffer().then((buffer) => {
        dispatchUpload(buffer, file.name);
        show();
      });
    },
    [show],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext !== "usdz" && ext !== "glb" && ext !== "gltf") {
        alert("Please upload a .usdz or .glb file");
        return;
      }
      file.arrayBuffer().then((buffer) => {
        dispatchUpload(buffer, file.name);
        show();
      });
      e.target.value = "";
    },
    [show],
  );

  return (
    <div
      className={styles.viewer}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className={styles.controls}>
        <AnimatePresence>
          {visible && (
            <TransformPanel
              transform={transform}
              onChange={set}
              onReset={reset}
              onClose={hide}
              fidelity={fidelity}
              onFidelityChange={setFidelity}
            />
          )}
        </AnimatePresence>

        <div className={styles.buttonRow}>
          <button className={styles.toggleBtn} onClick={visible ? hide : show}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="2" />
              <line x1="12" y1="2" x2="12" y2="10" />
              <polyline points="9 5 12 2 15 5" />
              <line x1="12" y1="14" x2="12" y2="22" />
              <polyline points="9 19 12 22 15 19" />
              <line x1="2" y1="12" x2="10" y2="12" />
              <polyline points="5 9 2 12 5 15" />
              <line x1="14" y1="12" x2="22" y2="12" />
              <polyline points="19 9 22 12 19 15" />
            </svg>
          </button>
          <label className={styles.uploadBtn}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Model
            <input
              ref={fileRef}
              type="file"
              accept=".usdz,.glb,.gltf"
              onChange={onFileChange}
              hidden
            />
          </label>
        </div>
      </div>

      <div
        className={styles.canvas}
        style={{
          opacity: ptReady ? 1 : 0,
          transition: "opacity 1s ease-in",
        }}
      >
        {ptReady && (
          <Canvas
            camera={{ position: [5.0, 2.5, 5.0], fov: 35 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#000000"]} />

            <Pathtracer
              key={fidelity}
              {...FIDELITY_CONFIG[fidelity]}
              filteredGlossyFactor={1.0}
              tiles={[2, 2]}
              minSamples={20}
              fadeDuration={500}
              dynamicLowRes={false}
              rasterizeScene
              enabled
            >
              <ambientLight intensity={1.28} />

              <Suspense
                fallback={
                  <Html center>
                    <span style={{ color: "#444" }}>Loading...</span>
                  </Html>
                }
              >
                <CarModel transform={transform} />
              </Suspense>

              <GroundPlane />
              <GarageLights />
              <WireframeRasterize />
              <CalculatingLabel maxSamples={FIDELITY_CONFIG[fidelity].samples} />
            </Pathtracer>

            <OrbitControls
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              enableDamping={true}
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={10}
              maxPolarAngle={Math.PI / 2.15}
              minPolarAngle={1.05}
              target={[0, 0.4, 0]}
              makeDefault
            />
          </Canvas>
        )}
      </div>
    </div>
  );
}

export default App;
