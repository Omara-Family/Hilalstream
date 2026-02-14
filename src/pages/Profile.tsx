import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAppStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setName(data.name || '');
            setAvatarUrl(data.avatar_url);
          }
          setLoading(false);
        });
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('posters')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('posters').getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
    setAvatarUrl(newUrl);
    setUploading(false);
    toast({ title: 'تم تحديث الصورة' });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم حفظ التغييرات' });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-lg">
        <h1 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
          الملف الشخصي
        </h1>

        <div className="bg-card rounded-2xl p-6 space-y-8 border border-border">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="w-24 h-24 border-2 border-primary">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : (
                  <Camera className="w-6 h-6 text-primary" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p className="text-xs text-muted-foreground">اضغط لتغيير الصورة (حد أقصى 2MB)</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">الاسم</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك"
              className="bg-secondary border-border text-foreground"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="text-foreground">البريد الإلكتروني</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted border-border text-muted-foreground"
            />
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground hover:opacity-90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            حفظ التغييرات
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
