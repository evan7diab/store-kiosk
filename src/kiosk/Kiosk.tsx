import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react"
import { SPIRITS, type Locale, type SpiritId } from "../data/spirits"
import { DrinkIcon } from "./drinkIcons"
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

type Step = "details" | "drinks" | "confirm" | "thanks"
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
}

const steps: Step[] = ["details", "drinks", "confirm"]
const flowOrder: Step[] = ["details", "drinks", "confirm", "thanks"]

const settle: Transition = { type: "spring", bounce: 0, visualDuration: 0.28 }
const fade: Transition = { duration: 0.2, ease: "easeOut" }

const stepShift = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
}

const KioskPortalContext = createContext<HTMLElement | null>(null)

function useStayAwake() {
  useEffect(() => {
    const available = "wakeLock" in navigator ? navigator.wakeLock : null
    if (!available) return
    const wakeLock = available

    let sentinel: WakeLockSentinel | null = null
    let pending = false
    let stopped = false
    let retry = 0

    async function acquire() {
      if (stopped || pending || sentinel || document.visibilityState !== "visible") return
      pending = true
      try {
        const next = await wakeLock.request("screen")
        if (stopped) {
          await next.release()
          return
        }
        sentinel = next
        next.addEventListener("release", () => {
          if (sentinel !== next) return
          sentinel = null
          if (stopped || document.visibilityState !== "visible") return
          window.clearTimeout(retry)
          retry = window.setTimeout(() => {
            void acquire()
          }, 1000)
        })
      } catch {
        // The iPad refuses the lock while the page is hidden or Low Power Mode is on.
      } finally {
        pending = false
      }
    }

    function onForeground() {
      void acquire()
    }

    void acquire()
    document.addEventListener("visibilitychange", onForeground)
    window.addEventListener("pointerdown", onForeground)

    return () => {
      stopped = true
      window.clearTimeout(retry)
      document.removeEventListener("visibilitychange", onForeground)
      window.removeEventListener("pointerdown", onForeground)
      const held = sentinel
      sentinel = null
      void held?.release().catch(() => {})
    }
  }, [])
}

