import { useEffect, useState, useCallback, useRef } from 'react'
import { Group, Box3, Vector3, Mesh, MeshStandardMaterial, MathUtils } from 'three'
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { usePathtracer } from '@react-three/gpu-pathtracer'
import type { ModelTransform } from './useModelTransform'

const DEFAULT_MODEL = import.meta.env.BASE_URL + '2005_BMW_M3_GTR_Need_For_Speed_Most_Wanted.usdz'
const TARGET_WIDTH = 3
const TARGET_HEIGHT = 1.5
const TARGET_DEPTH = 3

function fitModel(group: Group) {
  group.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = true
      child.receiveShadow = true
      if (child.material instanceof MeshStandardMaterial) {
        child.material.envMapIntensity = 0.6
      }
    }
  })

  const box = new Box3().setFromObject(group)
  const size = new Vector3()
  const center = new Vector3()
  box.getSize(size)
  box.getCenter(center)

  const scale = Math.min(
    TARGET_WIDTH / size.x,
    TARGET_HEIGHT / size.y,
    TARGET_DEPTH / size.z
  )
  group.scale.setScalar(scale)
  group.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
}

function loadUSDZ(buffer: ArrayBuffer): Group {
  const loader = new USDZLoader()
  return loader.parse(buffer)
}

async function loadGLB(buffer: ArrayBuffer): Promise<Group> {
  const loader = new GLTFLoader()
  return new Promise((resolve, reject) => {
    loader.parse(buffer, '', (gltf) => resolve(gltf.scene), reject)
  })
}

interface CarModelProps {
  transform: ModelTransform
}

export function CarModel({ transform }: CarModelProps) {
  const [model, setModel] = useState<Group | null>(null)
  const wrapperRef = useRef<Group>(null)
  const { update } = usePathtracer()

  const loadModel = useCallback(async (buffer: ArrayBuffer, filename: string) => {
    const ext = filename.toLowerCase().split('.').pop()
    let group: Group

    if (ext === 'usdz') {
      group = loadUSDZ(buffer)
    } else if (ext === 'glb' || ext === 'gltf') {
      group = await loadGLB(buffer)
    } else {
      console.error('Unsupported format:', ext)
      return
    }

    group.scale.set(1, 1, 1)
    group.position.set(0, 0, 0)
    group.rotation.set(0, 0, 0)
    group.updateMatrixWorld(true)

    fitModel(group)

    setModel((prev) => {
      if (prev) {
        prev.traverse((child) => {
          if (child instanceof Mesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose())
            } else {
              child.material?.dispose()
            }
          }
        })
      }
      return group
    })
  }, [])

  // Load default model
  useEffect(() => {
    fetch(DEFAULT_MODEL)
      .then((res) => res.arrayBuffer())
      .then((buffer) => loadModel(buffer, DEFAULT_MODEL))
      .catch((err) => console.error('Failed to load default model:', err))
  }, [loadModel])

  // Listen for file uploads
  useEffect(() => {
    const handler = (e: CustomEvent<{ buffer: ArrayBuffer; filename: string }>) => {
      loadModel(e.detail.buffer, e.detail.filename)
    }
    window.addEventListener('model-upload', handler as EventListener)
    return () => window.removeEventListener('model-upload', handler as EventListener)
  }, [loadModel])

  // Rebuild path tracer BVH when model changes
  useEffect(() => {
    if (model) {
      update()
    }
  }, [model, update])

  // Apply user transform and rebuild path tracer
  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.position.set(transform.posX, transform.posY, transform.posZ)
      wrapperRef.current.rotation.set(
        MathUtils.degToRad(transform.rotX),
        MathUtils.degToRad(transform.rotY),
        MathUtils.degToRad(transform.rotZ)
      )
      wrapperRef.current.scale.setScalar(transform.scale)
      update()
    }
  }, [transform, update])

  return (
    <group ref={wrapperRef}>
      {model && <primitive object={model} />}
    </group>
  )
}
