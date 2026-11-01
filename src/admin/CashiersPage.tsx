import { useState } from "react"
import { initials } from "../lib/people"
import { useStore } from "../store"
import { PageHeader } from "./AdminLayout"

export default function CashiersPage() {
  const { cashiers, addCashier, setCashierActive } = useStore()
  const [name, setName] = useState("")

  return (
    <div>
      <PageHeader kicker="On the floor" title="Cashiers" />
      <p className="max-w-xl text-ink/60">
        The iPad shows this list. Whoever is chosen on the welcome screen is saved with each new guest.
      </p>
      <form
        className="mt-6 flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          addCashier(name)
          setName("")
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Cashier name"
          className="min-w-0 flex-1 border border-line bg-white px-3 py-3 outline-none"
        />
        <button type="submit" className="bg-ink px-4 py-3 text-cream">
          Add
        </button>
      </form>
      <ul className="mt-6 max-w-xl divide-y divide-line border-y border-line">
        {cashiers.map((cashier) => (
          <li key={cashier.id} className="flex items-center justify-between gap-4 py-4">
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center bg-ink font-display text-cream">
                {initials(cashier.name)}
              </span>
              {cashier.name}
            </span>
            <button
              type="button"
              onClick={() => setCashierActive(cashier.id, !cashier.active)}
              className={`px-3 py-2 text-sm ${cashier.active ? "bg-ink text-cream" : "border border-line"}`}
            >
              {cashier.active ? "On the iPad" : "Hidden"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
