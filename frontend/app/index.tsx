import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="receipt" size={60} color="#3B82F6" />
            </View>
            <Text style={styles.title}>TaxDraw</Text>
            <Text style={styles.subtitle}>Scan Receipts. Win Prizes.</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="scan" size={32} color="#10B981" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Scan Receipts</Text>
                <Text style={styles.featureDesc}>Scan tax receipt QR codes from registered merchants</Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Ionicons name="trophy" size={32} color="#F59E0B" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Earn Entries</Text>
                <Text style={styles.featureDesc}>Each valid receipt earns you draw entries</Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Ionicons name="gift" size={32} color="#EC4899" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Win Prizes</Text>
                <Text style={styles.featureDesc}>Weekly, monthly & quarterly prize draws</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: isWeb ? 'center' : 'stretch',
  },
  container: {
    flex: isWeb ? undefined : 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    width: '100%',
    maxWidth: isWeb ? 420 : undefined,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#94A3B8',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
  },
  footer: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginTop: 24,
  },
});
