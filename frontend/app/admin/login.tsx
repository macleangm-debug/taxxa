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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdminStore } from '../../src/store/adminStore';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { login } = useAdminStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      router.replace('/admin/dashboard');
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.detail || 'Invalid credentials'
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
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={48} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>TaxDraw Management System</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#64748B"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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

            <TouchableOpacity
              style={[styles.button, (!username || !password) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login to Admin</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="arrow-back" size={16} color="#64748B" />
            <Text style={styles.backText}>Back to User App</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
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
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  backText: {
    color: '#64748B',
    fontSize: 14,
  },
});
