import { useEffect, useState, type ReactNode } from "react"
import { useStore } from "../store"
import { PageHeader } from "./AdminLayout"

type RangeDraft = {
  label: string
  points: number
  rewards: number
}

function readScore(value: string) {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  return Number(trimmed)
}

function readRange(label: string, points: string, rewards: string): RangeDraft | null {
  const trimmed = label.trim()
  const parsedPoints = readScore(points)
  const parsedRewards = readScore(rewards)
  if (!trimmed || parsedPoints === null || parsedRewards === null) return null
  return { label: trimmed, points: parsedPoints, rewards: parsedRewards }
}

function rangeError(label: string, points: string, rewards: string) {
  if (!label.trim()) return "Add a label."
  if (readScore(points) === null || readScore(rewards) === null) return "Use whole numbers for points and rewards."
  return "Check the range and try again."
}

export default function RangesPage() {
  const { ranges, addRange, updateRange, removeRange, moveRange } = useStore()
  const [label, setLabel] = useState("")
  const [points, setPoints] = useState("")
  const [rewards, setRewards] = useState("")
  const [error, setError] = useState("")

  return (
    <div>
      <PageHeader kicker="On the iPad" title="Ranges" />
      <p className="max-w-2xl text-ink/60">
        The iPad shows these ranges when a returning guest logs a receipt. Each pick adds that range's points and
        rewards. A change applies to the next receipt.
      </p>
      <form
        className="mt-6 flex max-w-3xl flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const next = readRange(label, points, rewards)
          if (!next) {
            setError(rangeError(label, points, rewards))
            return
          }
          addRange(next)
          setLabel("")
          setPoints("")
          setRewards("")
          setError("")
        }}
      >
        <Field label="Range" className="min-w-[12rem] flex-1">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="10-50"
            className={controlClass}
          />
        </Field>
        <Field label="Points">
          <input
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            inputMode="numeric"
            placeholder="10"
            className={`${controlClass} w-28`}
          />
        </Field>
        <Field label="Rewards">
          <input
            value={rewards}
            onChange={(event) => setRewards(event.target.value)}
            inputMode="numeric"
            placeholder="1"
            className={`${controlClass} w-28`}
          />
        </Field>
        <button type="submit" className="bg-ink px-4 py-3 text-cream">
          Add
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-brass-deep">{error}</p> : null}
      {ranges.length === 0 ? <p className="mt-8 text-ink/50">No ranges yet. The iPad has nothing to offer.</p> : null}
      <ul className="mt-6 max-w-3xl divide-y divide-line border-y border-line">
        {ranges.map((range, index) => (
          <RangeEditor
            key={range.id}
            label={range.label}
            points={range.points}
            rewards={range.rewards}
            index={index}
            count={ranges.length}
            onSave={(next) => updateRange(range.id, next)}
            onRemove={() => removeRange(range.id)}
            onMove={(direction) => moveRange(range.id, direction)}
          />
        ))}
      </ul>
    </div>
  )
}

function RangeEditor({
  label: initialLabel,
  points: initialPoints,
  rewards: initialRewards,
  index,
  count,
  onSave,
  onRemove,
  onMove,
}: {
  label: string
  points: number
  rewards: number
  index: number
  count: number
  onSave: (next: RangeDraft) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}) {
  const [label, setLabel] = useState(initialLabel)
  const [points, setPoints] = useState(String(initialPoints))
  const [rewards, setRewards] = useState(String(initialRewards))
  const [error, setError] = useState("")

  useEffect(() => {
    setLabel(initialLabel)
    setPoints(String(initialPoints))
    setRewards(String(initialRewards))
    setError("")
  }, [initialLabel, initialPoints, initialRewards])

  return (
    <li className="py-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const next = readRange(label, points, rewards)
          if (!next) {
            setError(rangeError(label, points, rewards))
            return
          }
          setError("")
          onSave(next)
        }}
      >
        <Field label="Range" className="min-w-[12rem] flex-1">
          <input value={label} onChange={(event) => setLabel(event.target.value)} className={controlClass} />
        </Field>
        <Field label="Points">
          <input
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            inputMode="numeric"
            className={`${controlClass} w-28`}
          />
        </Field>
        <Field label="Rewards">
          <input
            value={rewards}
            onChange={(event) => setRewards(event.target.value)}
            inputMode="numeric"
            className={`${controlClass} w-28`}
          />
        </Field>
        <button type="submit" className="bg-ink px-4 py-3 text-sm text-cream">
          Save
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="border border-line px-3 py-3 text-sm disabled:opacity-40"
        >
          Up
        </button>
        <button
          type="button"
          disabled={index === count - 1}
          onClick={() => onMove(1)}
          className="border border-line px-3 py-3 text-sm disabled:opacity-40"
        >
          Down
        </button>
        <button type="button" onClick={onRemove} className="px-3 py-3 text-sm text-ink/60 underline underline-offset-4">
          Remove
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-brass-deep">{error}</p> : null}
    </li>
  )
}

const controlClass = "mt-1 block border border-line bg-white px-3 py-3 text-base normal-case tracking-normal text-ink outline-none"

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block text-[0.7rem] tracking-[0.16em] uppercase text-ink/45 ${className ?? ""}`}>
      {label}
      {children}
    </label>
  )
}
