import { useEffect, useRef } from 'react';

const AD_SCRIPT_SRC = 'https://www.highperformanceformat.com/02a4159ca18691320710c3684561cab2/invoke.js';

const AdBanner728 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || injected.current || !containerRef.current) return;
    injected.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.textContent = `atOptions = { 'key': '02a4159ca18691320710c3684561cab2', 'format': 'iframe', 'height': 90, 'width': 728, 'params': {} };`;
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
    <div className="hidden md:flex justify-center py-3">
      <div ref={containerRef} style={{ width: 728, height: 90 }} />
    </div>
  );
};

export default AdBanner728;
