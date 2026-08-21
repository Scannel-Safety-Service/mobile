import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Upload, Camera, FileText, Trash2 } from 'lucide-react-native';
import { Typography } from '@/constants/theme';

export interface AttachmentItemData {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface AttachmentsSectionProps {
  attachments: AttachmentItemData[];
  handleTakePhoto: () => void;
  handleUploadFile: () => void;
  removeAttachment: (index: number) => void;
  colors: any;
  isDark: boolean;
}

export const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  attachments,
  handleTakePhoto,
  handleUploadFile,
  removeAttachment,
  colors,
  isDark,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Is There Something You Need to Send? (Optional)
      </Text>
      <Text style={[styles.sectionSub, { color: colors.muted, marginBottom: 14 }]}>
        Worker can either upload a file or take a picture in this section
      </Text>

      {/* Upload Drop Zone / Action Buttons */}
      <View
        style={[
          styles.uploadBox,
          { borderColor: colors.primary, backgroundColor: isDark ? '#0c1f35' : '#f8fafc' },
        ]}
      >
        <Upload size={28} color={colors.primary} style={{ marginBottom: 8 }} />
        <Text style={[styles.uploadBoxTitle, { color: colors.text }]}>Add a File or Photo</Text>
        <Text style={[styles.uploadBoxSub, { color: colors.muted, marginBottom: 14 }]}>
          Tap an option below to attach receipts or documents
        </Text>

        <View style={styles.uploadActionsRow}>
          <TouchableOpacity
            onPress={handleTakePhoto}
            style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
          >
            <Camera size={16} color="#ffffff" />
            <Text style={styles.uploadBtnText}>Take Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleUploadFile}
            style={[styles.uploadBtnOutline, { borderColor: colors.primary }]}
          >
            <FileText size={16} color={colors.primary} />
            <Text style={[styles.uploadBtnOutlineText, { color: colors.primary }]}>
              Browse File
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <View style={styles.attachmentsList}>
          {attachments.map((att, i) => (
            <View
              key={i}
              style={[
                styles.attachmentItem,
                { borderColor: colors.cardBorder, backgroundColor: isDark ? '#081729' : '#ffffff' },
              ]}
            >
              <View style={styles.attachmentLeft}>
                {att.type.startsWith('image/') ? (
                  <Image source={{ uri: att.uri }} style={styles.attThumbnail} />
                ) : (
                  <View style={[styles.attIconWrap, { backgroundColor: isDark ? '#0c1f35' : '#f1f5f9' }]}>
                    <FileText size={18} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attName, { color: colors.text }]} numberOfLines={1}>
                    {att.name}
                  </Text>
                  {att.size && (
                    <Text style={[styles.attSize, { color: colors.muted }]}>
                      {(att.size / 1024).toFixed(1)} KB
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => removeAttachment(i)}
                style={styles.attRemoveBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    ...Typography.headline,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    ...Typography.footnote,
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  uploadBoxSub: {
    fontSize: 12,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  uploadBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  uploadBtnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
  },
  attachmentsList: {
    marginTop: 12,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  attIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attName: {
    fontSize: 13,
    fontWeight: '600',
  },
  attSize: {
    fontSize: 11,
    marginTop: 1,
  },
  attRemoveBtn: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
