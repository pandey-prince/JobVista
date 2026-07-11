import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import HeroSection from './HeroSection'
import CategoryCarousel from './CategoryCarousel'
import HowItWorks from './HowItWorks'
import LatestJobs from './LatestJobs'
import NewTodayJobs from './NewTodayJobs'
import RecommendedJobs from './RecommendedJobs'
import OnboardingChecklist from '@/features/onboarding/OnboardingChecklist'
import useOnboardingProgress from '@/features/onboarding/useOnboardingProgress'

const ONBOARDING_BANNER_KEY = 'jobvista-onboarding-banner-dismissed'

const Home = () => {
  const { user } = useSelector((store) => store.auth)
  const { isComplete, loading } = useOnboardingProgress(user)
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem(ONBOARDING_BANNER_KEY) === 'true',
  )

  useEffect(() => {
    if (isComplete) {
      localStorage.removeItem(ONBOARDING_BANNER_KEY)
      setBannerDismissed(false)
    }
  }, [isComplete])

  const showBanner =
    user?.role === 'student' && !loading && !isComplete && !bannerDismissed

  const dismissBanner = () => {
    localStorage.setItem(ONBOARDING_BANNER_KEY, 'true')
    setBannerDismissed(true)
  }

  return (
    <div>
      {showBanner ? (
        <OnboardingChecklist
          user={user}
          variant="banner"
          onDismiss={dismissBanner}
        />
      ) : null}
      <HeroSection />
      <NewTodayJobs />
      <RecommendedJobs />
      <HowItWorks />
      <CategoryCarousel />
      <LatestJobs />
    </div>
  )
}

export default Home
