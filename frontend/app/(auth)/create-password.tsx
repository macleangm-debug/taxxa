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
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function CreatePasswordScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { createPassword } = useAuthStore();
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValidPassword = password.length >= 6;
  const passwordsMatch = password === confirmPassword;

  const handleCreateAccount = async () => {
    if (!isValidPassword) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await createPassword(phone!, password, name || undefined);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to create account'
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              {/* Back button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color="#94A3B8" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person-add" size={48} color="#3B82F6" />
                </View>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Set up your password to complete registration
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person" size={20} color="#64748B" />
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name (optional)"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

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

                {password && !isValidPassword && (
                  <Text style={styles.errorText}>
                    Password must be at least 6 characters
                  </Text>
                )}
                {confirmPassword && !passwordsMatch && (
                  <Text style={styles.errorText}>
                    Passwords do not match
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (!isValidPassword || !passwordsMatch) && styles.buttonDisabled,
                ]}
                onPress={handleCreateAccount}
                disabled={isLoading || !isValidPassword || !passwordsMatch}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
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
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isWeb ? '#0F172A' : '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: -8,
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
});
