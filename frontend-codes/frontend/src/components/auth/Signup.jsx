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

const Signup = () => {
  const [step, setStep] = useState("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [input, setInput] = useState({
    fullname: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { loading, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      dispatch(setLoading(true));
      const res = await authApi.register({ ...input, role: "student" });
      if (res.data.success && res.data.needsVerification) {
        setPendingEmail(res.data.email || input.email);
        setStep("otp");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleVerified = (verifiedUser) => {
    dispatch(setUser(verifiedUser));
    navigate("/profile/setup");
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, []);

  return (
    <div>
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 sm:px-6">
        <div className="my-10 w-full max-w-xl rounded-md border border-border p-4 sm:p-6">
          {step === "otp" ? (
            <VerifyEmailOtp
              email={pendingEmail}
              onVerified={handleVerified}
              onBack={() => setStep("form")}
            />
          ) : (
            <>
              <h1 className="mb-5 text-xl font-bold">Sign Up</h1>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your JobLeLo account to save jobs, set alerts, and track applications.
              </p>
              <form onSubmit={submitHandler}>
                <div className="my-2">
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    value={input.fullname}
                    name="fullname"
                    onChange={changeEventHandler}
                    placeholder="Jon Doe"
                    required
                  />
                </div>
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
                      placeholder="**********"
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
                    Signup
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
              <GoogleSignInButton />

              <span className="mt-4 block text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600">
                  Login
                </Link>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
