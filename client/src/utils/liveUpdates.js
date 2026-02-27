export const LIVE_EVENT_ISSUES_UPDATED = "minutes-tracker:issues-updated";
export const LIVE_EVENT_NOTIFICATIONS_UPDATED = "minutes-tracker:notifications-updated";
const LIVE_EVENT_ISSUES_UPDATED_KEY = "minutes-tracker:issues-updated:key";
const LIVE_EVENT_NOTIFICATIONS_UPDATED_KEY = "minutes-tracker:notifications-updated:key";

const KEY_BY_EVENT = {
  [LIVE_EVENT_ISSUES_UPDATED]: LIVE_EVENT_ISSUES_UPDATED_KEY,
  [LIVE_EVENT_NOTIFICATIONS_UPDATED]: LIVE_EVENT_NOTIFICATIONS_UPDATED_KEY,
};

function emitCrossTab(eventName, payload) {
  const key = KEY_BY_EVENT[eventName];
  if (!key) return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), payload: payload || {} })
    );
  } catch {
    // Ignore storage errors; same-tab custom event still works.
  }
}

export function emitIssuesUpdated(payload = {}) {
  window.dispatchEvent(new CustomEvent(LIVE_EVENT_ISSUES_UPDATED, { detail: payload }));
  emitCrossTab(LIVE_EVENT_ISSUES_UPDATED, payload);
}

export function emitNotificationsUpdated(payload = {}) {
  window.dispatchEvent(new CustomEvent(LIVE_EVENT_NOTIFICATIONS_UPDATED, { detail: payload }));
  emitCrossTab(LIVE_EVENT_NOTIFICATIONS_UPDATED, payload);
}

export function addLiveEventListener(eventName, handler) {
  const key = KEY_BY_EVENT[eventName];
  const customHandler = (evt) => handler(evt);
  const storageHandler = (evt) => {
    if (!key || evt.key !== key || !evt.newValue) return;
    try {
      const parsed = JSON.parse(evt.newValue);
      handler({ detail: parsed?.payload || {} });
    } catch {
      handler({ detail: {} });
    }
  };

  window.addEventListener(eventName, customHandler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(eventName, customHandler);
    window.removeEventListener("storage", storageHandler);
  };
}
