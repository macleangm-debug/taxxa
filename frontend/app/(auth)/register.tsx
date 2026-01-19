import React, { useState } from 'react';
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
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Phone validation: must be 0XXXXXXXXX (10 digits starting with 0)
const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  // Remove any spaces or dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  if (cleaned.length === 0) {
    return { valid: false };
  }
  
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Phone number must contain only digits' };
  }
  
  if (!cleaned.startsWith('0')) {
    return { valid: false, error: 'Phone number must start with 0' };
  }
  
  if (cleaned.length !== 10) {
    return { valid: false, error: 'Phone number must be 10 digits (0XXXXXXXXX)' };
  }
  
  return { valid: true };
};

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExistsModal, setShowExistsModal] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handlePhoneChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    
    // Clear error when typing
    if (phoneError) {
      setPhoneError(null);
    }
  };

  const handleRegister = async () => {
    const validation = validatePhone(phoneNumber);
    
    if (!validation.valid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(phoneNumber);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone: phoneNumber, testOtp: result.otp },
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to send OTP';
      
      if (errorMessage.toLowerCase().includes('already registered') || 
          errorMessage.toLowerCase().includes('already exists')) {
        setShowExistsModal(true);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setShowExistsModal(false);
    router.push('/(auth)/login');
  };

  const isValidPhone = validatePhone(phoneNumber).valid;

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
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color="#94A3B8" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="phone-portrait" size={48} color="#3B82F6" />
                </View>
                <Text style={styles.title}>Enter your phone number</Text>
                <Text style={styles.subtitle}>
                  We'll send you an OTP to verify your number
                </Text>
              </View>

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
                <Text style={styles.formatHint}>Format: 0XXXXXXXXX (10 digits)</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  !isValidPhone && styles.buttonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading || !isValidPhone}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginBold}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showExistsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="information-circle" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>Phone Number Exists</Text>
            <Text style={styles.modalText}>
              This phone number is already registered. Would you like to login instead?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowExistsModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Try Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleGoToLogin}
              >
                <Text style={styles.modalButtonPrimaryText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: isWeb ? '#1E293B' : 'transparent',
    borderRadius: isWeb ? 24 : 0,
    padding: isWeb ? 32 : 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: isWeb ? '#0F172A' : '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isWeb ? '#0F172A' : '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  formatHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
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
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  loginBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
