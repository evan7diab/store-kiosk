import { validEmail, validPhone } from "./people"
import type { MessageImage, MessagingSettings, StorageKind } from "../types"

export function defaultMessaging(): MessagingSettings {
  return {
    storeName: "Circus Liquor",
    emailFromName: "",
    emailFromAddress: "",
    emailReplyTo: "",
    resendApiKey: "",
    testEmail: "",
    smsFromNumber: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    testPhone: "",
    storageKind: "directory",
    storagePublicUrl: "",
    storageDirectory: "",
    storageBucket: "",
  }
}

export function emailReady(settings: MessagingSettings) {
  return (
    settings.emailFromName.trim().length > 0 &&
    validEmail(settings.emailFromAddress) &&
    (settings.emailReplyTo.trim() === "" || validEmail(settings.emailReplyTo)) &&
    settings.resendApiKey.trim().length > 0
  )
}

export function smsReady(settings: MessagingSettings) {
  return (
    settings.storeName.trim().length > 0 &&
    validPhone(settings.smsFromNumber) &&
    settings.twilioAccountSid.trim().length > 0 &&
    settings.twilioAuthToken.trim().length > 0
  )
}

export function emailFromLine(settings: MessagingSettings) {
  const name = settings.emailFromName.trim()
  const address = settings.emailFromAddress.trim()
  if (!name && !address) return ""
  if (!address) return name
  if (!name) return address
  return `${name} <${address}>`
}

export function validPublicUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function storedImageName(original: string, taken: string[]) {
  const dot = original.lastIndexOf(".")
  const ext = dot > 0 ? original.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : ""
  const stem = (dot > 0 ? original.slice(0, dot) : original)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const base = stem || "image"
  const suffix = ext ? `.${ext}` : ""
  let name = `${base}${suffix}`
  let count = 2
  while (taken.includes(name)) {
    name = `${base}-${count}${suffix}`
    count += 1
  }
  return name
}

export function imagePublicUrl(base: string, name: string) {
  const root = base.trim().replace(/\/+$/, "")
  if (!root || !name) return ""
  return `${root}/${name}`
}

export function storagePlace(settings: Pick<MessagingSettings, "storageKind" | "storageDirectory" | "storageBucket">) {
  if (settings.storageKind === "bucket") return settings.storageBucket.trim()
  return settings.storageDirectory.trim()
}

export function messageWithImages(body: string, images: Pick<MessageImage, "url">[] = []) {
  const links = images.map((image) => image.url).filter((url) => url && !body.includes(url))
  const text = body.trim()
  if (links.length === 0) return text
  return text ? `${text}\n\n${links.join("\n")}` : links.join("\n")
}

export function isStorageKind(value: string): value is StorageKind {
  return value === "directory" || value === "bucket"
}
