import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { SPIRITS, spiritName } from "../data/spirits"
import { daysUntilBirthday, isSameDay } from "../lib/dates"
import { guestsForSpirit } from "../lib/people"
import { useStore } from "../store"
import { PageHeader } from "./AdminLayout"

function localDay(iso: string) {
  const date = new Date(iso)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export default function OverviewPage() {
  const { customers, cashiers, receipts } = useStore()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const rangeStart = from && to && from > to ? to : from
  const rangeEnd = from && to && from > to ? from : to
  const cashierCounts = useMemo(() => {
    const registered = customers.filter((customer) => {
      const day = localDay(customer.createdAt)
      if (rangeStart && day < rangeStart) return false
      if (rangeEnd && day > rangeEnd) return false
      return true
    })
    const rows = cashiers.map((cashier) => ({
      id: cashier.id,
      name: cashier.name,
      count: registered.filter((customer) => customer.cashierId === cashier.id).length,
    }))
    const known = new Set(cashiers.map((cashier) => cashier.id))
    const unknown = registered.filter((customer) => !known.has(customer.cashierId)).length
    if (unknown > 0) rows.push({ id: "unknown", name: "Unknown", count: unknown })
    return rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [cashiers, customers, rangeEnd, rangeStart])
  const cashierMax = Math.max(...cashierCounts.map((row) => row.count), 1)
  const cashierTotal = cashierCounts.reduce((sum, row) => sum + row.count, 0)
  const today = customers.filter((customer) => isSameDay(customer.createdAt)).length
  const receiptsToday = receipts.filter((receipt) => isSameDay(receipt.createdAt))
  const pointsToday = receiptsToday.reduce((sum, receipt) => sum + receipt.points, 0)
  const counts = SPIRITS.map((spirit) => ({
    spirit,
    count: guestsForSpirit(customers, spirit.id).length,
  }))
  const top = counts.reduce((best, item) => (item.count > best.count ? item : best), counts[0])
  const max = Math.max(...counts.map((item) => item.count), 1)
  const birthdays = customers
    .map((customer) => ({ customer, days: daysUntilBirthday(customer.birthday) }))
    .filter((item) => item.days <= 45)
    .sort((a, b) => a.days - b.days)
  const recent = [...customers].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)

  return (
    <div>
      <PageHeader kicker="This store" title="Overview" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Guests" value={String(customers.length)} />
        <Stat label="Joined today" value={String(today)} />
        <Stat label="Receipts today" value={String(receiptsToday.length)} />
        <Stat label="Points today" value={String(pointsToday)} />
        <Stat label="Most loved" value={top && top.count > 0 ? spiritName(top.spirit.id) : "—"} />
      </div>

      <section className="mt-10 border border-line bg-white px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Cashiers</h2>
            <p className="mt-1 text-sm text-ink/55">
              {`${cashierTotal} ${cashierTotal === 1 ? "guest" : "guests"} registered${rangeStart || rangeEnd ? " in this range" : ""}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">
              From
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="mt-1 block border border-line bg-white px-3 py-2 text-sm normal-case tracking-normal text-ink"
              />
            </label>
            <label className="block text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">
              To
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="mt-1 block border border-line bg-white px-3 py-2 text-sm normal-case tracking-normal text-ink"
              />
            </label>
            {from || to ? (
              <button type="button" onClick={() => { setFrom(""); setTo("") }} className="px-3 py-2 text-sm text-ink/60 underline underline-offset-4">
                All dates
              </button>
            ) : null}
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {cashierCounts.map((row) => (
            <li key={row.id} className="grid grid-cols-[minmax(8rem,12rem)_1fr_2rem] items-center gap-3">
              <span>{row.name}</span>
              <span className="h-1 bg-paper-2">
                <span className="block h-1 bg-ink" style={{ width: `${(row.count / cashierMax) * 100}%` }} />
              </span>
              <span className="text-right font-display">{row.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="font-display text-2xl">What they drink</h2>
          <p className="mt-1 text-sm text-ink/55">A guest can sit in more than one group.</p>
          <ul className="mt-5 space-y-3">
            {counts.map((item) => (
              <li key={item.spirit.id}>
                <Link to={`/admin/segments/${item.spirit.id}`} className="grid grid-cols-[110px_1fr_2rem] items-center gap-3">
                  <span>{spiritName(item.spirit.id)}</span>
                  <span className="h-1 bg-paper-2">
                    <span className="block h-1 bg-ink" style={{ width: `${(item.count / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-display">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Birthdays</h2>
          <p className="mt-1 text-sm text-ink/55">Next 45 days.</p>
          {birthdays.length === 0 ? <p className="mt-5 text-ink/50">None coming up.</p> : null}
          <ul className="mt-4 divide-y divide-line">
            {birthdays.map((item) => (
              <li key={item.customer.id} className="flex items-baseline justify-between gap-4 py-3">
                <Link to={`/admin/customers/${item.customer.id}`} className="underline decoration-line underline-offset-4">
                  {item.customer.name}
                </Link>
                <span className="text-sm text-ink/55">{item.days === 0 ? "Today" : `${item.days} days`}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Latest guests</h2>
          <Link to="/admin/customers" className="text-sm underline underline-offset-4">
            All guests
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {recent.map((customer) => (
            <li key={customer.id}>
              <Link to={`/admin/customers/${customer.id}`} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                <span className="text-lg">{customer.name}</span>
                <span className="text-sm text-ink/55">
                  {customer.spiritIds.map((id) => spiritName(id)).join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-white px-5 py-5">
      <p className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  )
}
