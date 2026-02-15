import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, Film, Users, Eye, Brain, RefreshCw, TrendingUp, BarChart3, Heart, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

interface AnalyticsData {
  genreData: { genre: string; views: number; count: number }[];
  topSeries: { name: string; views: number; rating: number }[];
  growthData: { month: string; count: number }[];
  abandonmentData: { name: string; started: number; abandoned: number; rate: number }[];
  favData: { name: string; favorites: number }[];
  userGrowthData: { month: string; count: number }[];
  aiInsights: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(142, 76%, 36%)',
  'hsl(217, 91%, 60%)',
  'hsl(280, 67%, 52%)',
  'hsl(25, 95%, 53%)',
  'hsl(340, 75%, 55%)',
  'hsl(180, 70%, 45%)',
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ series: 0, episodes: 0, users: 0, views: 0 });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('series').select('id', { count: 'exact', head: true }),
      supabase.from('episodes').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('total_views'),
    ]).then(([s, e, u, v]) => {
      const totalViews = v.data?.reduce((sum, r) => sum + (r.total_views ?? 0), 0) ?? 0;
      setStats({ series: s.count ?? 0, episodes: e.count ?? 0, users: u.count ?? 0, views: totalViews });
    });
  }, []);

  const fetchAnalytics = async () => {
    setLoadingAi(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!error && data) setAnalytics(data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statCards = [
    { title: t('admin.totalSeries'), value: stats.series, icon: Tv, color: 'text-primary' },
    { title: t('admin.totalEpisodes'), value: stats.episodes, icon: Film, color: 'text-accent' },
    { title: t('admin.totalUsers'), value: stats.users, icon: Users, color: 'text-green-400' },
    { title: t('admin.totalViews'), value: stats.views.toLocaleString(), icon: Eye, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{t('admin.dashboardOverview')}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loadingAi}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loadingAi ? 'animate-spin' : ''}`} />
          {loadingAi ? t('common.loading') : t('admin.refreshAnalytics')}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
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

      {/* AI Insights */}
      {analytics?.aiInsights && (
        <Card className="bg-card border-primary/30">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-foreground">{t('admin.aiInsights')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {analytics.aiInsights}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Genre Distribution */}
          {analytics.genreData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <BarChart3 className="h-5 w-5 text-accent" />
                <CardTitle className="text-base text-foreground">{t('admin.genrePerformance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ views: { label: 'Views', color: 'hsl(var(--primary))' } }} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={analytics.genreData.slice(0, 8)}
                      dataKey="views"
                      nameKey="genre"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ genre }) => genre}
                    >
                      {analytics.genreData.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Series */}
          {analytics.topSeries.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-base text-foreground">{t('admin.topSeriesByViews')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ views: { label: 'Views', color: 'hsl(var(--primary))' } }} className="h-[250px] w-full">
                  <BarChart data={analytics.topSeries} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* User Growth */}
          {analytics.userGrowthData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Users className="h-5 w-5 text-green-400" />
                <CardTitle className="text-base text-foreground">{t('admin.userGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { label: 'Users', color: 'hsl(142, 76%, 36%)' } }} className="h-[250px] w-full">
                  <LineChart data={analytics.userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Favorites Distribution */}
          {analytics.favData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Heart className="h-5 w-5 text-red-400" />
                <CardTitle className="text-base text-foreground">{t('admin.mostFavorited')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ favorites: { label: 'Favorites', color: 'hsl(340, 75%, 55%)' } }} className="h-[250px] w-full">
                  <BarChart data={analytics.favData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="favorites" fill="hsl(340, 75%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Abandonment Rate */}
          {analytics.abandonmentData.length > 0 && (
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <UserMinus className="h-5 w-5 text-orange-400" />
                <CardTitle className="text-base text-foreground">{t('admin.abandonmentAnalysis')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    started: { label: t('admin.started'), color: 'hsl(var(--primary))' },
                    abandoned: { label: t('admin.abandonedShort'), color: 'hsl(25, 95%, 53%)' },
                  }}
                  className="h-[250px] w-full"
                >
                  <BarChart data={analytics.abandonmentData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="started" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="abandoned" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Content Growth */}
          {analytics.growthData.length > 0 && (
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base text-foreground">{t('admin.contentGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ count: { label: 'Series Added', color: 'hsl(217, 91%, 60%)' } }} className="h-[250px] w-full">
                  <LineChart data={analytics.growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {loadingAi && !analytics && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>{t('admin.analyzingData')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
