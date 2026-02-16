import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { 
  Trophy, Medal, Crown, Star, TrendingUp, User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Leaderboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API}/leaderboard`, { params: { limit: 50 } });
      setLeaderboard(res.data);
      
      // Find user's rank
      const rank = res.data.findIndex(item => item.phone_masked?.includes(user?.phone_number?.slice(-2)));
      if (rank !== -1) setUserRank(rank + 1);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-slate-500 font-mono">{rank}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    if (rank === 2) return 'bg-slate-50 border-slate-200';
    if (rank === 3) return 'bg-amber-50/50 border-amber-100';
    return 'bg-white border-slate-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in" data-testid="leaderboard-page">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{t('leaderboard.title')}</h1>
        <p className="text-slate-600">{t('leaderboard.topScanners')}</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((item, i) => {
          const positions = [1, 0, 2]; // 2nd, 1st, 3rd
          const pos = positions[i];
          const entry = leaderboard[pos];
          if (!entry) return null;
          
          return (
            <div 
              key={pos}
              className={`text-center ${pos === 0 ? 'order-2' : pos === 1 ? 'order-1 mt-8' : 'order-3 mt-8'}`}
            >
              <div className={`card-default ${pos === 0 ? 'border-2 border-secondary shadow-glow' : ''}`}>
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  pos === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-600' : 
                  pos === 1 ? 'bg-slate-200' : 'bg-amber-200'
                }`}>
                  {pos === 0 ? (
                    <Crown className="w-8 h-8 text-white" />
                  ) : (
                    <span className="text-2xl font-bold text-slate-700">{pos + 1}</span>
                  )}
                </div>
                <p className="font-semibold text-slate-900 truncate">{entry.name}</p>
                <p className="text-sm text-slate-500">{entry.phone_masked}</p>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-2xl font-bold text-primary">{entry.entries?.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{t('leaderboard.entries')}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <div className="card-default">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">{t('leaderboard.topScanners')}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="w-4 h-4" />
            <span>Updated live</span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">{t('leaderboard.rank')}</div>
            <div className="col-span-7">{t('leaderboard.name')}</div>
            <div className="col-span-3 text-right">{t('leaderboard.entries')}</div>
          </div>

          {/* Rows */}
          {leaderboard.map((item, i) => (
            <div 
              key={i}
              className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-xl border transition-all hover:shadow-sm ${getRankBg(item.rank)}`}
              data-testid={`leaderboard-row-${item.rank}`}
            >
              <div className="col-span-2 flex items-center">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  {getRankIcon(item.rank)}
                </div>
              </div>
              <div className="col-span-7 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.phone_masked}</p>
                </div>
              </div>
              <div className="col-span-3 flex items-center justify-end">
                <div className="text-right">
                  <p className="font-bold text-lg text-slate-900">{item.entries?.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">entries</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No Data Yet</h3>
            <p className="text-slate-500">Start scanning to appear on the leaderboard!</p>
          </div>
        )}
      </div>

      {/* User Rank Card */}
      {userRank && userRank > 10 && (
        <div className="card-default mt-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">#{userRank}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('leaderboard.you')}</p>
                <p className="text-sm text-slate-600">Keep scanning to climb the ranks!</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{user?.total_entries || 0}</p>
              <p className="text-xs text-slate-500">entries</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
