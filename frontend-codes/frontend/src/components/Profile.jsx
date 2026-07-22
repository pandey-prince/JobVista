import React, { useState } from 'react'
import UserAvatar from './shared/UserAvatar'
import { Button } from './ui/button'
import { Briefcase, Contact, GraduationCap, Link as LinkIcon, Mail, MapPin, Pen } from 'lucide-react'
import { Badge } from './ui/badge'
import ApplicationTracker from './ApplicationTracker'
import UpdateProfileDialog from './UpdateProfileDialog'
import { useSelector } from 'react-redux'
import { isProfileIncomplete } from '@/utils/profileValidation'
import { Link } from 'react-router-dom'
import OnboardingChecklist from '@/features/onboarding/OnboardingChecklist'

const Profile = () => {
    const [open, setOpen] = useState(false);
    const {user} = useSelector(store=>store.auth);

    return (
        <div>
            <div className='mx-auto my-5 max-w-4xl px-2 sm:px-0'>
                <OnboardingChecklist user={user} className="mb-5" />
            </div>
            <div className='mx-auto my-5 max-w-4xl rounded-2xl border border-border bg-card p-5 sm:p-8'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
                        <UserAvatar
                            name={user?.fullname}
                            className="h-20 w-20 sm:h-24 sm:w-24"
                            fallbackClassName="bg-brand-muted text-2xl font-bold text-brand sm:text-3xl"
                        />
                        <div className='min-w-0'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <h1 className='text-xl font-medium'>{user?.fullname}</h1>
                                {isProfileIncomplete(user) ? (
                                    <Badge variant="outline" className="border-brand/40 bg-brand-muted text-brand">
                                        Profile incomplete
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">Profile complete</Badge>
                                )}
                            </div>
                            <p className='break-words text-sm text-muted-foreground sm:text-base'>{user?.profile?.bio}</p>
                            {isProfileIncomplete(user) ? (
                                <Link to="/profile/setup" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                                    Complete your profile
                                </Link>
                            ) : null}
                        </div>
                    </div>
                    <Button onClick={() => setOpen(true)} className="self-start text-right" variant="outline"><Pen /></Button>
                </div>
                <div className='my-5'>
                    <div className='my-2 flex items-start gap-3'>
                        <Mail className='mt-1 h-4 w-4 shrink-0' />
                        <span className='break-all'>{user?.email}</span>
                    </div>
                    <div className='my-2 flex items-start gap-3'>
                        <Contact className='mt-1 h-4 w-4 shrink-0' />
                        <span className='break-words'>{user?.phoneNumber}</span>
                    </div>
                    {user?.profile?.location && (
                        <div className='my-2 flex items-start gap-3'>
                            <MapPin className='mt-1 h-4 w-4 shrink-0' />
                            <span className='break-words'>{user?.profile?.location}</span>
                        </div>
                    )}
                </div>
                <div className='my-5'>
                    <h1 className='flex items-center gap-2 font-semibold'><GraduationCap /> Education</h1>
                    <p className='mt-2 text-sm text-foreground/80'>
                        {[user?.profile?.college, user?.profile?.degree, user?.profile?.branch, user?.profile?.graduationYear]
                            .filter(Boolean)
                            .join(" - ") || "NA"}
                    </p>
                    {user?.profile?.cgpa && <p className='text-sm text-foreground/80'>CGPA: {user.profile.cgpa}</p>}
                </div>
                <div className='my-5'>
                    <h1>Skills</h1>
                    <div className='flex flex-wrap items-center gap-1'>
                        {
                            Array.isArray(user?.profile?.skills) && user.profile.skills.length
                              ? user.profile.skills.map((item, index) => <Badge key={index}>{item}</Badge>)
                              : <span>NA</span>
                        }
                    </div>
                </div>
                <div className='my-5'>
                    <h1>Preferred Roles</h1>
                    <div className='flex flex-wrap items-center gap-1'>
                        {
                            Array.isArray(user?.profile?.preferredJobRoles) && user.profile.preferredJobRoles.length
                              ? user.profile.preferredJobRoles.map((item, index) => <Badge key={index} variant="outline">{item}</Badge>)
                              : <span>NA</span>
                        }
                    </div>
                </div>
                <div className='my-5 grid gap-4 md:grid-cols-3'>
                    {user?.profile?.portfolio && <a className='flex items-center gap-2 break-all text-brand hover:underline' href={user.profile.portfolio} target='blank'><LinkIcon className='h-4 w-4 shrink-0' /> Portfolio</a>}
                    {user?.profile?.linkedin && <a className='flex items-center gap-2 break-all text-brand hover:underline' href={user.profile.linkedin} target='blank'><LinkIcon className='h-4 w-4 shrink-0' /> LinkedIn</a>}
                    {user?.profile?.github && <a className='flex items-center gap-2 break-all text-brand hover:underline' href={user.profile.github} target='blank'><LinkIcon className='h-4 w-4 shrink-0' /> GitHub</a>}
                </div>
                <div className='my-5'>
                    <h1 className='flex items-center gap-2 font-semibold'><Briefcase /> Experience</h1>
                    {Array.isArray(user?.profile?.experience) && user.profile.experience.length ? user.profile.experience.map((item, index) => (
                        <p key={index} className='mt-2 text-sm text-foreground/80'>{[item.title, item.company, item.duration, item.description].filter(Boolean).join(" - ")}</p>
                    )) : <span>NA</span>}
                </div>
                <div className='my-5'>
                    <h1 className='font-semibold'>Internships</h1>
                    {Array.isArray(user?.profile?.internships) && user.profile.internships.length ? user.profile.internships.map((item, index) => (
                        <p key={index} className='mt-2 text-sm text-foreground/80'>{[item.title, item.company, item.duration, item.description].filter(Boolean).join(" - ")}</p>
                    )) : <span>NA</span>}
                </div>
                <div className='my-5'>
                    <h1 className='font-semibold'>Projects</h1>
                    {Array.isArray(user?.profile?.projects) && user.profile.projects.length ? user.profile.projects.map((item, index) => (
                        <p key={index} className='mt-2 text-sm text-foreground/80'>{[item.title, item.link, item.description].filter(Boolean).join(" - ")}</p>
                    )) : <span>NA</span>}
                </div>
                <div className='grid w-full max-w-sm items-center gap-1.5'>
                    <h2 className="text-md font-bold">Resume</h2>
                    {
                        user?.profile?.resume ? <a target='blank' rel="noopener noreferrer" href={user?.profile?.resume} className='w-full cursor-pointer break-all text-brand hover:underline'>{user?.profile?.resumeOriginalName || "View Resume"}</a> : <span className="text-muted-foreground">NA</span>
                    }
                </div>
            </div>
            <div className='mx-auto max-w-6xl rounded-2xl bg-background px-2 sm:px-0'>
                <h1 className='my-5 text-lg font-bold'>Application Tracker</h1>
                <ApplicationTracker />
            </div>
            <UpdateProfileDialog open={open} setOpen={setOpen}/>
        </div>
    )
}

export default Profile
