import { useEffect, useMemo } from "react";
import {
  Mesh,
  MeshBasicMaterial,
  LineSegments,
  EdgesGeometry,
  ShaderMaterial,
  Scene,
  Camera,
  Object3D,
  Box3,
  Vector3,
} from "three";
import { usePathtracer } from "@react-three/gpu-pathtracer";

const FILL_COLOR = "#000000";
const EDGE_THRESHOLD_ANGLE = 20;

const edgeVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const edgeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBoundsMin;
  uniform vec3 uBoundsMax;

  varying vec3 vWorldPos;

  void main() {
    // Normalize Z position along the car (0 = back, 1 = front)
    float nz = (vWorldPos.z - uBoundsMin.z) / (uBoundsMax.z - uBoundsMin.z);

    // 3s sweep, no pause
    float t = fract(uTime / 3.0);
    // Ease in-out
    float eased = t * t * (3.0 - 2.0 * t);

    // Sweep position travels from 1.3 to -0.3 (front to back)
    float sweepPos = mix(1.3, -0.3, eased);

    // Soft gradient band around the sweep position
    float dist = abs(nz - sweepPos);
    float wave = 1.0 - smoothstep(0.0, 0.4, dist);

    float brightness = mix(0.5, 1.0, wave);

    gl_FragColor = vec4(vec3(1.0), brightness);
  }
`;

export function WireframeRasterize() {
  const { pathtracer } = usePathtracer();

  const fillMaterial = useMemo(
    () => new MeshBasicMaterial({ color: FILL_COLOR }),
    [],
  );

  const edgeMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: edgeVertexShader,
        fragmentShader: edgeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBoundsMin: { value: new Vector3() },
          uBoundsMax: { value: new Vector3() },
        },
        transparent: true,
      }),
    [],
  );

  useEffect(() => {
    const origMaterials = new Map<Mesh, any>();
    const edgeObjects = new Map<Object3D, LineSegments>();
    const bounds = new Box3();
    const startTime = performance.now();

    pathtracer.rasterizeSceneCallback = (scene: Scene, camera: Camera) => {
      // Compute scene bounds (skip ground plane)
      bounds.makeEmpty();
      scene.traverse((obj) => {
        if (obj instanceof Mesh) {
          const b = new Box3().setFromObject(obj);
          if (b.max.y > 0.05) {
            bounds.union(b);
          }
        }
      });

      // Update uniforms
      const elapsed = (performance.now() - startTime) / 1000;
      edgeMaterial.uniforms.uTime.value = elapsed;
      edgeMaterial.uniforms.uBoundsMin.value.copy(bounds.min);
      edgeMaterial.uniforms.uBoundsMax.value.copy(bounds.max);

      // Swap to wireframe materials
      scene.traverse((obj) => {
        if (obj instanceof Mesh) {
          origMaterials.set(obj, obj.material);
          obj.material = fillMaterial;

          if (!edgeObjects.has(obj)) {
            const edges = new EdgesGeometry(
              obj.geometry,
              EDGE_THRESHOLD_ANGLE,
            );
            const line = new LineSegments(edges, edgeMaterial);
            line.raycast = () => {};
            edgeObjects.set(obj, line);
          }

          const line = edgeObjects.get(obj)!;
          obj.add(line);
        }
      });

      // Render
      (pathtracer as any)._renderer.render(scene, camera);

      // Restore original materials and remove edge lines
      origMaterials.forEach((mat, mesh) => {
        mesh.material = mat;
      });
      edgeObjects.forEach((line, obj) => {
        obj.remove(line);
      });
      origMaterials.clear();
    };

    return () => {
      fillMaterial.dispose();
      edgeMaterial.dispose();
      edgeObjects.forEach((line) => line.geometry.dispose());
    };
  }, [pathtracer, fillMaterial, edgeMaterial]);

  return null;
}
