// Runs every migration in order on PGlite (with stand-ins for Supabase auth/storage)
// and checks the single-seller rules: the owner is admin, roles are locked, quote items hidden.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const sql = (name) => readFile(new URL(`../supabase/${name}`, import.meta.url), "utf8");
const OWNER = "11111111-1111-4111-8111-111111111111";
const CUSTOMER = "22222222-2222-4222-8222-222222222222";

async function setup() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
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
  await db.exec((await sql("schema.sql")).split("-- Storage buckets")[0]);
  await db.exec(await sql("migration_signup_trigger.sql"));
  await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values
    ('${OWNER}', 'A.Ali44xd@gmail.com', '{"role":"designer"}'),
    ('${CUSTOMER}', 'someone@example.com', '{}');`);
  await db.exec(`insert into designs (designer_id, title, file_url, price) values ('${OWNER}', 'Vase', 'x', 60);
    insert into designs (designer_id, title, file_url, price) values ('${OWNER}', 'Old quote item', 'x', 0);`);
  for (const file of ["migration_shipping_payment.sql", "migration_moyasar.sql", "migration_server_checkout.sql",
    "migration_oto_tracking.sql",
    "migration_print_quotes.sql", "migration_single_seller.sql", "migration_single_seller.sql"]) {
    await db.exec(await sql(file));
  }
  return db;
}

const as = (db, uid, role = "authenticated") => db.exec(`set test.uid = '${uid}'; set test.role = '${role}';`);

test("store owner becomes the only admin", async () => {
  const db = await setup();
  const { rows } = await db.query("select user_id from admins");
  assert.deepEqual(rows.map((r) => r.user_id), [OWNER]);
  await as(db, OWNER);
  assert.equal((await db.query("select is_admin() as a")).rows[0].a, true);
  await as(db, CUSTOMER);
  assert.equal((await db.query("select is_admin() as a")).rows[0].a, false);
});

test("customers cannot change their account type", async () => {
  const db = await setup();
  await as(db, CUSTOMER);
  await assert.rejects(db.query(`update profiles set role = 'printer' where id = '${CUSTOMER}'`), /نوع الحساب/);
  await db.query(`update profiles set full_name = 'Ali' where id = '${CUSTOMER}'`);
});

test("new sign-ups are always customers", async () => {
  const db = await setup();
  const id = "33333333-3333-4333-8333-333333333333";
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'x@y.z', '{"role":"printer"}')`, [id]);
  assert.equal((await db.query("select role from profiles where id = $1", [id])).rows[0].role, "customer");
});

test("products without a fixed price are hidden; orders store color and quality", async () => {
  const db = await setup();
  const { rows } = await db.query("select title, is_active from designs order by title");
  assert.deepEqual(rows.map((r) => [r.title, r.is_active]), [["Old quote item", false], ["Vase", true]]);
  await as(db, "", "");
  await db.query(`insert into orders (customer_id, total_price, shipping_cost, status, payment_status, color, quality)
    values ('${CUSTOMER}', 60, 15, 'pending_payment', 'unpaid', 'أسود', 'high')`);
  await assert.rejects(db.query(`insert into orders (customer_id, total_price, quality) values ('${CUSTOMER}', 1, 'ultra')`));
});
