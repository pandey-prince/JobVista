import React from 'react'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import CompanyLogo from './CompanyLogo'
import JobFreshnessBadges from './shared/JobFreshnessBadges'
import { getJobBadges } from '@/utils/jobBadges'

const LatestJobCards = ({job}) => {
    const navigate = useNavigate();
    const badges = getJobBadges(job);

    const openJob = () => {
        const isScrapedJob = String(job?._id || "").startsWith("scraped-");
        if (job?.external && job?.applicationLink && !isScrapedJob) {
            window.open(job.applicationLink, "_blank", "noopener,noreferrer");
            return;
        }
        navigate(`/description/${job._id}`);
    }

    const salaryText = typeof job?.salary === "number" ? `${job.salary}LPA` : job?.salary;

    return (
        <div
            onClick={openJob}
            className='cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
        >
            <div className='flex items-center justify-between gap-2'>
                <p className='text-xs font-medium text-gray-500'>{badges.freshnessLabel}</p>
            </div>
            <div className='mt-3 flex items-center gap-3'>
                <CompanyLogo company={job?.company} className="h-12 w-12" />
                <div className="min-w-0">
                    <h2 className='truncate font-medium text-lg'>{job?.company?.name}</h2>
                    <p className='text-sm text-gray-500'>{job?.location || "India"}</p>
                </div>
            </div>
            <div className='mt-4'>
                <h3 className='font-bold text-lg leading-snug'>{job?.title}</h3>
                <div className="mt-2">
                    <JobFreshnessBadges job={job} />
                </div>
                <p className='mt-3 text-sm text-gray-600 line-clamp-3'>{job?.description}</p>
            </div>
            <div className='mt-4 flex flex-wrap items-center gap-2'>
                <Badge className='font-semibold text-blue-700' variant="ghost">{job?.position} Positions</Badge>
                <Badge className='font-semibold text-[#F83002]' variant="ghost">{job?.jobType}</Badge>
                <Badge className='font-semibold text-[#7209b7]' variant="ghost">{salaryText}</Badge>
            </div>
        </div>
    )
}

export default LatestJobCards
