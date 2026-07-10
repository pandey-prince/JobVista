import React from 'react'
import { Label } from './ui/label'
import { Button } from './ui/button'

const filterData = [
    {
        key: "locations",
        filterType: "City / Location",
        array: [
            "Bangalore",
            "Hyderabad",
            "Pune",
            "Mumbai",
            "Delhi NCR",
            "Chennai",
            "Kolkata",
            "Ahmedabad",
            "Remote",
        ],
    },
    {
        key: "workModes",
        filterType: "Work Mode",
        array: ["Remote", "Hybrid", "On-site"],
    },
    {
        key: "experienceLevels",
        filterType: "Experience",
        array: ["Fresher", "0-1 year", "1-3 years", "3-5 years", "5+ years", "Internship"],
    },
    {
        key: "roles",
        filterType: "Role / Skill",
        array: [
            "Software Engineer",
            "Frontend / React",
            "Backend / Node",
            "Full Stack",
            "DevOps / Cloud",
            "Data / ML / AI",
            "QA / Testing",
            "Java",
            "Python",
        ],
    },
    {
        key: "jobTypes",
        filterType: "Job Type",
        array: ["Full-time", "Internship", "Contract", "Part-time"],
    },
    {
        key: "postedWithin",
        filterType: "Posted",
        array: ["Last 24 hours", "Last 7 days", "Last 30 days"],
    },
]

const FilterCard = ({ selectedFilters, onFilterChange, onClear }) => {
    const changeHandler = (groupKey, value) => {
        const currentValues = selectedFilters[groupKey] || [];
        const nextValues = currentValues.includes(value)
            ? currentValues.filter((item) => item !== value)
            : [...currentValues, value];

        onFilterChange({ ...selectedFilters, [groupKey]: nextValues });
    }

    const activeCount = Object.values(selectedFilters).reduce(
        (count, values) => count + (values?.length || 0),
        0,
    );

    return (
        <div className='w-full rounded-md border border-border bg-card p-3 shadow-sm'>
            <div className='flex items-center justify-between gap-2'>
                <div>
                    <h1 className='font-bold text-lg'>Filter Jobs</h1>
                    {activeCount > 0 && (
                        <p className="text-xs text-muted-foreground">{activeCount} active</p>
                    )}
                </div>
                <Button type="button" variant="link" className="px-0 text-sm" onClick={onClear}>
                    Clear all
                </Button>
            </div>
            <hr className='mt-3' />
            {
                filterData.map((data, index) => (
                    <div key={data.key} className='mt-4'>
                        <h2 className='font-bold text-base'>{data.filterType}</h2>
                        {
                            data.array.map((item, idx) => {
                                const itemId = `filter-${data.key}-${idx}`
                                return (
                                    <div key={item} className='flex items-center space-x-2 my-2'>
                                        <input
                                            type="checkbox"
                                            checked={selectedFilters[data.key]?.includes(item) || false}
                                            id={itemId}
                                            onChange={() => changeHandler(data.key, item)}
                                            className='h-4 w-4 accent-brand cursor-pointer'
                                        />
                                        <Label htmlFor={itemId} className="cursor-pointer text-sm">{item}</Label>
                                    </div>
                                )
                            })
                        }
                    </div>
                ))
            }
        </div>
    )
}

export default FilterCard
