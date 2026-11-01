import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { SPIRITS, type Locale, type SpiritId } from "../data/spirits"
import { copy, MONTHS, nextGuestLabel } from "../i18n"
import { daysInMonth, formatBirthdayShort, isAtLeastAge, isoBirthday, yearOptions } from "../lib/dates"
import { initials, validEmail, validPhone } from "../lib/people"
import { useStore } from "../store"
import type { Cashier } from "../types"
import "./kiosk.css"

const EMAIL_DOMAINS = ["@yahoo.com", "@gmail.com", "@outlook.com", "@icloud.com", "@hotmail.com"]

function emailWithDomain(value: string, domain: string) {
  const at = value.indexOf("@")
  const local = (at === -1 ? value : value.slice(0, at)).trim()
  return `${local}${domain}`
}

type Step = "details" | "drinks" | "bottles" | "confirm" | "thanks"
type SheetMode = "browse" | "submit" | null

type Draft = {
  first: string
  last: string
  email: string
  phone: string
  month: string
  day: string
  year: string
  spiritIds: SpiritId[]
  brandIds: string[]
}

const emptyDraft: Draft = {
  first: "",
  last: "",
  email: "",
  phone: "",
  month: "",
  day: "",
  year: "",
  spiritIds: [],
  brandIds: [],
}

const steps: Step[] = ["details", "drinks", "bottles", "confirm"]

