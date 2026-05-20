"use client";

import { useState } from "react";
import { Check, Loader2, Phone } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

async function updatePhone(phoneCountryCode: string, phoneNumber: string) {
  const response = await fetch("/api/me/profile", {
    body: JSON.stringify({
      phoneCountryCode,
      phoneNumber,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Unable to save phone number.");
  }
}

export function PhoneSettingsCard({
  initialPhoneCountryCode,
  initialPhoneNumber,
  phoneVerified,
}: {
  initialPhoneCountryCode: string | null;
  initialPhoneNumber: string | null;
  phoneVerified: boolean;
}) {
  const [countryCode, setCountryCode] = useState(initialPhoneCountryCode ?? "+33");
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);

    try {
      await updatePhone(countryCode, phoneNumber);
      setStatus("success");
      setMessage("Phone number saved.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save phone number.");
    }
  }

  return (
    <GlassCard className="rounded-xl p-5">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <div className="flex items-center gap-2 text-white">
            <Phone className="size-5 text-[#66c0f4]" />
            <h2 className="text-xl font-semibold">Phone</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/55">
            SMS verification is not enabled in this sprint.
          </p>
        </div>

        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <label className="block space-y-2">
            <span className="text-sm text-white/60">Code</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-[#07111f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#66c0f4]/60"
              onChange={(event) => setCountryCode(event.target.value)}
              placeholder="+33"
              value={countryCode}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-white/60">Number</span>
            <input
              className="w-full rounded-lg border border-white/10 bg-[#07111f]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#66c0f4]/60"
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="6 12 34 56 78"
              value={phoneNumber}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className={phoneVerified ? "text-sm text-emerald-300" : "text-sm text-amber-300"}>
            {phoneVerified ? "Verified" : "Not verified"}
          </span>
          <Button className="rounded-lg" disabled={status === "saving"} type="submit">
            {status === "saving" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save
          </Button>
        </div>

        {message ? (
          <p className={status === "error" ? "text-sm text-red-300" : "text-sm text-emerald-300"}>
            {status === "success" ? <Check className="mr-1 inline size-4" /> : null}
            {message}
          </p>
        ) : null}
      </form>
    </GlassCard>
  );
}
