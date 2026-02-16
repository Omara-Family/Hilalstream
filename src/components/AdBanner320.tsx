import { useEffect, useRef } from 'react';

const AD_SCRIPT_SRC = 'https://www.highperformanceformat.com/02a4159ca18691320710c3684561cab2/invoke.js';

const AdBanner320 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || injected.current || !containerRef.current) return;
    injected.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.textContent = `atOptions = { 'key': '02a4159ca18691320710c3684561cab2', 'format': 'iframe', 'height': 50, 'width': 320, 'params': {} };`;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.src = AD_SCRIPT_SRC;
    invokeScript.async = true;
    containerRef.current.appendChild(invokeScript);

    return () => {
      injected.current = false;
    };
  }, []);

  return (
    <div className="flex justify-center py-3 md:hidden">
      <div ref={containerRef} style={{ width: 320, height: 50 }} />
    </div>
  );
};

export default AdBanner320;
