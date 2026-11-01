import { defaultMessaging } from "../lib/messaging"
import type { Brand, Database } from "../types"
import { type SpiritId } from "../data/spirits"

const bottles: Record<SpiritId, string[]> = {
  whiskey: [
    "Jameson",
    "Maker's Mark",
    "Woodford Reserve",
    "The Macallan 12",
    "Buffalo Trace",
    "Johnnie Walker Black",
  ],
  tequila: [
    "Don Julio Blanco",
    "Patrón Silver",
    "Casamigos Reposado",
    "Clase Azul",
    "Espolòn Blanco",
    "Fortaleza",
  ],
  vodka: ["Grey Goose", "Tito's", "Belvedere", "Ketel One", "Cîroc"],
  gin: ["Hendrick's", "Bombay Sapphire", "Tanqueray", "The Botanist", "Monkey 47"],
  rum: ["Bacardí Superior", "Diplomático Reserva", "Appleton Estate", "Ron Zacapa 23", "Planteray"],
  wine: ["Caymus Cabernet", "Whispering Angel", "Catena Malbec", "La Crema Pinot Noir", "Kim Crawford"],
  champagne: ["Veuve Clicquot", "Moët Impérial", "Dom Pérignon", "Laurent-Perrier"],
  beer: ["Modelo Especial", "Corona", "Heineken", "Stella Artois", "Lagunitas IPA"],
  cognac: ["Hennessy VS", "Rémy Martin VSOP", "Courvoisier VS", "Martell VS"],
  arak: ["El Massaya", "Ksarak", "Gantous & Abou Raad", "Al Rayan"],
}

export function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function makeBrandId(spiritId: SpiritId, name: string) {
  return `${spiritId}-${slug(name)}`
}

function sampleBrands(): Brand[] {
  return (Object.entries(bottles) as [SpiritId, string[]][]).flatMap(([spiritId, names]) =>
    names.map((name) => ({
      id: makeBrandId(spiritId, name),
      spiritId,
      name,
    })),
  )
}

const bottle = makeBrandId

