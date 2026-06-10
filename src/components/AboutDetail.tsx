'use client'

import AboutContent from './AboutContent'

export default function AboutDetail({ onBack }: { onBack?: () => void }) {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <AboutContent onBack={onBack} />
    </div>
  )
}
