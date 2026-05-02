import React from 'react'
import { Label } from './ui/label'
import { Button } from './ui/button'

const filterData = [
    {
        key: "locations",
        filterType: "Location",
        array: ["Remote", "Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai"]
    },
    {
        key: "roles",
        filterType: "Role",
        array: ["Frontend Developer", "Backend Developer", "FullStack Developer", "React", "Node", "Python"]
    },
    {
        key: "jobTypes",
        filterType: "Job Type",
        array: ["Full Time", "Part Time", "Contractor", "Intern", "Remote"]
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

    return (
        <div className='w-full bg-white p-3 rounded-md'>
            <div className='flex items-center justify-between gap-2'>
                <h1 className='font-bold text-lg'>Filter Jobs</h1>
                <Button type="button" variant="link" className="px-0 text-sm" onClick={onClear}>Clear</Button>
            </div>
            <hr className='mt-3' />
            {
                filterData.map((data, index) => (
                    <div key={data.key} className='mt-4'>
                        <h1 className='font-bold text-base'>{data.filterType}</h1>
                        {
                            data.array.map((item, idx) => {
                                const itemId = `id${index}-${idx}`
                                return (
                                    <div key={item} className='flex items-center space-x-2 my-2'>
                                        <input
                                            type="checkbox"
                                            checked={selectedFilters[data.key]?.includes(item) || false}
                                            id={itemId}
                                            onChange={() => changeHandler(data.key, item)}
                                            className='h-4 w-4 accent-[#6A38C2] cursor-pointer'
                                        />
                                        <Label htmlFor={itemId} className="cursor-pointer">{item}</Label>
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
