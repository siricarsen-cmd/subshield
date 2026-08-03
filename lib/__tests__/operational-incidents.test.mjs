// Sanitized operational incident contract checks. Run with Node 24:
// node --experimental-loader ./lib/analyzer/__tests__/ts-relative-import.loader.mjs lib/__tests__/operational-incidents.test.mjs
import assert from "node:assert/strict";
import {
  OPERATIONAL_INCIDENT_SEVERITIES,
  getOperationalStatusWithDatabase,
  recordOperationalIncidentWithDatabase,
} from "../operational-incidents.ts";

let checks = 0;

async function check(label, callback) {
  await callback();
  checks += 1;
  console.log(`PASS: ${label}`);
}

await check("incident vocabulary contains only fixed code and severity strings", async () => {
  const serialized = JSON.stringify(OPERATIONAL_INCIDENT_SEVERITIES);
  assert.equal(Object.keys(OPERATIONAL_INCIDENT_SEVERITIES).length, 17);
  assert.equal(/@|\.pdf|stripe_event|customer_id|user_id|audit_id/i.test(serialized), false);
  assert.deepEqual(
    [...new Set(Object.values(OPERATIONAL_INCIDENT_SEVERITIES))].sort(),
    ["critical", "warning"],
  );
});

await check("incident recording sends only the allow-listed event code", async () => {
  let invocation;
  const recorded = await recordOperationalIncidentWithDatabase(
    {
      async rpc(functionName, params) {
        invocation = { functionName, params };
        return { data: null, error: null };
      },
    },
    "stripe_invoice_reconciliation_required",
  );

  assert.equal(recorded, true);
  assert.deepEqual(invocation, {
    functionName: "record_operational_incident",
    params: { p_event_code: "stripe_invoice_reconciliation_required" },
  });
});

await check("incident recording reports a database failure without throwing details", async () => {
  const recorded = await recordOperationalIncidentWithDatabase(
    {
      async rpc() {
        return { data: null, error: { message: "sensitive database detail" } };
      },
    },
    "delete_lock_failed",
  );

  assert.equal(recorded, false);
});

await check("recent incidents produce a generic degraded status", async () => {
  let invocation;
  const status = await getOperationalStatusWithDatabase(
    {
      async rpc(functionName, params) {
        invocation = { functionName, params };
        return { data: true, error: null };
      },
    },
    {
      now: new Date("2026-08-03T06:30:00.000Z"),
      windowMs: 90 * 60 * 1000,
    },
  );

  assert.equal(status, "degraded");
  assert.deepEqual(invocation, {
    functionName: "has_recent_operational_incidents",
    params: { p_since: "2026-08-03T05:00:00.000Z" },
  });
});

await check("no recent incidents produce ok", async () => {
  const status = await getOperationalStatusWithDatabase({
    async rpc() {
      return { data: false, error: null };
    },
  });

  assert.equal(status, "ok");
});

await check("monitor query failure fails closed as degraded", async () => {
  const status = await getOperationalStatusWithDatabase({
    async rpc() {
      return { data: null, error: { message: "private failure detail" } };
    },
  });

  assert.equal(status, "degraded");
});

console.log(`Completed ${checks} operational incident checks.`);
