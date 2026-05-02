import React, { useEffect, useState } from "react";
import Navbar from "./shared/Navbar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { USER_API_END_POINT } from "@/utils/constant";
import { buildProfileFormData, profileInitialState } from "@/utils/profileForm";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "@/redux/authSlice";
import { toast } from "sonner";

const ProfileSetup = () => {
  const { user } = useSelector((store) => store.auth);
  const [input, setInput] = useState(profileInitialState(user));
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

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const fileChangeHandler = (e) => {
    setInput({ ...input, file: e.target.files?.[0] });
  };

  const saveProfile = async (skipped = false) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${USER_API_END_POINT}/profile/update`,
        buildProfileFormData(input, skipped),
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success(skipped ? "You can complete your profile later." : res.data.message);
        navigate("/profile");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save profile");
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    saveProfile(false);
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto my-6 border border-gray-200 rounded-md p-6 bg-white">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bold text-2xl">Complete your JobVista profile</h1>
            <p className="text-sm text-gray-600 mt-1">
              Add education, skills, experience, internships and links so recruiters can understand you better.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => saveProfile(true)} disabled={loading}>
            Skip for now
          </Button>
        </div>

        <form onSubmit={submitHandler} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input name="fullname" value={input.fullname} onChange={changeEventHandler} />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={input.email} onChange={changeEventHandler} />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input name="phoneNumber" value={input.phoneNumber} onChange={changeEventHandler} />
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <textarea
              name="bio"
              value={input.bio}
              onChange={changeEventHandler}
              className="w-full min-h-20 border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Example: Final year CSE student interested in frontend development"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>College</Label>
              <Input name="college" value={input.college} onChange={changeEventHandler} />
            </div>
            <div>
              <Label>Degree</Label>
              <Input name="degree" value={input.degree} onChange={changeEventHandler} placeholder="B.Tech" />
            </div>
            <div>
              <Label>Branch</Label>
              <Input name="branch" value={input.branch} onChange={changeEventHandler} placeholder="CSE" />
            </div>
            <div>
              <Label>Graduation Year</Label>
              <Input name="graduationYear" value={input.graduationYear} onChange={changeEventHandler} />
            </div>
            <div>
              <Label>CGPA</Label>
              <Input name="cgpa" value={input.cgpa} onChange={changeEventHandler} />
            </div>
            <div>
              <Label>Location</Label>
              <Input name="location" value={input.location} onChange={changeEventHandler} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Skills</Label>
              <Input
                name="skills"
                value={input.skills}
                onChange={changeEventHandler}
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div>
              <Label>Preferred Job Roles</Label>
              <Input
                name="preferredJobRoles"
                value={input.preferredJobRoles}
                onChange={changeEventHandler}
                placeholder="Frontend Developer, MERN Intern"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Portfolio</Label>
              <Input name="portfolio" value={input.portfolio} onChange={changeEventHandler} />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input name="linkedin" value={input.linkedin} onChange={changeEventHandler} />
            </div>
            <div>
              <Label>GitHub</Label>
              <Input name="github" value={input.github} onChange={changeEventHandler} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Experience</Label>
              <textarea
                name="experience"
                value={input.experience}
                onChange={changeEventHandler}
                className="w-full min-h-28 border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Title | Company | Duration | Description"
              />
            </div>
            <div>
              <Label>Internships</Label>
              <textarea
                name="internships"
                value={input.internships}
                onChange={changeEventHandler}
                className="w-full min-h-28 border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Title | Company | Duration | Description"
              />
            </div>
            <div>
              <Label>Projects</Label>
              <textarea
                name="projects"
                value={input.projects}
                onChange={changeEventHandler}
                className="w-full min-h-28 border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Project | Link | Description"
              />
            </div>
          </div>

          <div>
            <Label>Resume</Label>
            <Input type="file" accept="application/pdf" onChange={fileChangeHandler} />
          </div>

          <Button type="submit" className="w-full bg-[#6A38C2] hover:bg-[#5b30a6]" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
