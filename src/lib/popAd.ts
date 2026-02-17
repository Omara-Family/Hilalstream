const SCRIPT_SRC = 'https://ballroomfondnessnovelty.com/c5/87/b7/c587b76ceee02cf1b8604471065a25dc.js';
const STORAGE_KEY = 'popCount';
const SCRIPT_ID = 'pop-ad-script';
const MAX_POPS = 5;

/** Check if current user is admin (reads from zustand store) */
function isAdmin(): boolean {
  try {
    const store = JSON.parse(sessionStorage.getItem('app-admin') || 'false');
    return store === true;
  } catch { return false; }
}

/** Inject the ad script early so it's ready to intercept clicks */
function ensureScriptLoaded(): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById(SCRIPT_ID)) return;
  if (isAdmin()) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

// Delay script load to allow admin status to be set in sessionStorage
if (typeof window !== 'undefined') {
  setTimeout(() => ensureScriptLoaded(), 2000);
}

/**
 * Call this on user click events (e.g. Watch Now, Episode links).
 * It re-injects the script to trigger the popunder on this interaction,
 * and briefly delays SPA navigation so the ad script has time to fire.
 */
export function triggerPopAd(e?: React.MouseEvent): void {
  if (typeof window === 'undefined') return;
  if (isAdmin()) return;

  const count = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
  if (count >= MAX_POPS) return;

  // Remove and re-inject script to trigger on this user gesture
  const old = document.getElementById(SCRIPT_ID);
  if (old) old.remove();

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);

  sessionStorage.setItem(STORAGE_KEY, String(count + 1));

  // Delay SPA navigation so the script has time to execute on the user gesture
  if (e) {
    e.preventDefault();
    const el = e.currentTarget as HTMLAnchorElement;
    const target = el?.getAttribute('href') || el?.pathname;
    if (target) {
      setTimeout(() => {
        window.location.href = target;
      }, 300);
    }
  }
}