export default function Kiosk() {
  const store = useStore()
  const [locale, setLocale] = useState<Locale>("en")
  const [step, setStep] = useState<Step>("details")
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [consent, setConsent] = useState(false)
  const [ofAge, setOfAge] = useState(false)
  const [result, setResult] = useState<"created" | "updated">("created")
  const text = copy[locale]
  const activeCashier = store.cashiers.find((cashier) => cashier.id === store.activeCashierId && cashier.active)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    stepsRef.current?.scrollTo(0, 0)
  }, [step])

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      root.style.overflow = previous
      document.body.style.overflow = ""
    }
  }, [])

  const reset = useCallback(() => {
    setDraft(emptyDraft)
    setErrors({})
    setConsent(false)
    setOfAge(false)
    setStep("details")
    setSheet(null)
  }, [])

  function finish(cashierId: string) {
    const birthday = isoBirthday(draft.year, draft.month, draft.day)
    if (!birthday) return
    const allowed = new Set(
      store.brands.filter((brand) => draft.spiritIds.includes(brand.spiritId)).map((brand) => brand.id),
    )
    const status = store.addCustomer({
      name: `${draft.first.trim()} ${draft.last.trim()}`,
      email: draft.email,
      phone: draft.phone,
      birthday,
      spiritIds: SPIRITS.filter((spirit) => draft.spiritIds.includes(spirit.id)).map((spirit) => spirit.id),
      brandIds: draft.brandIds.filter((id) => allowed.has(id)),
      cashierId,
      locale,
    })
    setResult(status)
    setStep("thanks")
  }

  function pickCashier(id: string) {
    store.setActiveCashier(id)
    const mode = sheet
    setSheet(null)
    if (mode === "submit") finish(id)
  }

  function toggleSpirit(id: SpiritId) {
    setDraft((current) => {
      const spiritIds = current.spiritIds.includes(id)
        ? current.spiritIds.filter((spiritId) => spiritId !== id)
        : [...current.spiritIds, id]
      const brandIds = current.brandIds.filter((brandId) => {
        const brand = store.brands.find((item) => item.id === brandId)
        return brand ? spiritIds.includes(brand.spiritId) : false
      })
      return { ...current, spiritIds, brandIds }
    })
    setErrors({})
  }

  function toggleBrand(id: string) {
    setDraft((current) => ({
      ...current,
      brandIds: current.brandIds.includes(id)
        ? current.brandIds.filter((brandId) => brandId !== id)
        : [...current.brandIds, id],
    }))
  }

  function continueFromDetails() {
    const nextErrors: Record<string, string> = {}
    if (!draft.first.trim()) nextErrors.first = text.firstError
    if (!draft.last.trim()) nextErrors.last = text.lastError
    if (!validEmail(draft.email)) nextErrors.email = text.emailError
    if (!validPhone(draft.phone)) nextErrors.phone = text.phoneError
    const birthday = isoBirthday(draft.year, draft.month, draft.day)
    if (!birthday) nextErrors.birthday = text.birthdayError
    else if (!isAtLeastAge(birthday, 21)) nextErrors.birthday = text.ageError
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setStep("drinks")
  }

  function continueFromDrinks() {
    if (draft.spiritIds.length === 0) {
      setErrors({ drinks: text.drinkError })
      return
    }
    setErrors({})
    setStep("bottles")
  }

  function submit() {
    if (!consent || !ofAge) {
      setErrors({ confirm: text.checkError })
      return
    }
    const birthday = isoBirthday(draft.year, draft.month, draft.day)
    if (!birthday || !isAtLeastAge(birthday, 21)) {
      setErrors({ confirm: text.ageError })
      return
    }
    if (!activeCashier) {
      setSheet("submit")
      return
    }
    finish(activeCashier.id)
  }

  const stepIndex = Math.max(steps.indexOf(step), 0)
  const titles: Record<Exclude<Step, "thanks">, { title: string; hint: string }> = {
    details: { title: text.detailsTitle, hint: text.detailsHint },
    drinks: { title: text.drinksTitle, hint: text.drinksHint },
    bottles: { title: text.bottlesTitle, hint: text.bottlesHint },
    confirm: { title: text.confirmTitle, hint: text.confirmHint },
  }
  const current = step === "thanks" ? null : titles[step]
  const primaryLabel =
    step === "confirm" ? text.complete : step === "bottles" && draft.brandIds.length === 0 ? text.skip : text.continue

  return (
    <div className="ck">
      <div className="ck-top" />
      <header className="ck-head">
        <div className="ck-logo">
          <img className="ck-face" src={`${import.meta.env.BASE_URL}brand/clown-face.png`} alt="" />
          <span className="ck-brand">
            <strong>CIRCUS LIQUOR</strong>
            <small>{locale === "es" ? "Desde 1959 · California" : "Since 1959 · California"}</small>
          </span>
        </div>
        <button type="button" className="ck-pill" onClick={() => setSheet("browse")}>
          {activeCashier ? <i className="ck-dot" /> : null}
          {activeCashier ? activeCashier.name : text.chooseCashier}
        </button>
      </header>

      <main className="ck-wrap">
        <section className="ck-kiosk">
          <aside className="ck-side">
            <div className="ck-lang" role="group" aria-label={locale === "es" ? "Idioma" : "Language"}>
              <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>
                English
              </button>
              <button type="button" className={locale === "es" ? "active" : ""} onClick={() => setLocale("es")}>
                Español
              </button>
            </div>
            <div className="ck-sidecontent">
              <div className="ck-eyebrow">{text.sideEyebrow}</div>
              <div className="ck-copy">
                <h1>
                  {text.sideLine1}
                  <br />
                  <em>{text.sideEm}</em>
                  <br />
                  {text.sideLine2}
                </h1>
                <div className="ck-sep" />
                <p>{text.sideBody}</p>
              </div>
              <img className="ck-mascot" src={`${import.meta.env.BASE_URL}brand/mascot.png`} alt="Circus Liquor" />
            </div>
            <div className="ck-sidefoot">
              <div className="ck-shield">♧</div>
              <span>
                {text.sideCare}
                <br />
                {text.sideCare2}
              </span>
            </div>
          </aside>

          <div className="ck-panel">
            {step === "thanks" ? (
              <Success locale={locale} result={result} name={draft.first.trim()} onDone={reset} />
            ) : (
              <>
                <div className="ck-progress">
                  {text.progress}
                  <span className="ck-count">
                    {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                  </span>
                  <div className="ck-bar">
                    <i style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
                  </div>
                </div>
                <h2>{current?.title}</h2>
                <p className="ck-intro">{current?.hint}</p>
                <div className="ck-steps" ref={stepsRef}>
                {step === "details" ? <DetailsStep locale={locale} draft={draft} setDraft={setDraft} errors={errors} /> : null}
                {step === "drinks" ? (
                  <DrinksStep locale={locale} selected={draft.spiritIds} error={errors.drinks} onToggle={toggleSpirit} />
                ) : null}
                {step === "bottles" ? (
                  <BottlesStep locale={locale} spiritIds={draft.spiritIds} brandIds={draft.brandIds} onToggle={toggleBrand} />
                ) : null}
                {step === "confirm" ? (
                  <ConfirmStep
                    locale={locale}
                    draft={draft}
                    cashier={activeCashier}
                    consent={consent}
                    ofAge={ofAge}
                    error={errors.confirm}
                    onConsent={setConsent}
                    onAge={setOfAge}
                    onCashier={() => setSheet("browse")}
                  />
                ) : null}
                </div>

                <div className="ck-action">
                  <button
                    type="button"
                    className="ck-secondary"
                    onClick={() => {
                      setErrors({})
                      if (step === "details") reset()
                      else setStep(steps[stepIndex - 1] ?? "details")
                    }}
                  >
                    {step === "details" ? text.clear : text.back}
                  </button>
                  <button
                    type="button"
                    className="ck-primary"
                    onClick={() => {
                      if (step === "details") continueFromDetails()
                      else if (step === "drinks") continueFromDrinks()
                      else if (step === "bottles") setStep("confirm")
                      else submit()
                    }}
                  >
                    {primaryLabel} &nbsp; →
                  </button>
                </div>
                <p className="ck-micro">
                  {locale === "es" ? "Paso " : "Step "}
                  {stepIndex + 1} / {steps.length}
                </p>
              </>
            )}
          </div>
        </section>
        <div className="ck-footer">CIRCUS LIQUOR · KIOSK · 2026</div>
      </main>

      {sheet ? (
        <CashierSheet
          locale={locale}
          cashiers={store.cashiers.filter((cashier) => cashier.active)}
          selectedId={store.activeCashierId}
          onClose={() => setSheet(null)}
          onPick={pickCashier}
        />
      ) : null}
    </div>
  )
}

