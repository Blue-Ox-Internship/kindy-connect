export const AUTH_LOCK_KEY = "noble.auth.locked";
export const AUTH_USER_KEY = "noble.auth.userId";
export const LEGACY_SESSION_KEY = "kinder.currentUserId";
export const LEGACY_SCHOOL_CONTEXT_KEY = "kinder.selectedSchoolId";
export const LEGACY_LOCK_KEY = "kinder.locked";

export function clearLegacySessionKeys(storage: Storage = sessionStorage) {
  try {
    storage.removeItem(LEGACY_SESSION_KEY);
    storage.removeItem(LEGACY_SCHOOL_CONTEXT_KEY);
    storage.removeItem(LEGACY_LOCK_KEY);
    storage.removeItem(AUTH_LOCK_KEY);
    storage.removeItem(AUTH_USER_KEY);
  } catch {}
}

export function hasActiveSession(storage: Storage = sessionStorage): boolean {
  try {
    const currentId = storage.getItem(AUTH_USER_KEY);
    if (currentId && currentId.trim().length > 0) return true;
    if (storage.getItem(LEGACY_SESSION_KEY)) {
      return false;
    }
    return false;
  } catch {
    return false;
  }
}

export function resetAuthSession(storage: Storage = sessionStorage) {
  try {
    if (typeof (storage as Storage & { clear?: () => void }).clear === "function") {
      storage.clear();
      return;
    }
  } catch {}

  try {
    storage.removeItem(LEGACY_SESSION_KEY);
    storage.removeItem(LEGACY_SCHOOL_CONTEXT_KEY);
    storage.removeItem(LEGACY_LOCK_KEY);
    storage.removeItem(AUTH_LOCK_KEY);
    storage.removeItem(AUTH_USER_KEY);
  } catch {}
}

export function hasLoginLock(storage: Storage = sessionStorage): boolean {
  try {
    if (storage.getItem(AUTH_LOCK_KEY) === "1") return true;
    if (storage.getItem(LEGACY_LOCK_KEY) === "1") {
      storage.setItem(AUTH_LOCK_KEY, "1");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function setLoginLock(storage: Storage = sessionStorage) {
  try {
    storage.setItem(AUTH_LOCK_KEY, "1");
    storage.removeItem(LEGACY_LOCK_KEY);
  } catch {}
}

export function releaseLoginLock(storage: Storage = sessionStorage) {
  try {
    storage.removeItem(AUTH_LOCK_KEY);
    storage.removeItem(LEGACY_LOCK_KEY);
    storage.removeItem(AUTH_USER_KEY);
  } catch {}
}

export function setActiveUserId(userId: string, storage: Storage = sessionStorage) {
  try {
    storage.setItem(AUTH_USER_KEY, userId);
  } catch {}
}

export function clearActiveUserId(storage: Storage = sessionStorage) {
  try {
    storage.removeItem(AUTH_USER_KEY);
  } catch {}
}
