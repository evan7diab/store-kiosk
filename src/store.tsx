import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { defaultRanges, makeBrandId, seedDatabase } from "./data/seed"
import type { SpiritId } from "./data/spirits"
import { defaultMessaging } from "./lib/messaging"
import type { Campaign, Customer, CustomerInput, Database, MessagingSettings, Receipt, ReceiptRange } from "./types"

const STORAGE_KEY = "circus-portal-db-v1"

type SavedDatabase = Omit<Partial<Database>, "version" | "ranges" | "receipts"> & {
  version?: number
  ranges?: unknown[]
  receipts?: unknown[]
}

function wholeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

function normalizeCustomer(customer: Customer): Customer {
  return {
    ...customer,
    points: wholeScore(customer.points),
    rewards: wholeScore(customer.rewards),
  }
}

function normalizeRange(value: unknown): ReceiptRange | null {
  if (!value || typeof value !== "object") return null
  const range = value as Partial<ReceiptRange>
  if (typeof range.id !== "string" || !range.id || typeof range.label !== "string") return null
  if (typeof range.points !== "number" || typeof range.rewards !== "number") return null
  return {
    id: range.id,
    label: range.label,
    points: wholeScore(range.points),
    rewards: wholeScore(range.rewards),
  }
}

function normalizeReceipt(value: unknown): Receipt | null {
  if (!value || typeof value !== "object") return null
  const receipt = value as Partial<Receipt>
  if (typeof receipt.id !== "string" || typeof receipt.customerId !== "string") return null
  if (typeof receipt.rangeId !== "string" || typeof receipt.rangeLabel !== "string") return null
  if (typeof receipt.createdAt !== "string") return null
  if (typeof receipt.points !== "number" || typeof receipt.rewards !== "number") return null
  return {
    id: receipt.id,
    customerId: receipt.customerId,
    rangeId: receipt.rangeId,
    rangeLabel: receipt.rangeLabel,
    points: wholeScore(receipt.points),
    rewards: wholeScore(receipt.rewards),
    cashierId: typeof receipt.cashierId === "string" ? receipt.cashierId : null,
    createdAt: receipt.createdAt,
  }
}

function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDatabase()
    const parsed = JSON.parse(raw) as SavedDatabase
    if ((parsed.version !== 2 && parsed.version !== 3) || !Array.isArray(parsed.customers) || !Array.isArray(parsed.brands)) {
      return seedDatabase()
    }
    return {
      version: 3,
      customers: parsed.customers.map(normalizeCustomer),
      cashiers: Array.isArray(parsed.cashiers) ? parsed.cashiers : [],
      brands: parsed.brands,
      campaigns: (parsed.campaigns ?? []).map((campaign) => ({
        ...campaign,
        images: campaign.images ?? [],
      })),
      ranges: Array.isArray(parsed.ranges)
        ? parsed.ranges.flatMap((range) => {
            const next = normalizeRange(range)
            return next ? [next] : []
          })
        : defaultRanges(),
      receipts: Array.isArray(parsed.receipts)
        ? parsed.receipts.flatMap((receipt) => {
            const next = normalizeReceipt(receipt)
            return next ? [next] : []
          })
        : [],
      activeCashierId: parsed.activeCashierId ?? null,
      messaging: {
        ...defaultMessaging(),
        ...parsed.messaging,
        storageKind: parsed.messaging?.storageKind === "bucket" ? "bucket" : "directory",
      },
    }
  } catch {
    return seedDatabase()
  }
}

type RangeInput = {
  label: string
  points: number
  rewards: number
}

export type ReceiptAward = {
  rangeLabel: string
  points: number
  rewards: number
  totalPoints: number
  totalRewards: number
}

function cleanRange(input: RangeInput): RangeInput | null {
  const label = input.label.trim()
  if (!label) return null
  if (!Number.isInteger(input.points) || input.points < 0) return null
  if (!Number.isInteger(input.rewards) || input.rewards < 0) return null
  return { label, points: input.points, rewards: input.rewards }
}

