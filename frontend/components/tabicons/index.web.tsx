/**
 * Flappit custom SVG icons (web).
 * Recreated from user-provided SVG assets. Stroke color: #378ADD.
 */

type IconProps = { size?: number; color?: string }

const C = '#378ADD'

export function AiIcon({ size = 24, color = C }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Antenna stem */}
      <line x1="12" y1="2" x2="12" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Antenna dot */}
      <circle cx="12" cy="1.5" r="1.2" fill={color} />
      {/* Head (rounded rect) */}
      <rect x="3" y="6" width="18" height="14" rx="4" stroke={color} strokeWidth="1.8" />
      {/* Left eye */}
      <circle cx="8.5" cy="12" r="1.6" fill={color} />
      {/* Right eye */}
      <circle cx="15.5" cy="12" r="1.6" fill={color} />
      {/* Smile */}
      <path d="M8.5 15.5 Q12 18 15.5 15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function NotesIcon({ size = 24, color = C }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Page */}
      <rect x="4" y="2" width="16" height="20" rx="2.5" stroke={color} strokeWidth="1.8" />
      {/* Line 1 */}
      <line x1="7.5" y1="8" x2="16.5" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Line 2 */}
      <line x1="7.5" y1="12" x2="16.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Line 3 (shorter) */}
      <line x1="7.5" y1="16" x2="13" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function CalendarIcon({ size = 24, color = C }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer rect */}
      <rect x="2" y="4" width="20" height="18" rx="2.5" stroke={color} strokeWidth="1.8" />
      {/* Header divider */}
      <line x1="2" y1="9" x2="22" y2="9" stroke={color} strokeWidth="1.8" />
      {/* Left ring tab */}
      <line x1="7" y1="2" x2="7" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Right ring tab */}
      <line x1="17" y1="2" x2="17" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Dot grid — row 1 */}
      <circle cx="7" cy="13" r="1.2" fill={color} />
      <circle cx="12" cy="13" r="1.2" fill={color} />
      <circle cx="17" cy="13" r="1.2" fill={color} />
      {/* Dot grid — row 2 */}
      <circle cx="7" cy="17.5" r="1.2" fill={color} />
      <circle cx="12" cy="17.5" r="1.2" fill={color} />
    </svg>
  )
}

export function ProfileIcon({ size = 24, color = C }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <circle cx="12" cy="7.5" r="4" fill={color} />
      {/* Body */}
      <path
        d="M4 21 Q4 15 12 15 Q20 15 20 21"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
