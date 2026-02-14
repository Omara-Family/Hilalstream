import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, Film, Users, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ series: 0, episodes: 0, users: 0, views: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('series').select('id', { count: 'exact', head: true }),
      supabase.from('episodes').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('total_views'),
    ]).then(([s, e, u, v]) => {
      const totalViews = v.data?.reduce((sum, r) => sum + (r.total_views ?? 0), 0) ?? 0;
      setStats({
        series: s.count ?? 0,
        episodes: e.count ?? 0,
        users: u.count ?? 0,
        views: totalViews,
      });
    });
  }, []);

  const cards = [
    { title: 'Total Series', value: stats.series, icon: Tv, color: 'text-primary' },
    { title: 'Total Episodes', value: stats.episodes, icon: Film, color: 'text-accent' },
    { title: 'Total Users', value: stats.users, icon: Users, color: 'text-green-400' },
    { title: 'Total Views', value: stats.views.toLocaleString(), icon: Eye, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
