import test from "node:test";
import assert from "node:assert/strict";

import {
  AUTH_LOCK_KEY,
  LEGACY_SESSION_KEY,
  LEGACY_SCHOOL_CONTEXT_KEY,
  clearLegacySessionKeys,
  hasLoginLock,
  releaseLoginLock,
  setLoginLock,
} from "./session-state.ts";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.has(key) ? values.get(key)! : null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  } as Storage;
}

test("lock state is preserved until the user enters the password again", () => {
  const storage = createStorage();

  setLoginLock(storage);
  assert.equal(hasLoginLock(storage), true);

  releaseLoginLock(storage);
  assert.equal(hasLoginLock(storage), false);
  assert.equal(storage.getItem(AUTH_LOCK_KEY), null);
});

test("legacy auth keys are cleared without removing the current lock state", () => {
  const storage = createStorage();

  storage.setItem(LEGACY_SESSION_KEY, "user-123");
  storage.setItem(LEGACY_SCHOOL_CONTEXT_KEY, "school-456");
  storage.setItem(AUTH_LOCK_KEY, "1");

  clearLegacySessionKeys(storage);

  assert.equal(storage.getItem(LEGACY_SESSION_KEY), null);
  assert.equal(storage.getItem(LEGACY_SCHOOL_CONTEXT_KEY), null);
  assert.equal(storage.getItem(AUTH_LOCK_KEY), "1");
});
