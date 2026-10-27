import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedLoginEmail } from "../src/lib/auth/allowed-login-domain";

test("allows goalkeep.net email addresses", () => {
  assert.equal(isAllowedLoginEmail("tanya@goalkeep.net", "goalkeep.net"), true);
});

test("rejects gmail.com email addresses", () => {
  assert.equal(isAllowedLoginEmail("tanya@gmail.com", "goalkeep.net"), false);
});

test("allows uppercase Goalkeep domain addresses", () => {
  assert.equal(isAllowedLoginEmail("tanya@GOALKEEP.NET", "goalkeep.net"), true);
});
