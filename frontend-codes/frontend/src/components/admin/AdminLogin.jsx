import React, { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/redux/authSlice";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const [input, setInput] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { loading, user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));
      const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      if (res.data.success) {
        if (res.data.user?.role !== "admin") {
          toast.error("This account is not an admin. Use the student login instead.");
          return;
        }
        dispatch(setUser(res.data.user));
        navigate("/admin");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 sm:px-6">
      <form onSubmit={submitHandler} className="w-full rounded-md border border-border p-6">
        <h1 className="text-xl font-bold">Admin login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ops access for career source monitoring and sync.
        </p>

        <div className="my-4">
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            value={input.email}
            onChange={(e) => setInput({ ...input, email: e.target.value })}
            required
          />
        </div>

        <div className="my-4">
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={input.password}
              onChange={(e) => setInput({ ...input, password: e.target.value })}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="text-brand hover:underline">
            Back to JobLeLo
          </Link>
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;
