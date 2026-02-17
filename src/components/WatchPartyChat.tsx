import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, Copy, X, Plus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';

interface PartyMessage {
  id: string;
  user_name: string;
  message: string;
  created_at: string;
  user_id: string;
}

interface WatchPartyChatProps {
  seriesSlug: string;
  episodeNumber: number;
  episodeId: string;
}

const WatchPartyChat = ({ seriesSlug, episodeNumber, episodeId }: WatchPartyChatProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAppStore();
  const [open, setOpen] = useState(false);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [partyCode, setPartyCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [mode, setMode] = useState<'menu' | 'chat'>('menu');
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user name
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('name').eq('id', user.id).single().then(({ data }) => {
      if (data) setUserName(data.name);
    });
  }, [user?.id]);

  // Subscribe to messages
  useEffect(() => {
    if (!partyId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('party_messages')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setMessages(data as PartyMessage[]);
    };

    fetchMessages();

    const channel = supabase
      .channel(`party-${partyId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'party_messages',
        filter: `party_id=eq.${partyId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as PartyMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [partyId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createParty = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('watch_parties')
      .insert({
        host_id: user.id,
        episode_id: episodeId,
        series_slug: seriesSlug,
        episode_number: episodeNumber,
      })
      .select()
      .single();

    if (error) {
      toast({ title: '❌', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) {
      setPartyId(data.id);
      setPartyCode(data.code);
      setMode('chat');
      toast({ title: '🎉', description: isAr ? 'تم إنشاء الحفلة!' : 'Party created!' });
    }
  };

  const joinParty = async () => {
    if (!joinCode.trim()) return;
    const { data, error } = await supabase
      .from('watch_parties')
      .select('*')
      .eq('code', joinCode.trim().toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast({ title: '❌', description: isAr ? 'الكود غير صحيح' : 'Invalid party code', variant: 'destructive' });
      return;
    }
    setPartyId(data.id);
    setPartyCode(data.code);
    setMode('chat');
    toast({ title: '🎉', description: isAr ? 'انضممت للحفلة!' : 'Joined party!' });
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user || !partyId) return;
    const msg = newMsg.trim().slice(0, 300);
    setNewMsg('');
    await supabase.from('party_messages').insert({
      party_id: partyId,
      user_id: user.id,
      user_name: userName || (isAr ? 'مستخدم' : 'User'),
      message: msg,
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(partyCode);
    toast({ title: '📋', description: isAr ? 'تم نسخ الكود!' : 'Code copied!' });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 end-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <Users className="w-5 h-5" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 end-6 z-40 w-80 max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  {isAr ? 'حفلة المشاهدة' : 'Watch Party'}
                </h4>
              </div>
              <div className="flex items-center gap-1">
                {partyCode && (
                  <button onClick={copyCode} className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors">
                    <Copy className="w-3 h-3" />
                    {partyCode.toUpperCase()}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {mode === 'menu' ? (
              <div className="p-4 space-y-3">
                <button onClick={createParty} className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-foreground hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 text-primary" />
                  <div className="text-start">
                    <p className="text-sm font-semibold">{isAr ? 'إنشاء حفلة' : 'Create Party'}</p>
                    <p className="text-[11px] text-muted-foreground">{isAr ? 'شارك الكود مع أصدقائك' : 'Share the code with friends'}</p>
                  </div>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-card px-2">{isAr ? 'أو' : 'or'}</span></div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    placeholder={isAr ? 'أدخل كود الحفلة' : 'Enter party code'}
                    maxLength={6}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
                  />
                  <button onClick={joinParty} className="px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    <LogIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[40vh]">
                  {messages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {isAr ? 'لا توجد رسائل بعد' : 'No messages yet'}
                    </p>
                  )}
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-muted-foreground mb-0.5">{msg.user_name}</span>
                      <div className={`px-3 py-1.5 rounded-xl text-sm max-w-[85%] ${
                        msg.user_id === user?.id
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="p-2 border-t border-border flex gap-2">
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
                    maxLength={300}
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <button type="submit" disabled={!newMsg.trim()} className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WatchPartyChat;
