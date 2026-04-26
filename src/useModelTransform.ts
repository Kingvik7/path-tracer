import { useState, useCallback } from 'react'

export interface ModelTransform {
  posX: number
  posY: number
  posZ: number
  rotX: number
  rotY: number
  rotZ: number
  scale: number
}

const DEFAULT: ModelTransform = {
  posX: 0, posY: 0, posZ: 0,
  rotX: 0, rotY: 0, rotZ: 0,
  scale: 1,
}

export function useModelTransform() {
  const [transform, setTransform] = useState<ModelTransform>(DEFAULT)
  const [visible, setVisible] = useState(false)

  const show = useCallback(() => setVisible(true), [])
  const hide = useCallback(() => {
    setVisible(false)
    setTransform(DEFAULT)
  }, [])
  const reset = useCallback(() => setTransform(DEFAULT), [])

  const set = useCallback((key: keyof ModelTransform, value: number) => {
    setTransform((prev) => ({ ...prev, [key]: value }))
  }, [])

  return { transform, visible, show, hide, reset, set }
}
