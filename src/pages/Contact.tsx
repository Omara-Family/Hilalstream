import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { Mail, Send, User, MessageSquare, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

const Contact = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: '⚠️', description: parsed.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { type: 'contact', ...parsed.data },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Failed');
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const fields = [
    { key: 'name', icon: User, type: 'text', label: isAr ? 'الاسم الكامل' : 'Full Name', placeholder: isAr ? 'أدخل اسمك' : 'Enter your name' },
    { key: 'email', icon: Mail, type: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email Address', placeholder: 'email@example.com' },
    { key: 'subject', icon: FileText, type: 'text', label: isAr ? 'الموضوع' : 'Subject', placeholder: isAr ? 'موضوع الرسالة' : 'What is this about?' },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-gradient-gold mb-2">{t('footer.contact')}</h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? 'نحب نسمع منك! أرسل لنا رسالتك وسنرد عليك في أقرب وقت.' : "We'd love to hear from you! Send us a message and we'll get back to you soon."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/30 mb-6">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{isAr ? 'تم الإرسال بنجاح!' : 'Message Sent!'}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? 'سنرد عليك خلال 24-48 ساعة.' : "We'll respond within 24-48 hours."}</p>
                <button onClick={() => setSent(false)} className="text-primary hover:underline text-sm font-medium">
                  {isAr ? 'أرسل رسالة أخرى' : 'Send another message'}
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 space-y-5 border border-border/50 shadow-2xl shadow-black/20"
              >
                {fields.map(({ key, icon: Icon, type, label, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">{label}</label>
                    <div className="relative group">
                      <Icon className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type={type}
                        required
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full ps-10 pe-4 py-3 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-secondary/80 text-sm transition-all border border-transparent focus:border-primary/30"
                        placeholder={placeholder}
                      />
                    </div>
                  </div>
                ))}

                {/* Message */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">{isAr ? 'الرسالة' : 'Message'}</label>
                  <div className="relative group">
                    <MessageSquare className="absolute start-3.5 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full ps-10 pe-4 py-3 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-secondary/80 text-sm transition-all border border-transparent focus:border-primary/30 resize-none"
                      placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {isAr ? 'إرسال الرسالة' : 'Send Message'}
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
