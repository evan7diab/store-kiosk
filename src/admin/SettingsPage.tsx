import { useState, type FormEvent } from "react"
import { emailReady, isStorageKind, smsReady, validPublicUrl, defaultMessaging } from "../lib/messaging"
import { validEmail, validPhone } from "../lib/people"
import { useStore } from "../store"
import type { MessagingSettings } from "../types"
import { PageHeader, Tag } from "./AdminLayout"

export default function SettingsPage() {
  const { messaging, updateMessaging } = useStore()
  const [draft, setDraft] = useState<MessagingSettings>({ ...defaultMessaging(), ...messaging })
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof MessagingSettings, string>>>({})

  function setField(key: keyof MessagingSettings, value: string) {
    setSaved(false)
    if (key === "storageKind" && !isStorageKind(value)) return
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function save(event: FormEvent) {
    event.preventDefault()
    const next = trimSettings(draft)
    const nextErrors = validate(next)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setDraft(next)
    updateMessaging(next)
    setSaved(true)
  }

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        kicker="Delivery"
        title="Settings"
        action={
          <button type="submit" className="bg-ink px-5 py-3 text-sm text-cream">
            Save settings
          </button>
        }
      />
      <p className="max-w-2xl text-ink/60">
        Email sends through Resend. Texts send through Twilio. These values stay in this browser until the server is connected. The live keys will sit in a server file the kiosk cannot open.
      </p>
      {saved ? <p className="mt-4 text-sm font-semibold text-ink">Saved on this browser.</p> : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="border border-line bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Email</p>
              <h2 className="mt-1 font-display text-3xl">Resend</h2>
            </div>
            <Tag>{emailReady(draft) ? "Ready" : "Needs setup"}</Tag>
          </div>
          <div className="mt-5 space-y-4">
            <Field
              label="From name"
              value={draft.emailFromName}
              error={errors.emailFromName}
              onChange={(value) => setField("emailFromName", value)}
            />
            <Field
              label="From email"
              type="email"
              value={draft.emailFromAddress}
              error={errors.emailFromAddress}
              onChange={(value) => setField("emailFromAddress", value)}
              placeholder="hello@circusliquor.com"
            />
            <Field
              label="Reply-to"
              type="email"
              value={draft.emailReplyTo}
              error={errors.emailReplyTo}
              onChange={(value) => setField("emailReplyTo", value)}
              hint="Optional. Replies go here when it is set."
            />
            <Field
              label="API key"
              type="password"
              value={draft.resendApiKey}
              error={errors.resendApiKey}
              onChange={(value) => setField("resendApiKey", value)}
              autoComplete="off"
            />
            <Field
              label="Test email"
              type="email"
              value={draft.testEmail}
              error={errors.testEmail}
              onChange={(value) => setField("testEmail", value)}
              placeholder="you@circusliquor.com"
              hint="A test of an email goes here, not to the guest list."
            />
          </div>
        </section>

        <section className="border border-line bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Text</p>
              <h2 className="mt-1 font-display text-3xl">Twilio</h2>
            </div>
            <Tag>{smsReady(draft) ? "Ready" : "Needs setup"}</Tag>
          </div>
          <div className="mt-5 space-y-4">
            <Field
              label="Store name"
              value={draft.storeName}
              error={errors.storeName}
              onChange={(value) => setField("storeName", value)}
              hint="Added to the end of each text, with “Reply STOP to opt out.”"
            />
            <Field
              label="From number"
              type="tel"
              value={draft.smsFromNumber}
              error={errors.smsFromNumber}
              onChange={(value) => setField("smsFromNumber", value)}
              placeholder="+1 415 555 0100"
            />
            <Field
              label="Account SID"
              value={draft.twilioAccountSid}
              error={errors.twilioAccountSid}
              onChange={(value) => setField("twilioAccountSid", value)}
              autoComplete="off"
            />
            <Field
              label="Auth token"
              type="password"
              value={draft.twilioAuthToken}
              error={errors.twilioAuthToken}
              onChange={(value) => setField("twilioAuthToken", value)}
              autoComplete="off"
            />
            <Field
              label="Test phone"
              type="tel"
              value={draft.testPhone}
              error={errors.testPhone}
              onChange={(value) => setField("testPhone", value)}
              placeholder="+1 415 555 0199"
              hint="A test of a text goes here, not to the guest list."
            />
          </div>
        </section>
      </div>

      <section className="mt-6 border border-line bg-white px-5 py-5">
        <p className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">Images</p>
        <h2 className="mt-1 font-display text-3xl">Storage</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          An attached image is saved here. Guests receive its public link in the text or the email.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setField("storageKind", "directory")}
            className={`border px-4 py-3 ${draft.storageKind === "directory" ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}
          >
            Directory
          </button>
          <button
            type="button"
            onClick={() => setField("storageKind", "bucket")}
            className={`border px-4 py-3 ${draft.storageKind === "bucket" ? "border-ink bg-ink text-cream" : "border-line bg-white"}`}
          >
            Bucket
          </button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field
            label="Public link"
            value={draft.storagePublicUrl}
            error={errors.storagePublicUrl}
            onChange={(value) => setField("storagePublicUrl", value)}
            placeholder="https://circusliquor.com/media"
            hint="Guests open the image at this address."
          />
          {draft.storageKind === "directory" ? (
            <Field
              label="Directory"
              value={draft.storageDirectory}
              error={errors.storageDirectory}
              onChange={(value) => setField("storageDirectory", value)}
              placeholder="uploads/messages"
              hint="The server writes the file in this folder."
            />
          ) : (
            <Field
              label="Bucket"
              value={draft.storageBucket}
              error={errors.storageBucket}
              onChange={(value) => setField("storageBucket", value)}
              placeholder="circus-liquor-media"
              hint="The server writes the file in this bucket."
            />
          )}
        </div>
      </section>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  type?: string
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="text-[0.7rem] tracking-[0.16em] uppercase text-ink/45">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-line bg-white px-3 py-3 outline-none"
      />
      {error ? <span className="mt-1 block text-sm text-seal">{error}</span> : null}
      {hint && !error ? <span className="mt-1 block text-sm text-ink/50">{hint}</span> : null}
    </label>
  )
}

function trimSettings(settings: MessagingSettings): MessagingSettings {
  return {
    storeName: settings.storeName.trim(),
    emailFromName: settings.emailFromName.trim(),
    emailFromAddress: settings.emailFromAddress.trim(),
    emailReplyTo: settings.emailReplyTo.trim(),
    resendApiKey: settings.resendApiKey.trim(),
    testEmail: settings.testEmail.trim(),
    smsFromNumber: settings.smsFromNumber.trim(),
    twilioAccountSid: settings.twilioAccountSid.trim(),
    twilioAuthToken: settings.twilioAuthToken.trim(),
    testPhone: settings.testPhone.trim(),
    storageKind: settings.storageKind,
    storagePublicUrl: settings.storagePublicUrl.trim(),
    storageDirectory: settings.storageDirectory.trim(),
    storageBucket: settings.storageBucket.trim(),
  }
}

function validate(settings: MessagingSettings) {
  const errors: Partial<Record<keyof MessagingSettings, string>> = {}
  const emailStarted =
    settings.emailFromName || settings.emailFromAddress || settings.emailReplyTo || settings.resendApiKey
  const smsStarted = settings.smsFromNumber || settings.twilioAccountSid || settings.twilioAuthToken

  if (!settings.storeName) errors.storeName = "Add the store name."
  if (emailStarted) {
    if (!settings.emailFromName) errors.emailFromName = "Add the name guests will see."
    if (!validEmail(settings.emailFromAddress)) errors.emailFromAddress = "Use a full email address."
    if (settings.emailReplyTo && !validEmail(settings.emailReplyTo)) errors.emailReplyTo = "Use a full email address."
    if (!settings.resendApiKey) errors.resendApiKey = "Add the Resend API key."
  }
  if (smsStarted) {
    if (!validPhone(settings.smsFromNumber)) errors.smsFromNumber = "Use a full phone number."
    if (!settings.twilioAccountSid) errors.twilioAccountSid = "Add the Twilio account SID."
    if (!settings.twilioAuthToken) errors.twilioAuthToken = "Add the Twilio auth token."
  }
  if (settings.testEmail && !validEmail(settings.testEmail)) errors.testEmail = "Use a full email address."
  if (settings.testPhone && !validPhone(settings.testPhone)) errors.testPhone = "Use a full phone number."
  const storageStarted = Boolean(settings.storagePublicUrl || settings.storageDirectory || settings.storageBucket)
  if (storageStarted) {
    if (!validPublicUrl(settings.storagePublicUrl)) {
      errors.storagePublicUrl = "Use a full link, starting with https://."
    }
    if (settings.storageKind === "directory" && !settings.storageDirectory) {
      errors.storageDirectory = "Add the directory."
    }
    if (settings.storageKind === "bucket" && !settings.storageBucket) {
      errors.storageBucket = "Add the bucket name."
    }
  }
  return errors
}
