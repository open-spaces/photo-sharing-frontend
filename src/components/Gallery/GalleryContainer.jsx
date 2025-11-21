import { useState, useCallback } from "react";
import GalleryGrid from "./GalleryGrid";
import FabDock from "./FabDock";
import { Viewer } from "../Viewer/Viewer";
import "./gallery.css";

export default function GalleryContainer({
  images,
  viewerOpen,
  setViewerOpen,
  lastViewedIndex,
  onClose,
  canDelete,
  onDeleteSelected,
}) {
  const [startIndex, setStartIndex] = useState(0);

  // selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [order, setOrder] = useState(() => []);

  // viewer
  const openViewer = useCallback(
    (i) => {
      if (selectMode) return;
      setStartIndex(i);
      setViewerOpen(true);
    },
    [selectMode, setViewerOpen]
  );

  // selection helpers
  const togglePick = useCallback((i, range) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (range && range.length) {
        range.forEach((k) => next.add(k));
        setOrder((o) => [...o, ...range.filter((k) => !o.includes(k))]);
      } else {
        if (next.has(i)) {
          next.delete(i);
          setOrder((o) => o.filter((x) => x !== i));
        } else {
          next.add(i);
          setOrder((o) => (o.includes(i) ? o : [...o, i]));
        }
      }
      return next;
    });
  }, []);

  const clearAll = () => {
    setSelected(new Set());
    setOrder([]);
  };

  const exitSelect = () => {
    setSelectMode(false);
    clearAll();
  };

  // share selected (Web Share API with files; fallback to copying links)
  const getFileName = (url, i) => {
    try {
      const clean = url.split("?")[0];
      return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || `photo-${i + 1}.jpg`;
    } catch {
      return `photo-${i + 1}.jpg`;
    }
  };
  const fetchBlob = async (url) => {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Failed ${res.status}`);
    return await res.blob();
  };
  const shareSelected = async (setBusy, setBusyText) => {
    const idxs = [...selected].sort((a, b) => a - b);
    if (!idxs.length) return;
    setBusy(true);
    setBusyText("Collecting photos…");
    try {
      const files = [];
      for (let n = 0; n < idxs.length; n++) {
        const i = idxs[n];
        const blob = await fetchBlob(images[i]);
        files.push(new File([blob], getFileName(images[i], i), { type: blob.type || "image/jpeg" }));
        setBusyText(`Prepared ${n + 1}/${idxs.length}`);
      }
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: "Wedding Photos", text: "Sharing favorite moments 💍" });
      } else {
        await navigator.clipboard.writeText(idxs.map((i) => images[i]).join("\n"));
      }
    } finally {
      setBusy(false);
      setBusyText("");
    }
  };

  const deleteSelected = async (setBusy, setBusyText) => {
    if (!canDelete || !onDeleteSelected) return;
    const idxs = [...selected].sort((a, b) => a - b);
    if (!idxs.length) return;
    await onDeleteSelected(idxs, setBusy, setBusyText);
    // After deletion, exit selection and clear
    exitSelect();
  };

  if (viewerOpen) {
    return (
      <main className="container">
        <Viewer
          images={images}
          startIndex={startIndex}
          onBack={(idx) => {
            onClose(idx);
            setViewerOpen(false);
          }}
        />
      </main>
    );
  }

  return (
    <main className="container">
      {/* No header/title per your request */}

      <GalleryGrid
        images={images}
        selectMode={selectMode}
        selected={selected}
        order={order}
        onOpen={openViewer}
        onTogglePick={togglePick}
        onEnterSelect={() => setSelectMode(true)}
      />

      <FabDock
        open={selectMode}
        selectedCount={selected.size}
        onOpenSelect={() => setSelectMode(true)}
        onRequestCancel={exitSelect}              // will be called after the close animation
        onShare={shareSelected}
        onDelete={canDelete ? deleteSelected : undefined}
      />
    </main>
  );
}
