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

/** Check if current page is a Watch page */
function isWatchPage(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/watch');
}

/** Inject the ad script early so it's ready to intercept clicks */
function ensureScriptLoaded(): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById(SCRIPT_ID)) return;
  if (isAdmin()) return;
  if (isWatchPage()) return;
  if (sessionStorage.getItem('on-watch-page') === 'true') return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

let adObserver: MutationObserver | null = null;

/** Detect and remove ad-injected overlays, iframes, and scripts */
function cleanAdElements(): void {
  // Remove ad iframes
  document.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.src || '';
    if (src.includes('highperformanceformat') || src.includes('ballroomfondness') || 
        src.includes('kettledrooping') || src.includes('everya')) {
      iframe.remove();
    }
  });

  // Remove fixed/absolute positioned overlays injected by ad scripts (not part of React root)
  const root = document.getElementById('root');
  document.body.querySelectorAll(':scope > div, :scope > iframe, :scope > ins').forEach(el => {
    if (el === root || el.id === SCRIPT_ID) return;
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'absolute' || style.zIndex > '999') {
      el.remove();
    }
  });

  // Remove ad scripts
  document.querySelectorAll(`script[src*="ballroomfondness"], script[src*="highperformanceformat"], script[src*="kettledrooping"]`).forEach(s => s.remove());
  const popScript = document.getElementById(SCRIPT_ID);
  if (popScript) popScript.remove();
}

/** Remove the ad script, block popunders on Watch page + observe for new injections */
export function removePopAdScript(): void {
  cleanAdElements();

  // Block window.open
  if (!(window as any).__originalOpen) {
    (window as any).__originalOpen = window.open;
  }
  window.open = function() { return null; } as typeof window.open;

  // Watch for new ad elements being injected and remove them immediately
  if (!adObserver) {
    adObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const tag = node.tagName;
          
          // Remove injected iframes from ad networks
          if (tag === 'IFRAME') {
            const src = (node as HTMLIFrameElement).src || '';
            if (src.includes('highperformanceformat') || src.includes('ballroomfondness') || 
                src.includes('kettledrooping') || src.includes('everya')) {
              node.remove();
              continue;
            }
          }
          
          // Remove fixed overlays not in React root
          if (tag === 'DIV' || tag === 'INS' || tag === 'IFRAME') {
            const root = document.getElementById('root');
            if (node.parentElement === document.body && node !== root) {
              const style = window.getComputedStyle(node);
              if (style.position === 'fixed' || style.position === 'absolute' || parseInt(style.zIndex) > 999) {
                node.remove();
                continue;
              }
            }
          }
          
          // Remove ad scripts
          if (tag === 'SCRIPT') {
            const src = (node as HTMLScriptElement).src || '';
            if (src.includes('ballroomfondness') || src.includes('highperformanceformat') || src.includes('kettledrooping')) {
              node.remove();
            }
          }
        }
      }
    });
    adObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
  
  sessionStorage.setItem('on-watch-page', 'true');
}

/** Call when leaving Watch page to allow ads again */
export function allowPopAdScript(): void {
  sessionStorage.removeItem('on-watch-page');
  
  // Restore window.open
  if ((window as any).__originalOpen) {
    window.open = (window as any).__originalOpen;
    delete (window as any).__originalOpen;
  }
  
  // Stop observing
  if (adObserver) {
    adObserver.disconnect();
    adObserver = null;
  }
}

/** Call from non-Watch pages to load the popunder script */
export function initPopAd(): void {
  if (typeof window === 'undefined') return;
  if (isAdmin()) return;
  if (isWatchPage()) return;
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
  if (isWatchPage()) return;

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
