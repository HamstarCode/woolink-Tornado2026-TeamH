-- 強制マッチは発表担当者のGoogleログインだけに限定する。
-- 直前のマイグレーションで作成済みの関数定義へ、サーバー側のJWT検証を追加する。
do $migration$
declare
  v_definition text;
  v_guard text := 'if lower(coalesce(auth.jwt() ->> ''email'', '''')) <> ''aikii1012@gmail.com'' then';
begin
  v_definition := pg_get_functiondef('public.force_match_diaries()'::regprocedure);

  if position(v_guard in v_definition) = 0 then
    v_definition := replace(
      v_definition,
      'if v_user_id is null then raise exception ''ログインが必要です。''; end if;',
      'if v_user_id is null then raise exception ''ログインが必要です。''; end if;
  if lower(coalesce(auth.jwt() ->> ''email'', '''')) <> ''aikii1012@gmail.com'' then
    raise exception ''強制マッチを実行する権限がありません。'';
  end if;'
    );
    execute v_definition;
  end if;
end;
$migration$;
