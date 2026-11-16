export class FilterEngine {
  /**
   * Apply client-side filters when provider doesn't support them natively
   */
  static applyFilters<T extends Record<string, any>>(
    items: T[],
    filters: {
      q?: string;
      searchFields?: (keyof T)[];
      publishedAfter?: string;
      publishedBefore?: string;
      minDurationSeconds?: number;
      maxDurationSeconds?: number;
      limit?: number;
      offset?: number;
      sortBy?: keyof T;
      sortOrder?: 'asc' | 'desc';
    }
  ): { filtered: T[]; total: number } {
    let result = [...items];

    // 1. Keyword search
    if (filters.q && filters.searchFields && filters.searchFields.length > 0) {
      const qLower = filters.q.toLowerCase().trim();
      result = result.filter((item) =>
        filters.searchFields!.some((field) => {
          const val = item[field];
          if (typeof val === 'string') return val.toLowerCase().includes(qLower);
          return false;
        })
      );
    }

    // 2. Date filtering
    if (filters.publishedAfter) {
      const afterTime = new Date(filters.publishedAfter).getTime();
      result = result.filter((item) => {
        if (!item.published_at) return true;
        return new Date(item.published_at).getTime() >= afterTime;
      });
    }

    if (filters.publishedBefore) {
      const beforeTime = new Date(filters.publishedBefore).getTime();
      result = result.filter((item) => {
        if (!item.published_at) return true;
        return new Date(item.published_at).getTime() <= beforeTime;
      });
    }

    // 3. Duration filtering
    if (filters.minDurationSeconds !== undefined) {
      result = result.filter(
        (item) => (item.duration_seconds ?? 0) >= filters.minDurationSeconds!
      );
    }
    if (filters.maxDurationSeconds !== undefined) {
      result = result.filter(
        (item) => (item.duration_seconds ?? 0) <= filters.maxDurationSeconds!
      );
    }

    // 4. Sorting
    if (filters.sortBy) {
      const field = filters.sortBy;
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
        return 0;
      });
    }

    const total = result.length;

    // 5. Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit ? Math.min(filters.limit, 100) : result.length;
    result = result.slice(offset, offset + limit);

    return { filtered: result, total };
  }
}

