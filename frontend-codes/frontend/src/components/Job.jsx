import React from 'react'
import { Button } from './ui/button'
import { Bookmark } from 'lucide-react'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import CompanyLogo from './CompanyLogo'

const Job = ({job}) => {
    const navigate = useNavigate();
    // const jobId = "lsekdhjgdsnfvsdkjf";

    const daysAgoFunction = (mongodbTime) => {
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        return Math.floor(timeDifference/(1000*24*60*60));
    }

    const openDetails = () => {
        if (job?.external && job?.applicationLink) {
            window.open(job.applicationLink, "_blank", "noopener,noreferrer");
            return;
        }
        navigate(`/description/${job?._id}`);
    }

    const salaryText = typeof job?.salary === "number" ? `${job.salary}LPA` : job?.salary;
    const daysAgo = daysAgoFunction(job?.createdAt);
    
    return (
        <div className='p-5 rounded-md shadow-xl bg-white border border-gray-100'>
            <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500'>{daysAgo === 0 ? "Today" : `${daysAgo} days ago`}</p>
                <Button variant="outline" className="rounded-full" size="icon"><Bookmark /></Button>
            </div>

            <div className='flex items-center gap-3 my-4'>
                <CompanyLogo company={job?.company} className="h-14 w-14" />
                <div>
                    <h1 className='font-medium text-lg'>{job?.company?.name}</h1>
                    <p className='text-sm text-gray-500'>{job?.location || "India"}</p>
                </div>
            </div>

            <div>
                <div className='flex items-center gap-2'>
                    <h1 className='font-bold text-lg my-2'>{job?.title}</h1>
                    {job?.external && <Badge className='text-green-700 font-bold' variant="ghost">{job.externalSource}</Badge>}
                </div>
                <p className='text-sm text-gray-600 line-clamp-3'>{job?.description}</p>
            </div>
            <div className='flex items-center gap-2 mt-4'>
                <Badge className={'text-blue-700 font-bold'} variant="ghost">{job?.position} Positions</Badge>
                <Badge className={'text-[#F83002] font-bold'} variant="ghost">{job?.jobType}</Badge>
                <Badge className={'text-[#7209b7] font-bold'} variant="ghost">{salaryText}</Badge>
            </div>
            <div className='flex items-center gap-4 mt-4'>
                <Button onClick={openDetails} variant="outline">{job?.external ? "View Source" : "Details"}</Button>
                <Button className="bg-[#7209b7]">Save For Later</Button>
            </div>
        </div>
    )
}

export default Job
