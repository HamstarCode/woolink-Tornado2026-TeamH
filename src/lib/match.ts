import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { intersectSlots, longestContiguousRun } from "@/lib/slots";
import type { IntentMode, MatchWithFriend, SlotIndex } from "@/types/db";

interface IntentRow {
  mode: IntentMode;
  targets: string[]; // target_user_id list, only meaningful when mode === 'selected'
  createdAt: string;
}

/**
 * Recomputes matches for `userId` on `date` and upserts any newly-mutual,
 * overlapping pairs into `matches`. This is the ONLY function in the app
 * that reads another user's intent/availability — it always runs with the
 * service-role client, server-side, never reachable from a client request
 * without going through this exact flow (see /api/intent).
 *
 * Returns the up-to-date list of matches involving `userId` for that date.
 */
export async function recomputeMatchesForUser(
  admin: SupabaseClient,
  userId: string,
  date: string
): Promise<MatchWithFriend[]> {
  const existing = await getMatchesForUser(admin, userId, date);
  const me = await getIntentAndAvailability(admin, userId, date);
  if (!me) return getMatchesForUser(admin, userId, date);

  const occupied = new Set<SlotIndex>();
  const existingPeerIds = new Set<string>();
  for (const match of existing) {
    existingPeerIds.add(match.friend.id);
    for (let slot = match.overlap_start; slot <= match.overlap_end; slot++) occupied.add(slot);
  }

  // 1. Build the candidate set.
  let candidateIds: string[] = [];
  if (me.intent.mode === "selected") {
    candidateIds = me.intent.targets;
  } else {
    const { data: friendships } = await admin
      .from("friendships")
      .select("friend_id")
      .eq("user_id", userId);
    const friendIds = (friendships ?? []).map((f) => f.friend_id as string);
    if (friendIds.length > 0) {
      const { data: intentsToday } = await admin
        .from("daily_intents")
        .select("user_id")
        .eq("date", date)
        .in("user_id", friendIds);
      candidateIds = (intentsToday ?? []).map((r) => r.user_id as string);
    }
  }

  // 2. Collect mutually interested candidates and their already-booked slots.
  const candidates: Array<{
    candidateId: string;
    availability: SlotIndex[];
    occupied: Set<SlotIndex>;
    createdAt: string;
  }> = [];
  for (const candidateId of candidateIds) {
    if (candidateId === userId || existingPeerIds.has(candidateId)) continue;

    const candidate = await getIntentAndAvailability(admin, candidateId, date);
    if (!candidate) continue;

    const iWantThem =
      me.intent.mode === "selected"
        ? me.intent.targets.includes(candidateId)
        : await areFriends(admin, userId, candidateId);
    const theyWantMe =
      candidate.intent.mode === "selected"
        ? candidate.intent.targets.includes(userId)
        : await areFriends(admin, userId, candidateId);

    if (!iWantThem || !theyWantMe) continue;

    const candidateOccupied = new Set<SlotIndex>();
    for (const match of await getMatchesForUser(admin, candidateId, date)) {
      for (let slot = match.overlap_start; slot <= match.overlap_end; slot++) candidateOccupied.add(slot);
    }
    candidates.push({
      candidateId,
      availability: candidate.availability,
      occupied: candidateOccupied,
      createdAt: candidate.intent.createdAt,
    });
  }

  // 3. Greedily fill the caller's still-free slots. A person can have several
  // calls in one day, but no two calls may occupy the same half-hour slot.
  while (candidates.length > 0) {
    const scored = candidates
      .map((candidate) => {
        const freeOverlap = intersectSlots(me.availability, candidate.availability)
          .filter((slot) => !occupied.has(slot) && !candidate.occupied.has(slot));
        const run = longestContiguousRun(freeOverlap);
        return run
          ? { ...candidate, start: run.start, end: run.end, length: run.end - run.start + 1 }
          : null;
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .sort(
        (a, b) =>
          b.length - a.length ||
          a.createdAt.localeCompare(b.createdAt) ||
          a.candidateId.localeCompare(b.candidateId)
      );
    if (scored.length === 0) break;

    const candidate = scored[0];
    const candidateIndex = candidates.findIndex((item) => item.candidateId === candidate.candidateId);
    candidates.splice(candidateIndex, 1);
    const [userA, userB] = [userId, candidate.candidateId].sort();
    const { error: matchError } = await admin.from("matches").upsert(
      {
        user_a: userA,
        user_b: userB,
        date,
        overlap_start: candidate.start,
        overlap_end: candidate.end,
      },
      { onConflict: "user_a,user_b,date" }
    );
    if (matchError) {
      // A simultaneous request may have occupied this range first.
      if (matchError.code === "23505") continue;
      throw new Error(`failed to save match: ${matchError.message}`);
    }
    for (let slot = candidate.start; slot <= candidate.end; slot++) occupied.add(slot);
  }

  return getMatchesForUser(admin, userId, date);
}

async function getIntentAndAvailability(
  admin: SupabaseClient,
  userId: string,
  date: string
): Promise<{ intent: IntentRow; availability: number[] } | null> {
  const { data: intent, error: intentError } = await admin
    .from("daily_intents")
    .select("id, mode, created_at")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (intentError) throw new Error(`failed to read intent: ${intentError.message}`);
  if (!intent) return null;

  // Fetched regardless of mode: in 'selected' mode these are the hard
  // candidate restriction; in 'anyone' mode they're an optional priority
  // list that doesn't affect whether a match happens, only its display
  // order (see getMatchesForUser).
  const { data: targetRows, error: targetsError } = await admin
    .from("intent_targets")
    .select("target_user_id")
    .eq("intent_id", intent.id);
  if (targetsError) throw new Error(`failed to read intent targets: ${targetsError.message}`);
  const targets = (targetRows ?? []).map((t) => t.target_user_id as string);

  const { data: availRow, error: availabilityError } = await admin
    .from("availabilities")
    .select("slots")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (availabilityError) throw new Error(`failed to read availability: ${availabilityError.message}`);

  return {
    intent: { mode: intent.mode as IntentMode, targets, createdAt: intent.created_at as string },
    availability: (availRow?.slots as number[] | undefined) ?? [],
  };
}

async function areFriends(admin: SupabaseClient, a: string, b: string) {
  const { data, error } = await admin
    .from("friendships")
    .select("id")
    .eq("user_id", a)
    .eq("friend_id", b)
    .maybeSingle();
  if (error) throw new Error(`failed to read friendship: ${error.message}`);
  return !!data;
}

export async function getMatchesForUser(
  admin: SupabaseClient,
  userId: string,
  date: string
): Promise<MatchWithFriend[]> {
  const { data: matches, error: matchesError } = await admin
    .from("matches")
    .select("*")
    .eq("date", date)
    .or(`user_a.eq.${userId},user_b.eq.${userId}`);
  if (matchesError) throw new Error(`failed to read matches: ${matchesError.message}`);

  if (!matches || matches.length === 0) return [];

  // "Preferred" = friends the caller listed in their own intent_targets for
  // this date — meaningful in both modes (see recomputeMatchesForUser).
  // Used only to sort/badge results, never computed by the caller's own
  // request (this always re-derives from what was actually saved).
  const { data: myIntent } = await admin
    .from("daily_intents")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  let preferredIds = new Set<string>();
  if (myIntent) {
    const { data: myTargets } = await admin
      .from("intent_targets")
      .select("target_user_id")
      .eq("intent_id", myIntent.id);
    preferredIds = new Set((myTargets ?? []).map((t) => t.target_user_id as string));
  }

  const friendIds = matches.map((m) => (m.user_a === userId ? m.user_b : m.user_a));
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, nickname")
    .in("id", friendIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, {
    id: p.id,
    name: p.nickname,
    avatar_url: null,
  }]));

  const result = matches.map((m) => {
    const friendId = m.user_a === userId ? m.user_b : m.user_a;
    const friend = profileMap.get(friendId) ?? {
      id: friendId,
      name: "友達",
      avatar_url: null,
    };
    return { ...m, friend, preferred: preferredIds.has(friendId) } as MatchWithFriend;
  });

  // Preferred matches first, then earliest start time.
  result.sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.overlap_start - b.overlap_start);
  return result;
}
