import { supabase } from '@/integrations/supabase/client';

/**
 * Trusted Device Service
 * Manages trusted devices for users
 */

export interface TrustedDevice {
  id: string;
  deviceFingerprint: string;
  deviceName: string;
  trustedAt: string;
  lastUsedAt: string;
}

/**
 * Check if device is trusted
 */
export async function isDeviceTrusted(
  userId: string,
  deviceFingerprint: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('trusted_devices' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint)
      .maybeSingle();

    if (error) {
      console.error('Failed to check trusted device:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking trusted device:', error);
    return false;
  }
}

/**
 * Trust current device
 */
export async function trustCurrentDevice(
  userId: string,
  deviceFingerprint: string,
  deviceName: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trusted_devices' as any)
      .upsert({
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
        trusted_at: new Date().toISOString(),
        last_used_at: new Date().toISOString()
      } as any, {
        onConflict: 'user_id,device_fingerprint'
      });

    if (error) {
      console.error('Failed to trust device:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error trusting device:', error);
    return false;
  }
}

/**
 * Get user's trusted devices
 */
export async function getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
  try {
    const { data, error } = await supabase
      .from('trusted_devices' as any)
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch trusted devices:', error);
      return [];
    }

    return ((data || []) as any[]).map((d: any) => ({
      id: d.id,
      deviceFingerprint: d.device_fingerprint,
      deviceName: d.device_name,
      trustedAt: d.trusted_at,
      lastUsedAt: d.last_used_at
    }));
  } catch (error) {
    console.error('Error fetching trusted devices:', error);
    return [];
  }
}

/**
 * Revoke trust for a device
 */
export async function revokeTrustedDevice(deviceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trusted_devices' as any)
      .delete()
      .eq('id', deviceId);

    if (error) {
      console.error('Failed to revoke trusted device:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error revoking trusted device:', error);
    return false;
  }
}

/**
 * Update last used timestamp for device
 */
export async function updateDeviceLastUsed(
  userId: string,
  deviceFingerprint: string
): Promise<void> {
  try {
    await supabase
      .from('trusted_devices' as any)
      .update({ last_used_at: new Date().toISOString() } as any)
      .eq('user_id', userId)
      .eq('device_fingerprint', deviceFingerprint);
  } catch (error) {
    console.error('Error updating device last used:', error);
  }
}

/**
 * Generate device name from user agent
 */
export function generateDeviceName(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';

  // Extract browser
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Extract OS
  let os = '';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Android')) os = 'Android';

  return os ? `${browser} on ${os}` : browser;
}