function DetailsStep({
  locale,
  draft,
  setDraft,
  errors,
}: {
  locale: Locale
  draft: Draft
  setDraft: Dispatch<SetStateAction<Draft>>
  errors: Record<string, string>
}) {
  const text = copy[locale]
  const dayCount = daysInMonth(draft.year, draft.month)
  const years = useMemo(() => yearOptions(), [])
  const emailRef = useRef<HTMLInputElement>(null)
  const [picker, setPicker] = useState<null | "month" | "day" | "year">(null)
  const selectedDomain = EMAIL_DOMAINS.find((domain) => draft.email.toLowerCase().endsWith(domain))

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function chooseMonth(value: string) {
    const max = daysInMonth(draft.year, value)
    setDraft((current) => ({
      ...current,
      month: value,
      day: current.day && Number(current.day) > max ? "" : current.day,
    }))
    setPicker(null)
  }

  function chooseYear(value: string) {
    const max = daysInMonth(value, draft.month)
    setDraft((current) => ({
      ...current,
      year: value,
      day: current.day && Number(current.day) > max ? "" : current.day,
    }))
    setPicker(null)
  }

  function chooseDomain(domain: string) {
    const next = emailWithDomain(draft.email, domain)
    set("email", next)
    const at = next.indexOf("@")
    requestAnimationFrame(() => {
      const input = emailRef.current
      if (!input) return
      input.focus()
      const caret = at <= 0 ? 0 : next.length
      input.setSelectionRange(caret, caret)
    })
  }

  return (
    <>
      <div className="ck-row">
        <Field label={text.first} required error={errors.first}>
          <input
            value={draft.first}
            placeholder={text.firstPlaceholder}
            autoComplete="off"
            autoCapitalize="words"
            className={errors.first ? "invalid" : ""}
            onChange={(event) => set("first", event.target.value)}
          />
        </Field>
        <Field label={text.last} required error={errors.last}>
          <input
            value={draft.last}
            placeholder={text.lastPlaceholder}
            autoComplete="off"
            autoCapitalize="words"
            className={errors.last ? "invalid" : ""}
            onChange={(event) => set("last", event.target.value)}
          />
        </Field>
      </div>
      <Field label={text.email} required error={errors.email}>
        <input
          ref={emailRef}
          type="email"
          value={draft.email}
          placeholder={text.emailPlaceholder}
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          className={errors.email ? "invalid" : ""}
          onChange={(event) => set("email", event.target.value)}
        />
        <div className="ck-domains" role="group" aria-label={text.email}>
          {EMAIL_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              className={selectedDomain === domain ? "active" : ""}
              onClick={() => chooseDomain(domain)}
            >
              {domain}
            </button>
          ))}
        </div>
      </Field>
      <Field label={text.phone} required error={errors.phone}>
        <input
          type="tel"
          value={draft.phone}
          placeholder={text.phonePlaceholder}
          inputMode="tel"
          autoComplete="off"
          className={errors.phone ? "invalid" : ""}
          onChange={(event) => set("phone", event.target.value)}
        />
      </Field>
      <div className={errors.birthday ? "ck-field haserror" : "ck-field"}>
        <span className="ck-label">
          {text.birthday} <span className="ck-req">*</span>
        </span>
        <div className="ck-row ck-birth">
          <button
            type="button"
            className={`ck-birthbtn${draft.month ? "" : " is-empty"}${errors.birthday ? " invalid" : ""}`}
            aria-haspopup="dialog"
            onClick={() => setPicker("month")}
          >
            {draft.month ? MONTHS[locale][Number(draft.month) - 1] : text.month}
          </button>
          <button
            type="button"
            className={`ck-birthbtn${draft.day ? "" : " is-empty"}${errors.birthday ? " invalid" : ""}`}
            aria-haspopup="dialog"
            onClick={() => setPicker("day")}
          >
            {draft.day || text.day}
          </button>
          <button
            type="button"
            className={`ck-birthbtn${draft.year ? "" : " is-empty"}${errors.birthday ? " invalid" : ""}`}
            aria-haspopup="dialog"
            onClick={() => setPicker("year")}
          >
            {draft.year || text.year}
          </button>
        </div>
        <div className="ck-err">{errors.birthday}</div>
      </div>
      {picker ? (
        <DateSheet
          part={picker}
          locale={locale}
          value={picker === "month" ? draft.month : picker === "day" ? draft.day : draft.year}
          years={years}
          dayCount={dayCount}
          onClose={() => setPicker(null)}
          onPick={(value) => {
            if (picker === "month") chooseMonth(value)
            else if (picker === "day") {
              set("day", value)
              setPicker(null)
            } else chooseYear(value)
          }}
        />
      ) : null}
    </>
  )
}

