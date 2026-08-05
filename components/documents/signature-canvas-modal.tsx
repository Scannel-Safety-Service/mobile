import React, { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';

interface SignatureCanvasModalProps {
  visible: boolean;
  documentTitle: string;
  onClose: () => void;
  onSign: (base64Signature: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function SignatureCanvasModal({
  visible,
  documentTitle,
  onClose,
  onSign,
  isSubmitting = false,
}: SignatureCanvasModalProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

  const signatureRef = useRef<SignatureViewRef>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [successStep, setSuccessStep] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOK = (signature: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSignatureData(signature);
    setConfirmStep(true);
    setErrorMessage(null);
  };

  const handleEmpty = () => {
    setHasDrawn(false);
  };

  const handleBegin = () => {
    setHasDrawn(true);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signatureRef.current?.clearSignature();
    setHasDrawn(false);
    setSignatureData(null);
    setConfirmStep(false);
    setSuccessStep(false);
    setErrorMessage(null);
  };

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signatureRef.current?.undo();
  };

  const handleSave = () => {
    signatureRef.current?.readSignature();
  };

  const handleConfirmSubmit = async () => {
    if (!signatureData) return;
    try {
      setErrorMessage(null);
      await onSign(signatureData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessStep(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(err?.message || 'Unable to submit signature. Please try again.');
    }
  };

  const handleModalClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmStep(false);
    setSuccessStep(false);
    setSignatureData(null);
    setHasDrawn(false);
    setErrorMessage(null);
    onClose();
  };

  // Custom styling string passed to react-native-signature-canvas WebView
  const canvasStyle = `.m-signature-pad {
    box-shadow: none;
    border: none;
    background-color: ${isDark ? '#0f2338' : '#f8fafc'};
  }
  .m-signature-pad--body {
    border: 2px dashed ${isDark ? '#1e3a5f' : '#cbd5e1'};
    border-radius: 16px;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body, html {
    background-color: ${isDark ? '#081729' : '#ffffff'};
  }`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleModalClose}
    >
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.container, { backgroundColor: isDark ? '#081729' : '#ffffff' }]}
      >
        {/* Modal Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.modalBadge, { color: colors.primary, backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff' }]}>
              Digital Document Signing
            </Text>
            <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={1}>
              {documentTitle}
            </Text>
          </View>
          <Pressable
            onPress={handleModalClose}
            style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {!confirmStep && !successStep ? (
          /* Step 1: Signature Drawing Screen */
          <View style={styles.content}>
            {/* Legal Disclaimer */}
            <View style={[styles.disclaimerCard, { backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : '#f0f9ff', borderColor: isDark ? 'rgba(59,130,246,0.2)' : '#bae6fd' }]}>
              <Ionicons name="information-circle" size={18} color="#0284c7" style={styles.disclaimerIcon} />
              <Text style={[styles.disclaimerText, { color: isDark ? '#93c5fd' : '#0369a1' }]}>
                By signing below, you acknowledge that your digital signature will be permanently attached to this compliance record with a cryptographic hash.
              </Text>
            </View>

            {/* Canvas Box */}
            <View style={styles.canvasContainer}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleOK}
                onEmpty={handleEmpty}
                onBegin={handleBegin}
                webStyle={canvasStyle}
                penColor={isDark ? '#60a5fa' : '#1e3a8a'}
                minWidth={2}
                maxWidth={4.5}
                descriptionText=""
                clearText="Clear"
                confirmText="Done"
              />
              {!hasDrawn && (
                <View style={styles.watermarkContainer} pointerEvents="none">
                  <Ionicons name="pencil" size={32} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} />
                  <Text style={[styles.watermarkText, { color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)' }]}>
                    Sign inside the box above
                  </Text>
                </View>
              )}
            </View>

            {/* Controls Bar */}
            <View style={styles.actionsBar}>
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [
                  styles.actionButtonSecondary,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.text} />
                <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>Clear</Text>
              </Pressable>

              <Pressable
                onPress={handleUndo}
                style={({ pressed }) => [
                  styles.actionButtonSecondary,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="arrow-undo-outline" size={18} color={colors.text} />
                <Text style={[styles.actionButtonTextSecondary, { color: colors.text }]}>Undo</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={!hasDrawn}
                style={({ pressed }) => [
                  styles.actionButtonPrimary,
                  { backgroundColor: hasDrawn ? colors.primary : (isDark ? '#1e293b' : '#cbd5e1') },
                  pressed && hasDrawn && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.actionButtonTextPrimary}>Review & Sign</Text>
              </Pressable>
            </View>
          </View>
        ) : confirmStep && !successStep ? (
          /* Step 2: Signature Preview & Final Confirmation */
          <View style={styles.confirmContainer}>
            <Text style={[styles.confirmHeaderTitle, { color: colors.text }]}>Confirm Your Signature</Text>
            <Text style={[styles.confirmHeaderSubtitle, { color: colors.muted }]}>
              Please verify your signature image before submitting.
            </Text>

            <View style={[styles.previewCard, { backgroundColor: isDark ? '#0f2338' : '#f8fafc', borderColor: colors.cardBorder }]}>
              {signatureData && (
                <Image
                  source={{ uri: signatureData }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}
            </View>

            {errorMessage && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.confirmActionsRow}>
              <Pressable
                onPress={() => setConfirmStep(false)}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.backStepButton,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.backStepText, { color: colors.text }]}>Redraw</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmSubmit}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: '#10b981' },
                  (pressed || isSubmitting) && { opacity: 0.85 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Submit Signature</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          /* Step 3: Success Confirmation Screen */
          <View style={styles.successContainer}>
            <View style={[styles.successIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5' }]}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>

            <Text style={[styles.successBadge, { color: '#059669', backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5' }]}>
              DIGITAL SIGNATURE RECORDED
            </Text>

            <Text style={[styles.successHeaderTitle, { color: colors.text }]}>
              Signature Embedded
            </Text>

            <Text style={[styles.successHeaderSubtitle, { color: colors.muted }]}>
              Your digital signature and device timestamp have been attached to this document.
            </Text>

            <View style={[styles.docSummaryCard, { backgroundColor: isDark ? '#0f2338' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]}>
              <View style={styles.docSummaryRow}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={[styles.docSummaryTitle, { color: colors.text }]} numberOfLines={1}>
                  {documentTitle}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
              <View style={styles.docSummaryMetaRow}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.muted }]}>Status</Text>
                  <View style={styles.statusBadge}>
                    <Ionicons name="time" size={12} color="#2563eb" />
                    <Text style={styles.statusBadgeText}>Pending Review</Text>
                  </View>
                </View>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.muted }]}>Time</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>Just now</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleModalClose}
              style={({ pressed }) => [
                styles.doneButton,
                { backgroundColor: '#10b981' },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="checkmark-done-sharp" size={20} color="#ffffff" />
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  modalBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  watermarkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionButtonTextPrimary: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmContainer: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  confirmHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmHeaderSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: -8,
  },
  previewCard: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    flex: 1,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  backStepButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backStepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  /* Step 3 Success Styles */
  successContainer: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  successBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  successHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successHeaderSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: -4,
  },
  docSummaryCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginVertical: 10,
  },
  docSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  docSummaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37,99,235,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  doneButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
