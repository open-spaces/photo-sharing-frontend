/**
 * Google Authentication Utility
 * Provides a reusable way to trigger Google One Tap login across the app
 */

/**
 * Triggers Google One Tap login programmatically
 * @param {Function} onSuccess - Callback function when login succeeds, receives user data
 * @param {Function} onError - Callback function when login fails, receives error message
 * @param {string} API - API base URL
 */
export const triggerGoogleLogin = (onSuccess, onError, API) => {
  if (!window.google) {
    onError?.('Google Sign-In is not available. Please refresh the page.');
    return;
  }

  // Initialize Google One Tap if not already initialized
  window.google.accounts.id.initialize({
    client_id:
      process.env.REACT_APP_GOOGLE_CLIENT_ID ||
      '163092054167-svtia0dcjfaq3152kcr6leueiff6d6mk.apps.googleusercontent.com',
    callback: async (response) => {
      try {
        const result = await fetch(`${API}/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.credential }),
        });

        const data = await result.json();

        if (result.ok) {
          localStorage.setItem('authToken', data.access_token);
          localStorage.setItem('username', data.username);
          onSuccess?.(data);
        } else {
          onError?.(data.detail || 'Google login failed');
        }
      } catch (err) {
        onError?.('Network error. Please try again.');
      }
    },
  });

  // Trigger the One Tap prompt
  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // If One Tap doesn't show, fall back to the popup
      window.google.accounts.id.renderButton(
        document.createElement('div'),
        {
          theme: 'outline',
          size: 'large',
        }
      );
    }
  });
};
