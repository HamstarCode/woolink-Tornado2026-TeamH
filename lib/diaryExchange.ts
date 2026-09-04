import { supabase } from "@/lib/supabase";

type SubmitDiaryResult = {
  submission_id: string;
  room_id: string | null;
};

export async function submitDiary(
  diary: string,
  targetPublicUserId: string | null,
) {
  const { data, error } = await supabase.rpc("submit_diary", {
    p_diary: diary.trim(),
    p_target_public_user_id:
      targetPublicUserId?.trim().toUpperCase() || null,
  });

  if (error) {
    throw new Error(error.message || "日記の提出に失敗しました。");
  }

  const result = (data?.[0] ?? null) as SubmitDiaryResult | null;

  if (!result) {
    throw new Error("日記の提出結果を確認できませんでした。");
  }

  return result;
}
