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
import { scanAPI, testAPI } from '../../src/utils/api';
import ScanResult from '../../src/components/ScanResult';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

interface ScanResultData {
  status: 'valid' | 'invalid' | 'duplicate' | 'expired';
  message: string;
  entries_earned: number;
  receipt_data?: {
    merchant_name?: string;
    amount?: number;
    tax_amount?: number;
  };
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!isScanning || isProcessing) return;
    
    setIsScanning(false);
    setIsProcessing(true);

    try {
      const response = await scanAPI.scan(data);
      setScanResult(response.data);
      setShowResult(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to process scan'
      );
      setIsScanning(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setScanResult(null);
    setIsScanning(true);
  };

  // For testing - generate and scan a test QR
  const handleTestScan = async () => {
    try {
      setIsProcessing(true);
      const qrResponse = await testAPI.generateQR('MER-001', Math.random() * 500 + 50);
      const response = await scanAPI.scan(qrResponse.data.qr_data);
      setScanResult(response.data);
      setShowResult(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to process test scan'
      );
    } finally {
      setIsProcessing(false);
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

      <ScanResult
        visible={showResult}
        result={scanResult}
        onClose={handleCloseResult}
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
