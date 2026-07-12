import React, { useEffect, useState } from "react";
import { USER_API_END_POINT } from "@/utils/constant";
import { buildProfileFormData } from "@/utils/profileForm";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "@/redux/authSlice";
import { toast } from "sonner";
import ProfileForm from "@/features/profile/ProfileForm";

const ProfileSetup = () => {
  const { user } = useSelector((store) => store.auth);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      navigate("/");
    }
  }, [user, navigate]);

  const saveProfile = async (formInput, skipped = false) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${USER_API_END_POINT}/profile/update`,
        buildProfileFormData(formInput, skipped),
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        if (skipped) {
          toast.success("You can complete your profile later.");
          navigate("/profile");
        } else {
          toast.success(res.data.message);
          toast.info("Next: watch 3 companies to get instant alerts when they post new jobs.", {
            duration: 6000,
          });
          navigate("/my-companies");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto my-6 max-w-3xl rounded-md border border-border bg-card p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Complete your JobLeLo profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add education, skills, experience, internships, and links so employers can understand you better.
        </p>
      </div>

      <ProfileForm
        user={user}
        loading={loading}
        showSkip
        onSkip={(formInput) => saveProfile(formInput, true)}
        onSubmit={(formInput) => saveProfile(formInput, false)}
        submitLabel="Save profile"
      />
    </div>
  );
};

export default ProfileSetup;
