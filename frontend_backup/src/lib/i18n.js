import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: "Home",
        dashboard: "Dashboard",
        scan: "Scan",
        draws: "Draws",
        leaderboard: "Leaderboard",
        referrals: "Referrals",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout"
      },
      // Landing
      landing: {
        hero: {
          title: "Turn Every Receipt Into a Winning Ticket",
          subtitle: "Scan receipts, earn entries, win big prizes. Join millions making tax compliance rewarding.",
          cta: "Get Started",
          secondary: "Learn How"
        },
        howItWorks: {
          title: "How It Works",
          step1: { title: "Shop & Request Receipt", desc: "Always ask for your official receipt with QR code" },
          step2: { title: "Scan the QR Code", desc: "Use our app to scan and validate your receipt" },
          step3: { title: "Earn Draw Entries", desc: "Valid receipts earn you entries into prize draws" },
          step4: { title: "Win Prizes!", desc: "Weekly and monthly draws with amazing prizes" }
        },
        stats: {
          users: "Active Users",
          scans: "Receipts Scanned",
          prizes: "Prizes Awarded",
          revenue: "Tax Revenue Impact"
        }
      },
      // Auth
      auth: {
        login: "Login",
        register: "Register",
        phone: "Phone Number",
        password: "Password",
        name: "Full Name",
        otp: "Enter OTP",
        sendOtp: "Send OTP",
        verifyOtp: "Verify OTP",
        createAccount: "Create Account",
        haveAccount: "Already have an account?",
        noAccount: "Don't have an account?",
        referralCode: "Referral Code (Optional)",
        forgotPassword: "Forgot Password?"
      },
      // Dashboard
      dashboard: {
        welcome: "Welcome back",
        totalScans: "Total Scans",
        validScans: "Valid Scans",
        totalEntries: "Total Entries",
        currentStreak: "Current Streak",
        days: "days",
        nextDraw: "Next Draw",
        yourEntries: "Your Entries",
        scanNow: "Scan Receipt",
        recentActivity: "Recent Activity",
        upcomingDraws: "Upcoming Draws",
        noActivity: "No recent activity"
      },
      // Scanner
      scanner: {
        title: "Scan Receipt",
        instructions: "Point your camera at the QR code on your receipt",
        upload: "Or upload image",
        testMode: "Test Mode",
        generateTest: "Generate Test QR",
        scanning: "Scanning...",
        success: "Receipt Verified!",
        duplicate: "Already Scanned",
        invalid: "Invalid Receipt",
        entriesEarned: "entries earned",
        streakBonus: "streak bonus"
      },
      // Draws
      draws: {
        title: "Prize Draws",
        active: "Active",
        upcoming: "Upcoming",
        completed: "Completed",
        weekly: "Weekly Draw",
        monthly: "Monthly Draw",
        quarterly: "Quarterly Draw",
        grandPrize: "Grand Prize",
        totalPool: "Total Prize Pool",
        yourEntries: "Your Entries",
        totalEntries: "Total Entries",
        endsIn: "Ends in",
        viewPrizes: "View All Prizes"
      },
      // Leaderboard
      leaderboard: {
        title: "Leaderboard",
        rank: "Rank",
        name: "Name",
        entries: "Entries",
        you: "You",
        topScanners: "Top Scanners"
      },
      // Referrals
      referrals: {
        title: "Invite Friends",
        subtitle: "Earn bonus entries when your friends join and scan",
        yourCode: "Your Referral Code",
        copyLink: "Copy Link",
        copied: "Copied!",
        share: "Share",
        stats: {
          total: "Total Referrals",
          active: "Active Referrals",
          earned: "Bonus Entries Earned",
          remaining: "Remaining Slots"
        },
        rewards: {
          title: "Reward Structure",
          signup: "Friend Signs Up",
          firstScan: "First Valid Scan",
          fiveScans: "5 Valid Scans"
        },
        yourReferrals: "Your Referrals"
      },
      // Streaks & Badges
      gamification: {
        streaks: {
          title: "Your Streak",
          current: "Current Streak",
          longest: "Longest Streak",
          multiplier: "Entry Multiplier",
          nextReward: "Next Reward"
        },
        badges: {
          title: "Your Badges",
          earned: "Earned",
          locked: "Locked",
          progress: "Keep scanning to unlock more badges!"
        }
      },
      // Common
      common: {
        loading: "Loading...",
        error: "Something went wrong",
        retry: "Try Again",
        save: "Save",
        cancel: "Cancel",
        confirm: "Confirm",
        back: "Back",
        next: "Next",
        submit: "Submit",
        share: "Share",
        close: "Close"
      }
    }
  },
  sw: {
    translation: {
      nav: {
        home: "Nyumbani",
        dashboard: "Dashibodi",
        scan: "Changanua",
        draws: "Bahati nasibu",
        leaderboard: "Orodha ya Wabora",
        referrals: "Marejeleo",
        profile: "Wasifu",
        settings: "Mipangilio",
        logout: "Ondoka"
      },
      landing: {
        hero: {
          title: "Geuza Kila Risiti Kuwa Tiketi ya Kushinda",
          subtitle: "Changanua risiti, pata kuingia, shinda zawadi kubwa.",
          cta: "Anza Sasa",
          secondary: "Jifunze Jinsi"
        },
        howItWorks: {
          title: "Jinsi Inavyofanya Kazi",
          step1: { title: "Nunua & Omba Risiti", desc: "Daima omba risiti yako rasmi na msimbo wa QR" },
          step2: { title: "Changanua Msimbo wa QR", desc: "Tumia programu yetu kuchanganua na kuthibitisha risiti yako" },
          step3: { title: "Pata Kuingia kwa Bahati", desc: "Risiti halali hukupa kuingia kwenye bahati nasibu" },
          step4: { title: "Shinda Zawadi!", desc: "Bahati nasibu za kila wiki na mwezi na zawadi za kushangaza" }
        }
      },
      auth: {
        login: "Ingia",
        register: "Jisajili",
        phone: "Nambari ya Simu",
        password: "Nenosiri",
        name: "Jina Kamili",
        otp: "Weka OTP",
        sendOtp: "Tuma OTP",
        verifyOtp: "Thibitisha OTP",
        createAccount: "Fungua Akaunti",
        haveAccount: "Una akaunti tayari?",
        noAccount: "Huna akaunti?"
      },
      dashboard: {
        welcome: "Karibu tena",
        totalScans: "Jumla ya Scans",
        validScans: "Scans Halali",
        totalEntries: "Jumla ya Kuingia",
        currentStreak: "Mfululizo wa Sasa",
        days: "siku",
        nextDraw: "Bahati Ijayo",
        yourEntries: "Kuingia Kwako",
        scanNow: "Changanua Risiti",
        recentActivity: "Shughuli za Hivi Karibuni"
      },
      scanner: {
        title: "Changanua Risiti",
        instructions: "Elekeza kamera yako kwenye msimbo wa QR kwenye risiti yako",
        success: "Risiti Imethibitishwa!",
        duplicate: "Tayari Imescaniwa",
        invalid: "Risiti si Halali",
        entriesEarned: "kuingia kumepatikana"
      },
      common: {
        loading: "Inapakia...",
        error: "Kitu kimeharibika",
        retry: "Jaribu Tena",
        save: "Hifadhi",
        cancel: "Ghairi",
        share: "Shiriki"
      }
    }
  },
  fr: {
    translation: {
      nav: {
        home: "Accueil",
        dashboard: "Tableau de bord",
        scan: "Scanner",
        draws: "Tirages",
        leaderboard: "Classement",
        referrals: "Parrainages",
        profile: "Profil",
        settings: "Paramètres",
        logout: "Déconnexion"
      },
      landing: {
        hero: {
          title: "Transformez Chaque Reçu en Ticket Gagnant",
          subtitle: "Scannez vos reçus, gagnez des participations, remportez de gros prix.",
          cta: "Commencer",
          secondary: "En Savoir Plus"
        }
      },
      auth: {
        login: "Connexion",
        register: "Inscription",
        phone: "Numéro de Téléphone",
        password: "Mot de passe",
        name: "Nom Complet",
        otp: "Entrer OTP",
        sendOtp: "Envoyer OTP",
        verifyOtp: "Vérifier OTP",
        createAccount: "Créer un Compte"
      },
      common: {
        loading: "Chargement...",
        error: "Une erreur est survenue",
        retry: "Réessayer",
        save: "Enregistrer",
        cancel: "Annuler"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
