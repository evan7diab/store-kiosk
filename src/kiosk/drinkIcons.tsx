import type { ReactNode } from "react"
import type { SpiritId } from "../data/spirits"

function Mark({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const icons: Record<SpiritId, ReactNode> = {
  tequila: (
    <Mark>
      <path d="M13.2 3.5h4.2M13.7 3.5v3h3.2v-3" />
      <path d="M12.2 6.5h6.2l1.3 3v14.4a2 2 0 0 1-2 2h-4.8a2 2 0 0 1-2-2V9.5l1.3-3z" />
      <path d="M11.2 14.8h8.2" />
      <path d="M22.4 20.2a2.3 2.3 0 1 0 0.1-3.2" />
      <path d="M21.2 17.4c1.4.2 2.2 1.2 2.1 2.4" />
    </Mark>
  ),
  bourbon: (
    <Mark>
      <path d="M7.5 9.5h17" />
      <path d="M9.2 9.5 11 24.2a2 2 0 0 0 2 1.6h6a2 2 0 0 0 2-1.6L22.8 9.5" />
      <path d="M10.2 16.2h11.6" />
      <circle cx="18.2" cy="20.4" r="1.15" fill="currentColor" stroke="none" />
    </Mark>
  ),
  rtd: (
    <Mark>
      <path d="M11 4.5h10a2 2 0 0 1 2 2v19a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-19a2 2 0 0 1 2-2z" />
      <path d="M9 9h14M9 23h14" />
      <path d="M13 13.5h6M13 17h4" />
    </Mark>
  ),
  "red-wine": (
    <Mark>
      <path d="M10.5 5h11c-.2 5.2-2.2 8.2-5.5 10.2-3.3-2-5.3-5-5.5-10.2z" />
      <path d="M11.3 8.4h9.4c-.4 3.4-2 5.6-4.7 6.5-2.7-.9-4.3-3.1-4.7-6.5z" fill="currentColor" stroke="none" />
      <path d="M16 15.2v6.2M12.5 27h7" />
    </Mark>
  ),
  "white-wine": (
    <Mark>
      <path d="M10.5 5h11c-.2 5.2-2.2 8.2-5.5 10.2-3.3-2-5.3-5-5.5-10.2z" />
      <path d="M12.6 12.6h6.8" />
      <path d="M16 15.2v6.2M12.5 27h7" />
    </Mark>
  ),
  "craft-beer": (
    <Mark>
      <path d="M8.5 11h12.2v10.2a4 4 0 0 1-4 4h-4.2a4 4 0 0 1-4-4V11z" />
      <path d="M20.7 13.4h2.2a2.6 2.6 0 0 1 0 5.2h-2.2" />
      <path d="M9.2 11c.7-2.1 1.8-2.1 2.6 0s1.9 2.1 2.7 0 1.9-2.1 2.7 0 1.8 2.1 2.6 0" />
    </Mark>
  ),
}

export function DrinkIcon({ id }: { id: SpiritId }) {
  return icons[id]
}
