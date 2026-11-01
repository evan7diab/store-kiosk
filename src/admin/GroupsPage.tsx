import { Link, useParams } from "react-router-dom"
import { isSpiritId, SPIRITS, spiritName } from "../data/spirits"
import { guestsForBrand, guestsForSpirit } from "../lib/people"
import { useStore } from "../store"
import { PageHeader } from "./AdminLayout"

export default function GroupsPage() {
  const { spiritId } = useParams()
  if (spiritId) return <GroupDetail spiritId={spiritId} />
  return <GroupGrid />
}

function GroupGrid() {
  const { customers } = useStore()
  return (
    <div>
      <PageHeader kicker="Message a whole style" title="Groups" />
      <p className="max-w-xl text-ink/60">
        Everyone who picked tequila, whiskey, or any other style. A guest can be in more than one.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SPIRITS.map((spirit) => {
          const count = guestsForSpirit(customers, spirit.id).length
          return (
            <Link key={spirit.id} to={`/admin/segments/${spirit.id}`} className="border border-line bg-white p-5">
              <p className="font-display text-5xl">{count}</p>
              <p className="mt-2 text-lg">{spiritName(spirit.id)}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function GroupDetail({ spiritId }: { spiritId: string }) {
  const { customers, brands } = useStore()
  if (!isSpiritId(spiritId)) {
    return (
      <div>
        <p className="font-display text-4xl">That group does not exist.</p>
        <Link to="/admin/segments" className="mt-4 inline-block underline">
          All groups
        </Link>
      </div>
    )
  }

  const guests = guestsForSpirit(customers, spiritId)
  const bottleRows = brands
    .filter((brand) => brand.spiritId === spiritId)
    .map((brand) => ({ brand, count: guestsForBrand(customers, brand.id).length }))
    .sort((a, b) => b.count - a.count || a.brand.name.localeCompare(b.brand.name))
  const name = spiritName(spiritId)

  return (
    <div>
      <Link to="/admin/segments" className="text-sm text-ink/50 underline underline-offset-4">
        All groups
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] tracking-[0.18em] uppercase text-ink/45">{guests.length} guests</p>
          <h1 className="font-display text-5xl">{name}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/admin/messages/new?audience=spirit&id=${spiritId}&channel=sms`}
            className={`border border-ink px-4 py-3 text-sm ${guests.length === 0 ? "pointer-events-none opacity-30" : ""}`}
          >
            Text this group
          </Link>
          <Link
            to={`/admin/messages/new?audience=spirit&id=${spiritId}&channel=email`}
            className={`bg-ink px-4 py-3 text-sm text-cream ${guests.length === 0 ? "pointer-events-none opacity-30" : ""}`}
          >
            Email this group
          </Link>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl">Bottles</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {bottleRows.map((row) => (
          <li key={row.brand.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span>
              {row.brand.name}
              <span className="ml-3 text-sm text-ink/45">{row.count}</span>
            </span>
            <Link
              to={`/admin/messages/new?audience=brand&id=${row.brand.id}&channel=sms`}
              className={`text-sm underline underline-offset-4 ${row.count === 0 ? "pointer-events-none opacity-30" : ""}`}
            >
              Text these guests
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-display text-2xl">Guests</h2>
      {guests.length === 0 ? <p className="mt-3 text-ink/50">Nobody has picked {name.toLowerCase()} yet.</p> : null}
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {guests.map((guest) => (
          <li key={guest.id} className="py-3">
            <Link to={`/admin/customers/${guest.id}`} className="text-lg underline decoration-line underline-offset-4">
              {guest.name}
            </Link>
            <p className="text-sm text-ink/55">{guest.email}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
