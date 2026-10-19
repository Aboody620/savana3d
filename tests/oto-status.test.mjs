import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/otoStatus.js", import.meta.url), "utf8");
const { buildOtoUpdate, nextOrderStatus, savanaOrderIdFromOto } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const ID = "24543ec5-1dd2-46a1-b4b3-d3bd47837665";

test("OTO order ids map back to Savana orders", () => {
  assert.equal(savanaOrderIdFromOto(`SAVANA-${ID}`), ID);
  assert.equal(savanaOrderIdFromOto(ID.toUpperCase()), ID);
  assert.equal(savanaOrderIdFromOto("12345"), null);
});

test("statuses only move forward", () => {
  assert.equal(nextOrderStatus("printing", "pickedUp"), "shipped");
  assert.equal(nextOrderStatus("shipped", "delivered"), "completed");
  assert.equal(nextOrderStatus("completed", "shipmentInProgress"), "completed");
  assert.equal(nextOrderStatus("cancelled", "delivered"), "cancelled");
  assert.equal(nextOrderStatus("pending", "delivered"), "pending");
  assert.equal(nextOrderStatus("printing", "returned"), "printing");
});

test("webhook fills tracking and ignores unsafe links", () => {
  const update = buildOtoUpdate({ status: "printing" }, { status: "pickedUp", dcTrackingNumber: "AB123",
    trackingUrl: "javascript:alert(1)", deliveryCompany: "SMSA" });
  assert.equal(update.status, "shipped");
  assert.equal(update.tracking_number, "AB123");
  assert.equal(update.shipping_carrier, "SMSA");
  assert.equal(update.tracking_url, undefined);
  assert.equal(buildOtoUpdate({ status: "printing" }, { trackingUrl: "https://track.example/x" }).tracking_url, "https://track.example/x");
});
