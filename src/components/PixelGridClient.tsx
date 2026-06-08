'use client'

import dynamic from 'next/dynamic'

const PixelGrid = dynamic(() => import('./PixelGrid'), { ssr: false })

export default function PixelGridClient() {
  return <PixelGrid />
}