export default function Kiosk() {
  useStayAwake()
  const store = useStore()
  const [locale, setLocale] = useState<Locale>("en")
  const [step, setStep] = useState<Step>("details")
  const [direction, setDirection] = useState(1)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sheet, setSheet] = useState<SheetMode>(null)
  const [consent, setConsent] = useState(false)
  const [ofAge, setOfAge] = useState(false)
  const [result, setResult] = useState<"created" | "updated">("created")
  const [portal, setPortal] = useState<HTMLDivElement | null>(null)
  const text = copy[locale]
  const activeCashier = store.cashiers.find((cashier) => cashier.id === store.activeCashierId && cashier.active)

  function goTo(next: Step) {
    setDirection(flowOrder.indexOf(next) >= flowOrder.indexOf(step) ? 1 : -1)
    setStep(next)
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

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
    setDirection(-1)
    setStep("details")
    setSheet(null)
  }, [])

  function finish(cashierId: string) {
    const birthday = isoBirthday(draft.year, draft.month, draft.day)
    if (!birthday) return
    const status = store.addCustomer({
      name: `${draft.first.trim()} ${draft.last.trim()}`,
      email: draft.email,
      phone: draft.phone,
      birthday,
      spiritIds: SPIRITS.filter((spirit) => draft.spiritIds.includes(spirit.id)).map((spirit) => spirit.id),
      brandIds: [],
      cashierId,
      locale,
    })
    setResult(status)
    goTo("thanks")
  }

  function pickCashier(id: string) {
    store.setActiveCashier(id)
    const mode = sheet
    setSheet(null)
    if (mode === "submit") finish(id)
  }

  function toggleSpirit(id: SpiritId) {
    setDraft((current) => ({
      ...current,
      spiritIds: current.spiritIds.includes(id)
        ? current.spiritIds.filter((spiritId) => spiritId !== id)
        : [...current.spiritIds, id],
    }))
    setErrors({})
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
    if (Object.keys(nextErrors).length === 0) goTo("drinks")
  }

  function continueFromDrinks() {
    if (draft.spiritIds.length === 0) {
      setErrors({ drinks: text.drinkError })
      return
    }
    setErrors({})
    goTo("confirm")
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
    confirm: { title: text.confirmTitle, hint: text.confirmHint },
  }
  const current = step === "thanks" ? null : titles[step]
  const primaryLabel = step === "confirm" ? text.complete : text.continue

  return (
    <MotionConfig reducedMotion="user">
    <KioskPortalContext.Provider value={portal}>
    <div className="ck" ref={setPortal}>
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
              {(["en", "es"] as const).map((code) => (
                <button key={code} type="button" className={locale === code ? "active" : ""} onClick={() => setLocale(code)}>
                  {locale === code ? <motion.span layoutId="ck-locale" className="ck-lang-pill" transition={settle} /> : null}
                  <span className="ck-lang-label">{code === "en" ? "English" : "Español"}</span>
                </button>
              ))}
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
            <AnimatePresence mode="wait" initial={false}>
              {step === "thanks" ? (
                <motion.div
                  key="thanks"
                  className="ck-stage"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade}
                >
                  <Success locale={locale} result={result} name={draft.first.trim()} onDone={reset} />
                </motion.div>
              ) : (
                <motion.div
                  key="flow"
                  className="ck-stage"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade}
                >
                  <div className="ck-progress">
                    {text.progress}
                    <span className="ck-count">
                      {String(stepIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                    </span>
                    <div className="ck-bar">
                      <motion.i
                        initial={false}
                        animate={{ scaleX: (stepIndex + 1) / steps.length }}
                        transition={settle}
                        style={{ width: "100%", originX: 0 }}
                      />
                    </div>
                  </div>
                  <div className="ck-flow">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                      <motion.div
                        key={step}
                        className="ck-step"
                        custom={direction}
                        variants={stepShift}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={settle}
                      >
                        <h2>{current?.title}</h2>
                        <p className="ck-intro">{current?.hint}</p>
                        <div className="ck-steps">
                          {step === "details" ? <DetailsStep locale={locale} draft={draft} setDraft={setDraft} errors={errors} /> : null}
                          {step === "drinks" ? (
                            <DrinksStep locale={locale} selected={draft.spiritIds} error={errors.drinks} onToggle={toggleSpirit} />
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
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="ck-action">
                    <button
                      type="button"
                      className="ck-secondary"
                      onClick={() => {
                        setErrors({})
                        if (step === "details") reset()
                        else goTo(steps[stepIndex - 1] ?? "details")
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
        <div className="ck-footer">CIRCUS LIQUOR · KIOSK · 2026</div>
      </main>

      <AnimatePresence>
        {sheet ? (
          <CashierSheet
            key="cashiers"
            locale={locale}
            cashiers={store.cashiers.filter((cashier) => cashier.active)}
            selectedId={store.activeCashierId}
            onClose={() => setSheet(null)}
            onPick={pickCashier}
          />
        ) : null}
      </AnimatePresence>
    </div>
    </KioskPortalContext.Provider>
    </MotionConfig>
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
              {selectedDomain === domain ? <motion.span layoutId="ck-domain" className="ck-domain-pill" transition={settle} /> : null}
              <span className="ck-lang-label">{domain}</span>
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
        <ErrorNote message={errors.birthday} />
      </div>
      <AnimatePresence>
        {picker ? (
          <DateSheet
            key={picker}
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
      </AnimatePresence>
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
            <motion.button
              key={spirit.id}
              type="button"
              aria-pressed={on}
              className={on ? "ck-pick on" : "ck-pick"}
              onClick={() => onToggle(spirit.id)}
              whileTap={{ scale: 0.97 }}
              transition={settle}
            >
              <span className="ck-pick-icon">
                <DrinkIcon id={spirit.id} />
              </span>
              <span className="ck-pick-name">{spirit[locale]}</span>
            </motion.button>
          )
        })}
      </div>
      <ErrorNote message={error} />
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
  const birthday = isoBirthday(draft.year, draft.month, draft.day)
  const drinks = SPIRITS.filter((spirit) => draft.spiritIds.includes(spirit.id))

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
      <ErrorNote message={error} />
    </>
  )
}

const RESET_SECONDS = 10
const RING_RADIUS = 42
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

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
  const [left, setLeft] = useState(RESET_SECONDS)

  useEffect(() => {
    const started = performance.now()
    const tick = window.setInterval(() => {
      const remaining = RESET_SECONDS * 1000 - (performance.now() - started)
      setLeft(Math.max(0, Math.ceil(remaining / 1000)))
    }, 200)
    const done = window.setTimeout(onDone, RESET_SECONDS * 1000)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [onDone])

  const headline = result === "updated" ? text.thanksUpdated : text.welcomeAboard
  const seconds = Math.max(left, 0)

  return (
    <div className="ck-success">
      <div className="ck-check" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path d="M14 25.2 21.2 32.2 34.8 16.8" />
        </svg>
      </div>
      <p className="ck-success-kicker">{text.thanksEyebrow}</p>
      <h2>{headline}</h2>
      <p className="ck-success-copy">
        {name ? `${name}, ` : ""}
        {text.thanksSub}
      </p>
      <div
        className="ck-timer"
        role="timer"
        aria-label={nextGuestLabel(locale, seconds)}
        style={{ ["--ck-circ" as string]: RING_LENGTH, ["--ck-reset" as string]: `${RESET_SECONDS}s` }}
      >
        <svg viewBox="0 0 108 108" aria-hidden="true">
          <circle className="ck-timer-track" cx="54" cy="54" r={RING_RADIUS} />
          <circle className="ck-timer-value" cx="54" cy="54" r={RING_RADIUS} />
        </svg>
        <span className="ck-timer-num">{seconds}</span>
      </div>
      <p className="ck-timer-label">{text.nextGuest}</p>
      <button type="button" className="ck-done" onClick={onDone}>
        {text.registerAnother}
        <span aria-hidden="true">→</span>
      </button>
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

  const portal = useContext(KioskPortalContext)
  if (!portal) return null

  return createPortal(
    <SheetSurface labelledBy="date-title" className="ck-date-dialog" onClose={onClose}>
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
    </SheetSurface>,
    portal,
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

  const portal = useContext(KioskPortalContext)
  if (!portal) return null

  return createPortal(
    <SheetSurface labelledBy="cashier-title" onClose={onClose}>
      <h2 id="cashier-title">{text.chooseCashier}</h2>
      <p>{text.chooseCashierHint}</p>
      {cashiers.length === 0 ? (
        <p>{locale === "es" ? "Agrega cajeros desde la oficina." : "Add cashiers from the office dashboard."}</p>
      ) : null}
      <div className="ck-cashiers">
        {cashiers.map((cashier) => {
          const on = cashier.id === selectedId
          return (
            <motion.button
              key={cashier.id}
              type="button"
              className={on ? "ck-cashier on" : "ck-cashier"}
              onClick={() => onPick(cashier.id)}
              whileTap={{ scale: 0.98 }}
              transition={settle}
            >
              <span className="ck-mono">{initials(cashier.name)}</span>
              {cashier.name}
            </motion.button>
          )
        })}
      </div>
      <div className="ck-action">
        <button type="button" className="ck-secondary" onClick={onClose}>
          {text.close}
        </button>
      </div>
    </SheetSurface>,
    portal,
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
      <ErrorNote message={error} />
    </div>
  )
}

function ErrorNote({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.div
          key="error"
          className="ck-err"
          role="alert"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{ overflow: "hidden" }}
        >
          <div className="ck-err-text">{message}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function SheetSurface({
  labelledBy,
  className,
  onClose,
  children,
}: {
  labelledBy: string
  className?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <motion.div
      className="ck-sheet"
      role="presentation"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
    >
      <motion.div
        className={className ? `ck-dialog ${className}` : "ck-dialog"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={settle}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
