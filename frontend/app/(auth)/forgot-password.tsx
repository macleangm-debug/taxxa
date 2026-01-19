import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authAPI } from '../../src/utils/api';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Phone validation
const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.length === 0) return { valid: false };
  if (!/^\d+$/.test(cleaned)) return { valid: false, error: 'Phone number must contain only digits' };
  if (!cleaned.startsWith('0')) return { valid: false, error: 'Phone number must start with 0' };
  if (cleaned.length !== 10) return { valid: false, error: 'Phone number must be 10 digits (0XXXXXXXXX)' };
  return { valid: true };
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (testOtp && step === 'otp') {
      setOtp(testOtp.split(''));
    }
  }, [testOtp, step]);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    if (phoneError) setPhoneError(null);
  };

  const handleRequestOTP = async () => {
    const validation = validatePhone(phoneNumber);
    if (!validation.valid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Use the forgot-password endpoint for existing users
      const response = await authAPI.forgotPassword(phoneNumber);
      setTestOtp(response.data.otp_for_testing);
      setStep('otp');
      setCountdown(60);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to send OTP';
      if (msg.toLowerCase().includes('not registered') || msg.toLowerCase().includes('not found')) {
        Alert.alert('Error', 'Phone number not registered. Please create an account first.');
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.verifyOTP(phoneNumber, otpString);
      setStep('password');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword(phoneNumber, newPassword);
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setShowSuccessModal(false);
    router.replace('/(auth)/login');
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.forgotPassword(phoneNumber);
      setTestOtp(response.data.otp_for_testing);
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidPhone = validatePhone(phoneNumber).valid;
  const isValidOtp = otp.join('').length === 6;
  const isValidPassword = newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerContainer}>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => step === 'phone' ? router.back() : setStep(step === 'password' ? 'otp' : 'phone')}
              >
                <Ionicons name="arrow-back" size={20} color="#94A3B8" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={step === 'phone' ? 'key' : step === 'otp' ? 'shield-checkmark' : 'lock-closed'} 
                    size={48} 
                    color="#F59E0B" 
                  />
                </View>
                <Text style={styles.title}>
                  {step === 'phone' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
                </Text>
                <Text style={styles.subtitle}>
                  {step === 'phone' 
                    ? 'Enter your phone number to reset password' 
                    : step === 'otp' 
                    ? `Enter the 6-digit code sent to ${phoneNumber}`
                    : 'Create a new password for your account'}
                </Text>
              </View>

              {step === 'phone' && (
                <>
                  <View style={styles.inputContainer}>
                    <View style={[styles.inputWrapper, phoneError && styles.inputError]}>
                      <Ionicons name="call" size={20} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="0XXXXXXXXX"
                        placeholderTextColor="#64748B"
                        keyboardType="number-pad"
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        maxLength={10}
                      />
                    </View>
                    {phoneError && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#EF4444" />
                        <Text style={styles.errorText}>{phoneError}</Text>
                      </View>
                    )}
                    <Text style={styles.hintText}>Format: 0XXXXXXXXX (10 digits)</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.button, !isValidPhone && styles.buttonDisabled]}
                    onPress={handleRequestOTP}
                    disabled={isLoading || !isValidPhone}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {step === 'otp' && (
                <>
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref!)}
                        style={[styles.otpInput, digit && styles.otpInputFilled]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.button, !isValidOtp && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={isLoading || !isValidOtp}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.resendContainer}>
                    {countdown > 0 ? (
                      <Text style={styles.countdownText}>Resend OTP in {countdown}s</Text>
                    ) : (
                      <TouchableOpacity onPress={handleResendOTP}>
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {step === 'password' && (
                <>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed" size={20} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="New Password"
                        placeholderTextColor="#64748B"
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed" size={20} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#64748B"
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>

                    {newPassword && newPassword.length < 6 && (
                      <Text style={styles.hintTextSmall}>Password must be at least 6 characters</Text>
                    )}
                    {confirmPassword && newPassword !== confirmPassword && (
                      <Text style={styles.errorTextSmall}>Passwords do not match</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.button, !isValidPassword && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={isLoading || !isValidPassword}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.loginText}>
                  Remember your password? <Text style={styles.loginBold}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  card: { width: '100%', maxWidth: 400, backgroundColor: isWeb ? '#1E293B' : 'transparent', borderRadius: isWeb ? 24 : 0, padding: isWeb ? 32 : 0 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  backButtonText: { color: '#94A3B8', fontSize: 14 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: isWeb ? '#0F172A' : '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#94A3B8', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  inputContainer: { gap: 16, marginBottom: 24 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: isWeb ? '#0F172A' : '#1E293B', borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'transparent' },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#fff' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  errorText: { color: '#EF4444', fontSize: 13 },
  errorTextSmall: { color: '#EF4444', fontSize: 13 },
  hintText: { color: '#64748B', fontSize: 12, marginTop: -8 },
  hintTextSmall: { color: '#94A3B8', fontSize: 13 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  otpInput: { width: 48, height: 56, backgroundColor: isWeb ? '#0F172A' : '#1E293B', borderRadius: 12, textAlign: 'center', fontSize: 22, color: '#fff', fontWeight: '600' },
  otpInputFilled: { backgroundColor: '#F59E0B' },
  button: { backgroundColor: '#F59E0B', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#374151' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  resendContainer: { marginTop: 24, alignItems: 'center' },
  countdownText: { color: '#94A3B8', fontSize: 15 },
  resendText: { color: '#F59E0B', fontSize: 15, fontWeight: '600' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { color: '#94A3B8', fontSize: 15 },
  loginBold: { color: '#3B82F6', fontWeight: '600' },
});
