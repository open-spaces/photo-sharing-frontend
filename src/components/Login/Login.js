import React, { useState, useEffect } from 'react';
import './Login.css';
import { triggerGoogleLogin } from '../../utils/googleAuth';

export function Login({ onLogin, onGuestLogin, API }) {
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          process.env.REACT_APP_GOOGLE_CLIENT_ID ||
          '163092054167-svtia0dcjfaq3152kcr6leueiff6d6mk.apps.googleusercontent.com',
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError('');

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
        onLogin(data);
      } else {
        setError(data.detail || 'Google login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Programmatic trigger (can be called from outside or via button)
  const handleProgrammaticLogin = () => {
    setGoogleLoading(true);
    setError('');

    triggerGoogleLogin(
      (data) => {
        onLogin(data);
        setGoogleLoading(false);
      },
      (errorMsg) => {
        setError(errorMsg);
        setGoogleLoading(false);
      },
      API
    );
  };

  return (
    <div className="login-container">
      {/* floating warm orbs (decor only) */}
      <span aria-hidden className="orb orb-1" />
      <span aria-hidden className="orb orb-2" />
      <span aria-hidden className="orb orb-3" />

      <div className="login-box" role="dialog" aria-labelledby="login-title">
        <div className="login-header">
          <div className="brand-mark" aria-hidden>💍</div>
          <h1 id="login-title">Ariel &amp; Ya&apos;ara</h1>
          <p>Wedding Photo Sharing · Capture the night ✨</p>
        </div>

        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        <div className="google-wrap" id="google-signin-button" />

        {googleLoading && (
          <div className="google-loading">Signing in with Google…</div>
        )}

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="guest-btn"
          onClick={onGuestLogin}
          disabled={googleLoading}
          aria-label="Continue as Guest"
          title="Continue as Guest"
        >
          <span aria-hidden>🎉</span> Continue as Guest
        </button>

        <p className="guest-note">
          Guests can view photos and celebrate with us.
        </p>

        <div className="login-footer" aria-live="polite">
          Secure sign-in via Google. By continuing you agree to our{' '}
          <a className="link-btn" href="#" onClick={(e) => e.preventDefault()}>
            Terms
          </a>{' '}
          &amp;{' '}
          <a className="link-btn" href="#" onClick={(e) => e.preventDefault()}>
            Privacy
          </a>
          .
        </div>
      </div>
    </div>
  );
}
