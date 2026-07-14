import { create } from 'zustand';
import { apiRequest } from '@/lib/api';
import { Document, DocumentSection } from '@/types/document';
import { Category } from '@/types/category';

interface DocumentsState {
  documents: Record<string, Document[]>; // key: `${section}_${categoryId || 'global'}`
  categories: Record<string, Category[]>; // key: section
  isLoading: boolean;
  error: string | null;

  fetchCategories: (section: DocumentSection) => Promise<void>;
  fetchDocuments: (section: DocumentSection, categoryId?: string) => Promise<void>;
  clearError: () => void;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: {},
  categories: {},
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCategories: async (section: DocumentSection) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiRequest(`/categories?section=${section}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch categories');
      }

      set((state) => ({
        categories: {
          ...state.categories,
          [section]: result.data || [],
        },
        isLoading: false,
      }));
    } catch (err: any) {
      console.error(`Error fetching categories for ${section}:`, err);
      set({ error: err.message || 'Error loading categories', isLoading: false });
    }
  },

  fetchDocuments: async (section: DocumentSection, categoryId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let url = `/documents?section=${section}`;
      if (categoryId) {
        url += `&categoryId=${categoryId}`;
      }

      const response = await apiRequest(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch documents');
      }

      // Check if result has paging structure: { items: Document[], meta: ... } or just array/items
      let docsList: Document[] = [];
      if (result.data) {
        if (Array.isArray(result.data)) {
          docsList = result.data;
        } else if (result.data.items && Array.isArray(result.data.items)) {
          docsList = result.data.items;
        }
      }

      const key = `${section}_${categoryId || 'global'}`;
      set((state) => ({
        documents: {
          ...state.documents,
          [key]: docsList,
        },
        isLoading: false,
      }));
    } catch (err: any) {
      console.error(`Error fetching documents for ${section} (category: ${categoryId}):`, err);
      set({ error: err.message || 'Error loading documents', isLoading: false });
    }
  },
}));
