"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

async function migrateLocalBookmarks(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const migrationKey = `bookmarks-db-migrated:${userId}`;
  if (localStorage.getItem(migrationKey)) return;

  const publicUserIds = readBookmarks().map((item) => item.publicUserId);
  if (publicUserIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .in("public_user_id", publicUserIds);
    if (profileError) return;
    const rows = (profiles ?? [])
      .filter((profile) => profile.id !== userId)
      .map((profile) => ({ user_id: userId, target_user_id: profile.id }));
    if (rows.length > 0) {
      const { error } = await supabase
        .from("bookmarks")
        .upsert(rows, { onConflict: "user_id,target_user_id", ignoreDuplicates: true });
      if (error) return;
    }
  }
  localStorage.setItem(migrationKey, "1");
}

export function useBookmark(
  targetUserId?: string | null,
  publicUserId?: string | null,
  nickname?: string | null,
) {
  const supabase = useMemo(() => createClient(), []);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetUserId) {
      setIsBookmarked(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await migrateLocalBookmarks(supabase, user.id);
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_user_id", targetUserId)
      .maybeSingle();
    if (!error) setIsBookmarked(Boolean(data));
  }, [supabase, targetUserId]);

  useEffect(() => {
    const runRefresh = () => void refresh();
    const frame = window.requestAnimationFrame(runRefresh);
    window.addEventListener("storage", runRefresh);
    window.addEventListener(CHANGE_EVENT, runRefresh);
    window.addEventListener("focus", runRefresh);
    window.addEventListener("pageshow", runRefresh);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", runRefresh);
      window.removeEventListener(CHANGE_EVENT, runRefresh);
      window.removeEventListener("focus", runRefresh);
      window.removeEventListener("pageshow", runRefresh);
    };
  }, [refresh]);

  const toggleBookmark = useCallback(async () => {
    if (!targetUserId || !publicUserId || !nickname) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const next = !isBookmarked;
    setIsBookmarked(next);
    const { error } = next
      ? await supabase.from("bookmarks").upsert(
          { user_id: user.id, target_user_id: targetUserId },
          { onConflict: "user_id,target_user_id", ignoreDuplicates: true },
        )
      : await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("target_user_id", targetUserId);
    if (error) {
      setIsBookmarked(!next);
      return;
    }

    const bookmarks = readBookmarks();
    const updated = next
      ? [...bookmarks.filter((item) => item.publicUserId !== publicUserId), { publicUserId, nickname }]
      : bookmarks.filter((item) => item.publicUserId !== publicUserId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [isBookmarked, nickname, publicUserId, supabase, targetUserId]);

  return { isBookmarked, toggleBookmark };
}
