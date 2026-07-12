import React, { useEffect, useRef, useCallback, useState } from "react";
import { authApi } from "@/api";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/authSlice";
import { useNavigate } from "react-router-dom";

const GOOGLE_SCRIPT_ID = "google-gsi-client";

const GoogleSignInButton = ({ onSuccess, redirectTo = "/" }) => {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(async (response) => {
    try {
      const res = await authApi.googleLogin({ credential: response.credential });
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(res.data.message);
        if (onSuccess) {
          onSuccess(res.data.user);
        } else if (res.data.user?.role === "admin") {
          navigate("/admin");
        } else if (!res.data.user?.phoneNumber) {
          navigate("/profile/setup");
        } else {
          navigate(redirectTo);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Google sign-in failed");
    }
  }, [dispatch, navigate, onSuccess, redirectTo]);

  useEffect(() => {
    if (!clientId) return undefined;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      // #region agent log
      fetch('http://127.0.0.1:7533/ingest/ab9d03cf-9a58-4f5a-9174-f3b9b67f6bd5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'adbcde'},body:JSON.stringify({sessionId:'adbcde',location:'GoogleSignInButton.jsx:initGoogle',message:'google gsi init',data:{origin:window.location.origin,hasClientId:Boolean(clientId),clientIdSuffix:clientId?clientId.slice(-12):null,siteUrl:import.meta.env.VITE_SITE_URL||null},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: buttonRef.current.offsetWidth || 320,
      });
      setReady(true);
    };

    if (document.getElementById(GOOGLE_SCRIPT_ID)) {
      initGoogle();
      return undefined;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);

    return () => {};
  }, [clientId, handleCredential]);

  if (!clientId) {
    return null;
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className={`flex min-h-[44px] w-full justify-center ${ready ? "" : "hidden"}`} />
      {!ready ? (
        <p className="text-center text-xs text-muted-foreground">Loading Google sign-in…</p>
      ) : null}
    </div>
  );
};

export default GoogleSignInButton;
