/**
 * Analytics and Tracking Configuration
 * Centralized management of all tracking events and analytics
 */

import { track } from '@vercel/analytics';

/**
 * Event name generators for consistent tracking
 */
export const trackingEvents = {
  // CTA events
  cta: {
    click: (protocol: string) => `${protocol}_cta_click`,
    hover: (protocol: string) => `${protocol}_cta_hover`,
    view: (protocol: string) => `${protocol}_cta_view`,
  },

  // Affiliate link events
  affiliate: {
    click: (platform: string, source?: string) =>
      source ? `affiliate_${platform}_from_${source}` : `affiliate_${platform}_click`,
    conversion: (platform: string) => `affiliate_${platform}_conversion`,
  },

  // Page view events
  page: {
    view: (page: string) => `page_view_${page}`,
    exit: (page: string) => `page_exit_${page}`,
    timeSpent: (page: string, seconds: number) => `page_time_${page}_${seconds}s`,
  },

  // Protocol interaction events
  protocol: {
    detailView: (protocol: string) => `protocol_detail_${protocol}`,
    compareView: (protocols: string[]) => `protocol_compare_${protocols.join('_')}`,
    filterApply: (filterType: string) => `filter_apply_${filterType}`,
    searchPerform: (query: string) => `search_${query.toLowerCase().replace(/\s+/g, '_')}`,
  },

  // User action events
  user: {
    emailSignup: () => 'email_signup',
    emailConfirm: () => 'email_confirm',
    shareClick: (platform: string) => `share_${platform}`,
    copyLink: () => 'copy_link',
  },

  // Error events
  error: {
    apiFailure: (endpoint: string) => `error_api_${endpoint}`,
    pageNotFound: (path: string) => `error_404_${path}`,
    clientError: (error: string) => `error_client_${error}`,
  },
} as const;

/**
 * Metadata types for tracking events
 */
export interface TrackingMetadata {
  protocol?: string;
  protocolId?: string;
  source?: string;
  destination?: string;
  value?: string | number;
  category?: string;
  label?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Main tracking function with metadata support
 */
export function trackEvent(
  eventName: string,
  metadata?: TrackingMetadata
): void {
  try {
    // Add timestamp if not provided
    const enrichedMetadata = {
      timestamp: Date.now(),
      ...metadata,
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Event: ${eventName}`, enrichedMetadata);
    }

    // Send to Vercel Analytics
    track(eventName, enrichedMetadata);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * Specialized tracking functions
 */
export const tracking = {
  // Track CTA clicks
  trackCtaClick(protocolId: string, metadata?: TrackingMetadata) {
    trackEvent(trackingEvents.cta.click(protocolId), {
      ...metadata,
      protocolId,
      type: 'primary_cta',
    });
  },

  // Track affiliate clicks
  trackAffiliateClick(
    platform: string,
    source?: string,
    metadata?: TrackingMetadata
  ) {
    trackEvent(trackingEvents.affiliate.click(platform, source), {
      ...metadata,
      platform,
      source,
      type: 'affiliate',
    });
  },

  // Track page views
  trackPageView(pageName: string, metadata?: TrackingMetadata) {
    trackEvent(trackingEvents.page.view(pageName), {
      ...metadata,
      page: pageName,
      type: 'page_view',
    });
  },

  // Track protocol detail views
  trackProtocolView(protocolId: string, metadata?: TrackingMetadata) {
    trackEvent(trackingEvents.protocol.detailView(protocolId), {
      ...metadata,
      protocolId,
      type: 'protocol_view',
    });
  },

  // Track search
  trackSearch(query: string, resultsCount: number, metadata?: TrackingMetadata) {
    trackEvent(trackingEvents.protocol.searchPerform(query), {
      ...metadata,
      query,
      resultsCount,
      type: 'search',
    });
  },

  // Track errors
  trackError(errorType: 'api' | 'client' | '404', details: string, metadata?: TrackingMetadata) {
    const eventName = errorType === 'api'
      ? trackingEvents.error.apiFailure(details)
      : errorType === '404'
      ? trackingEvents.error.pageNotFound(details)
      : trackingEvents.error.clientError(details);

    trackEvent(eventName, {
      ...metadata,
      errorType,
      details,
      type: 'error',
    });
  },
};

/**
 * Performance tracking utilities
 */
export const performanceTracking = {
  // Mark the start of an operation
  markStart(operationName: string): number {
    const startTime = typeof window !== 'undefined' ? window.performance.now() : Date.now();
    if (typeof window !== 'undefined') {
      window.performance.mark(`${operationName}_start`);
    }
    return startTime;
  },

  // Mark the end and track duration
  markEnd(operationName: string, startTime: number, metadata?: TrackingMetadata): void {
    const endTime = typeof window !== 'undefined' ? window.performance.now() : Date.now();
    const duration = Math.round(endTime - startTime);

    if (typeof window !== 'undefined') {
      window.performance.mark(`${operationName}_end`);
      window.performance.measure(
        operationName,
        `${operationName}_start`,
        `${operationName}_end`
      );
    }

    trackEvent(`performance_${operationName}`, {
      ...metadata,
      duration,
      type: 'performance',
    });
  },
};