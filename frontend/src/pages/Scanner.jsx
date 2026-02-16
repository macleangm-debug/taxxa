import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  QrCode, Camera, Upload, CheckCircle, XCircle, AlertCircle,
  Flame, Star, Award, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Scanner = () => {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testQR, setTestQR] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState("MER-001");
  const [amount, setAmount] = useState(100);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const res = await axios.get(`${API}/test/merchants`);
      setMerchants(res.data);
    } catch (err) {
      console.error("Failed to fetch merchants:", err);
    }
  };

  const generateTestQR = async () => {
    try {
      const res = await axios.get(`${API}/test/generate-qr`, {
        params: { merchant_id: selectedMerchant, amount }
      });
      setTestQR(res.data);
    } catch (err) {
      toast.error("Failed to generate test QR");
    }
  };

  const handleScan = async (qrData) => {
    setScanning(true);
    setResult(null);
    
    try {
      const res = await axios.post(`${API}/scan`, { qr_data: qrData });
      setResult(res.data);
      
      if (res.data.status === "valid") {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#059669', '#F59E0B', '#FFD700']
        });
        toast.success(res.data.message);
        refreshUser();
      } else if (res.data.status === "duplicate") {
        toast.warning(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Scan failed");
      setResult({ status: "error", message: "Scan failed" });
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In real app, would decode QR from image
    // For demo, we'll use test QR
    if (testQR) {
      handleScan(testQR.qr_data);
    } else {
      toast.error("Please generate a test QR first");
    }
  };

  const resetScanner = () => {
    setResult(null);
    setTestQR(null);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in" data-testid="scanner-page">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{t('scanner.title')}</h1>
        <p className="text-slate-600">{t('scanner.instructions')}</p>
      </div>

      {/* Scanner Area */}
      {!result && (
        <div className="card-default mb-6">
          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">{t('scanner.testMode')}</span>
            </div>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                testMode ? 'bg-primary' : 'bg-slate-300'
              }`}
              data-testid="test-mode-toggle"
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                testMode ? 'left-7' : 'left-1'
              }`}></span>
            </button>
          </div>

          {testMode ? (
            /* Test Mode UI */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Merchant</label>
                  <select
                    value={selectedMerchant}
                    onChange={(e) => setSelectedMerchant(e.target.value)}
                    className="input-field"
                    data-testid="merchant-select"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amount ($)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="input-field"
                    min="1"
                    data-testid="amount-input"
                  />
                </div>
              </div>
              
              <Button 
                onClick={generateTestQR} 
                className="w-full btn-secondary"
                data-testid="generate-qr-btn"
              >
                <QrCode className="w-5 h-5 mr-2" />
                {t('scanner.generateTest')}
              </Button>
              
              {testQR && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Generated Receipt:</p>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{testQR.receipt_data.merchant_name}</p>
                        <p className="text-sm text-slate-500">ID: {testQR.receipt_data.receipt_id}</p>
                      </div>
                      <p className="text-xl font-bold text-primary">${testQR.receipt_data.amount}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Tax: ${testQR.receipt_data.tax_amount}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={() => handleScan(testQR.qr_data)}
                    className="w-full btn-gold mt-4"
                    disabled={scanning}
                    data-testid="scan-test-qr-btn"
                  >
                    {scanning ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        {t('scanner.scanning')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Scan This Receipt
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Camera Mode UI */
            <div className="space-y-4">
              <div className="aspect-square max-w-sm mx-auto bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                <Camera className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-slate-500 text-center px-4">
                  Camera preview would appear here
                </p>
                <p className="text-sm text-slate-400 mt-2">(Enable test mode to try scanning)</p>
              </div>
              
              <div className="text-center">
                <p className="text-slate-500 mb-4">{t('scanner.upload')}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="btn-secondary"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`card-default animate-scale-in ${
          result.status === 'valid' ? 'border-2 border-primary' : 
          result.status === 'duplicate' ? 'border-2 border-amber-400' : 
          'border-2 border-red-400'
        }`} data-testid="scan-result">
          <div className="text-center">
            {result.status === 'valid' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">{t('scanner.success')}</h2>
                
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Entries Earned</p>
                      <p className="text-3xl font-bold text-slate-900">{result.entries_earned}</p>
                    </div>
                    {result.streak_bonus > 0 && (
                      <div>
                        <p className="text-sm text-slate-500">Streak Bonus</p>
                        <p className="text-3xl font-bold text-orange-500">+{result.streak_bonus}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {result.receipt_data && (
                  <div className="text-left bg-white border border-slate-200 rounded-xl p-4 mb-6">
                    <p className="font-semibold text-slate-900">{result.receipt_data.merchant_name}</p>
                    <p className="text-sm text-slate-500">
                      Amount: ${result.receipt_data.amount}
                    </p>
                  </div>
                )}
                
                {result.new_badges?.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-secondary mb-2">
                      <Award className="w-5 h-5" />
                      <span className="font-semibold">New Badge Earned!</span>
                    </div>
                    <p className="text-sm text-slate-600">{result.new_badges.join(', ')}</p>
                  </div>
                )}
              </>
            ) : result.status === 'duplicate' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-50 mx-auto mb-4 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-amber-600 mb-2">{t('scanner.duplicate')}</h2>
                <p className="text-slate-600">{result.message}</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">{t('scanner.invalid')}</h2>
                <p className="text-slate-600">{result.message}</p>
              </>
            )}
            
            <Button 
              onClick={resetScanner}
              className="btn-primary mt-6"
              data-testid="scan-another-btn"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Scan Another Receipt
            </Button>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="card-default bg-slate-50 border-slate-200 mt-6">
        <h3 className="font-semibold text-slate-900 mb-4">Scanning Tips</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Ensure the QR code is clearly visible and not damaged</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Hold your phone steady until scanning completes</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Scan receipts within 30 days of purchase</span>
          </li>
          <li className="flex items-start gap-2">
            <Flame className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <span>Scan daily to build your streak and earn bonus multipliers!</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Scanner;
