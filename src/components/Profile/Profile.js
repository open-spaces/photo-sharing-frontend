import React, { useRef, useEffect, useState } from "react";
import "./Profile.css";

import ProfileImage from "../../assets/images/proposal-image.png";
import { triggerGoogleLogin as triggerGoogleLoginUtil } from "../../utils/googleAuth";

/**
 * A warm, accessible profile header that nudges users to share,
 * with friendly, dismissible toasts and a readable, expandable BIO.
 */
export function Profile({
  imageCount,
  guestCount,
  setImageCount,
  fetchImages,
  API,
  uploadError,
  setUploadError,
  user,
  onLogout,
  isGuest,
  onLogin,
  activeTab,
  onTabChange,
  selectedPerson,
  onBackToFaces
  }) {
  const fileInput = useRef(null);
  const imgRef = useRef(null);

  const [showFullBio, setShowFullBio] = useState(false);
  const [localToast, setLocalToast] = useState("");

  const triggerGoogleLogin = () => {
    triggerGoogleLoginUtil(
      (data) => {
        // Success callback - call parent's onLogin handler
        onLogin(data);
        setLocalToast("Welcome! You're now signed in.");
      },
      (error) => {
        // Error callback - show error message
        setUploadError(error || "Google login failed. Please try again.");
      },
      API
    );
  };

  const handleUploadClick = () => {
    if (isGuest) {
      triggerGoogleLogin();
      return;
    }
    fileInput.current?.click();
  };

  const handleKeyTrigger = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleUploadClick();
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    // Clear previous messages
    setUploadError(null);
    setLocalToast("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLocalToast("Please sign in to upload photos.");
        return;
      }

      const fd = new FormData();
      [...files].forEach((f) => fd.append("images", f));

      const response = await fetch(`${API}/upload`, {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const okData = await response.json().catch(() => null);
      const added = okData && typeof okData.count === 'number' ? okData.count : files.length;
      const duplicates = okData && typeof okData.duplicates === 'number' ? okData.duplicates : 0;

      // Optimistic increment then refresh
      setImageCount((n) => n + added);
      // Refresh current tab data (App passes fetchAllPhotos/fetchMyPhotos)
      await Promise.resolve(fetchImages && fetchImages());

      // Reset input (keep the user in context)
      e.target.value = "";

      // Offer a friendly toast with detailed feedback
      let message = "";
      if (added > 0 && duplicates === 0) {
        // All photos uploaded successfully
        message = `Thanks for sharing 💖 Added ${added} photo${added > 1 ? "s" : ""}.`;
      } else if (added > 0 && duplicates > 0) {
        // Some uploaded, some duplicates
        message = `Added ${added} photo${added > 1 ? "s" : ""}. ${duplicates} duplicate${duplicates > 1 ? "s" : ""} skipped.`;
      } else if (added === 0 && duplicates > 0) {
        // All were duplicates
        message = `All ${duplicates} photo${duplicates > 1 ? "s are" : " is"} already uploaded.`;
      }

      setLocalToast(message);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message || "We couldn’t upload right now. Please try again in a moment.");
    }
  };

  // Use a consistent app background set via global CSS (see App.css).
  // We intentionally avoid overriding document.body background here so the
  // whole app keeps the same white–blue variant.
  useEffect(() => {
    // no-op: background handled globally
  }, []);

  return (
    <header>
      <div className="container">
        <div className="profile" role="region" aria-label="Profile">
          {/* Avatar */}
          <div className="profile-image">
            <img
              ref={imgRef}
              alt="Our wedding profile"
              src={ProfileImage}
              width={92}
              height={92}
            />
          </div>

          {/* User & actions */}
          <div className="profile-user-settings">
            <div className="profile-header-top">
              <h1 className="profile-user-name">
                {user ? `@${user.username}` : "arielandyaara"}
              </h1>

              {user && (
                <button
                  className="profile-logout-btn"
                  onClick={onLogout}
                  aria-label={isGuest ? "Login" : "Logout"}
                  title={isGuest ? "Login" : "Logout"}
                >
                  {isGuest ? "Login" : "Logout"}
                </button>
              )}
            </div>

            <div className="profile-actions">
              <button
                className="profile-follow-btn"
                onClick={handleUploadClick}
                onKeyDown={handleKeyTrigger}
                aria-label={isGuest ? "Login to share photos" : "Share a photo"}
                title={isGuest ? "Login to share photos" : "Share Photo"}
              >
                <span aria-hidden>✨</span>
                {isGuest ? "Login to Share" : "Share Photo"}
              </button>

              <button
                className="profile-message-btn"
                aria-label="Send us a message"
                title="Send us a message"
              >
                💌
              </button>

              <button
                className="profile-options-btn"
                aria-label="Profile options"
                title="Profile options"
              >
                ⚙️
              </button>
            </div>

            {/* Friendly toast / errors (ARIA live region) */}
            <div aria-live="polite">
              {localToast && (
                <div className="toast" role="status">
                  <div className="toast__icon" aria-hidden>🌟</div>
                  <div className="toast__body">{localToast}</div>
                  <button
                    className="toast__close"
                    onClick={() => setLocalToast("")}
                    aria-label="Dismiss message"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="toast" role="alert">
                  <div className="toast__icon" aria-hidden>⚠️</div>
                  <div className="toast__body">
                    {uploadError}
                    <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>
                      Tip: Try a smaller image or check your connection.
                    </div>
                  </div>
                  <button
                    className="toast__close"
                    onClick={() => setUploadError(null)}
                    aria-label="Dismiss error"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Hidden input, programmatically triggered */}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <ul>
              <li aria-label={`${imageCount} posts`}>
                <span aria-hidden>📷</span>
                <span className="profile-stat-count">{imageCount}</span> posts
              </li>
              <li aria-label={`${guestCount} online`}>
                <span aria-hidden>👥</span>
                <span className="profile-stat-count">{guestCount}</span> online
              </li>
              <li aria-label="infinite love">
                <span aria-hidden>💛</span>
                <span className="profile-stat-count">∞</span> love
              </li>
            </ul>
          </div>

          {/* Bio */}
          <div className="profile-bio">
            <div className={`bio-text ${showFullBio ? "expanded" : ""}`}>
              <strong className="profile-real-name">Ariel &amp; Ya&apos;ara Wedding</strong>
              {" — Share your favorite moments from our special day! "}
              <span aria-hidden>💕</span>
              <br />
              • 📸 Upload memories &nbsp;• 🎉 Celebrate with us &nbsp;• 🥂 Tag your friends
            </div>
            <button
              className="bio-toggle"
              onClick={() => setShowFullBio((v) => !v)}
              aria-expanded={showFullBio}
            >
              {showFullBio ? "Show less" : "Read more"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="profile-tabs" aria-label="Gallery tabs">
          <button className={`profile-tab ${activeTab === 'all' ? 'active' : ''}`} aria-current={activeTab === 'all' ? 'page' : undefined} onClick={() => onTabChange && onTabChange('all')}>
            <span aria-hidden>📷</span> ALL PHOTOS
          </button>
          <button className={`profile-tab ${activeTab === 'mine' ? 'active' : ''}`} aria-current={activeTab === 'mine' ? 'page' : undefined} onClick={() => onTabChange && onTabChange('mine')} disabled={!user} title={!user ? 'Sign in to view your photos' : 'My Photos'}>
            <span aria-hidden>👥</span> MY PHOTOS
          </button>
          <button className={`profile-tab ${activeTab === 'find' ? 'active' : ''}`} onClick={() => onTabChange && onTabChange('find')} aria-current={activeTab === 'find' ? 'page' : undefined}>
            <span aria-hidden>🔎</span> FIND ME
          </button>
        </nav>

        {/* Back to Faces button when viewing a person's photos */}
        {activeTab === 'find' && selectedPerson && onBackToFaces && (
          <div className="back-to-faces-container">
            <button className="back-to-faces-button" onClick={onBackToFaces}>
              <span aria-hidden>←</span> Back to All Faces
            </button>
            <div className="selected-person-info">
              Viewing photos of {selectedPerson.name || `Person ${selectedPerson.id}`}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
