const SCRIPT_SRC = 'https://pl28726547.effectivegatecpm.com/c5/87/b7/c587b76ceee02cf1b8604471065a25dc.js';
const STORAGE_KEY = 'popShown';
const SCRIPT_ID = 'pop-ad-script';

export function triggerPopAd(): void {
  if (typeof window === 'undefined') return;

  // Once per session
  if (sessionStorage.getItem(STORAGE_KEY)) return;

  // Prevent duplicate script injection
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);

  sessionStorage.setItem(STORAGE_KEY, 'true');
}
