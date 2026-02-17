import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import Index from "./pages/Index";
import SeriesDetail from "./pages/SeriesDetail";
import Watch from "./pages/Watch";
import Browse from "./pages/Browse";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSeries from "./pages/admin/AdminSeries";
import AdminEpisodes from "./pages/admin/AdminEpisodes";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminProgramEpisodes from "./pages/admin/AdminProgramEpisodes";
import ProgramDetail from "./pages/ProgramDetail";
import WatchProgram from "./pages/WatchProgram";

const queryClient = new QueryClient();

const AppInner = () => {
  const initialize = useAppStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/series/:slug" element={<SeriesDetail />} />
      <Route path="/watch/:seriesSlug/:episodeNumber" element={<Watch />} />
      <Route path="/program/:slug" element={<ProgramDetail />} />
      <Route path="/watch-program/:programSlug/:episodeNumber" element={<WatchProgram />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/search" element={<Browse />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="series" element={<AdminSeries />} />
        <Route path="episodes" element={<AdminEpisodes />} />
        <Route path="programs" element={<AdminPrograms />} />
        <Route path="program-episodes" element={<AdminProgramEpisodes />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
