# Savana3D launch checklist (payment, shipping, files)

## 1. Supabase → SQL Editor (in this order)
1. `supabase/migration_server_checkout.sql` — orders are created only by `/api/checkout` with database prices; payment status can only be changed by the server.
2. `supabase/migration_oto_tracking.sql` — tracking columns written by the OTO webhook.
3. `supabase/migration_private_design_files.sql` — makes the `designs` bucket private and lets customers upload custom-order files.

Then run the check query at the end of file 1 to find any order marked paid without a Moyasar reference.

## 2. Vercel → Settings → Environment Variables (then Redeploy)
| Name | Value |
|---|---|
| `MOYASAR_WEBHOOK_SECRET` | random long string, same as Moyasar webhook secret token |
| `OTO_WEBHOOK_SECRET` | random long string, used when registering the OTO webhook |
| `OTO_AUTO_SHIP` | `true` to request the label automatically, otherwise `false` |
The existing six variables (Supabase ×3, Moyasar ×2, `NEXT_PUBLIC_SITE_URL`) and `OTO_REFRESH_TOKEN` stay as they are.

## 3. Moyasar dashboard
- Settings → Webhooks → Add: URL `https://savana3d.com/api/webhooks/moyasar`, event `payment_paid`, secret token = `MOYASAR_WEBHOOK_SECRET`.
- Live activation still requires the merchant documents (freelance document / CR + bank account). Swap test keys for live keys only after activation.

## 4. OTO
- Add a delivery company and a feasibility rule (cheapest / preferred carrier) so `createShipment` picks it.
- Top up the OTO wallet if `OTO_AUTO_SHIP=true`.
- Register the webhook once: `POST https://api.tryoto.com/rest/v2/webhook` with
  `{"method":"POST","url":"https://savana3d.com/api/webhooks/oto?key=<OTO_WEBHOOK_SECRET>","authorizationKey":"<OTO_WEBHOOK_SECRET>","webhookType":"orderStatus"}`.

## 5. End-to-end test (test keys first)
Customer buys 2 store items + 1 custom order → close the tab right after paying on one of them (webhook must still mark it paid) → printer accepts, downloads the file, starts printing, sends pickup to OTO → OTO status updates appear on the customer dashboard.

## Known remaining gaps
- Flat 25 SAR shipping per checkout even when items go to different printers.
- No refunds/cancellation flow and no commission settlement yet.
- Pending orders (with customer addresses) are visible to all printers before acceptance.
