import assert from "node:assert/strict";
import test from "node:test";
import { isValidLoginEmail } from "../src/lib/auth/allowed-login-domain";

test("allows Goalkeep email addresses", () => {
  assert.equal(isValidLoginEmail("tanya@goalkeep.net"), true);
});

test("allows invited email addresses from other domains", () => {
  assert.equal(isValidLoginEmail("tanya@gmail.com"), true);
});

test("accepts uppercase email domains", () => {
  assert.equal(isValidLoginEmail("tanya@GOALKEEP.NET"), true);
});

test("rejects malformed email addresses", () => {
  assert.equal(isValidLoginEmail("not-an-email"), false);
  assert.equal(isValidLoginEmail("tanya@"), false);
  assert.equal(isValidLoginEmail(null), false);
});
