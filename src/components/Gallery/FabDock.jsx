import { useEffect, useState } from "react";

/**
 * Floating speed-dial:
 * - Main button toggles between "Select" and "Cancel"
 * - When opened, actions animate OUT from the main button
 * - When Cancel is pressed, actions animate BACK, then we call onRequestCancel()
 */
export default function FabDock({
  open,                    // selection mode (from parent)
  selectedCount,
  onOpenSelect,
  onRequestCancel,         // called AFTER close animation
  onShare,                 // (setBusy, setBusyText) => Promise
  onDelete,                // optional: (setBusy, setBusyText) => Promise
}) {
  const [expanded, setExpanded] = useState(open); // drives the animation class
  const [busy, setBusy] = useState(false);
  const [busyText, setBusyText] = useState("");

  // sync animation state with "open"
  useEffect(() => {
    // when parent enters selection mode, mount actions then animate in
    if (open) setExpanded(true);
    // when parent closes selection mode externally, just collapse
    if (!open) setExpanded(false);
  }, [open]);

  // click handler for the MAIN button
  const onMainClick = () => {
    if (!open) {
      // open select mode
      onOpenSelect();
      // actions will animate in via useEffect above (expanded true)
      return;
    }
    // we're in selection mode => CANCEL:
    // 1) play reverse animation
    setExpanded(false);
    // 2) after animation ends, tell parent to exit selection mode
    window.setTimeout(() => {
      onRequestCancel();
    }, 260); // match CSS transition timing
  };

  return (
    <div className={`fab-dock ${expanded ? "fab-open" : ""}`} role="region" aria-label="Selection actions">
      {/* Main FAB (toggles text) */}
      <button
        className="fab-main"
        onClick={onMainClick}
        aria-label={open ? "Cancel selection" : "Select photos"}
        title={open ? "Cancel" : "Select photos"}
      >
        {open ? "✖ Cancel" : "✓ Select"}
      </button>

      {/* Actions slide out from the main button to the left.
          They remain mounted while open === true, so they can animate back. */}
      {open && (
        <>
          <button
            className="fab-action fab-share"
            style={{ "--i": 1 }}
            onClick={() => onShare(setBusy, setBusyText)}
            disabled={selectedCount === 0 || busy}
            aria-label="Share selected"
            title={busy ? "Working…" : "Share"}
          >
            📤 {busy ? "Working…" : "Share"}
          </button>

          {onDelete && (
            <button
              className="fab-action fab-delete"
              style={{ "--i": 2 }}
              onClick={() => onDelete(setBusy, setBusyText)}
              disabled={selectedCount === 0 || busy}
              aria-label="Delete selected"
              title={busy ? "Working?" : "Delete"}
            >
              Delete
            </button>
          )}

          <div
            className="fab-chip fab-count"
            style={{ "--i": 3 }}
            aria-live="polite"
            title={`${selectedCount} selected`}
          >
            {busy ? (busyText || "Working…") : `${selectedCount} selected`}
          </div>
        </>
      )}
    </div>
  );
}
