import { motion } from 'framer-motion';

const RamadanBanner = () => {
  return (
    <motion.div
      className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border-b border-primary/20"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3">
        <motion.span
          className="text-2xl"
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🌙
        </motion.span>
        <p className="text-sm md:text-base font-display font-semibold text-primary">
          رمضان كريم — Ramadan Kareem
        </p>
        <motion.span
          className="text-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🏮
        </motion.span>
      </div>

      {/* Sparkle particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary"
          style={{ left: `${10 + i * 12}%`, top: '50%' }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -15, 0],
          }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
        />
      ))}
    </motion.div>
  );
};

export default RamadanBanner;
