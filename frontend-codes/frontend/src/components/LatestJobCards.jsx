import React, { useState } from 'react'
import { Badge } from './ui/badge'
import CompanyLogo from './CompanyLogo'
import JobFreshnessBadges from './shared/JobFreshnessBadges'
import JobQuickView from '@/features/job-detail/JobQuickView'
import { getJobBadges } from '@/utils/jobBadges'
import { cleanJobText } from '@/utils/jobText'

const LatestJobCards = ({job}) => {
    const [quickViewOpen, setQuickViewOpen] = useState(false);
    const badges = getJobBadges(job);
    const salaryText = typeof job?.salary === "number" ? `${job.salary}LPA` : job?.salary;

    return (
        <>
        <div
            onClick={() => setQuickViewOpen(true)}
            className='cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
        >
            <div className='flex items-center justify-between gap-2'>
                <p className='text-xs font-medium text-muted-foreground'>{badges.freshnessLabel}</p>
            </div>
            <div className='mt-3 flex items-center gap-3'>
                <CompanyLogo company={job?.company} className="h-12 w-12" />
                <div className="min-w-0">
                    <h2 className='truncate font-medium text-lg'>{job?.company?.name}</h2>
                    <p className='text-sm text-muted-foreground'>{job?.location || "India"}</p>
                </div>
            </div>
            <div className='mt-4'>
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
                <Badge className='font-semibold text-accent-violet' variant="ghost">{salaryText}</Badge>
            </div>
        </div>

        <JobQuickView job={job} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
        </>
    )
}

export default LatestJobCards
