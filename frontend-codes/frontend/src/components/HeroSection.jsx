import React, { useState } from 'react'
import { Button } from './ui/button'
import { BriefcaseBusiness, Building2, Bot, Search, Wifi } from 'lucide-react'
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const [query, setQuery] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const searchJobHandler = () => {
        dispatch(setSearchedQuery(query));
        navigate("/jobs");
    }

    return (
        <div className='px-4 text-center sm:px-6'>
            <div className='flex flex-col gap-5 my-10'>
                <span className='mx-auto rounded-full bg-gray-100 px-4 py-2 font-medium text-[#F83002]'>Job search made simpler</span>
                <h1 className='text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl'>Search, Apply & <br /> Get Your <span className='text-[#6A38C2]'>Dream Job</span></h1>
                <p className='mx-auto max-w-2xl text-gray-600'>Find internships, fresher jobs, and remote opportunities from recruiters and trusted external sources. Build your profile, apply faster, and get career guidance from JobMate.</p>
                <div className='mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-gray-200 pl-3 shadow-lg sm:gap-4'>
                    <input
                        type="text"
                        placeholder='Find your dream jobs'
                        value={query}
                        onKeyDown={(e) => e.key === "Enter" && searchJobHandler()}
                        onChange={(e) => setQuery(e.target.value)}
                        className='w-full border-none outline-none'

                    />
                    <Button onClick={searchJobHandler} className="rounded-r-full bg-[#6A38C2] px-4 sm:px-6">
                        <Search className='h-5 w-5' />
                    </Button>
                </div>
                <div className='mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-3 text-left md:grid-cols-4'>
                    <div className='rounded-md border border-gray-200 bg-white p-4'>
                        <BriefcaseBusiness className='h-5 w-5 text-[#6A38C2]' />
                        <h3 className='mt-2 text-lg font-bold'>500+</h3>
                        <p className='text-sm text-gray-500'>Job opportunities</p>
                    </div>
                    <div className='rounded-md border border-gray-200 bg-white p-4'>
                        <Building2 className='h-5 w-5 text-[#6A38C2]' />
                        <h3 className='mt-2 text-lg font-bold'>100+</h3>
                        <p className='text-sm text-gray-500'>Hiring companies</p>
                    </div>
                    <div className='rounded-md border border-gray-200 bg-white p-4'>
                        <Wifi className='h-5 w-5 text-[#6A38C2]' />
                        <h3 className='mt-2 text-lg font-bold'>Remote</h3>
                        <p className='text-sm text-gray-500'>External openings</p>
                    </div>
                    <div className='rounded-md border border-gray-200 bg-white p-4'>
                        <Bot className='h-5 w-5 text-[#6A38C2]' />
                        <h3 className='mt-2 text-lg font-bold'>JobMate</h3>
                        <p className='text-sm text-gray-500'>AI career assistant</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroSection
