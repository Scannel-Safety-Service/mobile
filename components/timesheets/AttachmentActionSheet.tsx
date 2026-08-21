import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Camera, Upload, FileText, X } from 'lucide-react-native';

interface AttachmentActionSheetProps {
  isAttachmentSheetVisible: boolean;
  setIsAttachmentSheetVisible: (visible: boolean) => void;
  handleTakePhoto: () => void;
  handlePickImageFromLibrary: () => void;
  handlePickDocument: () => void;
  colors: any;
  isDark: boolean;
}

export const AttachmentActionSheet: React.FC<AttachmentActionSheetProps> = ({
  isAttachmentSheetVisible,
  setIsAttachmentSheetVisible,
  handleTakePhoto,
  handlePickImageFromLibrary,
  handlePickDocument,
  colors,
  isDark,
}) => {
  return (
    <Modal
      visible={isAttachmentSheetVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsAttachmentSheetVisible(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setIsAttachmentSheetVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.projectModalCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.grabHandleWrap}>
            <View style={[styles.grabHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
          </View>

          <View style={styles.projectModalHeader}>
            <Text style={[styles.projectModalTitle, { color: colors.text }]}>Add Attachment</Text>
            <TouchableOpacity onPress={() => setIsAttachmentSheetVisible(false)} style={styles.closeBtn}>
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionOptionItem, { borderBottomColor: isDark ? '#0f2740' : '#f1f5f9' }]}
            onPress={() => {
              setIsAttachmentSheetVisible(false);
              handleTakePhoto();
            }}
          >
            <View
              style={[
                styles.actionOptionIcon,
                { backgroundColor: isDark ? 'rgba(86,185,255,0.15)' : '#e0f2fe' },
              ]}
            >
              <Camera size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionOptionTitle, { color: colors.text }]}>Take Photo</Text>
              <Text style={[styles.actionOptionSub, { color: colors.muted }]}>
                Capture invoice or site photo using camera
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionOptionItem, { borderBottomColor: isDark ? '#0f2740' : '#f1f5f9' }]}
            onPress={() => {
              setIsAttachmentSheetVisible(false);
              handlePickImageFromLibrary();
            }}
          >
            <View
              style={[
                styles.actionOptionIcon,
                { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7' },
              ]}
            >
              <Upload size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionOptionTitle, { color: colors.text }]}>Photo Library</Text>
              <Text style={[styles.actionOptionSub, { color: colors.muted }]}>
                Choose image from photo gallery
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionOptionItem, { borderBottomColor: 'transparent' }]}
            onPress={() => {
              setIsAttachmentSheetVisible(false);
              handlePickDocument();
            }}
          >
            <View
              style={[
                styles.actionOptionIcon,
                { backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff' },
              ]}
            >
              <FileText size={20} color="#a855f7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionOptionTitle, { color: colors.text }]}>Document File</Text>
              <Text style={[styles.actionOptionSub, { color: colors.muted }]}>
                Select PDF or document file
              </Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  projectModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  grabHandleWrap: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  projectModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  projectModalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  actionOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionOptionSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
