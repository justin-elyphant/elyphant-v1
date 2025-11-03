/**
 * Session Fingerprinting Service
 * Creates unique device fingerprints for session tracking
 * Does NOT track personal information - only technical device characteristics
 */

export interface DeviceFingerprint {
  hash: string;
  raw: {
    userAgent: string;
    language: string;
    timezone: string;
    screenResolution: string;
    colorDepth: number;
    platform: string;
    touchSupport: boolean;
    cpuCores: number;
  };
}

export class SessionFingerprintService {
  /**
   * Generate device fingerprint hash
   */
  static async generateFingerprint(): Promise<DeviceFingerprint> {
    const raw = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      platform: navigator.platform,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      cpuCores: navigator.hardwareConcurrency || 0,
    };

    // Create fingerprint string
    const fingerprintString = [
      raw.userAgent,
      raw.language,
      raw.timezone,
      raw.screenResolution,
      raw.colorDepth.toString(),
      raw.platform,
      raw.touchSupport.toString(),
      raw.cpuCores.toString(),
    ].join('|');

    // Generate SHA-256 hash
    const hash = await this.hashString(fingerprintString);

    return {
      hash,
      raw,
    };
  }

  /**
   * Generate SHA-256 hash of a string
   */
  private static async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Get human-readable device description
   */
  static getDeviceDescription(fingerprint: DeviceFingerprint): string {
    const { raw } = fingerprint;
    
    // Extract browser name
    let browser = 'Unknown Browser';
    if (raw.userAgent.includes('Chrome') && !raw.userAgent.includes('Edg')) {
      browser = 'Chrome';
    } else if (raw.userAgent.includes('Safari') && !raw.userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (raw.userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (raw.userAgent.includes('Edg')) {
      browser = 'Edge';
    }

    // Extract OS
    let os = 'Unknown OS';
    if (raw.userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (raw.userAgent.includes('Mac')) {
      os = 'macOS';
    } else if (raw.userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (raw.userAgent.includes('Android')) {
      os = 'Android';
    } else if (raw.userAgent.includes('iOS') || raw.userAgent.includes('iPhone') || raw.userAgent.includes('iPad')) {
      os = 'iOS';
    }

    // Device type
    const deviceType = raw.touchSupport && raw.screenResolution.includes('x') 
      && parseInt(raw.screenResolution.split('x')[0]) < 768
      ? 'Mobile'
      : 'Desktop';

    return `${browser} on ${os} (${deviceType})`;
  }

  /**
   * Compare two fingerprints to see if they match
   */
  static fingerprintsMatch(fp1: string, fp2: string): boolean {
    return fp1 === fp2;
  }

  /**
   * Get location from browser (timezone-based, approximate)
   */
  static getApproximateLocation(): { timezone: string; region?: string } {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Extract region from timezone (e.g., "America/New_York" -> "America")
    const region = timezone.split('/')[0];
    
    return { timezone, region };
  }
}
