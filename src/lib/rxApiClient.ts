import { Provider } from '@/lib/supabase';
import { SearchFilters } from '@/reducers/searchReducer';

const BASE_URL = 'https://api.rxprescribers.com';

// Simple in-flight request deduper keyed by full URL (prevents duplicate concurrent calls)
const inflight = new Map<string, Promise<any>>();

async function fetchJson(url: string): Promise<any> {
  if (inflight.has(url)) {
    return inflight.get(url)!;
  }
  const p = fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Request failed ${res.status}: ${text || res.statusText}`);
      }
      return res.json();
    })
    .finally(() => {
      inflight.delete(url);
    });

  inflight.set(url, p);
  return p;
}

function buildUrl(path: string, params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) qs.set(k, String(v));
  });
  const url = `${BASE_URL}${path}${qs.toString() ? `?${qs.toString()}` : ''}`;
  return url;
}

// Map API "prescriber" to our Provider type (minimal fields used by UI)
function mapToProvider(p: any): Provider {
  const city = p?.address?.city || '';
  const state = p?.address?.state || '';
  const name: string = p?.name || '';
  const npi: string = String(p?.npi || '');

  return {
    // Required/common fields used across UI:
    id: npi || `${name}-${city}-${state}`.replace(/\s+/g, '-'),
    npi,
    name,
    first_name: undefined,
    last_name: undefined,
    title: undefined,
    specialties: p?.specialty ? [p.specialty] : [],
    city,
    state,
    location: city && state ? `${city}, ${state}` : city || state || '',
    rating: undefined,
    review_count: 0,
    image_url: undefined,
    availability: undefined,

    // Keep any additional fields that may exist in your Provider model as undefined or sensible defaults
    // ... You can extend this mapping later if needed.
  } as Provider;
}

async function searchProviders(filters: SearchFilters): Promise<{
  data: Provider[];
  nextCursor: null;
  totalCount: number;
}> {
  const radius = filters.radius ?? 25;

  // Determine which endpoint to hit
  // - If taxonomyClass present -> use enhanced class search
  // - Else use drug name search
  const isClassSearch = Boolean(filters.taxonomyClass && String(filters.taxonomyClass).length > 0);

  // Validate essentials (API expects zip for geo search)
  if (!filters.zipCode || (filters.zipCode && String(filters.zipCode).trim().length === 0)) {
    console.warn('rxApiClient.searchProviders: zipCode is missing; returning empty results.');
    return { data: [], nextCursor: null, totalCount: 0 };
  }

  const params: Record<string, string | number | undefined> = {
    zip: filters.zipCode,
    radius,
  };

  let path = '/api.php';

  if (isClassSearch) {
    // Enhanced class search
    // Use taxonomyClass as the "drug_class" for this implementation
    path = '/api_enhanced_fixed.php';
    params['drug_class'] = String(filters.taxonomyClass);
  } else {
    // Drug name search
    params['drug'] = String(filters.drugName || '').trim();
  }

  const url = buildUrl(path, params);
  console.log('[rxApiClient] GET', url);

  const json = await fetchJson(url);
  const total = Number(json?.results_count ?? 0);
  const prescribers: any[] = Array.isArray(json?.prescribers) ? json.prescribers : [];

  const providers: Provider[] = prescribers.map(mapToProvider);

  return {
    data: providers,
    nextCursor: null, // No cursor pagination from this API
    totalCount: Number.isFinite(total) ? total : providers.length,
  };
}

async function getDrugCategories(): Promise<any> {
  const url = buildUrl('/drug_categories.php', {});
  console.log('[rxApiClient] GET', url);
  return fetchJson(url);
}

export const rxApiClient = {
  searchProviders,
  getDrugCategories,
};
