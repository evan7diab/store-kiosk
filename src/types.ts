import type { Locale, SpiritId } from "./data/spirits"

export type Brand = {
  id: string
  spiritId: SpiritId
  name: string
}

export type Cashier = {
  id: string
  name: string
  active: boolean
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  birthday: string
  spiritIds: SpiritId[]
  brandIds: string[]
  cashierId: string
  locale: Locale
  consentAt: string
  points: number
  rewards: number
  createdAt: string
  updatedAt: string
}

export type ReceiptRange = {
  id: string
  label: string
  points: number
  rewards: number
}

export type Receipt = {
  id: string
  customerId: string
  rangeId: string
  rangeLabel: string
  points: number
  rewards: number
  cashierId: string | null
  createdAt: string
}

export type AudienceKind = "customer" | "spirit" | "brand"
export type Channel = "sms" | "email"
export type StorageKind = "directory" | "bucket"

export type MessageImage = {
  id: string
  name: string
  url: string
}

export type Campaign = {
  id: string
  channel: Channel
  audience: AudienceKind
  audienceId: string
  audienceLabel: string
  subject: string
  body: string
  recipientCount: number
  images: MessageImage[]
  createdAt: string
}

export type MessagingSettings = {
  storeName: string
  emailFromName: string
  emailFromAddress: string
  emailReplyTo: string
  resendApiKey: string
  testEmail: string
  smsFromNumber: string
  twilioAccountSid: string
  twilioAuthToken: string
  testPhone: string
  storageKind: StorageKind
  storagePublicUrl: string
  storageDirectory: string
  storageBucket: string
}

export type Database = {
  version: 3
  customers: Customer[]
  cashiers: Cashier[]
  brands: Brand[]
  campaigns: Campaign[]
  ranges: ReceiptRange[]
  receipts: Receipt[]
  activeCashierId: string | null
  messaging: MessagingSettings
}

export type CustomerInput = {
  name: string
  email: string
  phone: string
  birthday: string
  spiritIds: SpiritId[]
  brandIds: string[]
  cashierId: string
  locale: Locale
}
