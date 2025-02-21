import { Mixpanel } from 'mixpanel-react-native';
import { Platform } from 'react-native';

const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN || 'noop';

interface MixpanelProperties {
  [key: string]: string | number | boolean | null;
}

class MixpanelService {
  private static instance: MixpanelService;
  private mixpanel: Mixpanel;
  private initialized = false;

  private constructor() {
    this.mixpanel = new Mixpanel(MIXPANEL_TOKEN, false);
  }

  public static getInstance(): MixpanelService {
    if (!MixpanelService.instance) {
      MixpanelService.instance = new MixpanelService();
    }
    return MixpanelService.instance;
  }

  public async initialize() {
    if (this.initialized) return;

    try {
      await this.mixpanel.init();
      this.initialized = true;
      this.trackSystemProperties();
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
    }
  }

  private trackSystemProperties() {
    this.mixpanel.getPeople().set({
      'First Seen': new Date().toISOString(),
      Platform: Platform.OS,
      'Platform Version': Platform.Version,
      'App Version': process.env.APP_VERSION || '1.0.0',
    });
  }

  public identify(userId: string) {
    this.mixpanel.identify(userId);
  }

  public reset() {
    this.mixpanel.reset();
  }

  public track(eventName: string, properties?: MixpanelProperties) {
    this.mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  public setUserProperties(properties: MixpanelProperties) {
    this.mixpanel.getPeople().set(properties);
  }
}

export const mixpanel = MixpanelService.getInstance();
