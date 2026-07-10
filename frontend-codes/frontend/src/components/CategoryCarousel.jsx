import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { Button } from './ui/button';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSearchedQuery } from '@/redux/jobSlice';

const category = [
    "Frontend Developer",
    "Backend Developer",
    "FullStack Developer",
    "React Developer",
    "Python Developer",
    "Data Science",
    "DevOps Engineer",
    "SDE Intern",
]

const CategoryCarousel = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const searchJobHandler = (query) => {
        dispatch(setSearchedQuery(query));
        navigate("/jobs");
    }

    return (
        <section className="mx-auto my-16 max-w-4xl px-4 sm:px-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Popular IT roles</h2>
                <p className="mt-2 text-sm text-muted-foreground">Tap a role to search fresher and early-career openings</p>
            </div>
            <Carousel className="mx-auto mt-6 w-full max-w-2xl">
                <CarouselContent>
                    {
                        category.map((cat) => (
                            <CarouselItem key={cat} className="basis-1/2 md:basis-1/3">
                                <Button
                                    onClick={() => searchJobHandler(cat)}
                                    variant="outline"
                                    className="w-full rounded-full border-brand/30 hover:bg-brand-muted"
                                >
                                    {cat}
                                </Button>
                            </CarouselItem>
                        ))
                    }
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </section>
    )
}

export default CategoryCarousel
