import React, { useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { PREDEFINED_FOLDERS, FolderDefinition } from '@/constants/folders';
import { FolderCard } from '@/components/documents/folder-card';

export default function DocumentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Navigate to specific folder view
  const handleFolderPress = useCallback((sectionKey: string) => {
    router.push({
      pathname: '/(app)/documents/[section]',
      params: { section: sectionKey },
    });
  }, [router]);

  // Hoist renderItem callback to module scope or stabilize with useCallback
  const renderItem = useCallback(({ item }: { item: FolderDefinition }) => {
    return (
      <FolderCard
        label={item.label}
        iconName={item.icon}
        hasSubfolders={item.hasSubfolders}
        onPress={() => handleFolderPress(item.key)}
      />
    );
  }, [handleFolderPress]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Absolute Low Opacity Background Logo Icon */}
      <View style={styles.backgroundWrapper} pointerEvents="none">
        <Image
          source={require('@/assets/images/logo-icon.png')}
          style={styles.backgroundImage}
          contentFit="contain"
        />
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Safety Documents</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Browse categories and assigned certificates
        </Text>
      </View>

      <FlatList
        data={PREDEFINED_FOLDERS}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  backgroundImage: {
    width: '85%',
    height: '85%',
    opacity: 0.08, // Low opacity watermark look
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 4,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  gridContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
});
