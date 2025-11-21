import { useEffect, useState } from "react";

/** Track elements that have intersected at least once; returns a Set of indices. */
export default function useIntersectOnce(rootRef, selector, deps = []) {
  const [seen, setSeen] = useState(() => new Set());
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    setSeen(new Set());
    const els = Array.from(root.querySelectorAll(selector));
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (!e.isIntersecting) return;
        const idx = Number(e.target.getAttribute("data-idx"));
        setSeen(prev => { const next = new Set(prev); next.add(idx); return next; });
        obs.unobserve(e.target);
      }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [rootRef, selector, ...deps]);
  return seen;
}
