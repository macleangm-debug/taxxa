import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { receiptAPI, testAPI, DecodeResponse, ValidateResponse, SubmitResponse } from '../../src/utils/api';
import EnhancedScanResult from '../../src/components/EnhancedScanResult';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const SCAN_AREA_SIZE = Math.min(width * 0.7, 300);

type ProcessingStep = 'decoding' | 'validating' | 'submitting' | 'complete' | 'error';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Multi-step processing state
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('decoding');
  const [decodeResult, setDecodeResult] = useState<DecodeResponse | null>(null);
  const [validateResult, setValidateResult] = useState<ValidateResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset all state
  const resetState = () => {
    setDecodeResult(null);
    setValidateResult(null);
    setSubmitResult(null);
    setError(null);
    setCurrentStep('decoding');
  };

  // Process QR code through the 3-step flow
  const processQRCode = async (qr_data: string) => {
    resetState();
    setIsScanning(false);
    setIsProcessing(true);
    setShowResult(true);

    try {
      // Step 1: Decode
      setCurrentStep('decoding');
      const decodeRes = await receiptAPI.decode(qr_data);
      setDecodeResult(decodeRes.data);

      if (!decodeRes.data.success) {
        throw new Error(decodeRes.data.errors[0] || 'Failed to decode QR code');
      }

      // Step 2: Validate
      setCurrentStep('validating');
      const validateRes = await receiptAPI.validate(decodeRes.data.decode_id, 'mock');
      setValidateResult(validateRes.data);

      // Step 3: Submit (only if valid)
      if (validateRes.data.is_valid) {
        setCurrentStep('submitting');
        const submitRes = await receiptAPI.submit(validateRes.data.validation_id);
        setSubmitResult(submitRes.data);
      }

      setCurrentStep('complete');
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to process scan');
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!isScanning || isProcessing) return;
    await processQRCode(data);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    resetState();
    setIsScanning(true);
  };

  const handleRetry = () => {
    setShowResult(false);
    resetState();
    setIsScanning(true);
  };

  // For testing - generate and scan a test QR
  const handleTestScan = async () => {
    try {
      const qrResponse = await testAPI.generateReceiptQR(
        ['SuperMart', 'TechStore', 'Fashion Hub', 'Grocery Plus', 'Coffee Shop'][Math.floor(Math.random() * 5)],
        Math.floor(Math.random() * 500) + 50
      );
      await processQRCode(qrResponse.data.qr_data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate test scan');
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#64748B" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan receipt QR codes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          
          {/* Test button for web/simulator */}
          <TouchableOpacity style={styles.testButton} onPress={handleTestScan}>
            <Ionicons name="flask" size={20} color="#64748B" />
            <Text style={styles.testButtonText}>Test Scan (Demo)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>Point camera at the QR code</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.footer}>
        {/* How it works info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoSteps}>
            <View style={styles.infoStep}>
              <View style={styles.infoStepNumber}>
                <Text style={styles.infoStepNumberText}>1</Text>
              </View>
              <Text style={styles.infoStepText}>Decode QR</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#64748B" />
            <View style={styles.infoStep}>
              <View style={styles.infoStepNumber}>
                <Text style={styles.infoStepNumberText}>2</Text>
              </View>
              <Text style={styles.infoStepText}>Validate</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#64748B" />
            <View style={styles.infoStep}>
              <View style={styles.infoStepNumber}>
                <Text style={styles.infoStepNumberText}>3</Text>
              </View>
              <Text style={styles.infoStepText}>Earn Entry</Text>
            </View>
          </View>
        </View>

        <View style={styles.tips}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.tipsText}>
            Make sure the QR code is within the frame and well-lit
          </Text>
        </View>
        
        {/* Test button */}
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={handleTestScan}
          disabled={isProcessing}
        >
          <Ionicons name="flask" size={20} color="#64748B" />
          <Text style={styles.testButtonText}>
            {isProcessing ? 'Processing...' : 'Test Scan (Demo)'}
          </Text>
        </TouchableOpacity>
      </View>

      <EnhancedScanResult
        visible={showResult}
        currentStep={currentStep}
        decodeResult={decodeResult}
        validateResult={validateResult}
        submitResult={submitResult}
        error={error}
        onClose={handleCloseResult}
        onRetry={handleRetry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 24,
    marginHorizontal: 16,
    maxWidth: isWeb ? 400 : undefined,
    maxHeight: isWeb ? 400 : undefined,
    alignSelf: 'center',
    width: isWeb ? '100%' : undefined,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  footer: {
    padding: 16,
    maxWidth: isWeb ? 400 : undefined,
    alignSelf: isWeb ? 'center' : undefined,
    width: isWeb ? '100%' : undefined,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoSteps: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  infoStep: {
    alignItems: 'center',
    gap: 4,
  },
  infoStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoStepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  infoStepText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
  },
  tipsText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#94A3B8',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    maxWidth: isWeb ? 400 : undefined,
    alignSelf: isWeb ? 'center' : undefined,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  testButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});
