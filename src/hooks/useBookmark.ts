"use client";

import { useCallback, useEffect, useState } from "react";

type Bookmark = { publicUserId: string; nickname: string };

const STORAGE_KEY = "bookmarks";
const CHANGE_EVENT = "woolink-bookmarks-changed";

function readBookmarks(): Bookmark[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Bookmark =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Bookmark).publicUserId === "string" &&
            typeof (item as Bookmark).nickname === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function useBookmark(publicUserId?: string | null, nickname?: string | null) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const refresh = useCallback(() => {
    setIsBookmarked(
      Boolean(publicUserId) && readBookmarks().some((item) => item.publicUserId === publicUserId),
    );
  }, [publicUserId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [refresh]);

  const toggleBookmark = useCallback(() => {
    if (!publicUserId || !nickname) return;
    const bookmarks = readBookmarks();
    const exists = bookmarks.some((item) => item.publicUserId === publicUserId);
    const updated = exists
      ? bookmarks.filter((item) => item.publicUserId !== publicUserId)
      : [...bookmarks, { publicUserId, nickname }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [nickname, publicUserId]);

  return { isBookmarked, toggleBookmark };
}
