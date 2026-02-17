import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

const AD_KEY = '02a4159ca18691320710c3684561cab2';
const AD_SCRIPT_SRC = `https://www.highperformanceformat.com/${AD_KEY}/invoke.js`;

const AdBanner728 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdmin = useAppStore((s) => s.isAdmin);

  useEffect(() => {
    if (isAdmin || typeof window === 'undefined' || !containerRef.current) return;
    const container = containerRef.current;

    container.innerHTML = '';

    const optionsScript = document.createElement('script');
    optionsScript.textContent = `atOptions = { 'key': '${AD_KEY}', 'format': 'iframe', 'height': 90, 'width': 728, 'params': {} };`;
    container.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.src = AD_SCRIPT_SRC;
    invokeScript.async = true;
    container.appendChild(invokeScript);

    return () => {
      container.innerHTML = '';
    };
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <div className="hidden md:flex justify-center py-3">
      <div ref={containerRef} style={{ minWidth: 728, minHeight: 90 }} />
    </div>
  );
};

export default AdBanner728;
