import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Typography } from '@/constants/theme';
import { BackgroundLogo } from '@/components/background-logo';
import { ProjectCard } from '@/components/projects/project-card';
import { apiRequest } from '@/lib/api';

interface ProjectItem {
  id: string;
  name: string;
  year: number;
  companyId: string;
  createdAt: string;
}

export default function ProjectsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedProjects = useCallback(async () => {
    try {
      setError(null);
      const res = await apiRequest('/projects/my-assigned');
      if (!res.ok) {
        throw new Error('Failed to load assigned projects');
      }
      const data = await res.json();
      const grouped = data?.data?.projectsByYear || {};
      
      // Flatten projects by year sorted desc
      const allProjects: ProjectItem[] = [];
      const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      years.forEach((yr) => {
        allProjects.push(...(grouped[yr] || []));
      });

      setProjects(allProjects);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch projects');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAssignedProjects();
    }, [fetchAssignedProjects])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignedProjects();
  };

  const handleProjectPress = useCallback((projectId: string) => {
    router.push({
      pathname: '/(app)/projects/[id]',
      params: { id: projectId },
    });
  }, [router]);

  const renderItem = useCallback(({ item }: { item: ProjectItem }) => {
    return (
      <ProjectCard
        id={item.id}
        name={item.name}
        year={item.year}
        onPress={() => handleProjectPress(item.id)}
      />
    );
  }, [handleProjectPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackgroundLogo />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Projects</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Assigned projects and safety compliance folders
          </Text>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Loading assigned projects...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Projects Assigned</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              You have not been assigned to any safety projects yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
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
  },
  title: {
    ...Typography.title1,
  },
  subtitle: {
    ...Typography.subheadline,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    ...Typography.subheadline,
    fontWeight: '600',
  },
  errorText: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyTitle: {
    ...Typography.headline,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.subheadline,
    textAlign: 'center',
    lineHeight: 20,
  },
});
