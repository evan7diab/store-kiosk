import { Link } from "react-router-dom"
import { formatStamp } from "../lib/dates"
import { emailReady, messageWithImages, smsReady } from "../lib/messaging"
import { useStore } from "../store"
import { PageHeader, Tag } from "./AdminLayout"

export default function MessagesPage() {
  const { campaigns, messaging } = useStore()
  const ordered = [...campaigns].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div>
      <PageHeader
        kicker="Drafts"
        title="Messages"
        action={
          <Link to="/admin/messages/new" className="bg-ink px-5 py-3 text-sm text-cream">
            New message
          </Link>
        }
      />
      <p className="max-w-xl text-ink/60">
        Each message stays a draft until the server is connected. Sending uses the Resend and Twilio values in Settings.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tag>{emailReady(messaging) ? "Resend ready" : "Resend needs setup"}</Tag>
        <Tag>{smsReady(messaging) ? "Twilio ready" : "Twilio needs setup"}</Tag>
        <Link to="/admin/settings" className="text-sm font-semibold underline underline-offset-4">
          Settings
        </Link>
      </div>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {ordered.map((campaign) => (
          <li key={campaign.id} className="py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="flex flex-wrap items-center gap-2 text-lg">
                {campaign.channel === "sms" ? "Text" : "Email"} to {campaign.audienceLabel}
                <Tag>Draft</Tag>
              </p>
              <p className="text-sm text-ink/45">{formatStamp(campaign.createdAt)}</p>
            </div>
            {campaign.subject ? <p className="mt-2 font-medium">{campaign.subject}</p> : null}
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-ink/70">
              {messageWithImages(campaign.body, campaign.images)}
            </p>
            <p className="mt-3 text-sm text-ink/45">
              {campaign.recipientCount} {campaign.recipientCount === 1 ? "guest" : "guests"} · saved, not sent
            </p>
          </li>
        ))}
      </ul>
      {ordered.length === 0 ? <p className="mt-6 text-ink/50">No drafts yet.</p> : null}
    </div>
  )
}
