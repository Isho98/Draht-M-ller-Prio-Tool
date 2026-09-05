'use client'

import { useEffect, useRef } from 'react'

type Props = {
  onComplete: () => void
}

const HOLD_AFTER_MS = 400
const SAFETY_MS = 2400

export function AdeptIntro({ onComplete }: Props) {
  const done = useRef(false)

  function finish() {
    if (done.current) return
    done.current = true
    onComplete()
  }

  useEffect(() => {
    const safety = window.setTimeout(finish, SAFETY_MS)
    return () => window.clearTimeout(safety)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="adept-intro flex min-h-svh items-center justify-center bg-background">
      <svg
        className="h-auto w-full max-w-[600px] px-6"
        viewBox="0 0 600 200"
        aria-label="adept&"
      >
        <text
          x="50%"
          y="55%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="adept-intro-text"
        >
          <tspan className="adept-intro-static">adept</tspan>
          <tspan
            className="adept-intro-amp"
            dx={0}
            onAnimationEnd={(event) => {
              if (event.animationName.includes('auffuellen')) {
                window.setTimeout(finish, HOLD_AFTER_MS)
              }
            }}
          >
            &amp;
          </tspan>
        </text>
      </svg>
    </div>
  )
}
