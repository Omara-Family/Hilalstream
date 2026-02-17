import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCw } from 'lucide-react';

const reminders = [
  {
    ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    en: "Indeed, with hardship comes ease.",
    source_ar: "سورة الشرح - آية 6",
    source_en: "Quran 94:6",
  },
  {
    ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    en: "And whoever relies upon Allah – then He is sufficient for him.",
    source_ar: "سورة الطلاق - آية 3",
    source_en: "Quran 65:3",
  },
  {
    ar: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    en: "So remember Me; I will remember you.",
    source_ar: "سورة البقرة - آية 152",
    source_en: "Quran 2:152",
  },
  {
    ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    en: "And say, 'My Lord, increase me in knowledge.'",
    source_ar: "سورة طه - آية 114",
    source_en: "Quran 20:114",
  },
  {
    ar: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    en: "Allah does not burden a soul beyond that it can bear.",
    source_ar: "سورة البقرة - آية 286",
    source_en: "Quran 2:286",
  },
  {
    ar: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
    en: "And your Lord is going to give you, and you will be satisfied.",
    source_ar: "سورة الضحى - آية 5",
    source_en: "Quran 93:5",
  },
  {
    ar: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    en: "Indeed, Allah is with the patient.",
    source_ar: "سورة البقرة - آية 153",
    source_en: "Quran 2:153",
  },
  {
    ar: "خيركم من تعلم القرآن وعلمه",
    en: "The best among you are those who learn the Quran and teach it.",
    source_ar: "صحيح البخاري",
    source_en: "Sahih al-Bukhari",
  },
  {
    ar: "إنما الأعمال بالنيات",
    en: "Actions are judged by intentions.",
    source_ar: "صحيح البخاري",
    source_en: "Sahih al-Bukhari",
  },
  {
    ar: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
    en: "And We are closer to him than his jugular vein.",
    source_ar: "سورة ق - آية 16",
    source_en: "Quran 50:16",
  },
];

const getDailyIndex = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % reminders.length;
};

const DailyReminder = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [index, setIndex] = useState(getDailyIndex());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const reminder = reminders[index];

  const shuffle = () => {
    setIsRefreshing(true);
    let newIndex: number;
    do { newIndex = Math.floor(Math.random() * reminders.length); } while (newIndex === index);
    setIndex(newIndex);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-secondary/50 border border-border/50 p-8 md:p-10"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/3 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>

            {/* Label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              {isAr ? 'تذكير يومي' : 'Daily Reminder'}
            </p>

            {/* Arabic text always shown */}
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-relaxed mb-3 max-w-2xl" dir="rtl">
              {reminder.ar}
            </p>

            {/* English translation */}
            {!isAr && (
              <p className="text-base text-muted-foreground italic mb-4 max-w-xl">
                "{reminder.en}"
              </p>
            )}

            {/* Source */}
            <p className="text-sm text-primary/80 font-medium">
              — {isAr ? reminder.source_ar : reminder.source_en}
            </p>

            {/* Shuffle button */}
            <button
              onClick={shuffle}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-primary hover:bg-secondary transition-all text-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isAr ? 'تذكير آخر' : 'Another'}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DailyReminder;
