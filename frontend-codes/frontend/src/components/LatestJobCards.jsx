import React from 'react'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import CompanyLogo from './CompanyLogo'

const LatestJobCards = ({job}) => {
    const navigate = useNavigate();
    const openJob = () => {
        if (job?.external && job?.applicationLink) {
            window.open(job.applicationLink, "_blank", "noopener,noreferrer");
            return;
        }
        navigate(`/description/${job._id}`);
    }
    const salaryText = typeof job?.salary === "number" ? `${job.salary}LPA` : job?.salary;
    return (
        <div onClick={openJob} className='p-5 rounded-md shadow-xl bg-white border border-gray-100 cursor-pointer'>
            <div className='flex items-center gap-3'>
                <CompanyLogo company={job?.company} className="h-12 w-12" />
                <div>
                    <h1 className='font-medium text-lg'>{job?.company?.name}</h1>
                    <p className='text-sm text-gray-500'>{job?.location || "India"}</p>
                </div>
            </div>
            <div>
                <h1 className='font-bold text-lg my-2'>{job?.title}</h1>
                <p className='text-sm text-gray-600 line-clamp-3'>{job?.description}</p>
            </div>
            <div className='flex items-center gap-2 mt-4'>
                <Badge className={'text-blue-700 font-bold'} variant="ghost">{job?.position} Positions</Badge>
                <Badge className={'text-[#F83002] font-bold'} variant="ghost">{job?.jobType}</Badge>
                <Badge className={'text-[#7209b7] font-bold'} variant="ghost">{salaryText}</Badge>
                {job?.external && <Badge className='text-green-700 font-bold' variant="ghost">{job.externalSource}</Badge>}
            </div>

        </div>
    )
}

export default LatestJobCards
