import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { setUser } from '@/redux/authSlice'
import { toast } from 'sonner'
import { buildProfileFormData, profileInitialState } from '@/utils/profileForm'

const UpdateProfileDialog = ({ open, setOpen }) => {
    const [loading, setLoading] = useState(false);
    const { user } = useSelector(store => store.auth);

    const [input, setInput] = useState(profileInitialState(user));
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        const formData = buildProfileFormData(input);
        try {
            setLoading(true);
            const res = await axios.post(`${USER_API_END_POINT}/profile/update`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            if (res.data.success) {
                dispatch(setUser(res.data.user));
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally{
            setLoading(false);
        }
        setOpen(false);
    }

    const fieldRowClassName = 'grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4';
    const labelClassName = 'sm:text-right';
    const inputClassName = 'sm:col-span-3';
    const textareaClassName = 'min-h-20 rounded-md border border-border px-3 py-2 text-sm sm:col-span-3';

    return (
        <div>
            <Dialog open={open}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[760px]" onInteractOutside={() => setOpen(false)}>
                    <DialogHeader>
                        <DialogTitle>Update Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitHandler}>
                        <div className='grid gap-4 py-4'>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="name" className={labelClassName}>Name</Label>
                                <Input id="fullname" name="fullname" type="text" value={input.fullname} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="email" className={labelClassName}>Email</Label>
                                <Input id="email" name="email" type="email" value={input.email} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="number" className={labelClassName}>Number</Label>
                                <Input id="phoneNumber" name="phoneNumber" value={input.phoneNumber} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="bio" className={labelClassName}>Bio</Label>
                                <Input id="bio" name="bio" value={input.bio} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="skills" className={labelClassName}>Skills</Label>
                                <Input id="skills" name="skills" value={input.skills} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="college" className={labelClassName}>College</Label>
                                <Input id="college" name="college" value={input.college} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="degree" className={labelClassName}>Degree</Label>
                                <Input id="degree" name="degree" value={input.degree} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="branch" className={labelClassName}>Branch</Label>
                                <Input id="branch" name="branch" value={input.branch} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="graduationYear" className={labelClassName}>Grad Year</Label>
                                <Input id="graduationYear" name="graduationYear" value={input.graduationYear} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="cgpa" className={labelClassName}>CGPA</Label>
                                <Input id="cgpa" name="cgpa" value={input.cgpa} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="location" className={labelClassName}>Location</Label>
                                <Input id="location" name="location" value={input.location} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="preferredJobRoles" className={labelClassName}>Job Roles</Label>
                                <Input id="preferredJobRoles" name="preferredJobRoles" value={input.preferredJobRoles} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="portfolio" className={labelClassName}>Portfolio</Label>
                                <Input id="portfolio" name="portfolio" value={input.portfolio} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="linkedin" className={labelClassName}>LinkedIn</Label>
                                <Input id="linkedin" name="linkedin" value={input.linkedin} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="github" className={labelClassName}>GitHub</Label>
                                <Input id="github" name="github" value={input.github} onChange={changeEventHandler} className={inputClassName} />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="experience" className={labelClassName}>Experience</Label>
                                <textarea id="experience" name="experience" value={input.experience} onChange={changeEventHandler} className={textareaClassName} placeholder="Title | Company | Duration | Description" />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="internships" className={labelClassName}>Internships</Label>
                                <textarea id="internships" name="internships" value={input.internships} onChange={changeEventHandler} className={textareaClassName} placeholder="Title | Company | Duration | Description" />
                            </div>
                            <div className={fieldRowClassName}>
                                <Label htmlFor="projects" className={labelClassName}>Projects</Label>
                                <textarea id="projects" name="projects" value={input.projects} onChange={changeEventHandler} className={textareaClassName} placeholder="Project | Link | Description" />
                            </div>
                        </div>
                        <DialogFooter>
                            {
                                loading ? <Button className="my-4 w-full"> <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Please wait </Button> : <Button type="submit" className="my-4 w-full">Update</Button>
                            }
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default UpdateProfileDialog
