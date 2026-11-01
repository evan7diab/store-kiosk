import { defaultMessaging } from "../lib/messaging"
import type { Brand, Database } from "../types"
import { type SpiritId } from "../data/spirits"

const bottles: Record<SpiritId, string[]> = {
  tequila: ["Don Julio Blanco", "Casamigos Reposado", "Fortaleza", "Clase Azul"],
  bourbon: ["Maker's Mark", "Woodford Reserve", "Buffalo Trace"],
  rtd: ["High Noon", "Cutwater Margarita", "On The Rocks Old Fashioned"],
  "red-wine": ["Caymus Cabernet", "Catena Malbec", "La Crema Pinot Noir"],
  "white-wine": ["Whispering Angel", "Kim Crawford", "Cloudy Bay"],
  "craft-beer": ["Lagunitas IPA", "Russian River Pliny", "Firestone Walker 805"],
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
    version: 2,
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
        spiritIds: ["tequila", "bourbon"],
        brandIds: [bottle("tequila", "Don Julio Blanco"), bottle("tequila", "Casamigos Reposado"), bottle("bourbon", "Maker's Mark")],
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
        spiritIds: ["bourbon"],
        brandIds: [bottle("bourbon", "Woodford Reserve"), bottle("bourbon", "Buffalo Trace")],
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
        spiritIds: ["red-wine", "white-wine"],
        brandIds: [bottle("red-wine", "Catena Malbec"), bottle("white-wine", "Whispering Angel")],
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
        spiritIds: ["rtd"],
        brandIds: [bottle("rtd", "High Noon"), bottle("rtd", "Cutwater Margarita")],
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
        spiritIds: ["bourbon", "craft-beer"],
        brandIds: [bottle("bourbon", "Maker's Mark"), bottle("craft-beer", "Lagunitas IPA")],
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
        spiritIds: ["red-wine", "white-wine"],
        brandIds: [bottle("red-wine", "Caymus Cabernet"), bottle("white-wine", "Kim Crawford")],
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
        spiritIds: ["bourbon", "tequila"],
        brandIds: [bottle("bourbon", "Buffalo Trace"), bottle("tequila", "Fortaleza")],
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
        spiritIds: ["rtd", "tequila"],
        brandIds: [bottle("rtd", "On The Rocks Old Fashioned"), bottle("tequila", "Clase Azul")],
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
        spiritIds: ["craft-beer", "rtd"],
        brandIds: [bottle("craft-beer", "Russian River Pliny"), bottle("craft-beer", "Firestone Walker 805"), bottle("rtd", "High Noon")],
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
