import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppConfigStore } from '../store/appConfigStore';
import { DecodeResponse, ValidateResponse, SubmitResponse, ValidationCheck } from '../utils/api';

// Processing steps for the multi-step flow
type ProcessingStep = 'decoding' | 'validating' | 'submitting' | 'complete' | 'error';

interface EnhancedScanResultProps {
  visible: boolean;
  // Processing state
  currentStep: ProcessingStep;
  // Results from each step
  decodeResult?: DecodeResponse | null;
  validateResult?: ValidateResponse | null;
  submitResult?: SubmitResponse | null;
  // Error if any
  error?: string | null;
  // Callbacks
  onClose: () => void;
  onRetry?: () => void;
}

export default function EnhancedScanResult({ 
  visible, 
  currentStep,
  decodeResult,
  validateResult,
  submitResult,
  error,
  onClose,
  onRetry
}: EnhancedScanResultProps) {
  const { currency } = useAppConfigStore();
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  
  const isProcessing = ['decoding', 'validating', 'submitting'].includes(currentStep);
  const isSuccess = currentStep === 'complete' && validateResult?.is_valid;
  const isError = currentStep === 'error' || (currentStep === 'complete' && !validateResult?.is_valid);

  const getStepInfo = () => {
    switch (currentStep) {
      case 'decoding':
        return { text: 'Decoding QR Code...', icon: 'qr-code' };
      case 'validating':
        return { text: 'Validating Receipt...', icon: 'shield-checkmark' };
      case 'submitting':
        return { text: 'Submitting Entry...', icon: 'cloud-upload' };
      default:
        return { text: '', icon: 'checkmark' };
    }
  };

  const stepInfo = getStepInfo();

  // Render validation check item
  const renderValidationCheck = (check: ValidationCheck, index: number) => {
    const isPassed = check.passed;
    return (
      <View key={index} style={styles.checkItem}>
        <Ionicons 
          name={isPassed ? 'checkmark-circle' : 'close-circle'} 
          size={18} 
          color={isPassed ? '#10B981' : '#EF4444'} 
        />
        <View style={styles.checkContent}>
          <Text style={styles.checkName}>{check.description}</Text>
          {check.critical && !isPassed && (
            <Text style={styles.checkCritical}>Critical</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container, 
          isProcessing && styles.containerProcessing,
          isSuccess && styles.containerSuccess,
          isError && styles.containerError
        ]}>
          {/* Processing State */}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <View style={styles.processingSteps}>
                <View style={[styles.stepIndicator, currentStep === 'decoding' && styles.stepActive]}>
                  <Ionicons name="qr-code" size={20} color={currentStep === 'decoding' ? '#3B82F6' : '#94A3B8'} />
                  <Text style={[styles.stepText, currentStep === 'decoding' && styles.stepTextActive]}>Decode</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={[styles.stepIndicator, currentStep === 'validating' && styles.stepActive]}>
                  <Ionicons name="shield-checkmark" size={20} color={currentStep === 'validating' ? '#3B82F6' : '#94A3B8'} />
                  <Text style={[styles.stepText, currentStep === 'validating' && styles.stepTextActive]}>Validate</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={[styles.stepIndicator, currentStep === 'submitting' && styles.stepActive]}>
                  <Ionicons name="cloud-upload" size={20} color={currentStep === 'submitting' ? '#3B82F6' : '#94A3B8'} />
                  <Text style={[styles.stepText, currentStep === 'submitting' && styles.stepTextActive]}>Submit</Text>
                </View>
              </View>
              <Text style={styles.processingText}>{stepInfo.text}</Text>
              
              {/* Show decode info while validating */}
              {currentStep !== 'decoding' && decodeResult?.receipt && (
                <View style={styles.previewInfo}>
                  <Text style={styles.previewTitle}>
                    {decodeResult.receipt.merchant?.name || 'Unknown Merchant'}
                  </Text>
                  <Text style={styles.previewAmount}>
                    {decodeResult.receipt.currency} {decodeResult.receipt.total_amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.previewFormat}>
                    Format: {decodeResult.detected_format.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Success State */}
          {isSuccess && submitResult && (
            <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.resultContent}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                <Text style={styles.successTitle}>Success!</Text>
                <Text style={styles.successMessage}>{submitResult.message}</Text>

                {/* Receipt Info */}
                {decodeResult?.receipt && (
                  <View style={styles.receiptCard}>
                    <Text style={styles.cardTitle}>Receipt Details</Text>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Merchant</Text>
                      <Text style={styles.cardValue}>{decodeResult.receipt.merchant?.name || 'N/A'}</Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Amount</Text>
                      <Text style={styles.cardValue}>
                        {decodeResult.receipt.currency} {decodeResult.receipt.total_amount?.toLocaleString()}
                      </Text>
                    </View>
                    {decodeResult.receipt.total_tax && (
                      <View style={styles.cardRow}>
                        <Text style={styles.cardLabel}>Tax</Text>
                        <Text style={styles.cardValue}>
                          {decodeResult.receipt.currency} {decodeResult.receipt.total_tax?.toLocaleString()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Receipt #</Text>
                      <Text style={styles.cardValue}>{decodeResult.receipt.receipt_number}</Text>
                    </View>
                  </View>
                )}

                {/* Entries Earned */}
                <View style={styles.entriesCard}>
                  <Text style={styles.entriesLabel}>Draw Entries Earned</Text>
                  <Text style={styles.entriesValue}>+{submitResult.total_entries}</Text>
                  {submitResult.bonus_entries > 0 && (
                    <Text style={styles.bonusText}>
                      Includes {submitResult.bonus_entries} bonus entries!
                    </Text>
                  )}
                </View>

                {/* Validation Summary */}
                <TouchableOpacity 
                  style={styles.validationToggle}
                  onPress={() => setShowValidationDetails(!showValidationDetails)}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={styles.validationToggleText}>
                    {validateResult?.checks_performed.filter(c => c.passed).length}/{validateResult?.checks_performed.length} checks passed
                  </Text>
                  <Ionicons 
                    name={showValidationDetails ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>

                {showValidationDetails && validateResult && (
                  <View style={styles.validationDetails}>
                    {validateResult.checks_performed.map(renderValidationCheck)}
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Error/Invalid State */}
          {isError && (
            <ScrollView style={styles.resultScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.resultContent}>
                <Ionicons name="close-circle" size={80} color="#EF4444" />
                <Text style={styles.errorTitle}>
                  {error ? 'Scan Failed' : 'Validation Failed'}
                </Text>
                <Text style={styles.errorMessage}>
                  {error || 'This receipt could not be validated.'}
                </Text>

                {/* Show validation failures */}
                {validateResult && (
                  <View style={styles.failedChecksCard}>
                    <Text style={styles.failedChecksTitle}>Validation Results</Text>
                    {validateResult.checks_performed.map(renderValidationCheck)}
                  </View>
                )}

                {/* Retry button */}
                {onRetry && (
                  <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {/* Close button (shown when not processing) */}
          {!isProcessing && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>
                {isSuccess ? 'Scan More' : 'Close'}
              </Text>
            </TouchableOpacity>
          )}
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
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#fff',
  },
  containerProcessing: {
    backgroundColor: '#F8FAFC',
  },
  containerSuccess: {
    backgroundColor: '#ECFDF5',
  },
  containerError: {
    backgroundColor: '#FEF2F2',
  },
  // Processing styles
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processingSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  stepIndicator: {
    alignItems: 'center',
    opacity: 0.5,
  },
  stepActive: {
    opacity: 1,
  },
  stepText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  stepTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  processingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginTop: 8,
  },
  previewInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  previewAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 4,
  },
  previewFormat: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  // Result styles
  resultScroll: {
    flexGrow: 0,
  },
  resultContent: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  // Receipt card
  receiptCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    width: '100%',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  cardLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  // Entries card
  entriesCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#10B981',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  entriesLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  entriesValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  bonusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  // Validation toggle
  validationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    width: '100%',
    gap: 8,
  },
  validationToggleText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  validationDetails: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    width: '100%',
  },
  // Check item
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 8,
  },
  checkContent: {
    flex: 1,
  },
  checkName: {
    fontSize: 13,
    color: '#374151',
  },
  checkCritical: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  // Failed checks card
  failedChecksCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    width: '100%',
  },
  failedChecksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Buttons
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