type Store = Database & {
  addCustomer: (input: CustomerInput) => "created" | "updated"
  setActiveCashier: (id: string | null) => void
  addCashier: (name: string) => void
  setCashierActive: (id: string, active: boolean) => void
  addBrand: (spiritId: SpiritId, name: string) => void
  removeBrand: (id: string) => void
  addCampaign: (input: Omit<Campaign, "id" | "createdAt">) => void
  updateMessaging: (settings: MessagingSettings) => void
  addRange: (input: RangeInput) => void
  updateRange: (id: string, input: RangeInput) => void
  removeRange: (id: string) => void
  moveRange: (id: string, direction: -1 | 1) => void
  logReceipt: (customerId: string, rangeId: string) => ReceiptAward | null
  resetDemo: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(loadDatabase)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  }, [db])

  const value: Store = {
    ...db,
    messaging: { ...defaultMessaging(), ...db.messaging },
    addCustomer: (input) => {
      const email = input.email.trim().toLowerCase()
      const exists = db.customers.some((customer) => customer.email.toLowerCase() === email)
      const now = new Date().toISOString()
      setDb((prev) => {
        const match = prev.customers.find((customer) => customer.email.toLowerCase() === email)
        if (match) {
          return {
            ...prev,
            customers: prev.customers.map((customer) =>
              customer.id === match.id
                ? {
                    ...customer,
                    name: input.name.trim(),
                    email: input.email.trim(),
                    phone: input.phone.trim(),
                    birthday: input.birthday,
                    spiritIds: input.spiritIds,
                    brandIds: input.brandIds,
                    cashierId: input.cashierId,
                    locale: input.locale,
                    consentAt: now,
                    updatedAt: now,
                  }
                : customer,
            ),
          }
        }
        return {
          ...prev,
          customers: [
            {
              id: crypto.randomUUID(),
              name: input.name.trim(),
              email: input.email.trim(),
              phone: input.phone.trim(),
              birthday: input.birthday,
              spiritIds: input.spiritIds,
              brandIds: input.brandIds,
              cashierId: input.cashierId,
              locale: input.locale,
              consentAt: now,
              points: 0,
              rewards: 0,
              createdAt: now,
              updatedAt: now,
            },
            ...prev.customers,
          ],
        }
      })
      return exists ? "updated" : "created"
    },
    setActiveCashier: (id) => setDb((prev) => ({ ...prev, activeCashierId: id })),
    addCashier: (name) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setDb((prev) => {
        const duplicate = prev.cashiers.some(
          (cashier) => cashier.name.toLowerCase() === trimmed.toLowerCase(),
        )
        if (duplicate) return prev
        return {
          ...prev,
          cashiers: [...prev.cashiers, { id: crypto.randomUUID(), name: trimmed, active: true }],
        }
      })
    },
    setCashierActive: (id, active) =>
      setDb((prev) => ({
        ...prev,
        activeCashierId: !active && prev.activeCashierId === id ? null : prev.activeCashierId,
        cashiers: prev.cashiers.map((cashier) => (cashier.id === id ? { ...cashier, active } : cashier)),
      })),
    addBrand: (spiritId, name) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setDb((prev) => {
        const duplicate = prev.brands.some(
          (brand) => brand.spiritId === spiritId && brand.name.toLowerCase() === trimmed.toLowerCase(),
        )
        if (duplicate) return prev
        return {
          ...prev,
          brands: [...prev.brands, { id: makeBrandId(spiritId, trimmed), spiritId, name: trimmed }],
        }
      })
    },
    removeBrand: (id) =>
      setDb((prev) => ({ ...prev, brands: prev.brands.filter((brand) => brand.id !== id) })),
    addCampaign: (input) =>
      setDb((prev) => ({
        ...prev,
        campaigns: [
          {
            ...input,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          },
          ...prev.campaigns,
        ],
      })),
    updateMessaging: (settings) => setDb((prev) => ({ ...prev, messaging: settings })),
    addRange: (input) => {
      const next = cleanRange(input)
      if (!next) return
      setDb((prev) => ({
        ...prev,
        ranges: [...prev.ranges, { id: crypto.randomUUID(), ...next }],
      }))
    },
    updateRange: (id, input) => {
      const next = cleanRange(input)
      if (!next) return
      setDb((prev) => ({
        ...prev,
        ranges: prev.ranges.map((range) => (range.id === id ? { ...range, ...next } : range)),
      }))
    },
    removeRange: (id) =>
      setDb((prev) => ({ ...prev, ranges: prev.ranges.filter((range) => range.id !== id) })),
    moveRange: (id, direction) =>
      setDb((prev) => {
        const index = prev.ranges.findIndex((range) => range.id === id)
        const nextIndex = index + direction
        if (index < 0 || nextIndex < 0 || nextIndex >= prev.ranges.length) return prev
        const ranges = [...prev.ranges]
        const [item] = ranges.splice(index, 1)
        ranges.splice(nextIndex, 0, item)
        return { ...prev, ranges }
      }),
    logReceipt: (customerId, rangeId) => {
      const customer = db.customers.find((item) => item.id === customerId)
      const range = db.ranges.find((item) => item.id === rangeId)
      if (!customer || !range) return null
      const now = new Date().toISOString()
      setDb((prev) => {
        const current = prev.customers.find((item) => item.id === customerId)
        const currentRange = prev.ranges.find((item) => item.id === rangeId)
        if (!current || !currentRange) return prev
        return {
          ...prev,
          customers: prev.customers.map((item) =>
            item.id === customerId
              ? {
                  ...item,
                  points: item.points + currentRange.points,
                  rewards: item.rewards + currentRange.rewards,
                  updatedAt: now,
                }
              : item,
          ),
          receipts: [
            {
              id: crypto.randomUUID(),
              customerId,
              rangeId: currentRange.id,
              rangeLabel: currentRange.label,
              points: currentRange.points,
              rewards: currentRange.rewards,
              cashierId: prev.activeCashierId,
              createdAt: now,
            },
            ...prev.receipts,
          ],
        }
      })
      return {
        rangeLabel: range.label,
        points: range.points,
        rewards: range.rewards,
        totalPoints: customer.points + range.points,
        totalRewards: customer.rewards + range.rewards,
      }
    },
    resetDemo: () => {
      localStorage.removeItem(STORAGE_KEY)
      setDb(seedDatabase())
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be used within StoreProvider")
  return store
}