export function seedDatabase(): Database {
  return {
    version: 1,
    activeCashierId: null,
    messaging: defaultMessaging(),
    cashiers: [
      { id: "maya", name: "Maya Chen", active: true },
      { id: "luis", name: "Luis Ortega", active: true },
      { id: "sofia", name: "Sofia Reyes", active: true },
      { id: "jordan", name: "Jordan Blake", active: true },
    ],
    brands: sampleBrands(),
    customers: [
      {
        id: "elena",
        name: "Elena Vasquez",
        email: "elena@example.com",
        phone: "(415) 555-0134",
        birthday: "1992-11-02",
        spiritIds: ["tequila", "whiskey"],
        brandIds: [bottle("tequila", "Don Julio Blanco"), bottle("tequila", "Casamigos Reposado"), bottle("whiskey", "Jameson")],
        cashierId: "luis",
        locale: "es",
        consentAt: "2026-10-31T18:12:00.000Z",
        createdAt: "2026-10-31T18:12:00.000Z",
        updatedAt: "2026-10-31T18:12:00.000Z",
      },
      {
        id: "james",
        name: "James Whitfield",
        email: "james@example.com",
        phone: "(415) 555-0170",
        birthday: "1984-03-14",
        spiritIds: ["whiskey"],
        brandIds: [bottle("whiskey", "The Macallan 12"), bottle("whiskey", "Woodford Reserve")],
        cashierId: "maya",
        locale: "en",
        consentAt: "2026-10-30T18:00:00.000Z",
        createdAt: "2026-10-30T18:00:00.000Z",
        updatedAt: "2026-10-30T18:00:00.000Z",
      },
      {
        id: "camila",
        name: "Camila Ruiz",
        email: "camila@example.com",
        phone: "(628) 555-0192",
        birthday: "1995-11-12",
        spiritIds: ["wine", "champagne"],
        brandIds: [bottle("wine", "Whispering Angel"), bottle("champagne", "Veuve Clicquot")],
        cashierId: "sofia",
        locale: "es",
        consentAt: "2026-10-28T17:20:00.000Z",
        createdAt: "2026-10-28T17:20:00.000Z",
        updatedAt: "2026-10-28T17:20:00.000Z",
      },
      {
        id: "noah",
        name: "Noah Adler",
        email: "noah@example.com",
        phone: "(510) 555-0144",
        birthday: "1990-12-19",
        spiritIds: ["gin", "vodka"],
        brandIds: [bottle("gin", "Hendrick's"), bottle("vodka", "Tito's")],
        cashierId: "jordan",
        locale: "en",
        consentAt: "2026-10-22T19:05:00.000Z",
        createdAt: "2026-10-22T19:05:00.000Z",
        updatedAt: "2026-10-22T19:05:00.000Z",
      },
      {
        id: "priya",
        name: "Priya Shah",
        email: "priya@example.com",
        phone: "(415) 555-0118",
        birthday: "1993-11-20",
        spiritIds: ["whiskey", "beer"],
        brandIds: [bottle("whiskey", "Jameson"), bottle("beer", "Modelo Especial")],
        cashierId: "maya",
        locale: "en",
        consentAt: "2026-10-15T16:40:00.000Z",
        createdAt: "2026-10-15T16:40:00.000Z",
        updatedAt: "2026-10-15T16:40:00.000Z",
      },
      {
        id: "mateo",
        name: "Mateo Alvarez",
        email: "mateo@example.com",
        phone: "(415) 555-0166",
        birthday: "1988-06-02",
        spiritIds: ["tequila"],
        brandIds: [bottle("tequila", "Fortaleza"), bottle("tequila", "Clase Azul")],
        cashierId: "luis",
        locale: "es",
        consentAt: "2026-10-02T20:10:00.000Z",
        createdAt: "2026-10-02T20:10:00.000Z",
        updatedAt: "2026-10-02T20:10:00.000Z",
      },
      {
        id: "hannah",
        name: "Hannah Brooks",
        email: "hannah@example.com",
        phone: "(650) 555-0181",
        birthday: "1986-01-28",
        spiritIds: ["champagne", "wine"],
        brandIds: [bottle("champagne", "Dom Pérignon"), bottle("champagne", "Moët Impérial"), bottle("wine", "Caymus Cabernet")],
        cashierId: "sofia",
        locale: "en",
        consentAt: "2026-09-18T18:30:00.000Z",
        createdAt: "2026-09-18T18:30:00.000Z",
        updatedAt: "2026-09-18T18:30:00.000Z",
      },
      {
        id: "omar",
        name: "Omar Haddad",
        email: "omar@example.com",
        phone: "(415) 555-0104",
        birthday: "1979-08-09",
        spiritIds: ["arak", "whiskey"],
        brandIds: [bottle("arak", "Ksarak"), bottle("arak", "El Massaya"), bottle("whiskey", "Buffalo Trace")],
        cashierId: "jordan",
        locale: "en",
        consentAt: "2026-09-01T17:00:00.000Z",
        createdAt: "2026-09-01T17:00:00.000Z",
        updatedAt: "2026-09-01T17:00:00.000Z",
      },
      {
        id: "lucia",
        name: "Lucia Ferrer",
        email: "lucia@example.com",
        phone: "(408) 555-0199",
        birthday: "1996-04-17",
        spiritIds: ["rum", "gin"],
        brandIds: [bottle("rum", "Diplomático Reserva"), bottle("rum", "Ron Zacapa 23"), bottle("gin", "Bombay Sapphire")],
        cashierId: "luis",
        locale: "es",
        consentAt: "2026-08-12T19:45:00.000Z",
        createdAt: "2026-08-12T19:45:00.000Z",
        updatedAt: "2026-08-12T19:45:00.000Z",
      },
      {
        id: "ben",
        name: "Ben Carter",
        email: "ben@example.com",
        phone: "(415) 555-0127",
        birthday: "1991-09-30",
        spiritIds: ["beer", "vodka"],
        brandIds: [bottle("beer", "Lagunitas IPA"), bottle("beer", "Corona"), bottle("vodka", "Grey Goose")],
        cashierId: "maya",
        locale: "en",
        consentAt: "2026-07-04T18:15:00.000Z",
        createdAt: "2026-07-04T18:15:00.000Z",
        updatedAt: "2026-07-04T18:15:00.000Z",
      },
    ],
    campaigns: [
      {
        id: "draft-tequila",
        channel: "sms",
        audience: "spirit",
        audienceId: "tequila",
        audienceLabel: "Tequila",
        subject: "",
        body: "Fortaleza and Don Julio just landed. Reply if you want a bottle held until Friday.",
        recipientCount: 2,
        images: [],
        createdAt: "2026-10-28T19:00:00.000Z",
      },
      {
        id: "draft-james",
        channel: "email",
        audience: "customer",
        audienceId: "james",
        audienceLabel: "James Whitfield",
        subject: "The Macallan 12 is back",
        body: "James — we set aside a Macallan 12. Want it held through Sunday?",
        recipientCount: 1,
        images: [],
        createdAt: "2026-10-30T16:40:00.000Z",
      },
    ],
  }
}
