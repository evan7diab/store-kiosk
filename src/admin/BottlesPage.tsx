import { useState } from "react"
import { SPIRITS, spiritName, type SpiritId } from "../data/spirits"
import { useStore } from "../store"
import { PageHeader } from "./AdminLayout"

export default function BottlesPage() {
  const { brands, addBrand, removeBrand } = useStore()
  const [drafts, setDrafts] = useState<Partial<Record<SpiritId, string>>>({})

  return (
    <div>
      <PageHeader kicker="Sample shelf" title="Bottles" />
      <p className="max-w-xl text-ink/60">
        The kiosk is not asking for bottles right now. These names stay here for the office. The six groups stay fixed.
      </p>
      <div className="mt-8 space-y-8">
        {SPIRITS.map((spirit) => {
          const rows = brands.filter((brand) => brand.spiritId === spirit.id)
          return (
            <section key={spirit.id} className="border border-line bg-white p-5">
              <h2 className="font-display text-3xl">{spiritName(spirit.id)}</h2>
              <ul className="mt-4 divide-y divide-line">
                {rows.map((brand) => (
                  <li key={brand.id} className="flex items-center justify-between gap-3 py-2">
                    <span>{brand.name}</span>
                    <button type="button" onClick={() => removeBrand(brand.id)} className="text-sm text-ink/50">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  addBrand(spirit.id, drafts[spirit.id] ?? "")
                  setDrafts((current) => ({ ...current, [spirit.id]: "" }))
                }}
              >
                <input
                  value={drafts[spirit.id] ?? ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [spirit.id]: event.target.value }))}
                  placeholder="Add a bottle"
                  className="min-w-0 flex-1 border border-line px-3 py-3 outline-none"
                />
                <button type="submit" className="bg-ink px-4 py-3 text-cream">
                  Add
                </button>
              </form>
            </section>
          )
        })}
      </div>
    </div>
  )
}
