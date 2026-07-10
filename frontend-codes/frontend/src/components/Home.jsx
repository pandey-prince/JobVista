import React from 'react'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'
import HowItWorks from './HowItWorks'
import LatestJobs from './LatestJobs'

const Home = () => {
  return (
    <div>
      <HeroSection />
      <HowItWorks />
      <CategoryCarousel />
      <LatestJobs />
    </div>
  )
}

export default Home
