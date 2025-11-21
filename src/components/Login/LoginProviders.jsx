import React, { useEffect, useRef, useState } from "react";

/**
 * Renders the official Google button via Google Identity Services (GIS)
 * and a Guest button. On success, calls onGoogleToken(credential).
 */
export default function LoginProviders({ onGoogleToken, onGuest }) {
  const btnRef = useRef(null);
  const [initError, setInitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadGIS = () =>
      new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve();
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.async = true;
        s.defer = true;
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load Google script"));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        await loadGIS();
        if (cancelled) return;

        const clientId =
          process.env.REACT_APP_GOOGLE_CLIENT_ID ||
          "163092054167-svtia0dcjfaq3152kcr6leueiff6d6mk.apps.googleusercontent.com";

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp) => {
            if (resp?.credential) {
              onGoogleToken?.(resp.credential);
            }
          },
        });

        if (btnRef.current) {
          // Stable, official button (prevents size jitter)
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            width: "100%",
            logo_alignment: "left",
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setInitError("Google sign-in unavailable right now.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onGoogleToken]);

  return (
    <div className="providers">
      {/* Google button mount point */}
      <div
        ref={btnRef}
        className="gis-btn-wrap"
        style={{
          height: 48,              // fixes layout jumps
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
        aria-label="Continue with Google"
      />
      {initError && (
        <div className="login-error" role="alert" style={{ marginTop: 8 }}>
          {initError}
        </div>
      )}

      <button className="btn btn-guest" onClick={onGuest}>
        <span>Continue as Guest</span>
      </button>
    </div>
  );
}
