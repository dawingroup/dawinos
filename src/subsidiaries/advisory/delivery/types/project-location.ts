/**
 * PROJECT LOCATION TYPES
 * 
 * Geographic and site information for infrastructure projects.
 */

// ─────────────────────────────────────────────────────────────────
// COORDINATES
// ─────────────────────────────────────────────────────────────────

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

// ─────────────────────────────────────────────────────────────────
// NETWORK COVERAGE
// ─────────────────────────────────────────────────────────────────

export type NetworkCoverage = 'none' | 'poor' | 'moderate' | 'good' | 'excellent';

// ─────────────────────────────────────────────────────────────────
// PROJECT LOCATION
// ─────────────────────────────────────────────────────────────────

export interface ProjectLocation {
  // Geographic hierarchy (Uganda-specific)
  country: string;
  region: string;
  district: string;
  subcounty?: string;
  parish?: string;
  village?: string;
  
  // Site details
  siteName: string;
  siteAddress?: string;
  
  // Coordinates
  coordinates?: GeoCoordinates;
  
  // Access information
  accessNotes?: string;
  nearestTown?: string;
  distanceFromTown?: number;
  
  // Connectivity
  networkCoverage?: NetworkCoverage;
  hasElectricity: boolean;
  hasWaterSupply: boolean;
}

// ─────────────────────────────────────────────────────────────────
// UGANDA REGIONS
// ─────────────────────────────────────────────────────────────────

export const UGANDA_REGIONS = [
  'Central Region',
  'Eastern Region',
  'Northern Region',
  'Western Region',
] as const;

export type UgandaRegion = typeof UGANDA_REGIONS[number];

// ─────────────────────────────────────────────────────────────────
// UGANDA DISTRICTS BY REGION
// ─────────────────────────────────────────────────────────────────

export const UGANDA_DISTRICTS: Record<UgandaRegion, string[]> = {
  'Central Region': [
    'Buikwe', 'Bukomansimbi', 'Butambala', 'Buvuma', 'Gomba', 'Kalangala',
    'Kalungu', 'Kampala', 'Kayunga', 'Kiboga', 'Kyankwanzi', 'Luweero',
    'Lwengo', 'Lyantonde', 'Masaka', 'Mityana', 'Mpigi', 'Mubende',
    'Mukono', 'Nakaseke', 'Nakasongola', 'Rakai', 'Sembabule', 'Wakiso',
  ],
  'Eastern Region': [
    'Amuria', 'Budaka', 'Bududa', 'Bugiri', 'Bukedea', 'Bukwa', 'Bulambuli',
    'Busia', 'Butaleja', 'Buyende', 'Iganga', 'Jinja', 'Kaberamaido',
    'Kaliro', 'Kamuli', 'Kapchorwa', 'Katakwi', 'Kibuku', 'Kumi', 'Kween',
    'Luuka', 'Manafwa', 'Mayuge', 'Mbale', 'Namayingo', 'Namutumba',
    'Ngora', 'Pallisa', 'Serere', 'Sironko', 'Soroti', 'Tororo',
  ],
  'Northern Region': [
    'Abim', 'Adjumani', 'Agago', 'Alebtong', 'Amolatar', 'Amudat', 'Amuru',
    'Apac', 'Arua', 'Dokolo', 'Gulu', 'Kaabong', 'Kitgum', 'Koboko',
    'Kole', 'Kotido', 'Lamwo', 'Lira', 'Maracha', 'Moroto', 'Moyo',
    'Nakapiripirit', 'Napak', 'Nebbi', 'Nwoya', 'Otuke', 'Oyam', 'Pader',
    'Yumbe', 'Zombo',
  ],
  'Western Region': [
    'Buhweju', 'Buliisa', 'Bundibugyo', 'Bushenyi', 'Hoima', 'Ibanda',
    'Isingiro', 'Kabale', 'Kabarole', 'Kamwenge', 'Kanungu', 'Kasese',
    'Kibaale', 'Kiruhura', 'Kiryandongo', 'Kisoro', 'Kyegegwa', 'Kyenjojo',
    'Masindi', 'Mbarara', 'Mitooma', 'Ntoroko', 'Ntungamo', 'Rubirizi',
    'Rukungiri', 'Sheema',
  ],
};

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get districts for a region
 */
export function getDistrictsForRegion(region: UgandaRegion): string[] {
  return UGANDA_DISTRICTS[region] || [];
}

/**
 * Format location for display
 */
export function formatLocationDisplay(location: ProjectLocation): string {
  const parts = [location.siteName];
  if (location.district) parts.push(location.district);
  if (location.region) parts.push(location.region);
  return parts.join(', ');
}

/**
 * Format short location
 */
export function formatShortLocation(location: ProjectLocation): string {
  return `${location.siteName}, ${location.district}`;
}

/**
 * Get network coverage label
 */
export function getNetworkCoverageLabel(coverage: NetworkCoverage): string {
  const labels: Record<NetworkCoverage, string> = {
    none: 'No Coverage',
    poor: 'Poor',
    moderate: 'Moderate',
    good: 'Good',
    excellent: 'Excellent',
  };
  return labels[coverage];
}

/**
 * Initialize default location
 */
export function getDefaultLocation(): ProjectLocation {
  return {
    country: 'Uganda',
    region: '',
    district: '',
    siteName: '',
    hasElectricity: false,
    hasWaterSupply: false,
  };
}
