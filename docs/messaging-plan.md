# Messages and email

The office already writes a draft for one guest, a drink group, or a bottle group. Nothing is delivered. Sending happens later, on the server, after someone presses Send.

## Providers

Email goes through **Resend**. The store domain (for example `circusliquor.com`) is verified there, and the server sends with a From address such as `Circus Liquor <hello@circusliquor.com>`.

Texts go through **Twilio**. A US marketing text needs a registered 10DLC campaign or the carriers block it. The consent line on the kiosk, including STOP, is the start of that registration.

## What the office sets

The Settings screen stores the values the office can change:

- Store name, used in the text footer
- Email from name, from address, and optional reply-to
- Resend API key
- Twilio phone number, account SID, and auth token
- Test email and test phone, used before a message goes to guests
- Image storage: a directory or a bucket, plus the public link guests open

A channel shows Ready only when its required fields are filled and the addresses or phone number look valid.

## What stays off the page

On the live site the API keys do not stay in the browser. They live in a PHP config file outside the public site. The Settings screen will keep the from name, from address, reply-to, store name, and Twilio number in MySQL. The kiosk never reads any of this.

Until that server exists, Settings saves on this browser only, the same way guests and drafts do. The Send button stays off. Saving a message still keeps a draft.

## What Send will do

1. The office reviews the draft and presses Send.
2. The server skips anyone who did not agree to messages.
3. It sends one guest at a time through Resend or Twilio.
4. It records each guest as sent, failed, or skipped.
5. Texts get a footer: the store name and “Reply STOP to opt out.”
6. Each attached image is written to the chosen directory or bucket. The public link is added to the text or the email.

A returning guest keeps one record. The same email updates that guest instead of creating a second one, so a later message still reaches one person. Until the server is connected, a draft keeps the image name and the link, and the file is written when Send is connected.
