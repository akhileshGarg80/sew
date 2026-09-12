// Storage key for saving user search history
export const RECENT_USERS_KEY = 'gh_explorer_recent_users';

export function getRecentUsers(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    return [];
  } catch (err) {
    console.warn('Failed to read recent users from localStorage:', err);
    return [];
  }
}

export function saveRecentUser(username: string): string[] {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) return getRecentUsers();

  try {
    const current = getRecentUsers();
    // Move to front, case-insensitive deduplication
    const filtered = current.filter((u) => u.toLowerCase() !== trimmed);
    const updated = [trimmed, ...filtered].slice(0, 12);
    localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('recent-users-updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Failed to save recent user to localStorage:', err);
    return getRecentUsers();
  }
}

export function removeRecentUser(username: string): string[] {
  const target = username.trim().toLowerCase();
  try {
    const current = getRecentUsers();
    const updated = current.filter((u) => u.toLowerCase() !== target);
    localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('recent-users-updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Failed to remove recent user from localStorage:', err);
    return getRecentUsers();
  }
}

export function clearRecentUsers(): void {
  try {
    localStorage.removeItem(RECENT_USERS_KEY);
    window.dispatchEvent(new CustomEvent('recent-users-updated', { detail: [] }));
  } catch (err) {
    console.warn('Failed to clear recent users from localStorage:', err);
  }
}
