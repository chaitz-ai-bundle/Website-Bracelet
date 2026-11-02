# Jagat — Bracelet Store

A static online store for the Jagat 20 Bracelet Collection. No server or build step needed.

## Run locally
Open `index.html`, or run `python3 -m http.server` and visit http://localhost:8000.

## Edit prices, shipping and order delivery
Everything is in `js/products.js`:

- `STORE.defaultPrice`, `freeShippingOver`, `shippingFee`, `currency`
- Give a single bracelet its own price by adding `price: 1799` to its entry in `PRODUCTS`
- **`STORE.whatsappNumber`** (e.g. `"919876543210"`) — orders open in WhatsApp, pre-filled, for the customer to send to you
- or **`STORE.orderEmail`** — orders open in the customer's email app instead

Until one of these is set, the checkout shows a confirmation but the order is not sent anywhere.

## Deploy
Any static host works: GitHub Pages, Netlify, Vercel, Cloudflare Pages.
