"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await signIn("credentials", {
        password,
        redirect: false,
      });

      if (!response?.ok) {
        throw new Error("Invalid password");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login failed:", error);
      setError("Invalid password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ImgStorage</h1>
          <p className="text-gray-500 mt-2">
            Free image storage API powered by Telegram
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Access password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              autoFocus
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-gray-900 py-3 px-4 text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {error && (
            <p className="text-center text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Private access for ImgStorage owner.
        </p>

        <p className="text-center text-xs text-gray-400 mt-2">
          <Link
            href="/terms"
            className="underline hover:text-gray-600 transition-colors"
          >
            Terms
          </Link>{" "}
          ·{" "}
          <Link
            href="/privacy"
            className="underline hover:text-gray-600 transition-colors"
          >
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
