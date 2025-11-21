import { useMemo, useRef } from "react";
import useIntersectOnce from "./useIntersectOnce";
import GalleryTile from "./GalleryTile";

export default function GalleryGrid({ images, selectMode, selected, order, onOpen, onTogglePick, onEnterSelect }) {
  const gridRef = useRef(null);
  const visibleSet = useIntersectOnce(gridRef, ".gallery-item", [images.length]);

  return (
    <div className={`gallery ${selectMode ? "is-selecting" : ""}`} ref={gridRef} role="list" aria-label="Photo gallery">
      {images.map((src, i) => {
        const isSelected = selected.has(i);
        const badgeNum = isSelected ? order.indexOf(i) + 1 : 0;
        const isVisible = visibleSet.has(i);

        return (
          <GalleryTile
            key={i}
            idx={i}
            src={src}
            visible={isVisible}
            selected={isSelected}
            badgeNum={badgeNum}
            selectMode={selectMode}
            onOpen={() => onOpen(i)}
            onToggle={(range) => onTogglePick(i, range)}
            onEnterSelect={onEnterSelect}
          />
        );
      })}
    </div>
  );
}
