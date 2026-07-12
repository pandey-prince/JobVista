import bcrypt from "bcryptjs";
import { EmailOtp } from "../models/emailOtp.model.js";
import { sendEmail, isEmailConfigured } from "./email.service.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESENDS = 3;
const RESEND_WINDOW_MS = 15 * 60 * 1000;

/** Dev-only: last OTP per email when Resend is not configured */
export const devOtpByEmail = new Map();

export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const normalizeEmail = (email) => String(email).trim().toLowerCase();

const deliverOtpEmail = async (normalized, otp) => {
  if (!isEmailConfigured()) {
    // #region agent log
    fetch('http://127.0.0.1:7533/ingest/ab9d03cf-9a58-4f5a-9174-f3b9b67f6bd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'adbcde'},body:JSON.stringify({sessionId:'adbcde',location:'otp.service.js:deliverOtpEmail',message:'email not configured',data:{nodeEnv:process.env.NODE_ENV,emailConfigured:false},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (process.env.NODE_ENV === "production") {
      const err = new Error("Email service is not configured. Contact support.");
      err.statusCode = 503;
      throw err;
    }
    devOtpByEmail.set(normalized, otp);
    console.warn(`[OTP] Dev mode — signup OTP for ${normalized}: ${otp}`);
    return { success: true, dev: true };
  }

  const result = await sendEmail({
    to: normalized,
    subject: "Your JobLeLo verification code",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color: #059669;">JobLeLo</h2>
        <p>Your email verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;">${otp}</p>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't sign up, ignore this email.</p>
      </div>
    `,
    text: `Your JobLeLo verification code is ${otp}. It expires in 10 minutes.`,
  });

  // #region agent log
  fetch('http://127.0.0.1:7533/ingest/ab9d03cf-9a58-4f5a-9174-f3b9b67f6bd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'adbcde'},body:JSON.stringify({sessionId:'adbcde',location:'otp.service.js:deliverOtpEmail',message:'email send result',data:{success:result.success,skipped:Boolean(result.skipped),hasId:Boolean(result.id),nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  if (result.skipped) {
    devOtpByEmail.set(normalized, otp);
    console.warn(`[OTP] Email skipped — signup OTP for ${normalized}: ${otp}`);
  }

  return result;
};

export const sendSignupOtp = async (email, otp) => {
  const normalized = normalizeEmail(email);
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await EmailOtp.findOneAndUpdate(
    { email: normalized, purpose: "signup" },
    {
      email: normalized,
      otpHash,
      purpose: "signup",
      attempts: 0,
      resendCount: 0,
      lastSentAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true },
  );

  return deliverOtpEmail(normalized, otp);
};

export const resendSignupOtp = async (email) => {
  const normalized = normalizeEmail(email);
  const existing = await EmailOtp.findOne({ email: normalized, purpose: "signup" });
  const windowStart = Date.now() - RESEND_WINDOW_MS;

  if (existing?.lastSentAt && existing.lastSentAt.getTime() > windowStart) {
    if (existing.resendCount >= MAX_RESENDS) {
      const err = new Error("Too many OTP requests. Try again in 15 minutes.");
      err.statusCode = 429;
      throw err;
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const resendCount =
    existing?.lastSentAt && existing.lastSentAt.getTime() > windowStart
      ? (existing.resendCount || 0) + 1
      : 1;

  await EmailOtp.findOneAndUpdate(
    { email: normalized, purpose: "signup" },
    {
      email: normalized,
      otpHash,
      purpose: "signup",
      attempts: 0,
      resendCount,
      lastSentAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true },
  );

  return deliverOtpEmail(normalized, otp);
};

export const verifySignupOtp = async (email, code) => {
  const normalized = normalizeEmail(email);
  const record = await EmailOtp.findOne({ email: normalized, purpose: "signup" });

  if (!record) {
    const err = new Error("Verification code expired or not found. Request a new one.");
    err.statusCode = 400;
    throw err;
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await EmailOtp.deleteOne({ _id: record._id });
    const err = new Error("Verification code expired. Request a new one.");
    err.statusCode = 400;
    throw err;
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await EmailOtp.deleteOne({ _id: record._id });
    const err = new Error("Too many failed attempts. Request a new code.");
    err.statusCode = 429;
    throw err;
  }

  const isMatch = await bcrypt.compare(String(code).trim(), record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    const err = new Error("Invalid verification code.");
    err.statusCode = 400;
    throw err;
  }

  await EmailOtp.deleteOne({ _id: record._id });
  devOtpByEmail.delete(normalized);
  return true;
};
