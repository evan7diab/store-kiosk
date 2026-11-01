import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { makeBrandId, seedDatabase } from "./data/seed"
import type { SpiritId } from "./data/spirits"
import { defaultMessaging } from "./lib/messaging"
import type { Campaign, CustomerInput, Database, MessagingSettings } from "./types"

const STORAGE_KEY = "circus-portal-db-v1"

function loadDatabase(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDatabase()
    const parsed = JSON.parse(raw) as Database
    if (parsed.version !== 1 || !Array.isArray(parsed.customers) || !Array.isArray(parsed.brands)) {
      return seedDatabase()
    }
    return {
      ...parsed,
      campaigns: (parsed.campaigns ?? []).map((campaign) => ({
        ...campaign,
        images: campaign.images ?? [],
      })),
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

type Store = Database & {
  addCustomer: (input: CustomerInput) => "created" | "updated"
  setActiveCashier: (id: string | null) => void
  addCashier: (name: string) => void
  setCashierActive: (id: string, active: boolean) => void
  addBrand: (spiritId: SpiritId, name: string) => void
  removeBrand: (id: string) => void
  addCampaign: (input: Omit<Campaign, "id" | "createdAt">) => void
  updateMessaging: (settings: MessagingSettings) => void
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
