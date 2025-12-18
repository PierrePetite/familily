interface PushoverMessage {
  appToken: string;
  userKey: string;
  title: string;
  message: string;
  url?: string;
  urlTitle?: string;
  priority?: -2 | -1 | 0 | 1 | 2; // -2 lowest, 2 emergency
  sound?: string;
}

interface PushoverResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a notification via Pushover API
 */
export async function sendPushoverNotification(
  params: PushoverMessage
): Promise<PushoverResult> {
  try {
    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: params.appToken,
        user: params.userKey,
        title: params.title,
        message: params.message,
        ...(params.url && { url: params.url }),
        ...(params.urlTitle && { url_title: params.urlTitle }),
        ...(params.priority !== undefined && { priority: params.priority.toString() }),
        ...(params.sound && { sound: params.sound }),
      }),
    });

    const data = await response.json();

    if (response.ok && data.status === 1) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.errors?.join(', ') || 'Unbekannter Fehler',
      };
    }
  } catch (error) {
    console.error('Pushover API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Netzwerkfehler',
    };
  }
}

/**
 * Validates a Pushover User Key by sending a validation request
 */
export async function validatePushoverUserKey(
  appToken: string,
  userKey: string
): Promise<PushoverResult> {
  try {
    const response = await fetch('https://api.pushover.net/1/users/validate.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: appToken,
        user: userKey,
      }),
    });

    const data = await response.json();

    if (response.ok && data.status === 1) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.errors?.join(', ') || 'Ungültiger User Key',
      };
    }
  } catch (error) {
    console.error('Pushover validation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Netzwerkfehler',
    };
  }
}
