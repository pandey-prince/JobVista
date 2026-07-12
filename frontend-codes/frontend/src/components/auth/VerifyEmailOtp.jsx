import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { authApi } from "@/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const RESEND_COOLDOWN_SEC = 60;

const VerifyEmailOtp = ({ email, onVerified, onBack, successRedirect = "/profile/setup" }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const submitOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    try {
      setLoading(true);
      const res = await authApi.verifyEmail({ email, otp: otp.trim() });
      if (res.data.success) {
        toast.success(res.data.message);
        onVerified?.(res.data.user, successRedirect);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      const res = await authApi.resendOtp({ email });
      if (res.data.success) {
        toast.success(res.data.message);
        setCooldown(RESEND_COOLDOWN_SEC);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={submitOtp} className="w-full">
      <h2 className="text-lg font-semibold">Verify your email</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="my-4">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          className="mt-2 text-center text-lg tracking-[0.4em]"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Verify email
      </Button>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resendLoading || cooldown > 0}
          onClick={handleResend}
        >
          {resendLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : cooldown > 0 ? (
            `Resend code in ${cooldown}s`
          ) : (
            "Resend code"
          )}
        </Button>
        {onBack ? (
          <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            Back
          </button>
        ) : null}
      </div>
    </form>
  );
};

export default VerifyEmailOtp;
