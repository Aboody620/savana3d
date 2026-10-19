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

// Mirrors what an earlier session created directly in production before this migration existed.
const LEGACY = `
  create table print_quotes (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references profiles(id), design_id uuid not null references designs(id),
    printer_id uuid references profiles(id), quantity integer not null check (quantity between 1 and 100),
    material text not null, color text not null, city text not null, notes text default '',
    status text not null default 'open' check (status in ('open','offered','accepted','cancelled')),
    product_price numeric, shipping_price numeric, order_id uuid references orders(id),
    created_at timestamptz default now());
  create function request_print_quote(p_design uuid, p_quantity integer, p_material text, p_color text, p_city text, p_notes text default '')
    returns uuid language sql as $$ select null::uuid $$;
`;

async function setup({ legacy = false } = {}) {
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
  if (legacy) {
    await db.exec(await sql("migration_shipping_payment.sql"));
    await db.exec(await sql("migration_moyasar.sql"));
    await db.exec(LEGACY);
  }
  for (const file of ["migration_shipping_payment.sql", "migration_moyasar.sql", "migration_server_checkout.sql",
    "migration_oto_tracking.sql", "migration_print_quotes.sql", "migration_print_quotes.sql"]) {
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
  const role = who === "server" ? "service_role" : who ? "authenticated" : "";
  const uid = who && who !== "server" ? ids[who] : "";
  await db.exec(`set test.uid = '${uid}'; set test.role = '${role}';`);
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

test("the migration upgrades the database version created by the earlier session", async () => {
  const { db, designId } = await setup({ legacy: true });
  await as(db, "customer");
  const { rows: [{ request_print_quote: quoteId }] } =
    await db.query("select request_print_quote($1, 1, 'PLA', 'red', 'Madinah', '')", [designId]);
  assert.ok(quoteId);
  await as(db, "printer");
  await db.query("select offer_print_quote($1, 40, 15)", [quoteId]);
  await as(db, null);
  const { rows: [quote] } = await db.query("select status, offered_at from print_quotes where id = $1", [quoteId]);
  assert.equal(quote.status, "offered");
  assert.ok(quote.offered_at);
});

test("accepting a quote creates one unpaid order at the stored price, server only", async () => {
  const { db, designId } = await setup();
  await as(db, "customer");
  const { rows: [{ request_print_quote: quoteId }] } =
    await db.query("select request_print_quote($1, 3, 'PETG', 'black', 'Madinah', '10cm')", [designId]);
  await as(db, "printer");
  await db.query("select offer_print_quote($1, 90, 18.5)", [quoteId]);

  const accept = (who) => as(db, who).then(() => db.query(
    "select accept_print_quote($1, $2, 'عبدالإله', '966551234567', 'حي العزيزية') as id", [quoteId, ids.customer]));
  await assert.rejects(accept("customer"), /Server authorization/);
  const { rows: [{ id: orderId }] } = await accept("server");
  const { rows: [{ id: again }] } = await accept("server");
  assert.equal(again, orderId);

  await as(db, null);
  const { rows: orders } = await db.query("select * from orders");
  assert.equal(orders.length, 1);
  assert.equal(Number(orders[0].total_price), 90);
  assert.equal(Number(orders[0].shipping_cost), 18.5);
  assert.equal(Number(orders[0].designer_commission), 9);
  assert.equal(orders[0].printer_id, ids.printer);
  assert.equal(orders[0].status, "pending_payment");
});

const quoteSource = await readFile(new URL("../lib/quoteOrder.js", import.meta.url), "utf8");
const { quoteRecipient } = await import(`data:text/javascript;base64,${Buffer.from(quoteSource).toString("base64")}`);
const checkoutSource = await readFile(new URL("../lib/checkout.js", import.meta.url), "utf8");
const { validateShipping } = await import(`data:text/javascript;base64,${Buffer.from(checkoutSource).toString("base64")}`);

test("recipient details are validated before a quote is accepted", () => {
  const quote = { city: "المدينة" };
  assert.deepEqual(quoteRecipient(quote, { name: "عبدالإله", phone: "055 123 4567", address: "حي العزيزية شارع 12" }, validateShipping),
    { p_name: "عبدالإله", p_phone: "966551234567", p_address: "حي العزيزية شارع 12" });
  assert.throws(() => quoteRecipient(quote, { name: "عبدالإله", phone: "123", address: "حي العزيزية شارع 12" }, validateShipping));
  assert.throws(() => quoteRecipient(quote, { name: "x", phone: "0551234567", address: "قصير" }, validateShipping));
});
