import { isSpiritId, SPIRITS, spiritName, type Locale, type SpiritId } from "../data/spirits"
import type { AudienceKind, Brand, Cashier, Customer } from "../types"

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function cashierName(cashiers: Cashier[], id: string) {
  return cashiers.find((cashier) => cashier.id === id)?.name ?? "Unknown"
}

export function brandName(brands: Brand[], id: string) {
  return brands.find((brand) => brand.id === id)?.name ?? "Retired bottle"
}

export function guestsForSpirit(customers: Customer[], spiritId: SpiritId) {
  return customers.filter((customer) => customer.spiritIds.includes(spiritId))
}

export function guestsForBrand(customers: Customer[], brandId: string) {
  return customers.filter((customer) => customer.brandIds.includes(brandId))
}

export function audienceGuests(
  customers: Customer[],
  kind: AudienceKind,
  id: string,
): Customer[] {
  if (kind === "customer") return customers.filter((customer) => customer.id === id)
  if (kind === "spirit" && isSpiritId(id)) return guestsForSpirit(customers, id)
  if (kind === "brand") return guestsForBrand(customers, id)
  return []
}

export function drinkLabels(customer: Customer, locale: Locale = "en") {
  return SPIRITS.filter((spirit) => customer.spiritIds.includes(spirit.id)).map(
    (spirit) => spiritName(spirit.id, locale),
  )
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validPhone(value: string) {
  return phoneKey(value).length === 10
}

export function phoneKey(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.length < 10) return ""
  return digits.slice(-10)
}

export function scoreText(points: number, rewards: number, added = false) {
  const pointLabel = points === 1 ? "point" : "points"
  const rewardLabel = rewards === 1 ? "reward" : "rewards"
  const mark = added ? "+" : ""
  return `${mark}${points} ${pointLabel} · ${mark}${rewards} ${rewardLabel}`
}

export function findGuests(customers: Customer[], query: string) {
  const value = query.trim()
  if (!value) return []
  if (value.includes("@")) {
    const email = value.toLowerCase()
    return customers.filter((customer) => customer.email.trim().toLowerCase() === email)
  }
  const key = phoneKey(value)
  if (!key) return []
  return customers.filter((customer) => phoneKey(customer.phone) === key)
}
