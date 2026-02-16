import { useEffect, useRef } from 'react';

const AD_KEY = '02a4159ca18691320710c3684561cab2';
const AD_SCRIPT_SRC = `https://www.highperformanceformat.com/${AD_KEY}/invoke.js`;

const AdBanner728 = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    const container = containerRef.current;

    // Clear previous content
    container.innerHTML = '';

    // Inject atOptions
    const optionsScript = document.createElement('script');
    optionsScript.textContent = `atOptions = { 'key': '${AD_KEY}', 'format': 'iframe', 'height': 90, 'width': 728, 'params': {} };`;
    container.appendChild(optionsScript);

    // Inject invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = AD_SCRIPT_SRC;
    invokeScript.async = true;
    container.appendChild(invokeScript);

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div className="hidden md:flex justify-center py-3">
      <div ref={containerRef} style={{ minWidth: 728, minHeight: 90 }} />
    </div>
  );
};

export default AdBanner728;
