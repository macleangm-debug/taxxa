import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { 
  Trophy, Clock, Star, Users, ChevronRight, Gift, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Draws = () => {
  const { t } = useTranslation();
  const [draws, setDraws] = useState([]);
  const [activeDraws, setActiveDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const [allRes, activeRes] = await Promise.all([
        axios.get(`${API}/draws`),
        axios.get(`${API}/draws/active`)
      ]);
      setDraws(allRes.data);
      setActiveDraws(activeRes.data);
    } catch (err) {
      console.error("Failed to fetch draws:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.max(0, end - now);
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const calculateWinChance = (userEntries, totalEntries) => {
    if (!totalEntries || totalEntries === 0) return 0;
    return Math.min(100, (userEntries / totalEntries) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in" data-testid="draws-page">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{t('draws.title')}</h1>
        <p className="text-slate-600">View active draws and past winners</p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t('draws.active')}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t('draws.upcoming')}
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            {t('draws.completed')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeDraws.length === 0 ? (
            <div className="card-default text-center py-12">
              <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600">No Active Draws</h3>
              <p className="text-slate-500">Check back soon for upcoming prize draws</p>
            </div>
          ) : (
            activeDraws.map((draw) => (
              <div key={draw.id} className="card-dark" data-testid={`draw-${draw.id}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 text-secondary mb-1">
                        <Trophy className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">{draw.draw_type}</span>
                      </div>
                      <h2 className="text-2xl font-bold">{draw.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">{t('draws.endsIn')}</p>
                      <p className="text-xl font-bold font-mono">{formatCountdown(draw.end_date)}</p>
                    </div>
                  </div>

                  {/* Prize Tiers */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {draw.prize_tiers?.slice(0, 4).map((tier, i) => (
                      <div 
                        key={i} 
                        className={`rounded-xl p-4 ${
                          i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black' : 'bg-white/10'
                        }`}
                      >
                        <p className={`text-xs uppercase tracking-wider mb-1 ${i === 0 ? 'text-black/60' : 'text-slate-400'}`}>
                          {tier.name}
                        </p>
                        <p className={`text-xl font-bold ${i === 0 ? '' : 'text-white'}`}>
                          ${tier.amount?.toLocaleString()}
                        </p>
                        <p className={`text-xs ${i === 0 ? 'text-black/60' : 'text-slate-400'}`}>
                          {tier.winners} winner{tier.winners > 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* User Stats */}
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-slate-300">{t('draws.yourEntries')}</p>
                        <p className="text-2xl font-bold">{draw.user_entries || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-300">{t('draws.totalEntries')}</p>
                        <p className="text-xl font-semibold">{draw.total_entries?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">Your win chance</span>
                        <span className="text-secondary font-medium">
                          {calculateWinChance(draw.user_entries, draw.total_entries).toFixed(2)}%
                        </span>
                      </div>
                      <Progress 
                        value={calculateWinChance(draw.user_entries, draw.total_entries)} 
                        className="h-2 bg-white/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="card-default text-center py-12">
            <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">Coming Soon</h3>
            <p className="text-slate-500">New draws will be announced here</p>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {draws.filter(d => d.status === 'completed').length === 0 ? (
            <div className="card-default text-center py-12">
              <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600">No Completed Draws</h3>
              <p className="text-slate-500">Past draw results will appear here</p>
            </div>
          ) : (
            draws.filter(d => d.status === 'completed').map((draw) => (
              <div key={draw.id} className="card-default">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{draw.draw_type}</p>
                    <h3 className="font-semibold text-lg">{draw.name}</h3>
                  </div>
                  <Button variant="outline" size="sm">
                    View Winners
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* How Draws Work */}
      <div className="card-default mt-8 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-lg text-slate-900 mb-4">How Draws Work</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Earn Entries</p>
              <p className="text-sm text-slate-600">Scan receipts to earn draw entries</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-slate-900">More = Better Odds</p>
              <p className="text-sm text-slate-600">Higher entries increase win chances</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Win Prizes</p>
              <p className="text-sm text-slate-600">Winners selected randomly each draw</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Draws;
