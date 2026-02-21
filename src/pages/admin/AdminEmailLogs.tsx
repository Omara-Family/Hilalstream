import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Mail } from 'lucide-react';

interface EmailLog {
  id: string;
  user_id: string;
  type: string;
  reference_id: string;
  sent_at: string;
  profile_name?: string;
}

export default function AdminEmailLogs() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (data) {
        // Fetch profile names for user_ids
        const userIds = [...new Set(data.map(l => l.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const nameMap = new Map((profiles || []).map(p => [p.id, p.name]));

        setLogs(data.map(l => ({
          ...l,
          profile_name: nameMap.get(l.user_id) || l.user_id.slice(0, 8),
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const typeLabel = (type: string) => {
    switch (type) {
      case 'newsletter': return isAr ? 'مسلسل جديد' : 'New Series';
      case 'favorite_update': return isAr ? 'حلقة جديدة' : 'New Episode';
      default: return type;
    }
  };

  const typeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'newsletter': return 'default';
      case 'favorite_update': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            {isAr ? 'سجل الإيميلات' : 'Email Logs'}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {isAr
          ? `إجمالي ${logs.length} إيميل مرسل`
          : `Total ${logs.length} emails sent`}
      </p>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isAr ? 'المستخدم' : 'User'}</TableHead>
              <TableHead>{isAr ? 'النوع' : 'Type'}</TableHead>
              <TableHead>{isAr ? 'المرجع' : 'Reference ID'}</TableHead>
              <TableHead>{isAr ? 'تاريخ الإرسال' : 'Sent At'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {isAr ? 'لا توجد سجلات بعد' : 'No email logs yet'}
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.profile_name}</TableCell>
                  <TableCell>
                    <Badge variant={typeVariant(log.type)}>{typeLabel(log.type)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.reference_id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(log.sent_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
