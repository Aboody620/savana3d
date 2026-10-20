import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/checkout.js", import.meta.url), "utf8");
const mod = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const { buildStoreOrders, buildCustomOrder, normalizeCartItems, normalizeSaudiMobile, shippingFor } = mod;

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const shipping = { name: "عبدالإله", phone: "0551234567", city: "الرياض", address: "حي العزيزية شارع 12" };

test("store prices come from the database, not the browser", () => {
  const items = normalizeCartItems([{ id: A, quantity: 2, price: 0.01 }, { id: B, quantity: 1 }]);
  const { rows, total } = buildStoreOrders({ customerId: "c", items, shipping,
    designs: [{ id: A, price: 40 }, { id: B, price: 15.5 }] });
  assert.equal(rows[0].total_price, 80);
  assert.equal(rows[1].total_price, 15.5);
  assert.equal(rows[0].shipping_cost, 25);
  assert.equal(rows[1].shipping_cost, 0);
  assert.equal(total, 120.5);
  assert.ok(rows.every((r) => r.payment_status === "unpaid" && r.status === "pending_payment"));
});

test("duplicated cart lines are merged and quantities are bounded", () => {
  assert.deepEqual(normalizeCartItems([{ id: A, quantity: 1 }, { id: A, quantity: 2 }]), [{ id: A, color: "", quality: "standard", quantity: 3 }]);
  for (const quantity of [0, -1, 1.5, 21, "x"]) {
    assert.throws(() => normalizeCartItems([{ id: A, quantity }]));
  }
  assert.throws(() => normalizeCartItems([{ id: "not-a-uuid", quantity: 1 }]));
  assert.throws(() => normalizeCartItems([]));
});

test("removed designs are reported so the cart can drop them", () => {
  const items = normalizeCartItems([{ id: A, quantity: 1 }]);
  assert.throws(() => buildStoreOrders({ customerId: "c", items, shipping, designs: [] }),
    (err) => err.status === 409 && err.missing[0] === A);
});

test("free or invalid design prices are rejected", () => {
  const items = normalizeCartItems([{ id: A, quantity: 1 }]);
  assert.throws(() => buildStoreOrders({ customerId: "c", items, shipping, designs: [{ id: A, price: 0 }] }));
});

test("Saudi mobile numbers are normalized for the courier", () => {
  assert.equal(normalizeSaudiMobile("055 123 4567"), "966551234567");
  assert.equal(normalizeSaudiMobile("+966551234567"), "966551234567");
  assert.equal(normalizeSaudiMobile("0112345678"), null);
  assert.throws(() => buildStoreOrders({ customerId: "c", items: [{ id: A, quantity: 1 }],
    designs: [{ id: A, price: 10 }], shipping: { ...shipping, phone: "123" } }));
});

test("custom orders only accept files uploaded to the customer's own folder", () => {
  const base = "https://abc.supabase.co/storage/v1/object/public/designs/custom/";
  const ok = buildCustomOrder({ customerId: "cust", supabaseUrl: "https://abc.supabase.co/",
    fileUrl: `${base}cust/1.stl`, price: 50, notes: "", shipping });
  assert.equal(ok.total, 75);
  for (const fileUrl of [`${base}other/1.stl`, "https://evil.example/x.stl", `${base}cust/../other/1.stl`]) {
    assert.throws(() => buildCustomOrder({ customerId: "cust", supabaseUrl: "https://abc.supabase.co",
      fileUrl, price: 50, shipping }));
  }
  assert.throws(() => buildCustomOrder({ customerId: "cust", supabaseUrl: "https://abc.supabase.co",
    fileUrl: `${base}cust/1.stl`, price: 1, shipping }));
});

const pathSource = await readFile(new URL("../lib/storagePath.js", import.meta.url), "utf8");
const { designsPathFromUrl } = await import(`data:text/javascript;base64,${Buffer.from(pathSource).toString("base64")}`);
test("stored file links resolve to private storage paths", () => {
  const base = "https://abc.supabase.co";
  assert.equal(designsPathFromUrl(`${base}/storage/v1/object/public/designs/u1/file%20a.stl`, base), "u1/file a.stl");
  assert.equal(designsPathFromUrl(`${base}/storage/v1/object/public/previews/u1/a.png`, base), null);
  assert.equal(designsPathFromUrl("https://evil.example/storage/v1/object/public/designs/u1/a.stl", base), null);
  assert.equal(designsPathFromUrl(`${base}/storage/v1/object/public/designs/../x`, base), null);
});

test("color and quality are validated and priced on the server", () => {
  const designs = [{ id: A, price: 40, price_high: 55, colors: ["أسود", "أبيض"], title: "Vase" }];
  const items = normalizeCartItems([
    { id: A, quantity: 1, color: "أسود", quality: "high" },
    { id: A, quantity: 2, color: "أبيض" },
  ]);
  assert.equal(items.length, 2);
  const { rows, total } = buildStoreOrders({ customerId: "c", items, designs, shipping });
  assert.equal(rows[0].total_price, 55);
  assert.equal(rows[0].color, "أسود");
  assert.equal(rows[0].quality, "high");
  assert.equal(rows[1].total_price, 80);
  assert.equal(total, 55 + 80 + 25);
  assert.throws(() => buildStoreOrders({ customerId: "c", designs, shipping,
    items: normalizeCartItems([{ id: A, quantity: 1, color: "وردي" }]) }), /اللون/);
  assert.throws(() => buildStoreOrders({ customerId: "c", shipping, designs: [{ id: A, price: 40, colors: [] }],
    items: normalizeCartItems([{ id: A, quantity: 1, quality: "high" }]) }), /الجودة العالية/);
  assert.throws(() => buildStoreOrders({ customerId: "c", shipping, designs: [{ id: A, price: 40, is_active: false }],
    items: normalizeCartItems([{ id: A, quantity: 1 }]) }), (err) => err.status === 409);
});

test("delivery inside Madinah costs less than shipping elsewhere", () => {
  for (const city of ["المدينة المنورة", "المدينه المنوره", " المدينة ", "Madinah", "medina"]) assert.equal(shippingFor(city), 15);
  for (const city of ["الرياض", "جدة", "", undefined]) assert.equal(shippingFor(city), 25);
  const { total } = buildStoreOrders({ customerId: "c", designs: [{ id: A, price: 40 }],
    items: normalizeCartItems([{ id: A, quantity: 1 }]), shipping: { ...shipping, city: "المدينة المنورة" } });
  assert.equal(total, 55);
});
