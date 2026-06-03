"use client";

import { useLikes } from "@/components/likes-provider";

function HeartIcon({ filled }) {
  return (
    <svg
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function LikeButton({ slug, variant = "card", title = "" }) {
  const likes = useLikes();
  const liked = likes?.liked?.has(slug) ?? false;
  const className = variant === "floating" ? "like-fab" : "like-chip";

  function handleClick(event) {
    // The card variant lives inside a navigation <Link>, so stop the click
    // from bubbling up into a page transition.
    event.preventDefault();
    event.stopPropagation();
    likes?.toggle(slug);
  }

  return (
    <button
      aria-label={liked ? `Unlike ${title}`.trim() : `Like ${title}`.trim()}
      aria-pressed={liked}
      className={`${className}${liked ? " is-liked" : ""}`}
      onClick={handleClick}
      type="button"
    >
      <HeartIcon filled={liked} />
    </button>
  );
}
