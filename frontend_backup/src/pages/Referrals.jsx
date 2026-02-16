import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "sonner";
import { 
  Gift, Copy, Share2, Users, Star, CheckCircle, Clock,
  Twitter, Facebook, MessageCircle, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Referrals = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        axios.get(`${API}/referral/stats`),
        axios.get(`${API}/referral/list`)
      ]);
      setStats(statsRes.data);
      setReferrals(listRes.data.referrals || []);
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!stats?.referral_link) return;
    
    try {
      await navigator.clipboard.writeText(stats.referral_link);
      setCopied(true);
      toast.success(t('referrals.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const shareOnPlatform = (platform) => {
    if (!stats) return;
    
    const message = `Join TAXXA and start winning prizes by scanning receipts! Use my referral code: ${stats.referral_code}`;
    const url = stats.referral_link;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in" data-testid="referrals-page">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{t('referrals.title')}</h1>
        <p className="text-slate-600">{t('referrals.subtitle')}</p>
      </div>

      {/* Referral Code Card */}
      <div className="card-dark mb-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-secondary mb-4">
            <Gift className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">{t('referrals.yourCode')}</span>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 bg-white/10 rounded-xl px-4 py-3">
              <p className="text-2xl md:text-3xl font-mono font-bold tracking-wider">{stats?.referral_code}</p>
            </div>
            <Button 
              onClick={copyToClipboard}
              className={`${copied ? 'bg-primary' : 'bg-white text-slate-900'} px-4 py-3`}
              data-testid="copy-code-btn"
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={stats?.referral_link || ''}
              readOnly
              className="bg-white/10 border-white/20 text-white"
            />
            <Button onClick={copyToClipboard} variant="secondary" className="bg-white text-slate-900">
              {t('referrals.copyLink')}
            </Button>
          </div>
          
          {/* Share Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => shareOnPlatform('twitter')}
              className="flex-1 bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
            >
              <Twitter className="w-5 h-5 mr-2" />
              Twitter
            </Button>
            <Button 
              onClick={() => shareOnPlatform('facebook')}
              className="flex-1 bg-[#4267B2] hover:bg-[#4267B2]/90"
            >
              <Facebook className="w-5 h-5 mr-2" />
              Facebook
            </Button>
            <Button 
              onClick={() => shareOnPlatform('whatsapp')}
              className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <Users className="w-8 h-8 text-primary mb-3" />
          <p className="text-3xl font-bold text-slate-900">{stats?.total_referrals || 0}</p>
          <p className="text-sm text-slate-500">{t('referrals.stats.total')}</p>
        </div>
        <div className="stat-card">
          <CheckCircle className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-3xl font-bold text-slate-900">{stats?.active_referrals || 0}</p>
          <p className="text-sm text-slate-500">{t('referrals.stats.active')}</p>
        </div>
        <div className="stat-card">
          <Star className="w-8 h-8 text-secondary mb-3" />
          <p className="text-3xl font-bold text-slate-900">{stats?.bonus_entries_earned || 0}</p>
          <p className="text-sm text-slate-500">{t('referrals.stats.earned')}</p>
        </div>
        <div className="stat-card">
          <Gift className="w-8 h-8 text-purple-500 mb-3" />
          <p className="text-3xl font-bold text-slate-900">{stats?.referrals_remaining || 20}</p>
          <p className="text-sm text-slate-500">{t('referrals.stats.remaining')}</p>
        </div>
      </div>

      {/* Progress to Max */}
      <div className="card-default mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-slate-700">Referral Progress</span>
          <span className="text-sm text-slate-500">{stats?.total_referrals || 0} / {stats?.max_referrals || 20}</span>
        </div>
        <Progress 
          value={((stats?.total_referrals || 0) / (stats?.max_referrals || 20)) * 100}
          className="h-3"
        />
        <p className="text-sm text-slate-500 mt-2">
          Invite up to {stats?.max_referrals || 20} friends to earn bonus entries
        </p>
      </div>

      {/* Reward Structure */}
      <div className="card-default mb-8 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-lg mb-4">{t('referrals.rewards.title')}</h3>
        <div className="space-y-3">
          {[
            { milestone: t('referrals.rewards.signup'), entries: 0, status: 'Registers' },
            { milestone: t('referrals.rewards.firstScan'), entries: '+1', status: 'First scan' },
            { milestone: t('referrals.rewards.fiveScans'), entries: '+3', status: '5 scans' },
          ].map((reward, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  i === 0 ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary'
                }`}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{reward.milestone}</p>
                  <p className="text-sm text-slate-500">{reward.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${i === 0 ? 'text-slate-400' : 'text-primary'}`}>
                  {reward.entries}
                </p>
                <p className="text-xs text-slate-500">entries</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <div className="card-default">
        <h3 className="font-semibold text-lg mb-4">{t('referrals.yourReferrals')}</h3>
        
        {referrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No Referrals Yet</h3>
            <p className="text-slate-500">Share your code to start earning bonus entries!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{ref.name || ref.phone_masked}</p>
                    <p className="text-sm text-slate-500">
                      {ref.status === 'pending' ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">+{ref.entries_earned || 0}</p>
                  <p className="text-xs text-slate-500">entries</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Referrals;
