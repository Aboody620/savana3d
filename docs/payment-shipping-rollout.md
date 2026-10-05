# Payment and pickup rollout

## Configuration
- Set the public Moyasar Test key as Vercel Config `NEXT_PUBLIC_MOYASAR_KEY`. It overrides the legacy `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` value, which Vercel no longer allows updating as a Secret with a public prefix.
- Set the complete matching secret as `MOYASAR_SECRET_KEY` (Secret). A displayed Secret Key ID with masked characters is not the usable secret.
- Set `NEXT_PUBLIC_SITE_URL` to the production origin. The verifier accepts the equivalent www/non-www hostname and requires `/order-success` with the same order IDs stored by Moyasar.
- Set `OTO_REFRESH_TOKEN` as a server-only Secret. Never add a public prefix.
- Redeploy after environment changes. Never commit credentials.

## Pickup workflow
The assigned printer opens a paid order in the printing state, enters the pickup address and national short address plus parcel weight/dimensions, and submits it to OTO. The server authenticates the caller and checks printer role, assignment, paid status, reference, and workflow state. It reads recipient and price from the stored order, supplies per-order `senderInformation`, and forces `createShipment: false`.

The resulting OTO order is preparation only: an operator must review the carrier price and buy the label in OTO, then enter tracking in Savana3D. No automatic charge or shipment-status webhook is implemented. Deterministic OTO IDs are `SAVANA-<order UUID>`; if a timeout or rejection occurs, inspect that ID in OTO before retrying. The UI does not mark the order shipped merely because an OTO draft was created.

## Validation
Run `node --test tests/*.test.mjs` and `npm run build` with configured Supabase environment values. Tests cover save failures, callback binding, repeated payment confirmation preserving fulfillment state, per-printer origins, validation, authentication, role/assignment checks, and no automatic label purchase.

Live QA remains required: Test payment, database confirmation, printer acceptance, pickup export, tracking, and cleanup. Do not treat a passing build as a successful gateway/shipping test.

## Remaining launch gaps
Server-authoritative checkout prices/quantities and payment-column RLS protection still need review. The cart currently charges 25 SAR once across potentially multiple printer origins, and legacy orders have no quantity field. Customer-upload storage permission is separate from the designer upload policy. Live Geidea approval, Mazaya subscription pricing, automatic shipment booking/tracking, payment webhooks and commission settlement are outside this patch.

## API references
- https://docs.moyasar.com/guides/references/form-configuration
- https://apis.tryoto.com/
- https://tryoto-support.freshdesk.com/en/support/solutions/articles/150000200661-how-to-create-an-order-thru-oto-apis
