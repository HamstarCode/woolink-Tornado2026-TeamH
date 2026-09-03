"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="mb-6 text-3xl font-bold">
          Woolink
        </h1>

        {user ? (
          <div>
            <p className="mb-4 text-green-600">
              ログインしています！
            </p>

            <p className="text-sm text-gray-600">
              {user.email}
            </p>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
              className="mt-4 rounded-lg border px-4 py-2"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="rounded-lg bg-gray-900 px-6 py-3 text-white"
          >
            Googleでログイン
          </button>
        )}
      </div>
    </main>
  );
}