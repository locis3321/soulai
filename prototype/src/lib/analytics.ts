// Analytics tracking for SoulAI
// This module handles event tracking for user interactions

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    // Initialize analytics
    this.loadEvents();
  }

  private loadEvents() {
    try {
      const saved = localStorage.getItem("soul_analytics");
      if (saved) {
        this.events = JSON.parse(saved);
      }
    } catch (error) {
      console.warn("Failed to load analytics events:", error);
      this.events = [];
    }
  }

  private saveEvents() {
    try {
      localStorage.setItem("soul_analytics", JSON.stringify(this.events));
    } catch (error) {
      console.warn("Failed to save analytics events:", error);
    }
  }

  track(name: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date()
    };

    this.events.push(event);
    this.saveEvents();

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Analytics Event:", event);
    }

    // In production, you would send this to your analytics service
    // this.sendToAnalyticsService(event);
  }

  // Track page views
  trackPageView(page: string) {
    this.track("page_view", { page });
  }

  // Track user interactions
  trackInteraction(component: string, action: string, details?: Record<string, any>) {
    this.track("interaction", {
      component,
      action,
      ...details
    });
  }

  // Track feature usage
  trackFeatureUsage(feature: string, action: string, details?: Record<string, any>) {
    this.track("feature_usage", {
      feature,
      action,
      ...details
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    this.track("error", {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }

  // Track AI interactions
  trackAiInteraction(advisor: string, messageType: string, details?: Record<string, any>) {
    this.track("ai_interaction", {
      advisor,
      messageType,
      ...details
    });
  }

  // Track divination usage
  trackDivination(type: string, action: string, details?: Record<string, any>) {
    this.track("divination", {
      type,
      action,
      ...details
    });
  }

  // Track healing activities
  trackHealing(activity: string, action: string, details?: Record<string, any>) {
    this.track("healing", {
      activity,
      action,
      ...details
    });
  }

  // Track onboarding steps
  trackOnboarding(step: string, action: string, details?: Record<string, any>) {
    this.track("onboarding", {
      step,
      action,
      ...details
    });
  }

  // Track paywall interactions
  trackPaywall(action: string, details?: Record<string, any>) {
    this.track("paywall", {
      action,
      ...details
    });
  }

  // Get all events (for debugging)
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear events
  clearEvents() {
    this.events = [];
    this.saveEvents();
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Get event count
  getEventCount(): number {
    return this.events.length;
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export class for custom instances
export { Analytics };
