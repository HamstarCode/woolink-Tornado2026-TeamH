import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type DiaryRoom = {
  room_id: string;
  ended_at: string;
  partner_user_id: string;
  partner_nickname: string;
  partner_public_user_id: string;
  partner_personality_type: string | null;
  partner_diary: string;
  my_reply_content: string | null;
  my_reply_reaction: string | null;
};

export type DiaryHistoryEntry = {
  submissionId: string;
  roomId: string | null;
  exchangeStartedAt: string;
  partnerUserId: string | null;
  partnerNickname: string | null;
  hasPartnerReply: boolean;
  submissionKind: "exchange" | "private";
};

export type DiaryHistoryDetail = {
  submissionId: string;
  room_id: string | null;
  exchangeStartedAt: string;
  myDiary: string;
  partner_user_id: string | null;
  partner_nickname: string | null;
  partner_diary: string | null;
  my_reply_content: string | null;
  my_reply_reaction: string | null;
  partnerReplyContent: string | null;
  partnerReplyReaction: string | null;
  submissionKind: "exchange" | "private";
};

export async function getDiaryRoom(roomId: string) {
  const { data, error } = await supabase.rpc("get_diary_room", {
    p_room_id: roomId,
  });

  if (error) throw new Error(error.message);

  const room = (data?.[0] ?? null) as DiaryRoom | null;
  if (!room) throw new Error("交換日記が見つかりませんでした。");

  return room;
}

export async function sendDiaryReply(
  roomId: string,
  content: string,
  reaction: string | null,
) {
  const { error } = await supabase.rpc("send_diary_reply", {
    p_room_id: roomId,
    p_content: content.trim() || null,
    p_reaction: reaction,
  });

  if (error) throw new Error(error.message);
}

export async function getDiaryHistory() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("ログイン情報を取得できませんでした。");

  const { data, error } = await supabase
    .from("submissions")
    .select("id, room_id, created_at, submission_kind")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("日記履歴を取得できませんでした。");

  return Promise.all(
    (data ?? []).map(async (submission): Promise<DiaryHistoryEntry> => {
      if (!submission.room_id) {
        return {
          submissionId: submission.id,
          roomId: null,
          exchangeStartedAt: submission.created_at,
          partnerUserId: null,
          partnerNickname: null,
          hasPartnerReply: false,
          submissionKind: submission.submission_kind === "private" ? "private" : "exchange",
        };
      }

      try {
        const room = await getDiaryRoom(submission.room_id);
        return {
          submissionId: submission.id,
          roomId: room.room_id,
          exchangeStartedAt: submission.created_at,
          partnerUserId: room.partner_user_id,
          partnerNickname: room.partner_nickname,
          hasPartnerReply: Boolean(room.my_reply_content || room.my_reply_reaction),
          submissionKind: submission.submission_kind === "private" ? "private" : "exchange",
        };
      } catch {
        return {
          submissionId: submission.id,
          roomId: submission.room_id,
          exchangeStartedAt: submission.created_at,
          partnerUserId: null,
          partnerNickname: null,
          hasPartnerReply: false,
          submissionKind: submission.submission_kind === "private" ? "private" : "exchange",
        };
      }
    }),
  );
}

export async function getDiaryHistoryDetail(submissionId: string) {
  const authResult = await supabase.auth.getUser();
  const user = authResult.data.user;

  if (authResult.error || !user) {
    throw new Error("ログイン情報を取得できませんでした。");
  }

  const { data: mySubmission, error: submissionError } = await supabase
    .from("submissions")
    .select("id, room_id, diary, created_at, submission_kind")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (submissionError) throw new Error("交換記録を取得できませんでした。");
  if (!mySubmission) throw new Error("自分の日記が見つかりませんでした。");

  if (!mySubmission.room_id) {
    return {
      submissionId: mySubmission.id,
      room_id: null,
      exchangeStartedAt: mySubmission.created_at,
      myDiary: mySubmission.diary,
      partner_user_id: null,
      partner_nickname: null,
      partner_diary: null,
      my_reply_content: null,
      my_reply_reaction: null,
      partnerReplyContent: null,
      partnerReplyReaction: null,
      submissionKind: mySubmission.submission_kind === "private" ? "private" : "exchange",
    } satisfies DiaryHistoryDetail;
  }

  const room = await getDiaryRoom(mySubmission.room_id);
  const { data: replies, error: replyError } = await supabase
    .from("replies")
    .select("user_id, content, reaction")
    .eq("room_id", room.room_id);

  if (replyError) throw new Error("交換記録を取得できませんでした。");

  const partnerReply = replies?.find((item) => item.user_id === room.partner_user_id);

  return {
    submissionId: mySubmission.id,
    room_id: room.room_id,
    exchangeStartedAt: mySubmission.created_at,
    myDiary: mySubmission.diary,
    partner_user_id: room.partner_user_id,
    partner_nickname: room.partner_nickname,
    partner_diary: room.partner_diary,
    my_reply_content: room.my_reply_content,
    my_reply_reaction: room.my_reply_reaction,
    partnerReplyContent: partnerReply?.content ?? null,
    partnerReplyReaction: partnerReply?.reaction ?? null,
    submissionKind: mySubmission.submission_kind === "private" ? "private" : "exchange",
  } satisfies DiaryHistoryDetail;
}
