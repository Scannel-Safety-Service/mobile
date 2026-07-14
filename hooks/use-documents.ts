import { useEffect, useCallback } from 'react';
import { useDocumentsStore } from '@/store/documents-store';
import { DocumentSection } from '@/types/document';

export function useDocuments(section: DocumentSection, categoryId?: string) {
  const { documents, isLoading, error, fetchDocuments } = useDocumentsStore();
  const key = `${section}_${categoryId || 'global'}`;
  const sectionDocs = documents[key] || [];

  const refetch = useCallback(async () => {
    await fetchDocuments(section, categoryId);
  }, [section, categoryId, fetchDocuments]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    documents: sectionDocs,
    isLoading,
    error,
    refetch,
  };
}
