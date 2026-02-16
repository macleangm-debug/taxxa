import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Receipt, Phone, Lock, User, ArrowRight, Eye, EyeOff, Gift, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, verifyOtp, createAccount } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Details
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testOtp, setTestOtp] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    
    setLoading(true);
    try {
      const res = await register(phone);
      setTestOtp(res.otp_for_testing);
      toast.success("OTP sent to your phone");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }
    
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      toast.success("Phone verified!");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    try {
      await createAccount(phone, password, name, referralCode);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex flex-1 gradient-emerald items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">Start Winning Today</h2>
          <p className="text-lg text-white/80 mb-8">
            Create your free account and start turning receipts into prize draw entries
          </p>
          
          <div className="space-y-4">
            {[
              "Scan any official receipt with QR code",
              "Earn entries into weekly prize draws",
              "Build streaks for bonus multipliers",
              "Win cash prizes up to $10,000"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
                <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-in">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900">TAXXA</span>
          </Link>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-primary' : 'bg-slate-100'}`}></div>}
              </React.Fragment>
            ))}
          </div>
          
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('auth.register')}</h1>
              <p className="text-slate-600 mb-8">Enter your phone number to get started</p>
              
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <Label htmlFor="phone" className="text-slate-700 mb-2 block">{t('auth.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+255 xxx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-11"
                      data-testid="register-phone"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full btn-primary" disabled={loading} data-testid="send-otp-btn">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('auth.sendOtp')}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}
          
          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('auth.verifyOtp')}</h1>
              <p className="text-slate-600 mb-8">Enter the 6-digit code sent to {phone}</p>
              
              {testOtp && (
                <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-secondary font-medium">Test OTP: <span className="font-mono font-bold">{testOtp}</span></p>
                </div>
              )}
              
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    data-testid="otp-input"
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <Button type="submit" className="w-full btn-primary" disabled={loading || otp.length !== 6} data-testid="verify-otp-btn">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('auth.verifyOtp')}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
                
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-slate-600 hover:text-primary"
                >
                  Change phone number
                </button>
              </form>
            </>
          )}
          
          {/* Step 3: Account Details */}
          {step === 3 && (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('auth.createAccount')}</h1>
              <p className="text-slate-600 mb-8">Complete your profile to start scanning</p>
              
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-slate-700 mb-2 block">{t('auth.name')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-11"
                      data-testid="register-name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-slate-700 mb-2 block">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-11 pr-11"
                      data-testid="register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="referral" className="text-slate-700 mb-2 block">{t('auth.referralCode')}</Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="referral"
                      type="text"
                      placeholder="Enter code (optional)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="input-field pl-11"
                      data-testid="register-referral"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full btn-gold" disabled={loading} data-testid="create-account-btn">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('auth.createAccount')}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}
          
          <p className="text-center mt-8 text-slate-600">
            {t('auth.haveAccount')}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline" data-testid="login-link">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
