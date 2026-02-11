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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhoneNumber(cleaned);
    if (phoneError) setPhoneError(null);
  };

  const handleLogin = async () => {
    const validation = validatePhone(phoneNumber);
    
    if (!validation.valid) {
      setPhoneError(validation.error || 'Invalid phone number');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await login(phoneNumber, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Invalid credentials'
      );
    } finally {
      setIsLoading(false);
    }
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
                  <Ionicons name="log-in" size={48} color="#3B82F6" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Login to continue scanning receipts
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

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed" size={20} color="#64748B" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#64748B"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  (!isValidPhone || password.length < 6) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading || !isValidPhone || password.length < 6}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.registerText}>
                  Don't have an account? <Text style={styles.registerBold}>Register</Text>
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
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 16,
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
    marginTop: -8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
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
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  registerBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
