# Circus Guest List

An iPad guest list for the store, plus a separate desk screen for messaging.

The iPad sits landscape on the floor stand. The guest joins the list in English or Spanish. The office screen is where you look people up and write to one person, or to everyone who drinks a style (tequila, whiskey, and the rest).

Messages are drafts for now. Nothing is texted or emailed yet.

## How to run

```bash
npm install
npm run dev
```

Open the local address Vite prints.

- `/` — choose the kiosk or the dashboard
- `/kiosk` — what the iPad should stay on
- `/admin` — guests, groups, drafts, bottles, cashiers

Sample guests and bottles are already loaded. They live in this browser only. “Reset sample data” on the front door puts them back.

## Screens

**Kiosk**

1. Welcome, with English / Spanish and who is at the register
2. Name, email, mobile, birthday
3. Drink styles, more than one allowed
4. Favorite bottles, optional, under the styles they picked
5. Consent, required, plus a 21+ confirmation
6. Thank you, then the screen clears for the next guest

**Dashboard**

- Overview, including upcoming birthdays
- Guests, with search and a drink filter
- A guest page, with Text and Email
- Groups, one per style, then the bottles inside it
- Message drafts to one guest, one style, or one bottle
- Bottle list the store can edit
- Cashier list the store can edit

## What is decided

- The guest fills in the iPad, not the cashier
- English and Spanish
- Landscape layout
- Many styles, and many bottles under each
- Cashiers are added in the dashboard, then chosen on the iPad welcome screen
- Messaging happens on a separate screen, not on the public kiosk
- Marketing consent is required
- Styles: Whiskey, Tequila, Vodka, Gin, Rum, Wine, Champagne, Beer, Cognac, Arak

## Next

1. **Shared database** so the iPad and the office see the same list, not just one browser
2. **Email** to one guest or a group
3. **Texts** the same way
4. **On the floor:** keep the iPad awake, locked to the kiosk, and clear an abandoned form

## Still open

- Real store name, logo, and colors. The screens say Circus for now.
- The real bottle list. What is in the app is a stand-in.
- Whether 21+ is the right age rule.
- Which email and text services to use when delivery is turned on.
