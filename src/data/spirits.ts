export const SPIRITS = [
  { id: "tequila", en: "Tequila", es: "Tequila" },
  { id: "bourbon", en: "Bourbon", es: "Bourbon" },
  { id: "rtd", en: "Ready to drink cocktail", es: "Cóctel listo para tomar" },
  { id: "red-wine", en: "Red wine", es: "Vino tinto" },
  { id: "white-wine", en: "White wine", es: "Vino blanco" },
  { id: "craft-beer", en: "Craft beer", es: "Cerveza artesanal" },
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
