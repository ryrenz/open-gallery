"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import RetryImage from "@/components/retry-image";

// Bottom-of-work navigation: explicit Prev/Next plus a drag-scrollable strip of
// every work in the current collection (its Vol. block). Clicking a thumbnail
// jumps straight to that work; the strip scrolls by drag or its own scrollbar
// when the works overflow.
export default function WorkNavigator({ navigation }) {
  const { works, currentIndex, groupSlug, groupTitle } = navigation;
  const scrollerRef = useRef(null);
  const currentRef = useRef(null);
  // Tracks a pointer drag so a drag-to-scroll gesture doesn't also fire a
  // thumbnail navigation when the pointer is released.
  const dragRef = useRef({ down: false, moved: false, startX: 0, startScroll: 0 });

  const prev = currentIndex > 0 ? works[currentIndex - 1] : null;
  const next =
    currentIndex < works.length - 1 ? works[currentIndex + 1] : null;

  // Center the active thumbnail so the reader sees where they are in the set.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = currentRef.current;

    if (!scroller || !active) {
      return;
    }

    const target =
      active.offsetLeft - scroller.clientWidth / 2 + active.clientWidth / 2;
    scroller.scrollLeft = Math.max(0, target);
  }, [currentIndex]);

  function handlePointerDown(event) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    dragRef.current = {
      down: true,
      moved: false,
      startX: event.clientX,
      startScroll: scroller.scrollLeft,
    };
  }

  function handlePointerMove(event) {
    const state = dragRef.current;
    const scroller = scrollerRef.current;

    if (!state.down || !scroller) {
      return;
    }

    const delta = event.clientX - state.startX;

    if (Math.abs(delta) > 4) {
      state.moved = true;
    }

    scroller.scrollLeft = state.startScroll - delta;
  }

  function endDrag() {
    dragRef.current.down = false;
    // Clear the moved flag after the click event has a chance to fire so a real
    // drag suppresses navigation but a plain click still works next time.
    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 0);
  }

  function handleThumbClick(event) {
    if (dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return (
    <nav className="work-nav" aria-label="Other works in this collection">
      <div className="work-nav-head">
        <Link className="work-nav-collection" href={`/groups/${groupSlug}`}>
          ← Back to {groupTitle}
        </Link>
        <div className="work-nav-arrows">
          {prev ? (
            <Link className="work-nav-arrow" href={`/gallery/${prev.slug}`}>
              ← Prev
            </Link>
          ) : (
            <span className="work-nav-arrow is-disabled">← Prev</span>
          )}
          {next ? (
            <Link className="work-nav-arrow" href={`/gallery/${next.slug}`}>
              Next →
            </Link>
          ) : (
            <span className="work-nav-arrow is-disabled">Next →</span>
          )}
        </div>
      </div>

      <div
        className="work-nav-strip"
        ref={scrollerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {works.map((work, index) => {
          const isCurrent = index === currentIndex;

          return (
            <Link
              aria-current={isCurrent ? "true" : undefined}
              className={`work-nav-thumb${isCurrent ? " is-current" : ""}`}
              draggable={false}
              href={`/gallery/${work.slug}`}
              key={work.slug}
              onClick={handleThumbClick}
              ref={isCurrent ? currentRef : null}
            >
              <div className="work-nav-thumb-frame">
                <RetryImage
                  alt={work.title}
                  draggable={false}
                  loading="lazy"
                  src={`/api/media/${work.slug}/${work.coverIndex}?mode=cover&w=240&q=65`}
                />
                {isCurrent ? (
                  <span className="work-nav-current-tag">Now</span>
                ) : null}
              </div>
              <span className="work-nav-thumb-title">{work.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