function DrinksStep({
  locale,
  selected,
  error,
  onToggle,
}: {
  locale: Locale
  selected: SpiritId[]
  error?: string
  onToggle: (id: SpiritId) => void
}) {
  return (
    <>
      <div className="ck-picks">
        {SPIRITS.map((spirit) => {
          const on = selected.includes(spirit.id)
          return (
            <button key={spirit.id} type="button" aria-pressed={on} className={on ? "ck-pick on" : "ck-pick"} onClick={() => onToggle(spirit.id)}>
              {spirit[locale]}
            </button>
          )
        })}
      </div>
      {error ? <div className="ck-err show">{error}</div> : null}
    </>
  )
}

function BottlesStep({
  locale,
  spiritIds,
  brandIds,
  onToggle,
}: {
  locale: Locale
  spiritIds: SpiritId[]
  brandIds: string[]
  onToggle: (id: string) => void
}) {
  const text = copy[locale]
  const { brands } = useStore()
  const chosen = SPIRITS.filter((spirit) => spiritIds.includes(spirit.id))

  return (
    <>
      {chosen.map((spirit) => {
        const options = brands.filter((brand) => brand.spiritId === spirit.id)
        return (
          <section key={spirit.id} className="ck-group">
            <h3>{spirit[locale]}</h3>
            {options.length === 0 ? <p className="ck-intro">{text.noneListed}</p> : null}
            <div className="ck-chips">
              {options.map((brand) => {
                const on = brandIds.includes(brand.id)
                return (
                  <button key={brand.id} type="button" aria-pressed={on} className={on ? "ck-chip on" : "ck-chip"} onClick={() => onToggle(brand.id)}>
                    {brand.name}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}

function ConfirmStep({
  locale,
  draft,
  cashier,
  consent,
  ofAge,
  error,
  onConsent,
  onAge,
  onCashier,
}: {
  locale: Locale
  draft: Draft
  cashier?: Cashier
  consent: boolean
  ofAge: boolean
  error?: string
  onConsent: (value: boolean) => void
  onAge: (value: boolean) => void
  onCashier: () => void
}) {
  const text = copy[locale]
  const { brands } = useStore()
  const birthday = isoBirthday(draft.year, draft.month, draft.day)
  const drinks = SPIRITS.filter((spirit) => draft.spiritIds.includes(spirit.id))
  const picked = brands.filter((brand) => draft.brandIds.includes(brand.id))

  return (
    <>
      <dl className="ck-summary">
        <div>
          <dt>{text.name}</dt>
          <dd>
            {draft.first} {draft.last}
          </dd>
        </div>
        <div>
          <dt>{text.email}</dt>
          <dd>{draft.email}</dd>
        </div>
        <div>
          <dt>{text.phone}</dt>
          <dd>{draft.phone}</dd>
        </div>
        <div>
          <dt>{text.birthday}</dt>
          <dd>{birthday ? formatBirthdayShort(birthday, locale) : "—"}</dd>
        </div>
        <div>
          <dt>{text.stepDrinks}</dt>
          <dd>{drinks.map((spirit) => spirit[locale]).join(", ")}</dd>
        </div>
        <div>
          <dt>{text.stepBottles}</dt>
          <dd>{picked.length ? picked.map((brand) => brand.name).join(", ") : text.noBottles}</dd>
        </div>
        <div>
          <dt>{text.signedWith}</dt>
          <dd>
            {cashier?.name ?? "—"}{" "}
            <button type="button" className="ck-change" onClick={onCashier}>
              {text.change}
            </button>
          </dd>
        </div>
      </dl>
      <label className="ck-choice">
        <input type="checkbox" checked={consent} onChange={(event) => onConsent(event.target.checked)} />
        <span>
          {text.consent} <span className="ck-req">*</span>
        </span>
      </label>
      <label className="ck-choice">
        <input type="checkbox" checked={ofAge} onChange={(event) => onAge(event.target.checked)} />
        <span>
          {text.age} <span className="ck-req">*</span>
        </span>
      </label>
      {error ? (
        <div className="ck-err show" role="alert">
          {error}
        </div>
      ) : null}
    </>
  )
}

function Success({
  locale,
  result,
  name,
  onDone,
}: {
  locale: Locale
  result: "created" | "updated"
  name: string
  onDone: () => void
}) {
  const text = copy[locale]
  const [left, setLeft] = useState(10)

  useEffect(() => {
    const tick = window.setInterval(() => setLeft((value) => value - 1), 1000)
    const done = window.setTimeout(onDone, 10000)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [onDone])

  const headline = result === "updated" ? text.thanksUpdated : text.welcomeAboard

  return (
    <div className="ck-success" aria-live="polite">
      <div className="ck-check">✓</div>
      <div className="ck-eyebrow" style={{ color: "#cf2034" }}>
        {text.thanksEyebrow}
      </div>
      <h2>{headline}</h2>
      <p>
        {name ? `${name}, ` : ""}
        {text.thanksSub}
      </p>
      <button type="button" className="ck-primary" onClick={onDone}>
        {text.registerAnother} →
      </button>
      <p className="ck-micro">{nextGuestLabel(locale, Math.max(left, 0))}</p>
    </div>
  )
}

function DateSheet({
  part,
  locale,
  value,
  years,
  dayCount,
  onClose,
  onPick,
}: {
  part: "month" | "day" | "year"
  locale: Locale
  value: string
  years: number[]
  dayCount: number
  onClose: () => void
  onPick: (value: string) => void
}) {
  const text = copy[locale]
  const title = part === "month" ? text.month : part === "day" ? text.day : text.year
  const selectedRef = useRef<HTMLButtonElement>(null)
  const options =
    part === "month"
      ? MONTHS[locale].map((label, index) => ({ value: String(index + 1), label }))
      : part === "day"
        ? Array.from({ length: dayCount }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))
        : years.map((year) => ({ value: String(year), label: String(year) }))

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    selectedRef.current?.scrollIntoView({ block: "center" })
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="ck-sheet" role="presentation" onClick={onClose}>
      <div
        className="ck-dialog ck-date-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="date-title">{title}</h2>
        <div className={`ck-dates ${part}`}>
          {options.map((option) => {
            const on = option.value === value
            return (
              <button
                key={option.value}
                ref={on ? selectedRef : undefined}
                type="button"
                className={on ? "ck-date on" : "ck-date"}
                onClick={() => onPick(option.value)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <div className="ck-action">
          <button type="button" className="ck-secondary" onClick={onClose}>
            {text.close}
          </button>
        </div>
      </div>
    </div>
  )
}

function CashierSheet({
  locale,
  cashiers,
  selectedId,
  onClose,
  onPick,
}: {
  locale: Locale
  cashiers: Cashier[]
  selectedId: string | null
  onClose: () => void
  onPick: (id: string) => void
}) {
  const text = copy[locale]

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="ck-sheet" role="presentation" onClick={onClose}>
      <div
        className="ck-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cashier-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="cashier-title">{text.chooseCashier}</h2>
        <p>{text.chooseCashierHint}</p>
        {cashiers.length === 0 ? (
          <p>{locale === "es" ? "Agrega cajeros desde la oficina." : "Add cashiers from the office dashboard."}</p>
        ) : null}
        <div className="ck-cashiers">
          {cashiers.map((cashier) => {
            const on = cashier.id === selectedId
            return (
              <button key={cashier.id} type="button" className={on ? "ck-cashier on" : "ck-cashier"} onClick={() => onPick(cashier.id)}>
                <span className="ck-mono">{initials(cashier.name)}</span>
                {cashier.name}
              </button>
            )
          })}
        </div>
        <div className="ck-action">
          <button type="button" className="ck-secondary" onClick={onClose}>
            {text.close}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <div className={error ? "ck-field haserror" : "ck-field"}>
      <label>
        {label} {required ? <span className="ck-req">*</span> : null}
      </label>
      {children}
      <div className="ck-err">{error}</div>
    </div>
  )
}
