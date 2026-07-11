import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/redux/authSlice";
import { toast } from "sonner";
import { buildProfileFormData } from "@/utils/profileForm";
import ProfileForm from "@/features/profile/ProfileForm";

const UpdateProfileDialog = ({ open, setOpen }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  const saveProfile = async (formInput) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${USER_API_END_POINT}/profile/update`,
        buildProfileFormData(formInput),
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(res.data.message);
        setOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col overflow-hidden p-0 sm:max-w-[760px]">
        <DialogHeader className="border-b border-border px-4 py-4 sm:px-6">
          <DialogTitle>Update profile</DialogTitle>
          <DialogDescription>
            Add your skills, education, and experience for better job matches and alerts.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6">
          <ProfileForm
            key={open ? user?._id : "closed"}
            user={user}
            loading={loading}
            onSubmit={saveProfile}
            submitLabel="Update profile"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProfileDialog;
