import React, { useState } from 'react'
import { Button } from './ui/button'
import { Bookmark } from 'lucide-react'
import { Badge } from './ui/badge'
import CompanyLogo from './CompanyLogo'
import JobFreshnessBadges from './shared/JobFreshnessBadges'
import JobQuickView from '@/features/job-detail/JobQuickView'
import { getJobBadges } from '@/utils/jobBadges'
import { cleanJobText } from '@/utils/jobText'
import useSavedJobs from '@/hooks/useSavedJobs'

const Job = ({job}) => {
    const [quickViewOpen, setQuickViewOpen] = useState(false);
    const { isSaved, toggleSaveJob } = useSavedJobs();
    const badges = getJobBadges(job);
    const saved = isSaved(job?._id);

    const handleSave = async (e) => {
        e.stopPropagation();
        await toggleSaveJob(job);
    }

    const salaryText = typeof job?.salary === "number" ? `${job.salary}LPA` : job?.salary;
    
    return (
        <>
        <div
            className='flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer'
            onClick={() => setQuickViewOpen(true)}
        >
            <div className='flex items-center justify-between gap-3'>
                <p className='text-sm font-medium text-muted-foreground'>{badges.freshnessLabel}</p>
                <Button
                    variant="outline"
                    className={`rounded-full shrink-0 ${saved ? "border-brand text-brand" : ""}`}
                    size="icon"
                    aria-label={saved ? "Unsave job" : "Save job"}
                    onClick={handleSave}
                >
                    <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                </Button>
            </div>

            <div className='mt-3 flex items-center gap-3'>
                <CompanyLogo company={job?.company} className="h-14 w-14" />
                <div className="min-w-0">
                    <h2 className='truncate font-medium text-lg'>{job?.company?.name}</h2>
                    <p className='text-sm text-muted-foreground'>{job?.location || "India"}</p>
                </div>
            </div>

            <div className='mt-4 flex-1'>
                <h3 className='font-bold text-lg leading-snug'>{job?.title}</h3>
                <div className="mt-2">
                    <JobFreshnessBadges job={job} />
                </div>
                <p className='mt-3 text-sm text-muted-foreground line-clamp-3'>
                    {cleanJobText(job?.description, { maxLength: 220 })}
                </p>
            </div>

            <div className='mt-4 flex flex-wrap items-center gap-2'>
                <Badge className='font-semibold text-blue-700' variant="ghost">{job?.position} Positions</Badge>
                <Badge className='font-semibold text-accent-orange' variant="ghost">{job?.jobType}</Badge>
                <Badge className='font-semibold text-accent-amber' variant="ghost">{salaryText}</Badge>
            </div>

            <div className='mt-4 flex items-center gap-3'>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        setQuickViewOpen(true);
                    }}
                    variant="outline"
                    className="flex-1"
                >
                    Quick view
                </Button>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSave(e);
                    }}
                    className="flex-1 bg-accent-amber text-white hover:bg-accent-amber/90"
                >
                    {saved ? "Saved" : "Save"}
                </Button>
            </div>
        </div>

        <JobQuickView job={job} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
        </>
    )
}

export default Job
