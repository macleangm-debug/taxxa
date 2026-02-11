import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppConfigStore } from '../store/appConfigStore';

interface ScanResultProps {
  visible: boolean;
  result: {
    status: 'valid' | 'invalid' | 'duplicate' | 'expired';
    message: string;
    entries_earned: number;
    receipt_data?: {
      merchant_name?: string;
      amount?: number;
      tax_amount?: number;
    };
  } | null;
  onClose: () => void;
}

export default function ScanResult({ visible, result, onClose }: ScanResultProps) {
  const { currency } = useAppConfigStore();
  
  if (!result) return null;

  const isSuccess = result.status === 'valid';
  const iconName = isSuccess ? 'checkmark-circle' : 'close-circle';
  const iconColor = isSuccess ? '#10B981' : '#EF4444';
  const bgColor = isSuccess ? '#ECFDF5' : '#FEF2F2';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={80} color={iconColor} />
          
          <Text style={[styles.title, { color: iconColor }]}>
            {isSuccess ? 'Success!' : 'Scan Failed'}
          </Text>
          
          <Text style={styles.message}>{result.message}</Text>
          
          {isSuccess && result.receipt_data && (
            <View style={styles.receiptInfo}>
              {result.receipt_data.merchant_name && (
                <Text style={styles.infoText}>
                  Merchant: {result.receipt_data.merchant_name}
                </Text>
              )}
              {result.receipt_data.amount && (
                <Text style={styles.infoText}>
                  Amount: {currency.currency_symbol} {result.receipt_data.amount.toLocaleString()}
                </Text>
              )}
              <Text style={styles.entriesText}>
                +{result.entries_earned} Draw Entries!
              </Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>
              {isSuccess ? 'Scan More' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
  },
  receiptInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  entriesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
