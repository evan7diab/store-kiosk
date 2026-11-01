import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { SPIRITS, spiritName, type SpiritId } from "../data/spirits"
import { formatStamp } from "../lib/dates"
import { cashierName } from "../lib/people"
import { useStore } from "../store"
import { PageHeader, Tag } from "./AdminLayout"

export default function GuestsPage() {
  const { customers, cashiers } = useStore()
  const [query, setQuery] = useState("")
  const [spirit, setSpirit] = useState<SpiritId | "all">("all")

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...customers]
      .filter((customer) => {
        const hay = `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase()
        const matchesQuery = hay.includes(needle)
        const matchesSpirit = spirit === "all" || customer.spiritIds.includes(spirit)
        return matchesQuery && matchesSpirit
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [customers, query, spirit])

  return (
    <div>
      <PageHeader
        kicker="The list"
        title="Guests"
        action={
          <Link to="/admin/messages/new" className="bg-ink px-5 py-3 text-sm text-cream">
            New message
          </Link>
        }
      />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, email, or mobile"
        className="w-full border border-line bg-white px-4 py-3 text-lg outline-none"
      />
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <Filter on={spirit === "all"} onClick={() => setSpirit("all")}>
          All
        </Filter>
        {SPIRITS.map((item) => (
          <Filter key={item.id} on={spirit === item.id} onClick={() => setSpirit(item.id)}>
            {spiritName(item.id)}
          </Filter>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink/50">
        {filtered.length} {filtered.length === 1 ? "guest" : "guests"}
      </p>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {filtered.map((customer) => (
          <li key={customer.id}>
            <Link to={`/admin/customers/${customer.id}`} className="grid gap-2 py-4 md:grid-cols-[1.2fr_1fr_0.8fr_0.7fr] md:items-center">
              <span>
                <span className="block text-lg">{customer.name}</span>
                <span className="text-sm text-ink/55">{customer.email}</span>
              </span>
              <span className="flex flex-wrap gap-1">
                {customer.spiritIds.map((id) => (
                  <Tag key={id}>{spiritName(id)}</Tag>
                ))}
              </span>
              <span className="text-sm text-ink/70">{cashierName(cashiers, customer.cashierId)}</span>
              <span className="text-sm text-ink/45">{formatStamp(customer.updatedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? <p className="mt-6 text-ink/50">No guests match.</p> : null}
    </div>
  )
}

function Filter({ children, on, onClick }: { children: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-2 text-sm whitespace-nowrap ${on ? "border-ink bg-ink text-cream" : "border-line bg-white text-ink"}`}
    >
      {children}
    </button>
  )
}
