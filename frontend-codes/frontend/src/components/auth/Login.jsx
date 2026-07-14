import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/redux/authSlice";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import VerifyEmailOtp from "./VerifyEmailOtp";
import GoogleSignInButton from "./GoogleSignInButton";

const Login = () => {
  const [input, setInput] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const { loading, user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));
      const res = await authApi.login(input);
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        if (res.data.user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
        toast.success(res.data.message);
      }
    } catch (error) {
      const data = error.response?.data;
      if (data?.needsVerification) {
        setPendingEmail(data.email || input.email);
        setStep("otp");
        toast.message(data.message || "Verify your email to continue");
      } else {
        toast.error(data?.message || "Login failed");
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleVerified = (verifiedUser) => {
    dispatch(setUser(verifiedUser));
    if (verifiedUser?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div>
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6">
        <div className="my-10 w-full max-w-md rounded-md border border-border p-4 sm:p-6">
          {step === "otp" ? (
            <VerifyEmailOtp
              email={pendingEmail}
              onVerified={handleVerified}
              onBack={() => setStep("form")}
              successRedirect="/"
            />
          ) : (
            <>
              <h1 className="mb-5 text-xl font-bold">Login</h1>
              <form onSubmit={submitHandler}>
                <div className="my-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={input.email}
                    name="email"
                    onChange={changeEventHandler}
                    placeholder="user@email.com"
                    required
                  />
                </div>

                <div className="my-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={input.password}
                      name="password"
                      onChange={changeEventHandler}
                      placeholder="********"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {loading ? (
                  <Button className="my-4 w-full" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                  </Button>
                ) : (
                  <Button type="submit" className="my-4 w-full">
                    Login
                  </Button>
                )}
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <GoogleSignInButton redirectTo="/" />

              <span className="mt-4 block text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="text-blue-600">
                  Signup
                </Link>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
