"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function TelegramSettingsPage() {
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/telegram-config")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setBotToken(data.botToken || "");
          setChannelId(data.channelId || "");
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load Telegram configuration");
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, channelId }),
      });

      if (res.ok) {
        toast.success("Telegram configuration saved successfully!");
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setBotToken("");
    setChannelId("");
  }

  if (loading) {
    return <div className="text-sm text-[#555]">Loading Telegram settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Telegram ID & Bot Settings</h1>
        <p className="text-sm text-[#555] mt-1">
          Configure your Telegram Bot Token and Group/Channel ID where images will be stored.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[#111] border border-white/[0.06] rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-[#888] mb-2">
            Telegram Bot Token
          </label>
          <input
            type="text"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 font-mono"
          />
          <p className="text-[11px] text-[#444] mt-1.5">
            Get this from <span className="text-[#666]">@BotFather</span> on Telegram.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#888] mb-2">
            Telegram Group / Channel ID
          </label>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="e.g. -1001234567890 or @yourchannel"
            className="w-full bg-[#0a0a0a] border border-white/[0.1] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 font-mono"
          />
          <p className="text-[11px] text-[#444] mt-1.5">
            The target chat or channel ID where your images will be stored as file messages.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear Fields
          </button>

          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black text-xs font-medium px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
