const RamadanLights = () => {
  const lights = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: i % 3 === 0 ? 'hsl(43 96% 56%)' : i % 3 === 1 ? 'hsl(35 100% 45%)' : 'hsl(25 90% 55%)',
  }));

  return (
    <div className="fixed top-16 left-0 right-0 z-40 pointer-events-none overflow-hidden">
      {/* String/wire */}
      <svg className="w-full h-16 md:h-20" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path
          d="M0,10 Q60,50 120,15 Q180,50 240,15 Q300,50 360,15 Q420,50 480,15 Q540,50 600,15 Q660,50 720,15 Q780,50 840,15 Q900,50 960,15 Q1020,50 1080,15 Q1140,50 1200,15"
          fill="none"
          stroke="hsl(43 40% 30%)"
          strokeWidth="2"
        />
      </svg>

      {/* CSS-based glow animation */}
      <style>{`
        @keyframes lantern-glow {
          0%, 100% { filter: drop-shadow(0 0 4px var(--lantern-color)); }
          50% { filter: drop-shadow(0 0 10px var(--lantern-color)); }
        }
        .lantern-light {
          animation: lantern-glow 2.5s ease-in-out infinite;
          will-change: filter;
        }
      `}</style>

      {/* Lanterns */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-2 md:px-4">
        {lights.map((light) => (
          <div
            key={light.id}
            className="flex flex-col items-center"
            style={{ width: '5%' }}
          >
            <div className="w-px bg-gold-dim" style={{ height: `${12 + (light.id % 3) * 8}px` }} />
            <div
              className="lantern-light"
              style={{
                '--lantern-color': light.color,
                animationDelay: `${(light.id % 3) * 0.8}s`,
              } as React.CSSProperties}
            >
              <svg width="16" height="24" viewBox="0 0 16 24" className="md:w-5 md:h-7">
                <rect x="5" y="0" width="6" height="3" rx="1" fill="hsl(43 60% 35%)" />
                <path
                  d="M3,3 Q3,1 8,3 Q13,1 13,3 L14,18 Q14,24 8,24 Q2,24 2,18 Z"
                  fill={light.color}
                  opacity="0.85"
                />
                <ellipse cx="8" cy="14" rx="3" ry="6" fill="white" opacity="0.3" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RamadanLights;
