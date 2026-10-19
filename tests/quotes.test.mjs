// Runs the real SQL migrations on an in-memory PostgreSQL (PGlite) with small
// stand-ins for Supabase's auth and storage schemas, then walks the quote flow.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const sql = (name) => readFile(new URL(`../supabase/${name}`, import.meta.url), "utf8");
const ids = {
  customer: "11111111-1111-4111-8111-111111111111",
  printer: "22222222-2222-4222-8222-222222222222",
  printer2: "33333333-3333-4333-8333-333333333333",
  designer: "44444444-4444-4444-8444-444444444444",
};

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select nullif(current_setting('test.role', true), '') $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean);
    create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
    create function storage.foldername(name text) returns text[] language sql immutable as
      $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    alter table storage.objects enable row level security;
  `);
  // schema.sql references storage policies that need Supabase internals; keep only the public tables.
  const schema = (await sql("schema.sql")).split("-- Storage buckets")[0];
  await db.exec(schema);
  for (const file of ["migration_shipping_payment.sql", "migration_moyasar.sql", "migration_server_checkout.sql",
    "migration_oto_tracking.sql", "migration_print_quotes.sql"]) {
    await db.exec(await sql(file));
  }
  await db.exec(`
    insert into auth.users values ('${ids.customer}'), ('${ids.printer}'), ('${ids.printer2}'), ('${ids.designer}');
    insert into profiles (id, role) values ('${ids.customer}', 'customer'), ('${ids.printer}', 'printer'),
      ('${ids.printer2}', 'printer'), ('${ids.designer}', 'designer');
  `);
  const { rows } = await db.query(`insert into designs (designer_id, title, file_url, price, pricing_mode)
    values ($1, 'Stand', 'https://x.supabase.co/storage/v1/object/public/designs/a/b.stl', 0, 'quote') returning id`, [ids.designer]);
  return { db, designId: rows[0].id };
}

const as = async (db, who) => {
  await db.exec(`set test.uid = '${who ? ids[who] : ""}'; set test.role = '${who ? "authenticated" : ""}';`);
};

test("quote flow: request, single printer offer, decline rules", async () => {
  const { db, designId } = await setup();

  await as(db, "printer");
  await assert.rejects(db.query("select request_print_quote($1, 1, 'PLA', 'red', 'Madinah', null)", [designId]));

  await as(db, "customer");
  const { rows: [{ request_print_quote: quoteId }] } =
    await db.query("select request_print_quote($1, 2, 'PLA', ' red ', 'Madinah', '10cm')", [designId]);
  await assert.rejects(db.query("select request_print_quote($1, 0, 'PLA', 'red', 'Madinah', null)", [designId]));
  await assert.rejects(db.query("select request_print_quote($1, 1, 'Wood', 'red', 'Madinah', null)", [designId]));
  await assert.rejects(db.query("select offer_print_quote($1, 50, 10)", [quoteId]), /أصحاب الطابعات/);

  await as(db, "printer");
  await assert.rejects(db.query("select offer_print_quote($1, 0, 10)", [quoteId]));
  await db.query("select offer_print_quote($1, 80.456, 20)", [quoteId]);
  await as(db, "printer2");
  await assert.rejects(db.query("select offer_print_quote($1, 60, 10)", [quoteId]), /ما عاد متاحًا/);

  await as(db, null);
  const { rows: [quote] } = await db.query("select * from print_quotes where id = $1", [quoteId]);
  assert.equal(quote.status, "offered");
  assert.equal(quote.printer_id, ids.printer);
  assert.equal(Number(quote.product_price), 80.46);
  assert.equal(quote.color, "red");

  await as(db, "printer");
  await assert.rejects(db.query("select decline_print_quote($1)", [quoteId]));
  await as(db, "customer");
  await db.query("select decline_print_quote($1)", [quoteId]);
  await as(db, null);
  const { rows: [after] } = await db.query("select status from print_quotes where id = $1", [quoteId]);
  assert.equal(after.status, "cancelled");
});

test("orders cannot be inserted or marked paid outside the server", async () => {
  const { db, designId } = await setup();
  await as(db, "customer");
  await assert.rejects(db.query(`insert into orders (customer_id, design_id, total_price, status, payment_status)
    values ($1, $2, 1, 'pending', 'paid')`, [ids.customer, designId]), /صفحة الدفع/);

  await as(db, null); // service role / SQL editor
  const { rows: [order] } = await db.query(`insert into orders (customer_id, design_id, printer_id, total_price, shipping_cost, status, payment_status)
    values ($1, $2, $3, 80, 20, 'pending_payment', 'unpaid') returning id`, [ids.customer, designId, ids.printer]);

  await as(db, "printer");
  await assert.rejects(db.query("update orders set payment_status = 'paid' where id = $1", [order.id]), /النظام فقط/);
  await assert.rejects(db.query("update orders set status = 'printing' where id = $1", [order.id]), /لم يُدفع/);
  await assert.rejects(db.query("update orders set tracking_url = 'https://x' where id = $1", [order.id]), /النظام فقط/);
  await assert.rejects(db.query("update orders set total_price = 1 where id = $1", [order.id]));

  await as(db, null);
  await db.query("update orders set payment_status = 'paid', status = 'accepted', payment_reference = 'p1' where id = $1", [order.id]);
  await as(db, "printer");
  await db.query("update orders set status = 'printing' where id = $1", [order.id]);
});

const quoteSource = await readFile(new URL("../lib/quoteOrder.js", import.meta.url), "utf8");
const { buildQuoteOrder } = await import(`data:text/javascript;base64,${Buffer.from(quoteSource).toString("base64")}`);
const checkoutSource = await readFile(new URL("../lib/checkout.js", import.meta.url), "utf8");
const { validateShipping } = await import(`data:text/javascript;base64,${Buffer.from(checkoutSource).toString("base64")}`);

test("approved quote becomes an order at the printer's stored price", () => {
  const quote = { customer_id: "c", design_id: "d", printer_id: "p", quantity: 3, material: "PETG",
    color: "black", notes: "10cm", city: "المدينة", product_price: "90", shipping_price: "18.5" };
  const row = buildQuoteOrder(quote, { name: "عبدالإله", phone: "0551234567", address: "حي العزيزية شارع 12", total_price: 1 }, validateShipping);
  assert.equal(row.total_price, 90);
  assert.equal(row.shipping_cost, 18.5);
  assert.equal(row.printer_id, "p");
  assert.equal(row.shipping_city, "المدينة");
  assert.equal(row.status, "pending_payment");
  assert.match(row.notes, /PETG · black\n10cm/);
  assert.throws(() => buildQuoteOrder(quote, { name: "x", phone: "1", address: "short" }, validateShipping));
  assert.throws(() => buildQuoteOrder({ ...quote, product_price: null }, { name: "عبدالإله", phone: "0551234567", address: "حي العزيزية شارع 12" }, validateShipping));
});
