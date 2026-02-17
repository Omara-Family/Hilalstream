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
let captureBlocker: ((e: MouseEvent) => void) | null = null;

const AD_DOMAINS = ['highperformanceformat', 'ballroomfondness', 'kettledrooping', 'everya', 'effectivegatecpm'];

function matchesAdDomain(src: string): boolean {
  return AD_DOMAINS.some(d => src.includes(d));
}

/** Detect and remove ad-injected overlays, iframes, and scripts */
function cleanAdElements(): void {
  document.querySelectorAll('iframe').forEach(iframe => {
    if (matchesAdDomain(iframe.src || '')) iframe.remove();
  });

  const root = document.getElementById('root');
  document.body.querySelectorAll(':scope > div, :scope > iframe, :scope > ins').forEach(el => {
    if (el === root || el.id === SCRIPT_ID) return;
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'absolute' || style.zIndex > '999') {
      el.remove();
    }
  });

  document.querySelectorAll(`script[src*="ballroomfondness"], script[src*="highperformanceformat"], script[src*="kettledrooping"], script[src*="effectivegatecpm"]`).forEach(s => s.remove());
  const popScript = document.getElementById(SCRIPT_ID);
  if (popScript) popScript.remove();
}

/** Remove the ad script, block popunders on Watch page + observe for new injections */
export function removePopAdScript(): void {
  cleanAdElements();

  if (!(window as any).__originalOpen) {
    (window as any).__originalOpen = window.open;
  }
  window.open = function() { return null; } as typeof window.open;

  if (!(document as any).__originalCreateElement) {
    (document as any).__originalCreateElement = document.createElement.bind(document);
  }
  const origCreate = (document as any).__originalCreateElement;
  document.createElement = function(tagName: string, options?: ElementCreationOptions) {
    const el = origCreate(tagName, options);
    if (tagName.toLowerCase() === 'script') {
      const origSetAttr = el.setAttribute.bind(el);
      el.setAttribute = function(name: string, value: string) {
        if (name === 'src' && matchesAdDomain(value)) return;
        return origSetAttr(name, value);
      };
      const descriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      if (descriptor) {
        Object.defineProperty(el, 'src', {
          set(v: string) {
            if (matchesAdDomain(v)) return;
            descriptor.set?.call(el, v);
          },
          get() { return descriptor.get?.call(el); }
        });
      }
    }
    return el;
  } as typeof document.createElement;

  if (!captureBlocker) {
    captureBlocker = (e: MouseEvent) => {
      const root = document.getElementById('root');
      if (e.target instanceof HTMLElement && !root?.contains(e.target)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    document.addEventListener('click', captureBlocker, true);
  }

  if (!adObserver) {
    adObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          const tag = node.tagName;
          if (tag === 'IFRAME' && matchesAdDomain((node as HTMLIFrameElement).src || '')) { node.remove(); continue; }
          if ((tag === 'DIV' || tag === 'INS' || tag === 'IFRAME') && node.parentElement === document.body && node !== document.getElementById('root')) {
            const style = window.getComputedStyle(node);
            if (style.position === 'fixed' || style.position === 'absolute' || parseInt(style.zIndex) > 999) { node.remove(); continue; }
          }
          if (tag === 'SCRIPT' && matchesAdDomain((node as HTMLScriptElement).src || '')) { node.remove(); }
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
  if ((window as any).__originalOpen) { window.open = (window as any).__originalOpen; delete (window as any).__originalOpen; }
  if ((document as any).__originalCreateElement) { document.createElement = (document as any).__originalCreateElement; delete (document as any).__originalCreateElement; }
  if (captureBlocker) { document.removeEventListener('click', captureBlocker, true); captureBlocker = null; }
  if (adObserver) { adObserver.disconnect(); adObserver = null; }
}

/** Call from non-Watch pages to load the popunder script */
export function initPopAd(): void {
  if (typeof window === 'undefined') return;
  if (isAdmin()) return;
  if (isWatchPage()) return;
  setTimeout(() => ensureScriptLoaded(), 2000);
}

/** Trigger popunder on user interaction */
export function triggerPopAd(e?: React.MouseEvent): void {
  if (typeof window === 'undefined') return;
  if (isAdmin()) return;
  if (isWatchPage()) return;

  const count = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
  if (count >= MAX_POPS) return;

  const old = document.getElementById(SCRIPT_ID);
  if (old) old.remove();

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);

  sessionStorage.setItem(STORAGE_KEY, String(count + 1));

  if (e) {
    e.preventDefault();
    const el = e.currentTarget as HTMLAnchorElement;
    const target = el?.getAttribute('href') || el?.pathname;
    if (target) {
      setTimeout(() => { window.location.href = target; }, 300);
    }
  }
}
