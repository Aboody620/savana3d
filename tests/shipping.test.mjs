import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../lib/otoOrder.js", import.meta.url), "utf8");
const { buildOtoOrder } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const order = { id: "12345678-1234-1234-1234-123456789012", printer_id: "printer-a", customer_id: "customer-a",
  total_price: 50, shipping_cost: 25, shipping_name: "QA Recipient", shipping_phone: "0500000000",
  shipping_city: "Riyadh", shipping_address: "Test only", designs: { title: "Cube" } };
const sender = { name: "QA Printer", phone: "0500000000", city: "Riyadh", address: "Test only", shortAddress: "ABCD1234" };
const parcel = { weight: 0.1, width: 10, height: 10, length: 10 };
test("OTO draft uses this printer's pickup and cannot automatically buy a label", () => {
  const payload = buildOtoOrder(order, sender, parcel);
  assert.equal(payload.createShipment, false);
  assert.equal(payload.senderInformation.senderId, "printer-a");
  assert.equal(payload.senderInformation.senderShortAddressCode, "ABCD1234");
  assert.equal(payload.senderInformation.senderMobile, "966500000000");
  assert.equal(payload.amount, 75);
  assert.equal(payload.amount_due, 0);
  assert.equal(payload.pickupLocationCode, undefined);
  assert.equal(payload.deliveryOptionId, undefined);
});
test("different orders retain different pickup origins", () => {
  const second = buildOtoOrder({ ...order, id: "second", printer_id: "printer-b" }, { ...sender, city: "Jeddah", shortAddress: "EFGH5678" }, parcel);
  assert.equal(second.senderInformation.senderCity, "Jeddah");
  assert.equal(second.senderInformation.senderId, "printer-b");
  assert.notEqual(second.orderId, buildOtoOrder(order, sender, parcel).orderId);
});
test("invalid pickup details and package dimensions fail before transmission", () => {
  assert.throws(() => buildOtoOrder(order, { ...sender, shortAddress: "" }, parcel));
  assert.throws(() => buildOtoOrder(order, { ...sender, phone: "hello" }, parcel));
  assert.throws(() => buildOtoOrder(order, sender, { ...parcel, weight: 0 }));
  assert.throws(() => buildOtoOrder(order, sender, { ...parcel, width: Infinity }));
});

const handlerSource = (await readFile(new URL("../pages/api/shipping/prepare.js", import.meta.url), "utf8"))
  .replace(/^import .*;\r?\n/gm, "").replace("export default async function handler", "async function handler");
async function request({ role = "printer", storedOrder = { ...order, payment_status: "paid", payment_reference: "payment", status: "printing" }, headers = { authorization: "Bearer token" } } = {}) {
  const calls = [];
  const admin = { auth: { getUser: async () => ({ data: { user: { id: "printer-a" } } }) },
    from(table) { const filters = []; return { select() { return this; }, eq(k,v) { filters.push([k,v]); return this; },
      async single() { return { data: table === "profiles" ? { role } : filters.every(([k,v]) => storedOrder?.[k] === v) ? storedOrder : null }; } }; } };
  const context = vm.createContext({ supabaseAdmin: admin, buildOtoOrder, AbortSignal,
    process: { env: { OTO_REFRESH_TOKEN: "test-token" } },
    fetch: async (url, options) => { calls.push({url,body:JSON.parse(options.body)}); return { ok: true,
      json: async () => url.endsWith("refreshToken") ? { access_token: "test-access" } : { success: true } }; } });
  vm.runInContext(handlerSource, context);
  let status;
  const res = { setHeader() {}, status(value) { status=value; return this; }, json() {} };
  await context.handler({ method:"POST", headers, body:{orderId:order.id,sender,parcel} },res);
  return {status,calls};
}
test("unauthenticated callers cannot send to OTO", async()=> {
  const result=await request({headers:{}}); assert.equal(result.status,401); assert.equal(result.calls.length,0);
});
test("customer role cannot prepare printer shipping", async()=> {
  const result=await request({role:"customer"}); assert.equal(result.status,403); assert.equal(result.calls.length,0);
});
test("another printer's order cannot be exported", async()=> {
  const result=await request({storedOrder:{...order,printer_id:"other"}}); assert.equal(result.status,404); assert.equal(result.calls.length,0);
});
test("unpaid order cannot be exported", async()=> {
  const result=await request({storedOrder:{...order,payment_status:"unpaid",status:"printing"}}); assert.equal(result.status,409); assert.equal(result.calls.length,0);
});
test("assigned printer can prepare a paid order without purchasing a label", async()=> {
  const result=await request(); assert.equal(result.status,200); assert.equal(result.calls.length,2);
  assert.equal(result.calls[1].body.createShipment,false);
});
