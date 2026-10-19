import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = await readFile(new URL("../lib/paymentConfig.js", import.meta.url), "utf8");
const { paymentKeyIsConfigured } = await import(`data:text/javascript;base64,${Buffer.from(config).toString("base64")}`);
test("checkout rejects missing and template credentials", () => {
  for (const key of [undefined, "", "pk_test_placeholder", "pk_test_yourkey", "sk_test_abc123"]) {
    assert.equal(paymentKeyIsConfigured(key), false);
  }
  assert.equal(paymentKeyIsConfigured("  pk_test_AbC0123456789  "), true);
});

const confirmSource = await readFile(new URL("../lib/confirmPayment.js", import.meta.url), "utf8");
const { confirmPayment } = await import(`data:text/javascript;base64,${Buffer.from(confirmSource).toString("base64")}`);

async function runVerification({ failUpdate = false, initialStatus = "pending_payment", reference = "payment-1", callback = "https://www.savana3d.com/order-success?order_ids=order-1", amount = 2600 } = {}) {
  const order = { id: "order-1", total_price: 1, shipping_cost: 25,
    status: initialStatus, payment_status: initialStatus === "pending_payment" ? "unpaid" : "paid",
    payment_reference: initialStatus === "pending_payment" ? null : reference };
  const admin = { from() {
    let patch;
    const filters = [];
    const query = {
      select() { return query; }, in() { return query; },
      eq(field, value) { filters.push([field, value]); return query; },
      update(value) { patch = value; return query; },
      then(resolve) {
        if (patch && failUpdate) return Promise.resolve(resolve({ error: { message: "database unavailable" } }));
        if (patch && filters.every(([field, value]) => order[field] === value)) Object.assign(order, patch);
        return Promise.resolve(resolve({ data: [{ ...order }], error: null }));
      }
    };
    return query;
  } };
  const fetchImpl = async () => ({ ok: true, json: async () => ({ id: "payment-1", status: "paid", amount, currency: "SAR", callback_url: callback }) });
  const out = await confirmPayment({ admin, fetchImpl,
    env: { MOYASAR_SECRET_KEY: "test", NEXT_PUBLIC_SITE_URL: "https://savana3d.com" },
    paymentId: "payment-1", orderIds: ["order-1"] });
  return { result: out, order };
}

test("successful payment is saved before reporting success", async () => {
  const { result, order } = await runVerification();
  assert.equal(result.status, 200);
  assert.equal(order.payment_status, "paid");
  assert.equal(order.status, "pending");
});
test("database failure must not appear as payment success", async () => {
  const { result, order } = await runVerification({ failUpdate: true });
  assert.equal(result.status, 500);
  assert.equal(order.payment_status, "unpaid");
});
test("reloading payment result preserves printer progress", async () => {
  const { result, order } = await runVerification({ initialStatus: "shipped" });
  assert.equal(result.status, 200);
  assert.equal(order.status, "shipped");
});
test("an order paid with a different reference is not overwritten", async () => {
  const { result, order } = await runVerification({ initialStatus: "accepted", reference: "another-payment" });
  assert.equal(result.status, 409);
  assert.equal(order.payment_reference, "another-payment");
});
test("a payment bound to another order cannot be replayed", async () => {
  const { result, order } = await runVerification({ callback: "https://savana3d.com/order-success?order_ids=other-order" });
  assert.equal(result.status, 400);
  assert.equal(order.payment_status, "unpaid");
});
test("a payment created for another site cannot confirm an order", async () => {
  const { result } = await runVerification({ callback: "https://example.com/order-success?order_ids=order-1" });
  assert.equal(result.status, 400);
});
test("a payment for a smaller amount does not confirm the order", async () => {
  const { result, order } = await runVerification({ amount: 100 });
  assert.equal(result.status, 400);
  assert.equal(order.payment_status, "unpaid");
});
