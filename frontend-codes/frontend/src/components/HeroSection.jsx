import React, { useState } from 'react'
import { Button } from './ui/button'
import { BriefcaseBusiness, Building2, Bot, Search, Wifi } from 'lucide-react'
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate } from 'react-router-dom';
import useGetPublicStats from '@/hooks/useGetPublicStats';

const formatCount = (value) => {
  if (!value && value !== 0) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k+`;
  return `${value}+`;
};

const HeroSection = () => {
    const [query, setQuery] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { stats, loading } = useGetPublicStats();

    const searchJobHandler = () => {
        dispatch(setSearchedQuery(query));
        navigate("/jobs");
    }

    const browseFreshJobs = () => {
        dispatch(setSearchedQuery(""));
        navigate("/jobs");
    }

    return (
        <div className='px-4 text-center sm:px-6'>
            <div className='mx-auto flex max-w-5xl flex-col gap-5 my-10'>
                <span className='mx-auto inline-flex items-center rounded-full bg-brand-muted px-4 py-2 text-sm font-medium text-brand'>
                    Fresh IT jobs from company career pages
                </span>
                <h1 className='text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl'>
                    See new IT roles <span className='text-brand'>before they flood LinkedIn</span>
                </h1>
                <p className='mx-auto max-w-2xl text-muted-foreground'>
                    JobVista monitors 100+ company career boards across India for fresher and 0–3 year IT openings.
                    Watch companies, save roles, and get email alerts when something new drops.
                </p>
                <div className='mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-card pl-3 shadow-lg sm:gap-4'>
                    <input
                        type="text"
                        placeholder='Search SDE, React, Python, Data...'
                        value={query}
                        onKeyDown={(e) => e.key === "Enter" && searchJobHandler()}
                        onChange={(e) => setQuery(e.target.value)}
                        className='w-full border-none bg-transparent py-3 text-foreground outline-none placeholder:text-muted-foreground'
                    />
                    <Button onClick={searchJobHandler} className="rounded-r-full bg-brand px-4 sm:px-6">
                        <Search className='h-5 w-5' />
                    </Button>
                </div>
                <div className='flex flex-wrap items-center justify-center gap-3'>
                    <Button onClick={browseFreshJobs} variant="outline" className="rounded-full">
                        Browse fresh IT jobs
                    </Button>
                    <Button onClick={() => navigate("/signup")} className="rounded-full bg-brand hover:bg-brand/90">
                        Create free account
                    </Button>
                </div>
                <div className='mx-auto mt-2 grid max-w-4xl grid-cols-2 gap-3 text-left md:grid-cols-4'>
                    <div className='rounded-xl border border-border bg-card p-4 shadow-sm'>
                        <BriefcaseBusiness className='h-5 w-5 text-brand' />
                        <h3 className='mt-2 text-lg font-bold'>
                            {loading ? "..." : formatCount(stats.totalJobs)}
                        </h3>
                        <p className='text-sm text-muted-foreground'>Live IT openings</p>
                    </div>
                    <div className='rounded-xl border border-border bg-card p-4 shadow-sm'>
                        <Building2 className='h-5 w-5 text-brand' />
                        <h3 className='mt-2 text-lg font-bold'>
                            {loading ? "..." : formatCount(stats.companiesMonitored)}
                        </h3>
                        <p className='text-sm text-muted-foreground'>Career pages monitored</p>
                    </div>
                    <div className='rounded-xl border border-border bg-card p-4 shadow-sm'>
                        <Wifi className='h-5 w-5 text-brand' />
                        <h3 className='mt-2 text-lg font-bold'>
                            {loading ? "..." : formatCount(stats.jobsAddedToday)}
                        </h3>
                        <p className='text-sm text-muted-foreground'>Added today</p>
                    </div>
                    <div className='rounded-xl border border-border bg-card p-4 shadow-sm'>
                        <Bot className='h-5 w-5 text-brand' />
                        <h3 className='mt-2 text-lg font-bold'>JobMate</h3>
                        <p className='text-sm text-muted-foreground'>AI career assistant</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeroSection
