'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sphere, Line, Resize, OrbitControls, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { Perf } from 'r3f-perf'

const Stars = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Stars), { ssr: false })
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })
const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-white' fill='none' viewBox='0 0 24 24'>
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

function Node({ position, onHover, onUnhover, hovered }) {
  return (
    <>
      <Sphere args={[1, 32, 32]} position={position} onPointerOver={onHover} onPointerOut={onUnhover}>
        <meshBasicMaterial attach='material' color={hovered ? 'red' : 'white'} />
      </Sphere>
    </>
  )
}

function Edge({ points }) {
  return <Line points={points} color='skyblue' lineWidth={0.1} />
}

function Network() {
  const [hoveredNode, setHoveredNode] = useState(null)

  const nodes = useMemo(() => {
    const nodes = []
    const radius = 150
    for (let i = 0; i < 300; i++) {
      const alpha = Math.random() * Math.PI * 2
      const beta = Math.random() * Math.PI - Math.PI / 2
      const x = radius * Math.sin(alpha) * Math.cos(beta)
      const y = radius * Math.sin(alpha) * Math.sin(beta)
      const z = radius * Math.cos(alpha)
      nodes.push(new THREE.Vector3(x, y, z))
    }
    return nodes
  }, [])

  const edges = useMemo(() => {
    const edges = []
    const threshold = 1000
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i !== j && node.distanceToSquared(other) < threshold) {
          edges.push([node, other])
        }
      })
    })
    return edges
  }, [nodes])

  return (
    <>
      {nodes.map((node, index) => (
        <Node
          key={index}
          position={node.toArray()}
          hovered={index === hoveredNode}
          onHover={() => setHoveredNode(index)}
          onUnhover={() => setHoveredNode(null)}
        />
      ))}
      {edges.map((edge, index) => (
        <Edge key={index} points={edge.map((node) => node.toArray())} />
      ))}
    </>
  )
}

function CameraControls() {
  const {
    camera,
    gl: { domElement },
  } = useThree()
  return <OrbitControls args={[camera, domElement]} enableDamping dampingFactor={0.1} />
}

export default function Page() {
  return (
    <div className='flex flex-col w-full h-full'>
      <div className='mx-auto flex w-full h-fit flex-col flex-wrap items-center p-10 md:flex-row'>
        <div className='relative h-fit w-full'>
          <h2 className='mb-3 text-3xl font-bold leading-none text-white '>TPO - F </h2>
          <p className='text-gray-300 text-xs'>
            TPO means Time, Place, Occasion. And F means Favor & Feedback. It is a new media ux design project founded
            by Sejin Oh and Hyungdong Hwhang.
          </p>
          <button className='mt-3 bg-white text-black text-xs px-4 py-2 rounded-md'>Open Perf Tab</button>
        </div>
      </div>
      <div className='flex h-full w-full'>
        {/* 
          //@ts-ignore */}
        <View className='relative size-full'>
          <Suspense fallback={null}>
            {/* <Stars /> */}
            <pointLight position={[10, 10, 10]} />
            <Resize scale={5}>
              <Network />
            </Resize>
            <CameraControls />
          </Suspense>
          <Perf top='0' right='0' fontSize='small' trackGPU />
        </View>
      </div>
    </div>
  )
}
