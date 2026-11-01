export function isoBirthday(year: string, month: string, day: string) {
  if (!year || !month || !day) return null
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function isAtLeastAge(birthday: string, years: number, today = new Date()) {
  const [y, m, d] = birthday.split("-").map(Number)
  if (!y || !m || !d) return false
  const born = new Date(y, m - 1, d)
  const cutoff = new Date(today.getFullYear() - years, today.getMonth(), today.getDate())
  return born <= cutoff
}

export function daysUntilBirthday(birthday: string, today = new Date()) {
  const [, month, day] = birthday.split("-").map(Number)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let next = new Date(today.getFullYear(), (month ?? 1) - 1, day ?? 1)
  if (next < start) next = new Date(today.getFullYear() + 1, (month ?? 1) - 1, day ?? 1)
  return Math.round((next.getTime() - start.getTime()) / 86_400_000)
}

export function formatBirthday(birthday: string) {
  const [y, m, d] = birthday.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatBirthdayShort(birthday: string, locale: "en" | "es") {
  const [y, m, d] = birthday.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(locale === "es" ? "es" : "en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatStamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function isSameDay(iso: string, today = new Date()) {
  const date = new Date(iso)
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function yearOptions(today = new Date()) {
  const newest = today.getFullYear() - 21
  const oldest = today.getFullYear() - 100
  const years: number[] = []
  for (let year = newest; year >= oldest; year -= 1) years.push(year)
  return years
}

export function daysInMonth(year: string, month: string) {
  const y = Number(year) || 2000
  const m = Number(month)
  if (!m) return 31
  return new Date(y, m, 0).getDate()
}
