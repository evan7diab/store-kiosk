import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { isSpiritId, SPIRITS, spiritName } from "../data/spirits"
import { emailFromLine, emailReady, imagePublicUrl, messageWithImages, smsReady, storagePlace, storedImageName } from "../lib/messaging"
import { audienceGuests, validEmail, validPhone } from "../lib/people"
import { useStore } from "../store"
import type { AudienceKind, Channel, MessageImage } from "../types"

type Phase = "edit" | "review" | "saved"
type DraftImage = MessageImage & { preview: string }

export default function ComposerPage() {
  const store = useStore()
  const [params] = useSearchParams()
  const [channel, setChannel] = useState<Channel>(params.get("channel") === "sms" ? "sms" : "email")
  const [kind, setKind] = useState<AudienceKind>(readKind(params.get("audience")))
  const [audienceId, setAudienceId] = useState(params.get("id") ?? "tequila")
  const [guestQuery, setGuestQuery] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [images, setImages] = useState<DraftImage[]>([])
  const [phase, setPhase] = useState<Phase>("edit")
  const fileRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const recipients = useMemo(
    () => audienceGuests(store.customers, kind, audienceId),
    [store.customers, kind, audienceId],
  )
  const label = audienceLabel(kind, audienceId, store)
  const guestMatches = store.customers.filter((customer) =>
    `${customer.name} ${customer.email}`.toLowerCase().includes(guestQuery.trim().toLowerCase()),
  )
  const subjectReady = channel === "sms" || subject.trim().length > 0
  const canReview = body.trim().length > 0 && subjectReady && recipients.length > 0 && label !== "Unknown"
  const providerReady = channel === "email" ? emailReady(store.messaging) : smsReady(store.messaging)
  const fromLine = channel === "email" ? emailFromLine(store.messaging) : store.messaging.smsFromNumber.trim()
  const skipped = recipients.filter((guest) => !guest.consentAt).length
  const testValue = channel === "email" ? store.messaging.testEmail : store.messaging.testPhone
  const testError =
    testValue.trim().length === 0
      ? ""
      : channel === "email"
        ? validEmail(testValue)
          ? ""
          : "Use a full email address."
        : validPhone(testValue)
          ? ""
          : "Use a full phone number."

  function setTestTarget(value: string) {
    store.updateMessaging({
      ...store.messaging,
      ...(channel === "email" ? { testEmail: value } : { testPhone: value }),
    })
  }

  const outgoing = messageWithImages(body, images)
  const publicBase = store.messaging.storagePublicUrl

  useEffect(() => {
    setImages((current) =>
      current.map((image) => ({ ...image, url: imagePublicUrl(publicBase, image.name) })),
    )
  }, [publicBase])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview))
    }
  }, [])

  function addImages(list: FileList | null) {
    if (!list) return
    setImages((current) => {
      const next = [...current]
      for (const file of list) {
        if (!file.type.startsWith("image/")) continue
        const name = storedImageName(file.name, next.map((image) => image.name))
        next.push({
          id: crypto.randomUUID(),
          name,
          url: imagePublicUrl(publicBase, name),
          preview: URL.createObjectURL(file),
        })
      }
      return next
    })
  }

  function removeImage(id: string) {
    setImages((current) => {
      const image = current.find((item) => item.id === id)
      if (image) URL.revokeObjectURL(image.preview)
      return current.filter((item) => item.id !== id)
    })
  }

  function save() {
    store.addCampaign({
      channel,
      audience: kind,
      audienceId,
      audienceLabel: label,
      subject: channel === "email" ? subject.trim() : "",
      body: body.trim(),
      recipientCount: recipients.length,
      images: images.map(({ id, name, url }) => ({ id, name, url })),
    })
    setPhase("saved")
  }

  if (phase === "saved") {
    return (
      <div className="max-w-xl">
        <p className="text-[0.7rem] tracking-[0.18em] uppercase text-ink/45">Saved in this browser</p>
        <h1 className="mt-2 font-display text-5xl leading-tight">Draft kept. Nothing was sent.</h1>
        <p className="mt-4 text-lg text-ink/65">
          {`${channel === "sms" ? "Text" : "Email"} for ${recipients.length} ${recipients.length === 1 ? "guest" : "guests"} in ${label}. Nothing was sent. Sending starts once the server is connected.`}
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/admin/messages" className="bg-ink px-5 py-3 text-cream">
            See drafts
          </Link>
          <button type="button" onClick={() => setPhase("edit")} className="px-5 py-3">
            Write another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/admin/messages" className="text-sm text-ink/50 underline underline-offset-4">
        All drafts
      </Link>
      <h1 className="mt-3 font-display text-5xl">{phase === "review" ? "Review" : "New message"}</h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        {`This saves a draft on this browser. Send stays off until the server can reach ${channel === "email" ? "Resend" : "Twilio"}.`}
      </p>
      {providerReady ? (
        <p className="mt-3 text-sm text-ink/70">From {fromLine || store.messaging.storeName}</p>
      ) : (
        <p className="mt-3 text-sm text-ink/70">
          {channel === "email" ? "Resend" : "Twilio"} is not set up.{" "}
          <Link to="/admin/settings" className="font-semibold underline underline-offset-4">
            Open settings
          </Link>
        </p>
      )}

      {phase === "edit" ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex gap-2">
              <Toggle on={channel === "sms"} onClick={() => setChannel("sms")}>
                Text
              </Toggle>
              <Toggle on={channel === "email"} onClick={() => setChannel("email")}>
                Email
              </Toggle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Toggle
                on={kind === "customer"}
                onClick={() => {
                  setKind("customer")
                  if (!store.customers.some((customer) => customer.id === audienceId)) {
                    setAudienceId(store.customers[0]?.id ?? "")
                  }
                }}
              >
                One guest
              </Toggle>
              <Toggle
                on={kind === "spirit"}
                onClick={() => {
                  setKind("spirit")
                  if (!isSpiritId(audienceId)) setAudienceId("tequila")
                }}
              >
                A drink group
              </Toggle>
              <Toggle
                on={kind === "brand"}
                onClick={() => {
                  setKind("brand")
                  if (!store.brands.some((brand) => brand.id === audienceId)) setAudienceId("")
                }}
              >
                A bottle
              </Toggle>
            </div>

            {kind === "customer" ? (
              <div>
                <input
                  value={guestQuery}
                  onChange={(event) => setGuestQuery(event.target.value)}
                  placeholder="Search guests"
                  className="w-full border border-line bg-white px-3 py-3 outline-none"
                />
                <div className="mt-2 max-h-56 overflow-auto border border-line bg-white">
                  {guestMatches.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setAudienceId(customer.id)}
                      className={`block w-full px-3 py-3 text-left ${customer.id === audienceId ? "bg-ink text-cream" : ""}`}
                    >
                      {customer.name}
                      <span className={`ml-2 text-sm ${customer.id === audienceId ? "text-cream/70" : "text-ink/45"}`}>
                        {customer.email}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {kind === "spirit" ? (
              <div className="flex flex-wrap gap-2">
                {SPIRITS.map((spirit) => (
                  <button
                    key={spirit.id}
                    type="button"
                    onClick={() => setAudienceId(spirit.id)}
                    className={`border px-3 py-2 ${audienceId === spirit.id ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}
                  >
                    {spiritName(spirit.id)}
                  </button>
                ))}
              </div>
            ) : null}

            {kind === "brand" ? (
              <select
                value={audienceId}
                onChange={(event) => setAudienceId(event.target.value)}
                className="w-full border border-line bg-white px-3 py-3"
              >
                <option value="">Choose a bottle</option>
                {SPIRITS.map((spirit) => (
                  <optgroup key={spirit.id} label={spiritName(spirit.id)}>
                    {store.brands
                      .filter((brand) => brand.spiritId === spirit.id)
                      .map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            ) : null}

            {channel === "email" ? (
              <label className="block">
                <span className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Subject</span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="mt-2 w-full border-b border-line bg-transparent py-3 text-xl outline-none"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Message</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={7}
                className="mt-2 w-full border border-line bg-white px-3 py-3 outline-none"
              />
              {channel === "sms" ? (
                <span className="mt-2 block text-sm text-ink/50">
                  {outgoing.length} characters
                  {outgoing.length > 160 ? " · this may arrive as more than one text" : ""}
                </span>
              ) : null}
            </label>

            <ImageAttach
              images={images}
              place={storagePlace(store.messaging)}
              kind={store.messaging.storageKind}
              channel={channel}
              fileRef={fileRef}
              onPick={(files) => {
                addImages(files)
                if (fileRef.current) fileRef.current.value = ""
              }}
              onRemove={removeImage}
            />

            <TestTarget channel={channel} value={testValue} error={testError} onChange={setTestTarget} />

            <button
              type="button"
              disabled={!canReview}
              onClick={() => setPhase("review")}
              className="bg-ink px-6 py-4 text-cream disabled:opacity-30"
            >
              Review
            </button>
          </div>
          <Preview
            channel={channel}
            label={label}
            count={recipients.length}
            subject={subject}
            body={outgoing}
            fromLine={fromLine}
            storeName={store.messaging.storeName}
          />
        </div>
      ) : (
        <div className="mt-8 max-w-xl">
          <p className="text-lg">
            {channel === "sms" ? "Text" : "Email"} to {label}
          </p>
          <p className="mt-2 text-ink/60">From {fromLine || "Not set"}</p>
          <p className="mt-2 text-ink/60">
            {recipients.length} {recipients.length === 1 ? "guest" : "guests"}:{" "}
            {recipients
              .slice(0, 8)
              .map((guest) => guest.name)
              .join(", ")}
            {recipients.length > 8 ? ` and ${recipients.length - 8} more` : ""}
          </p>
          {skipped > 0 ? (
            <p className="mt-2 text-sm text-ink/55">
              {skipped} {skipped === 1 ? "guest has" : "guests have"} not agreed, so they are left out when this sends.
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink/55">Everyone in this list agreed to messages.</p>
          )}
          {channel === "email" ? <p className="mt-6 font-medium">{subject}</p> : null}
          <p className="mt-3 whitespace-pre-wrap text-ink/80">{outgoing || body}</p>
          {images.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {images.map((image) => (
                <li key={image.id} className="flex items-center gap-3">
                  <img src={image.preview} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{image.name}</span>
                    <span className="block truncate text-sm text-ink/55">
                      {image.url || "Public link is not set yet."}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8">
            <TestTarget channel={channel} value={testValue} error={testError} onChange={setTestTarget} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setPhase("edit")} className="px-5 py-3">
              Back
            </button>
            <button type="button" onClick={save} className="bg-ink px-6 py-3 text-cream">
              Save draft
            </button>
            <button type="button" disabled className="border border-line px-6 py-3 disabled:opacity-40">
              Send
            </button>
          </div>
          <p className="mt-3 text-sm text-ink/50">
            {providerReady
              ? "Send stays off until the server is connected."
              : `Send stays off until the server is connected, and ${channel === "email" ? "Resend" : "Twilio"} is filled in under Settings.`}
          </p>
        </div>
      )}
    </div>
  )
}

function ImageAttach({
  images,
  place,
  kind,
  channel,
  fileRef,
  onPick,
  onRemove,
}: {
  images: DraftImage[]
  place: string
  kind: "directory" | "bucket"
  channel: Channel
  fileRef: RefObject<HTMLInputElement | null>
  onPick: (files: FileList | null) => void
  onRemove: (id: string) => void
}) {
  const where = place || (kind === "bucket" ? "the bucket" : "the directory")
  return (
    <div>
      <span className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Images</span>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => onPick(event.target.files)}
      />
      <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 border border-line bg-white px-4 py-3">
        Attach image
      </button>
      <p className="mt-2 text-sm text-ink/50">
        {`The server saves the file in ${where}. Guests get the link in the ${channel === "email" ? "email" : "text"}.`}
      </p>
      {images.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {images.map((image) => (
            <li key={image.id} className="flex items-center gap-3 border border-line bg-white p-3">
              <img src={image.preview} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{image.name}</span>
                <span className="block truncate text-sm text-ink/55">
                  {image.url || "Add the public image link in Settings."}
                </span>
              </span>
              <button type="button" onClick={() => onRemove(image.id)} className="px-3 py-2 text-sm">
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function TestTarget({
  channel,
  value,
  error,
  onChange,
}: {
  channel: Channel
  value: string
  error: string
  onChange: (value: string) => void
}) {
  const email = channel === "email"
  return (
    <label className="block">
      <span className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">
        {email ? "Test email" : "Test phone"}
      </span>
      <input
        type={email ? "email" : "tel"}
        value={value}
        placeholder={email ? "you@circusliquor.com" : "+1 415 555 0199"}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-line bg-white px-3 py-3 outline-none"
      />
      {error ? <span className="mt-1 block text-sm text-seal">{error}</span> : null}
      {!error ? (
        <span className="mt-1 block text-sm text-ink/50">
          {email
            ? "A test of this email goes here, not to the guest list."
            : "A test of this text goes here, not to the guest list."}
        </span>
      ) : null}
    </label>
  )
}

function Preview({
  channel,
  label,
  count,
  subject,
  body,
  fromLine,
  storeName,
}: {
  channel: Channel
  label: string
  count: number
  subject: string
  body: string
  fromLine: string
  storeName: string
}) {
  return (
    <aside className="border border-line bg-white p-5">
      <p className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">
        {count} {count === 1 ? "guest" : "guests"} · {label}
      </p>
      {count === 0 ? <p className="mt-4 text-ink/50">Nobody is in this group yet.</p> : null}
      {channel === "sms" ? (
        <div className="mt-6 max-w-xs bg-ink px-4 py-4 text-cream">
          <p className="whitespace-pre-wrap">{body || "Your text will show here."}</p>
          <p className="mt-3 text-sm text-cream/70">Reply STOP to opt out. {storeName.trim() || "Circus Liquor"}</p>
        </div>
      ) : (
        <div className="mt-6 border border-line p-4">
          <p className="text-sm text-ink/45">From {fromLine || "Not set"}</p>
          <p className="mt-4 text-sm text-ink/45">Subject</p>
          <p className="mt-1 text-lg">{subject || "Subject line"}</p>
          <p className="mt-4 whitespace-pre-wrap text-ink/80">{body || "The email will show here."}</p>
        </div>
      )}
    </aside>
  )
}

function Toggle({ children, on, onClick }: { children: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-3 ${on ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}
    >
      {children}
    </button>
  )
}

function readKind(value: string | null): AudienceKind {
  if (value === "customer" || value === "spirit" || value === "brand") return value
  return "spirit"
}

function audienceLabel(
  kind: AudienceKind,
  id: string,
  store: { customers: { id: string; name: string }[]; brands: { id: string; name: string }[] },
) {
  if (kind === "customer") return store.customers.find((customer) => customer.id === id)?.name ?? "Unknown"
  if (kind === "spirit" && isSpiritId(id)) return spiritName(id)
  if (kind === "brand") return store.brands.find((brand) => brand.id === id)?.name ?? "Unknown"
  return "Unknown"
}
