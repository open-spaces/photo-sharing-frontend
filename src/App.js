import React, { useState, useCallback, useEffect } from "react";
// import { io } from "socket.io-client";
import { Profile } from "./components/Profile/Profile";
import GalleryContainer from "./components/Gallery/GalleryContainer";
import LoginContainer from "./components/Login/LoginContainer";
import FindPeople from "./components/FindPeople/FindPeople";
import { getApiUrl, getWebSocketUrl, deletePhotoUrl } from "./config/api";
import { fetchWithAuth } from "./auth";
import "./components/Profile/Profile.css";
import "./components/Gallery/Gallery.css";
import "./components/Login/Login.css";
import "./App.css";

export default function App() {
  const [imageCount, setImageCount] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [images, setImages] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [lastViewedIndex, setLastIdx] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [allPhotos, setAllPhotos] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personPhotos, setPersonPhotos] = useState([]);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  const API = getApiUrl();

  // Authentication functions
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setIsGuest(false);
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    setIsAuthenticated(false);
    setUser({ username: 'Guest', isGuest: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUser(null);
    setIsGuest(false);
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    if (token && username) {
      setIsAuthenticated(true);
      setUser({ username, access_token: token });
    }
  }, []);

  // Fetch ALL photos (DB-backed)
  const fetchAllPhotos = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth(`${API}/photos`, { signal, cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      if (res.status === 304) return; // keep current state
      const data = await res.json();
      const urls = Array.isArray(data) ? data.map(p => p.url) : [];
      setAllPhotos(Array.isArray(data) ? data : []);
      if (activeTab === 'all') {
        setImages(urls);
        setImageCount(urls.length);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("fetchAllPhotos failed:", err);
        setAllPhotos([]);
        if (activeTab === 'all') { setImages([]); setImageCount(0); }
      }
    }
  }, [API, activeTab]);

  // Fetch MY photos (requires auth)
  const fetchMyPhotos = useCallback(async (signal) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { setMyPhotos([]); if (activeTab === 'mine') { setImages([]); setImageCount(0); } return; }
      const res = await fetchWithAuth(`${API}/my-photos`, { signal, cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      if (res.status === 304) return;
      const data = await res.json();
      const urls = Array.isArray(data) ? data.map(p => p.url) : [];
      setMyPhotos(Array.isArray(data) ? data : []);
      if (activeTab === 'mine') {
        setImages(urls);
        setImageCount(urls.length);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("fetchMyPhotos failed:", err);
        setMyPhotos([]);
        if (activeTab === 'mine') { setImages([]); setImageCount(0); }
      }
    }
  }, [API, activeTab]);

  // Fetch photos for a specific person
  const fetchPersonPhotos = useCallback(async (personId, signal) => {
    try {
      const res = await fetch(`${API}/persons/${personId}/photos`, { signal, cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch person photos');
      const data = await res.json();
      const urls = Array.isArray(data) ? data.map(p => p.url) : [];
      setPersonPhotos(Array.isArray(data) ? data : []);
      setImages(urls);
      setImageCount(urls.length);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("fetchPersonPhotos failed:", err);
        setPersonPhotos([]);
        setImages([]);
        setImageCount(0);
      }
    }
  }, [API]);

  // Handle person selection
  const handlePersonSelect = useCallback((person) => {
    setSelectedPerson(person);
    fetchPersonPhotos(person.id);
  }, [fetchPersonPhotos]);

  /* grab ALL photos once, when the app mounts */
  useEffect(() => {
    const controller = new AbortController();
    fetchAllPhotos(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update visible images when tab changes
  useEffect(() => {
    const controller = new AbortController();
    if (activeTab === 'all') {
      setSelectedPerson(null);
      fetchAllPhotos(controller.signal);
    } else if (activeTab === 'mine') {
      setSelectedPerson(null);
      fetchMyPhotos(controller.signal);
    } else if (activeTab === 'find') {
      // Reset images when entering find tab (will show FindPeople component)
      if (!selectedPerson) {
        setImages([]);
        setImageCount(0);
      }
    }
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    // live guest counter
    const ws = new WebSocket(getWebSocketUrl('/ws'));
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        setGuestCount(data.guestCount);
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    ws.onopen = () => console.log("WS connected");
    ws.onclose = () => console.log("WS closed");
    ws.onerror = (e) => console.error("WS error", e);

    return () => ws.close();
  }, []);

  const closeViewer = useCallback((idx) => {
    setLastIdx(idx);
    setViewerOpen(false);
  }, []);

  // Delete selected photos for My Photos tab
  const deleteMyPhotosByIndices = useCallback(async (indices, setBusy, setBusyText) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const ids = indices
      .sort((a, b) => a - b)
      .map(i => (myPhotos[i] ? myPhotos[i].id : null))
      .filter(v => v != null);
    try {
      setBusy(true);
      for (let n = 0; n < ids.length; n++) {
        const id = ids[n];
        setBusyText(`Deleting ${n + 1}/${ids.length}`);
        await fetchWithAuth(deletePhotoUrl(id), { method: 'DELETE' });
      }
      await fetchAllPhotos();
      await fetchMyPhotos();
    } finally {
      setBusy(false);
      setBusyText("");
    }
  }, [myPhotos, fetchAllPhotos, fetchMyPhotos]);

  // Delete selected photos for All Photos tab (admin only)
  const deleteAllPhotosByIndices = useCallback(async (indices, setBusy, setBusyText) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const ids = indices
      .sort((a, b) => a - b)
      .map(i => (allPhotos[i] ? allPhotos[i].id : null))
      .filter(v => v != null);
    try {
      setBusy(true);
      for (let n = 0; n < ids.length; n++) {
        const id = ids[n];
        setBusyText(`Deleting ${n + 1}/${ids.length}`);
        await fetchWithAuth(deletePhotoUrl(id), { method: 'DELETE' });
      }
      await fetchAllPhotos();
      await fetchMyPhotos();
    } finally {
      setBusy(false);
      setBusyText("");
    }
  }, [allPhotos, fetchAllPhotos, fetchMyPhotos]);

  // Show authentication forms if not authenticated and not guest
  if (!isAuthenticated && !isGuest) {
    return (
      <LoginContainer
        onLogin={handleLogin}
        onGuestLogin={handleGuestLogin}
        API={API}
      />
    );
  }

  return (
    <>
      {/* 1️⃣ conditional header */}
      {viewerOpen ? null : (
        <Profile
          imageCount={imageCount}
          guestCount={guestCount}
          setImageCount={setImageCount}
          fetchImages={() => {
            if (activeTab === 'all') return fetchAllPhotos();
            if (activeTab === 'mine') return fetchMyPhotos();
            if (activeTab === 'find' && selectedPerson) return fetchPersonPhotos(selectedPerson.id);
            return Promise.resolve();
          }}
          API={API}      // ◀—— call me after upload
          uploadError={uploadError}
          setUploadError={setUploadError}
          user={user}
          onLogout={handleLogout}
          isGuest={isGuest}
          onLogin={handleLogin}
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab !== 'find') setSelectedPerson(null);
            setActiveTab(tab);
          }}
          selectedPerson={selectedPerson}
          onBackToFaces={() => setSelectedPerson(null)}
        />
      )}

      {/* 2️⃣ Show FindPeople component when in find tab and no person selected */}
      {activeTab === 'find' && !selectedPerson && !viewerOpen ? (
        <FindPeople onPersonSelect={handlePersonSelect} />
      ) : null}

      {/* 3️⃣ gallery gets control to open / close viewer */}
      {(activeTab !== 'find' || selectedPerson) ? (
        <GalleryContainer
          images={images}
          viewerOpen={viewerOpen}
          setViewerOpen={setViewerOpen}
          lastViewedIndex={lastViewedIndex}
          onClose={closeViewer}
          canDelete={activeTab === 'mine' || (activeTab === 'all' && user?.email === 'arielsholet1234@gmail.com')}
          onDeleteSelected={
            activeTab === 'mine'
              ? deleteMyPhotosByIndices
              : (activeTab === 'all' && user?.email === 'arielsholet1234@gmail.com')
                ? deleteAllPhotosByIndices
                : undefined
          }
        />
      ) : null}
    </>
  );
}
