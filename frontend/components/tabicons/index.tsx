/**
 * Flappit icon fallbacks for React Native (iOS / Android).
 * SVG not supported without react-native-svg — use emoji placeholders.
 */
import { Text } from 'react-native'

type IconProps = { size?: number }

export function AiIcon({ size = 22 }: IconProps) {
  return <Text style={{ fontSize: size }}>🤖</Text>
}

export function NotesIcon({ size = 22 }: IconProps) {
  return <Text style={{ fontSize: size }}>📄</Text>
}

export function CalendarIcon({ size = 22 }: IconProps) {
  return <Text style={{ fontSize: size }}>🗓️</Text>
}

export function ProfileIcon({ size = 22 }: IconProps) {
  return <Text style={{ fontSize: size }}>👤</Text>
}
