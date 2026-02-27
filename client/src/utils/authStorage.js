const AUTH_KEYS = ["token", "username", "role", "department"];

export function getAuthValue(key) {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

export function setAuthValue(key, value) {
  if (value == null) return;
  sessionStorage.setItem(key, value);
}

export function clearAuthValues() {
  AUTH_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

export function migrateLocalAuthToSession() {
  AUTH_KEYS.forEach((key) => {
    const v = localStorage.getItem(key);
    if (v && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, v);
    }
  });
}
