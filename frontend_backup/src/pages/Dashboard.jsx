import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { 
  QrCode, Trophy, TrendingUp, Flame, Star, Clock, ArrowRight,
  Receipt, Users, ChevronRight, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, analyticsRes, badgesRes] = await Promise.all([
        axios.get(`${API}/user/stats`),
        axios.get(`${API}/analytics/overview`),
        axios.get(`${API}/badges`)
      ]);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setBadges(badgesRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (endDate) => {
    if (!endDate) return { days: 0, hours: 0, mins: 0 };
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.max(0, end - now);
    
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentDraw = stats?.upcoming_draws?.[0];
  const countdown = currentDraw ? formatCountdown(currentDraw.end_date) : null;
  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="space-y-6 animate-in" data-testid="dashboard">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t('dashboard.welcome')}, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-slate-600 mt-1">Here's your activity overview</p>
        </div>
        <Link to="/scan">
          <Button className="btn-gold" data-testid="scan-cta">
            <QrCode className="w-5 h-5 mr-2" />
            {t('dashboard.scanNow')}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card" data-testid="stat-total-scans">
          <div className="flex items-center justify-between mb-3">
            <Receipt className="w-8 h-8 text-primary" />
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">All Time</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.total_scans || 0}</p>
          <p className="text-sm text-slate-500">{t('dashboard.totalScans')}</p>
        </div>
        
        <div className="stat-card" data-testid="stat-valid-scans">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {stats?.total_scans > 0 ? Math.round((stats.valid_scans / stats.total_scans) * 100) : 0}%
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.valid_scans || 0}</p>
          <p className="text-sm text-slate-500">{t('dashboard.validScans')}</p>
        </div>
        
        <div className="stat-card" data-testid="stat-entries">
          <div className="flex items-center justify-between mb-3">
            <Star className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.total_entries || 0}</p>
          <p className="text-sm text-slate-500">{t('dashboard.totalEntries')}</p>
        </div>
        
        <div className="stat-card" data-testid="stat-streak">
          <div className="flex items-center justify-between mb-3">
            <Flame className="w-8 h-8 text-orange-500" />
            {stats?.streak?.multiplier > 1 && (
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                {stats.streak.multiplier}x
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats?.streak?.current_streak || 0}</p>
          <p className="text-sm text-slate-500">{t('dashboard.currentStreak')}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Next Draw Card */}
        <div className="md:col-span-8 card-dark" data-testid="next-draw-card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">{t('dashboard.nextDraw')}</span>
            </div>
            
            <h3 className="text-2xl font-bold mb-6">{currentDraw?.name || 'Weekly Grand Draw'}</h3>
            
            {countdown && (
              <div className="flex gap-4 mb-6">
                <div className="text-center">
                  <div className="countdown-digit">{countdown.days}</div>
                  <p className="text-xs text-slate-400 mt-1">Days</p>
                </div>
                <div className="text-center">
                  <div className="countdown-digit">{countdown.hours}</div>
                  <p className="text-xs text-slate-400 mt-1">Hours</p>
                </div>
                <div className="text-center">
                  <div className="countdown-digit">{countdown.mins}</div>
                  <p className="text-xs text-slate-400 mt-1">Mins</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
              <div>
                <p className="text-sm text-slate-300">{t('dashboard.yourEntries')}</p>
                <p className="text-2xl font-bold">{currentDraw?.user_entries || 0}</p>
              </div>
              <Link to="/draws">
                <Button variant="secondary" size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
                  View Prizes
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="md:col-span-4 card-default" data-testid="streak-card">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-6 h-6 text-orange-500" />
            <h3 className="font-semibold text-lg">{t('gamification.streaks.title')}</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Current</span>
              <span className="text-2xl font-bold">{stats?.streak?.current_streak || 0} {t('dashboard.days')}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Multiplier</span>
              <span className="text-lg font-semibold text-primary">{stats?.streak?.multiplier || 1}x</span>
            </div>
            
            {stats?.streak?.current_streak < 7 && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-2">
                  {7 - (stats?.streak?.current_streak || 0)} days to 1.2x multiplier
                </p>
                <Progress 
                  value={((stats?.streak?.current_streak || 0) / 7) * 100} 
                  className="h-2"
                />
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Longest streak</span>
              <span className="font-medium">{stats?.streak?.longest_streak || 0} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      {analytics?.chart_data && (
        <div className="card-default" data-testid="analytics-chart">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Activity (Last 7 Days)</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                Scans
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                Entries
              </span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.chart_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="entries" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{analytics.summary?.total_scans_7d || 0}</p>
              <p className="text-sm text-slate-500">Total Scans</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">{analytics.summary?.total_entries_7d || 0}</p>
              <p className="text-sm text-slate-500">Entries Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{analytics.summary?.win_probability?.toFixed(2) || 0}%</p>
              <p className="text-sm text-slate-500">Win Chance</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges Section */}
      <div className="card-default" data-testid="badges-section">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-secondary" />
            <h3 className="font-semibold text-lg">{t('gamification.badges.title')}</h3>
          </div>
          <Link to="/profile" className="text-sm text-primary hover:underline">
            View All ({badges.length})
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {badges.slice(0, 6).map((badge) => (
            <div 
              key={badge.id} 
              className={`p-4 rounded-xl text-center transition-all ${
                badge.earned 
                  ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200' 
                  : 'bg-slate-50 border border-slate-100 opacity-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                badge.earned ? 'bg-secondary/20 text-secondary' : 'bg-slate-200 text-slate-400'
              }`}>
                <Award className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">{badge.name}</p>
              <p className="text-xs text-slate-500">{badge.earned ? 'Earned' : 'Locked'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
