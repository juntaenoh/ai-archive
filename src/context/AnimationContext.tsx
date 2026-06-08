'use client'

import { createContext, useContext, useState } from 'react'

interface AnimationContextType {
  paused: boolean
  toggle: () => void
}

const AnimationContext = createContext<AnimationContextType>({
  paused: false,
  toggle: () => {},
})

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [paused, setPaused] = useState(false)
  return (
    <AnimationContext.Provider value={{ paused, toggle: () => setPaused(p => !p) }}>
      {children}
    </AnimationContext.Provider>
  )
}

export const useAnimation = () => useContext(AnimationContext)
