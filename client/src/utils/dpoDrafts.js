const DPO_DRAFTS_KEY = "dpo_issue_drafts";

function readDrafts() {
  try {
    const raw = localStorage.getItem(DPO_DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts) {
  localStorage.setItem(DPO_DRAFTS_KEY, JSON.stringify(drafts));
}

export function getDrafts() {
  return readDrafts().sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export function getDraftById(draftId) {
  return readDrafts().find((d) => d.id === draftId) || null;
}

export function saveDraft(draft) {
  const drafts = readDrafts();
  const now = new Date().toISOString();
  const idx = drafts.findIndex((d) => d.id === draft.id);

  const normalized = {
    ...draft,
    createdAt: draft.createdAt || now,
    updatedAt: now,
  };

  if (idx >= 0) {
    drafts[idx] = normalized;
  } else {
    drafts.push(normalized);
  }

  writeDrafts(drafts);
  return normalized;
}

export function removeDraft(draftId) {
  const drafts = readDrafts().filter((d) => d.id !== draftId);
  writeDrafts(drafts);
}
