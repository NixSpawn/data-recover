import { useMemo, useState } from "react";
import type { DeletedFile, FileCategory } from "@/shared/types/common.types";

interface UseFileFilterState {
  filteredFiles: DeletedFile[];
  activeCategories: Set<FileCategory>;
  searchQuery: string;
  toggleCategory: (category: FileCategory) => void;
  setSearchQuery: (q: string) => void;
  clearFilters: () => void;
}

export function useFileFilter(files: DeletedFile[]): UseFileFilterState {
  const [activeCategories, setActiveCategories] = useState<Set<FileCategory>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFiles = useMemo(() => {
    let result = files;

    if (activeCategories.size > 0) {
      result = result.filter((f) => activeCategories.has(f.category));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || f.original_path.toLowerCase().includes(q)
      );
    }

    return result;
  }, [files, activeCategories, searchQuery]);

  const toggleCategory = (category: FileCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveCategories(new Set());
    setSearchQuery("");
  };

  return { filteredFiles, activeCategories, searchQuery, toggleCategory, setSearchQuery, clearFilters };
}
