'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const Logo = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Logo), { ssr: false })
const Stars = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Stars), { ssr: false })
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})

export default function Page() {
  return (
    <div className='flex flex-col w-full h-full'>
      <div className='mx-auto flex w-full h-fit flex-col flex-wrap items-center p-10 md:flex-row  lg:w-4/5'>
        {/* first row */}
        <div className='relative h-48 w-full sm:w-1/2'>
          <h2 className='mb-3 text-3xl font-bold leading-none text-white '>New Media by TPO + F </h2>
          <p className='mb-8 text-gray-300'>
            TPO means Time, Place, Occasion. And F means Favor, Feedback... It is a new media ux design project founded
            by Sejin Oh and Hyungdong Hwhang.
          </p>
        </div>
        <div className='relative h-48 w-full sm:w-1/2'>
          {/* 
          //@ts-ignore */}
          <View className='relative h-full sm:h-48 sm:w-full'>
            <Suspense fallback={null}>
              <ambientLight />
              <pointLight position={[20, 30, 10]} intensity={3} decay={0.2} />
              <Logo scale={1} position={[0, 0, 0]} rotation={[0, 0, 0]} />
            </Suspense>
          </View>
        </div>
      </div>
      <div className='flex h-full w-full'>
        {/* 
          //@ts-ignore */}
        <View orbit className='relative size-full'>
          <Suspense fallback={null}>
            <Stars />
          </Suspense>
        </View>
      </div>
    </div>
  )
}
