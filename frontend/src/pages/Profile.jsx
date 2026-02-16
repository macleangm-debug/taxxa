import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "sonner";
import { 
  User, Phone, Calendar, Receipt, Star, Award, Settings,
  LogOut, ChevronRight, Flame, Globe, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [badgesRes, streakRes, historyRes] = await Promise.all([
        axios.get(`${API}/badges`),
        axios.get(`${API}/streaks`),
        axios.get(`${API}/scan/history`, { params: { limit: 20 } })
      ]);
      setBadges(badgesRes.data);
      setStreak(streakRes.data);
      setScanHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    toast.success(`Language changed to ${lang === 'en' ? 'English' : lang === 'sw' ? 'Kiswahili' : 'Français'}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <div className="animate-in" data-testid="profile-page">
      {/* Profile Header */}
      <div className="card-default mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl gradient-emerald flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'User'}</h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4" />
              {user?.phone_number}
            </p>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              Joined {formatDate(user?.created_at)}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-primary">{user?.total_entries || 0}</p>
              <p className="text-sm text-slate-500">Entries</p>
            </div>
            <div className="text-center px-4 border-l border-slate-200">
              <p className="text-2xl font-bold text-secondary">{user?.valid_scans || 0}</p>
              <p className="text-sm text-slate-500">Scans</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="badges" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Award className="w-4 h-4 mr-2" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          {/* Streak Card */}
          <div className="card-default bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Flame className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">{t('gamification.streaks.current')}</p>
                  <p className="text-3xl font-bold text-slate-900">{streak?.current_streak || 0} {t('dashboard.days')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Multiplier</p>
                <p className="text-2xl font-bold text-orange-500">{streak?.streak_multiplier || 1}x</p>
              </div>
            </div>
            {streak?.next_milestone && (
              <div className="mt-4 pt-4 border-t border-orange-200">
                <p className="text-sm text-orange-700">
                  {streak.next_milestone - (streak?.current_streak || 0)} days to next reward: <strong>{streak.next_reward}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Earned Badges */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary" />
              {t('gamification.badges.earned')} ({earnedBadges.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className="badge-item earned"
                  data-testid={`badge-${badge.id}`}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{badge.name}</p>
                    <p className="text-xs text-slate-500 truncate">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Locked Badges */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-400" />
              {t('gamification.badges.locked')} ({lockedBadges.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className="badge-item opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <Award className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-600 truncate">{badge.name}</p>
                    <p className="text-xs text-slate-400 truncate">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="card-default">
            <h3 className="font-semibold text-lg mb-4">Recent Scans</h3>
            
            {scanHistory.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No scans yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan, i) => (
                  <div 
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      scan.status === 'valid' ? 'bg-emerald-50 border-emerald-100' :
                      scan.status === 'duplicate' ? 'bg-amber-50 border-amber-100' :
                      'bg-red-50 border-red-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        scan.status === 'valid' ? 'bg-emerald-100 text-emerald-600' :
                        scan.status === 'duplicate' ? 'bg-amber-100 text-amber-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {scan.receipt_data?.merchant_name || 'Unknown Merchant'}
                        </p>
                        <p className="text-sm text-slate-500">{formatDate(scan.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        scan.status === 'valid' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {scan.status === 'valid' ? `+${scan.entries_earned}` : scan.status}
                      </p>
                      {scan.receipt_data?.amount && (
                        <p className="text-sm text-slate-500">${scan.receipt_data.amount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Language Settings */}
          <div className="card-default">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-lg">Language</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: 'en', name: 'English' },
                { code: 'sw', name: 'Kiswahili' },
                { code: 'fr', name: 'Français' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    i18n.language === lang.code 
                      ? 'border-primary bg-primary/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid={`lang-${lang.code}`}
                >
                  <p className="font-medium text-slate-900">{lang.name}</p>
                  <p className="text-sm text-slate-500">{lang.code.toUpperCase()}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card-default">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-slate-500" />
              <h3 className="font-semibold text-lg">Notifications</h3>
            </div>
            <div className="space-y-4">
              {[
                { id: 'draws', label: 'Draw reminders', desc: 'Get notified before draws end' },
                { id: 'winners', label: 'Winner announcements', desc: 'Know when winners are selected' },
                { id: 'streaks', label: 'Streak reminders', desc: 'Don\'t break your streak' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="card-default">
            <h3 className="font-semibold text-lg mb-4">Account</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Phone Number</span>
                <span className="font-medium">{user?.phone_number}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-600">Referral Code</span>
                <span className="font-mono font-medium text-primary">{user?.referral_code}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-600">Member Since</span>
                <span className="font-medium">{formatDate(user?.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <Button 
            onClick={logout}
            variant="outline" 
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
            data-testid="logout-btn-profile"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t('nav.logout')}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
