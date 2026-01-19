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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phone, testOtp } = useLocalSearchParams<{ phone: string; testOtp?: string }>();
  const { verifyOTP, register } = useAuthStore();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Auto-fill OTP for testing (remove in production)
    if (testOtp) {
      const digits = testOtp.split('');
      setOtp(digits);
    }
  }, [testOtp]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(phone!, otpString);
      router.push({
        pathname: '/(auth)/create-password',
        params: { phone },
      });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Invalid OTP'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const result = await register(phone!);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      // Auto-fill for testing
      if (result.otp) {
        const digits = result.otp.split('');
        setOtp(digits);
      }
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={48} color="#10B981" />
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{' '}\n{phone}
            </Text>
          </View>

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
            style={[
              styles.button,
              otp.join('').length !== 6 && styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend OTP in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 56,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  otpInputFilled: {
    backgroundColor: '#3B82F6',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  countdownText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  resendText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});
