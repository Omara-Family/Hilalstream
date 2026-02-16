const SCRIPT_SRC = 'https://ballroomfondnessnovelty.com/c5/87/b7/c587b76ceee02cf1b8604471065a25dc.js';
const STORAGE_KEY = 'popCount';
const SCRIPT_ID = 'pop-ad-script';
const MAX_POPS = 5;

/** Inject the ad script early so it's ready to intercept clicks */
function ensureScriptLoaded(): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

// Load the script as soon as this module is imported
ensureScriptLoaded();

/**
 * Call this on user click events (e.g. Watch Now, Episode links).
 * It re-injects the script to trigger the popunder on this interaction,
 * and briefly delays SPA navigation so the ad script has time to fire.
 */
export function triggerPopAd(e?: React.MouseEvent): void {
  if (typeof window === 'undefined') return;

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
