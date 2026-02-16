import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  QrCode, Trophy, TrendingUp, Shield, Users, Receipt, 
  ArrowRight, Star, CheckCircle, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-slate-900">TAXXA</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1" data-testid="language-selector">
                {['en', 'sw', 'fr'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      i18n.language === lang 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <Link to="/login">
                <Button variant="ghost" data-testid="login-btn">{t('auth.login')}</Button>
              </Link>
              <Link to="/register">
                <Button className="btn-primary" data-testid="register-btn">{t('landing.hero.cta')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-in">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                Government Backed Program
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                {t('landing.hero.title')}
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button className="btn-gold text-lg px-8 py-4" data-testid="hero-cta">
                    {t('landing.hero.cta')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" className="btn-secondary text-lg px-8 py-4">
                    {t('landing.hero.secondary')}
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-8 -left-8 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -right-8 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"></div>
              <div className="relative bg-white rounded-3xl shadow-floating p-8 animate-scale-in">
                <div className="card-ticket ticket-notch mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-slate-500 uppercase tracking-wider">Draw Entry</p>
                      <p className="font-heading text-3xl font-bold text-slate-900">+5</p>
                    </div>
                    <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-4">
                    <p className="text-sm text-slate-600">SuperMart Receipt</p>
                    <p className="text-xs text-slate-400">Verified 2 minutes ago</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">247</p>
                    <p className="text-xs text-slate-500">Your Entries</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">7</p>
                    <p className="text-xs text-slate-500">Day Streak</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">1.2x</p>
                    <p className="text-xs text-slate-500">Multiplier</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "2.5M+", label: t('landing.stats.users'), icon: Users },
              { value: "50M+", label: t('landing.stats.scans'), icon: QrCode },
              { value: "$2M+", label: t('landing.stats.prizes'), icon: Trophy },
              { value: "$300M+", label: t('landing.stats.revenue'), icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <p className="text-3xl md:text-4xl font-bold font-heading mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4" data-testid="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Simple steps to start winning while contributing to your nation
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, icon: Receipt, ...t('landing.howItWorks.step1', { returnObjects: true }) },
              { step: 2, icon: QrCode, ...t('landing.howItWorks.step2', { returnObjects: true }) },
              { step: 3, icon: Star, ...t('landing.howItWorks.step3', { returnObjects: true }) },
              { step: 4, icon: Trophy, ...t('landing.howItWorks.step4', { returnObjects: true }) },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-slate-200"></div>
                )}
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-card mx-auto mb-6 flex items-center justify-center border border-slate-100">
                    <item.icon className="w-9 h-9 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why Choose TAXXA?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: "Win Big Prizes",
                desc: "Weekly and monthly draws with prizes up to $10,000",
                color: "bg-secondary/10 text-secondary"
              },
              {
                icon: TrendingUp,
                title: "Streak Bonuses",
                desc: "Build streaks to multiply your entries up to 1.2x",
                color: "bg-primary/10 text-primary"
              },
              {
                icon: Users,
                title: "Refer & Earn",
                desc: "Invite friends and earn bonus entries when they scan",
                color: "bg-accent/10 text-accent"
              },
              {
                icon: Shield,
                title: "Government Backed",
                desc: "Official partnership with Tanzania Revenue Authority",
                color: "bg-slate-100 text-slate-700"
              },
              {
                icon: QrCode,
                title: "Instant Verification",
                desc: "Receipts verified in seconds with real-time validation",
                color: "bg-primary/10 text-primary"
              },
              {
                icon: Globe,
                title: "Multi-Language",
                desc: "Available in English, Swahili, and French",
                color: "bg-secondary/10 text-secondary"
              },
            ].map((feature, i) => (
              <div key={i} className="card-default hover:shadow-floating transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-official text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Winning?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join millions of citizens already earning entries and winning prizes
          </p>
          <Link to="/register">
            <Button className="btn-gold text-lg px-10 py-5" data-testid="cta-register">
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-emerald flex items-center justify-center">
                <Receipt className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white">TAXXA</span>
            </div>
            <p className="text-sm">© 2025 TAXXA. Transforming Tax Compliance Through Citizen Engagement.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
