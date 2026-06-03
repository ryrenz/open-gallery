"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const LikesContext = createContext(null);

export function LikesProvider({ children }) {
  const [liked, setLiked] = useState(() => new Set());

  // Hydrate the shared like set once on mount.
  useEffect(() => {
    let active = true;

    fetch("/api/likes")
      .then((response) => (response.ok ? response.json() : { likes: [] }))
      .then((data) => {
        if (active) {
          setLiked(new Set(Array.isArray(data.likes) ? data.likes : []));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Optimistic toggle: flip locally first, then persist; revert on failure.
  const toggle = useCallback((slug) => {
    // Compute the next state synchronously from the current set — a functional
    // setState updater does NOT run synchronously, so we cannot read the result
    // out of it before the fetch below (it would be undefined → liked:false).
    const nextLiked = !liked.has(slug);

    setLiked((current) => {
      const updated = new Set(current);

      if (nextLiked) {
        updated.add(slug);
      } else {
        updated.delete(slug);
      }

      return updated;
    });

    fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, liked: nextLiked }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save like.");
        }
      })
      .catch(() => {
        setLiked((current) => {
          const reverted = new Set(current);

          if (nextLiked) {
            reverted.delete(slug);
          } else {
            reverted.add(slug);
          }

          return reverted;
        });
      });
  }, [liked]);

  return (
    <LikesContext.Provider value={{ liked, toggle }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  return useContext(LikesContext);
}
