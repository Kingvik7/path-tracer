import { motion, LayoutGroup } from "framer-motion";
import type { ModelTransform } from "./useModelTransform";
import styles from "./TransformPanel.module.css";

export type Fidelity = "Low" | "Medium" | "High";
const FIDELITIES: Fidelity[] = ["Low", "Medium", "High"];

interface Props {
  transform: ModelTransform;
  onChange: (key: keyof ModelTransform, value: number) => void;
  onReset: () => void;
  onClose: () => void;
  fidelity: Fidelity;
  onFidelityChange: (f: Fidelity) => void;
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <input
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className={styles.sliderValue}>{value.toFixed(2)}</span>
    </div>
  );
}

export function TransformPanel({
  transform,
  onChange,
  onReset,
  fidelity,
  onFidelityChange,
}: Props) {
  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(6px)" }}
      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className={styles.header}>
        <span className={styles.headerTitle}>Transform</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className={styles.resetBtn} onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Fidelity</div>
        <div className={styles.filters}>
          <LayoutGroup>
            {FIDELITIES.map((f) => (
              <div
                key={f}
                className={`${styles.filter} ${fidelity === f ? styles.filterActive : ""}`}
                onClick={() => onFidelityChange(f)}
              >
                {fidelity === f && (
                  <motion.div
                    className={styles.filterPill}
                    layoutId="fidelity-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={styles.filterLabel}>{f}</span>
              </div>
            ))}
          </LayoutGroup>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Position</div>
        <Slider
          label="X"
          value={transform.posX}
          onChange={(v) => onChange("posX", v)}
          min={-3}
          max={3}
          step={0.01}
        />
        <Slider
          label="Y"
          value={transform.posY}
          onChange={(v) => onChange("posY", v)}
          min={-2}
          max={2}
          step={0.01}
        />
        <Slider
          label="Z"
          value={transform.posZ}
          onChange={(v) => onChange("posZ", v)}
          min={-3}
          max={3}
          step={0.01}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Rotation</div>
        <Slider
          label="X"
          value={transform.rotX}
          onChange={(v) => onChange("rotX", v)}
          min={-180}
          max={180}
          step={1}
        />
        <Slider
          label="Y"
          value={transform.rotY}
          onChange={(v) => onChange("rotY", v)}
          min={-180}
          max={180}
          step={1}
        />
        <Slider
          label="Z"
          value={transform.rotZ}
          onChange={(v) => onChange("rotZ", v)}
          min={-180}
          max={180}
          step={1}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Scale</div>
        <Slider
          label="S"
          value={transform.scale}
          onChange={(v) => onChange("scale", v)}
          min={0.1}
          max={5}
          step={0.01}
        />
      </div>
    </motion.div>
  );
}
