export const SPIRITS = [
  { id: "whiskey", en: "Whiskey", es: "Whiskey" },
  { id: "tequila", en: "Tequila", es: "Tequila" },
  { id: "vodka", en: "Vodka", es: "Vodka" },
  { id: "gin", en: "Gin", es: "Ginebra" },
  { id: "rum", en: "Rum", es: "Ron" },
  { id: "wine", en: "Wine", es: "Vino" },
  { id: "champagne", en: "Champagne", es: "Champaña" },
  { id: "beer", en: "Beer", es: "Cerveza" },
  { id: "cognac", en: "Cognac", es: "Coñac" },
  { id: "arak", en: "Arak", es: "Arak" },
] as const

export type SpiritId = (typeof SPIRITS)[number]["id"]
export type Locale = "en" | "es"

export function isSpiritId(value: string): value is SpiritId {
  return SPIRITS.some((spirit) => spirit.id === value)
}

export function spiritName(id: string, locale: Locale = "en") {
  const spirit = SPIRITS.find((item) => item.id === id)
  return spirit ? spirit[locale] : id
}
