import React, { useCallback } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { PREDEFINED_FOLDERS, FolderDefinition } from '@/constants/folders';
import { FolderCard } from '@/components/documents/folder-card';
import { BackgroundLogo } from '@/components/background-logo';

export default function DocumentsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDark = colorScheme === 'dark';

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Header */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 6,
    backgroundColor: 'transparent',
  },
  title: {
    ...Typography.title1,
  },
  subtitle: {
    ...Typography.subheadline,
    fontWeight: '500',
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  gridRow: {
    justifyContent: 'center',
    gap: 16,
  },
});
