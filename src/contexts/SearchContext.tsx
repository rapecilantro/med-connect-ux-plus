import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { searchReducer, SearchState, SearchAction, initialSearchState, SearchFilters } from '@/reducers/searchReducer';
// import { apiClient, SearchApiParams } from '@/lib/api-client';
import { rxApiClient } from '@/lib/rxApiClient';

interface SearchContextProps {
  searchState: SearchState;
  dispatch: React.Dispatch<SearchAction>;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  performSearch: (searchParams: SearchFilters, loadMore: boolean) => Promise<void>;
  loadMoreResults: () => Promise<void>;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchState, dispatch] = useReducer(searchReducer, initialSearchState);
  const { filters, pagination } = searchState;

  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, [dispatch]);

  const performSearch = useCallback(async (searchParams: SearchFilters, loadMore: boolean) => {
    // Guard against concurrent searches
    if (searchState.isLoading) {
      console.log('[SearchContext] Ignoring performSearch: request already in progress');
      return;
    }

    if (!loadMore) {
      dispatch({ type: 'SEARCH_REQUEST' });
    }

    try {
      // One explicit call to external API; no pagination support (nextCursor=null)
      const results = await rxApiClient.searchProviders(searchParams);

      dispatch({
        type: loadMore ? 'SEARCH_MORE_SUCCESS' : 'SEARCH_SUCCESS',
        payload: {
          results: results.data,
          pagination: {
            nextCursor: results.nextCursor,
            totalCount: results.totalCount,
          },
        },
      });
    } catch (error: any) {
      dispatch({ type: 'SEARCH_FAILURE', payload: error });
    }
  }, [dispatch, searchState.isLoading]);

  const loadMoreResults = useCallback(async () => {
    // No cursor-based pagination for external API; this becomes a no-op
    if (!pagination.nextCursor || searchState.isLoading) return;

    dispatch({ type: 'SEARCH_REQUEST' });

    try {
      const nextParams: SearchFilters = {
        ...filters,
        cursor: pagination.nextCursor,
      };

      // Fix TypeScript error by ensuring drugName is not undefined
      const apiParams = {
        drugName: nextParams.drugName || '', // Ensure drugName is not undefined
        zipCode: nextParams.zipCode || '',
        locationName: nextParams.locationName,
        radiusMiles: nextParams.radius,
        minClaims: nextParams.minClaims,
        taxonomyClass: nextParams.taxonomyClass,
        sortBy: nextParams.sortBy,
        acceptedInsurance: nextParams.acceptedInsurance,
        minRating: nextParams.minRating,
        cursor: nextParams.cursor,
        limit: 10,
        token: nextParams.token
      };

      // const results = await apiClient.findProviders(apiParams, nextParams.token);
      const results = {
        data: [],
        nextCursor: null,
        totalCount: 0,
      };

      dispatch({
        type: 'SEARCH_MORE_SUCCESS',
        payload: {
          results: results.data,
          pagination: {
            nextCursor: results.nextCursor,
            totalCount: results.totalCount,
          },
        },
      });
    } catch (error: any) {
      dispatch({ type: 'SEARCH_FAILURE', payload: error });
    }
  }, [dispatch, searchState.isLoading, pagination.nextCursor, filters]);

  const value: SearchContextProps = {
    searchState,
    dispatch,
    updateFilters,
    performSearch,
    loadMoreResults,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextProps => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
