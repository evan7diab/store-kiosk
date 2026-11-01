import { Link, useParams } from "react-router-dom"
import { spiritName } from "../data/spirits"
import { daysUntilBirthday, formatBirthday, formatStamp } from "../lib/dates"
import { brandName, cashierName, scoreText } from "../lib/people"
import { useStore } from "../store"
import { Tag } from "./AdminLayout"

export default function CustomerPage() {
  const { id } = useParams()
  const { customers, cashiers, brands, receipts } = useStore()
  const customer = customers.find((item) => item.id === id)

  if (!customer) {
    return (
      <div>
        <p className="font-display text-4xl">This guest is not on the list.</p>
        <Link to="/admin/customers" className="mt-6 inline-block underline underline-offset-4">
          Back to guests
        </Link>
      </div>
    )
  }

  const days = daysUntilBirthday(customer.birthday)
  const bottles = customer.brandIds.map((brandId) => brandName(brands, brandId))
  const history = receipts
    .filter((receipt) => receipt.customerId === customer.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div>
      <Link to="/admin/customers" className="text-sm text-ink/50 underline underline-offset-4">
        All guests
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] tracking-[0.18em] uppercase text-ink/45">
            {customer.locale === "es" ? "Joined in Spanish" : "Joined in English"}
          </p>
          <h1 className="font-display text-5xl leading-tight">{customer.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/admin/messages/new?audience=customer&id=${customer.id}&channel=sms`}
            className="border border-ink px-4 py-3 text-sm"
          >
            Text
          </Link>
          <Link
            to={`/admin/messages/new?audience=customer&id=${customer.id}&channel=email`}
            className="bg-ink px-4 py-3 text-sm text-cream"
          >
            Email
          </Link>
        </div>
      </div>

      {days <= 45 ? (
        <p className="mt-4 text-brass-deep">
          Birthday {days === 0 ? "today" : `in ${days} days`}.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <dl className="divide-y divide-line border-y border-line">
          <Info label="Email" value={customer.email} />
          <Info label="Mobile" value={customer.phone} />
          <Info label="Birthday" value={formatBirthday(customer.birthday)} />
          <Info label="Cashier" value={cashierName(cashiers, customer.cashierId)} />
          <Info label="Points" value={String(customer.points)} />
          <Info label="Rewards" value={String(customer.rewards)} />
          <Info label="Joined" value={formatStamp(customer.createdAt)} />
          <Info label="Consent" value={formatStamp(customer.consentAt)} />
        </dl>
        <div>
          <h2 className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Drinks</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {customer.spiritIds.map((spiritId) => (
              <Link key={spiritId} to={`/admin/segments/${spiritId}`}>
                <Tag>{spiritName(spiritId)}</Tag>
              </Link>
            ))}
          </div>
          <h2 className="mt-8 text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Bottles</h2>
          {bottles.length === 0 ? <p className="mt-3 text-ink/50">No favorite bottles.</p> : null}
          <ul className="mt-3 space-y-2">
            {bottles.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Receipts</h2>
        {history.length === 0 ? <p className="mt-3 text-ink/50">No receipts yet.</p> : null}
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {history.map((receipt) => (
            <li key={receipt.id} className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr_10rem] sm:items-baseline">
              <span className="text-lg">{receipt.rangeLabel}</span>
              <span className="text-sm text-ink/70">
                {scoreText(receipt.points, receipt.rewards, true)}
                {receipt.cashierId ? ` · ${cashierName(cashiers, receipt.cashierId)}` : ""}
              </span>
              <span className="text-sm text-ink/45 sm:text-right">{formatStamp(receipt.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]">
      <dt className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
