import type { ReactNode } from "react"
import { NavLink, Outlet } from "react-router-dom"
import "./admin.css"

const links = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/customers", label: "Guests", end: false },
  { to: "/admin/segments", label: "Groups", end: false },
  { to: "/admin/messages", label: "Messages", end: false },
  { to: "/admin/catalog", label: "Bottles", end: false },
  { to: "/admin/staff", label: "Cashiers", end: false },
  { to: "/admin/settings", label: "Settings", end: false },
]

export default function AdminLayout() {
  return (
    <div className="admin surface-paper min-h-dvh bg-paper text-ink">
      <div className="admin-stripe" />
      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="bg-ink text-cream lg:sticky lg:top-[9px] lg:flex lg:h-[calc(100dvh-9px)] lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3 px-5 py-6">
              <img src={`${import.meta.env.BASE_URL}brand/clown-face.png`} alt="" className="h-12 w-auto" />
              <span className="flex flex-col leading-none">
                <strong className="font-display text-lg tracking-[0.04em] text-cream">CIRCUS LIQUOR</strong>
                <small className="mt-1.5 text-[9px] font-bold tracking-[0.22em] text-brass uppercase">
                  Since 1959
                </small>
              </span>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:px-3">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 text-sm font-semibold whitespace-nowrap ${isActive ? "bg-cream text-ink" : "text-cream/80 hover:bg-white/10"}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <NavLink to="/" className="hidden px-6 py-6 text-sm text-cream/60 lg:block">
            Back to doors
          </NavLink>
        </aside>
        <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function PageHeader({
  kicker,
  title,
  action,
}: {
  kicker?: string
  title: string
  action?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker ? <p className="text-[0.7rem] tracking-[0.18em] uppercase text-ink/45">{kicker}</p> : null}
        <h1 className="font-display text-4xl leading-tight font-medium sm:text-5xl">{title}</h1>
      </div>
      {action}
    </header>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold">
      {children}
    </span>
  )
}
