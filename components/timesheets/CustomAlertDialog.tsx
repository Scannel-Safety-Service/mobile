import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react-native';

export interface CustomAlertState {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

interface CustomAlertDialogProps {
  customAlert: CustomAlertState;
  setCustomAlert: React.Dispatch<React.SetStateAction<CustomAlertState>>;
  colors: any;
  isDark: boolean;
}

export const CustomAlertDialog: React.FC<CustomAlertDialogProps> = ({
  customAlert,
  setCustomAlert,
  colors,
  isDark,
}) => {
  return (
    <Modal
      visible={customAlert.visible}
      transparent
      animationType="fade"
      onRequestClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
    >
      <View style={styles.dialogOverlay}>
        <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            {customAlert.type === 'success' && (
              <View
                style={[
                  styles.dialogIconBadge,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ecfdf5', borderColor: '#10b981' },
                ]}
              >
                <CheckCircle2 size={28} color="#10b981" />
              </View>
            )}
            {customAlert.type === 'error' && (
              <View
                style={[
                  styles.dialogIconBadge,
                  { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#fef2f2', borderColor: '#ef4444' },
                ]}
              >
                <AlertCircle size={28} color="#ef4444" />
              </View>
            )}
            {(customAlert.type === 'warning' || customAlert.type === 'confirm') && (
              <View
                style={[
                  styles.dialogIconBadge,
                  { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#fffbeb', borderColor: '#f59e0b' },
                ]}
              >
                <AlertTriangle size={28} color="#f59e0b" />
              </View>
            )}
            {customAlert.type === 'info' && (
              <View
                style={[
                  styles.dialogIconBadge,
                  { backgroundColor: isDark ? 'rgba(86,185,255,0.2)' : '#e0f2fe', borderColor: colors.primary },
                ]}
              >
                <AlertCircle size={28} color={colors.primary} />
              </View>
            )}
          </View>

          <Text style={[styles.dialogTitle, { color: colors.text }]}>{customAlert.title}</Text>
          <Text style={[styles.dialogMessage, { color: colors.muted }]}>{customAlert.message}</Text>

          <View style={styles.dialogActionsRow}>
            {customAlert.cancelText && (
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCustomAlert((prev) => ({ ...prev, visible: false }));
                }}
              >
                <Text style={[styles.dialogCancelText, { color: colors.text }]}>
                  {customAlert.cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.dialogBtn,
                { backgroundColor: customAlert.type === 'confirm' ? '#ef4444' : colors.primary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const callback = customAlert.onConfirm;
                setCustomAlert((prev) => ({ ...prev, visible: false }));
                if (callback) callback();
              }}
            >
              <Text style={styles.dialogConfirmText}>{customAlert.confirmText || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  dialogIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelBtn: {
    borderWidth: 1,
  },
  dialogConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  dialogCancelText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
