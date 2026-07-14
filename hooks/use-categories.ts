import { useEffect, useCallback } from 'react';
import { useDocumentsStore } from '@/store/documents-store';
import { DocumentSection } from '@/types/document';

export function useCategories(section: DocumentSection) {
  const { categories, isLoading, error, fetchCategories } = useDocumentsStore();
  const sectionCategories = categories[section] || [];

  const refetch = useCallback(async () => {
    if (!section) return;
    await fetchCategories(section);
  }, [section, fetchCategories]);

  useEffect(() => {
    if (section) {
      refetch();
    }
  }, [refetch, section]);

  return {
    categories: sectionCategories,
    isLoading,
    error,
    refetch,
  };
}
