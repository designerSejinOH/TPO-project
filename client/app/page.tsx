'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sphere, Line, Resize, OrbitControls, Billboard, Text, Html } from '@react-three/drei'
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

function Annotation({ children, ...props }) {
  return (
    <Html as='div' className='w-64 mt-2 -ml-8 flex ' {...props} distanceFactor={4}>
      <div>{children}</div>
    </Html>
  )
}

function Node({ idx, position, onHover, onUnhover, hovered, explained, emotion }) {
  useEffect(() => {
    hovered ? (document.body.style.cursor = 'pointer') : (document.body.style.cursor = 'auto')
  }, [hovered])

  return (
    <>
      {explained && (
        <Annotation position={position}>
          <div className='px-2 w-fit text-white backdrop-blur-sm rounded-full'>{emotion[0]}</div>
        </Annotation>
      )}

      <Sphere
        scale={explained ? 1 : 0.5}
        args={[1, 8, 8]}
        position={position}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
      >
        <meshBasicMaterial attach='material' color={explained ? emotion[1] : 'white'} />
      </Sphere>
    </>
  )
}

function Edge({ points, lineWidth }: { points: any; lineWidth: number }) {
  return <Line points={points} color='skyblue' lineWidth={lineWidth} />
}

function Network({
  length,
  isEmotion,
  radiusSensitivity,
  lineWidth,
}: {
  length?: number
  isEmotion?: boolean
  radiusSensitivity?: number
  lineWidth?: number
}) {
  const emotions = [
    ['분노 😡', 'red'],
    ['기쁨 😊', 'yellow'],
    ['슬픔 😢', 'blue'],
    ['놀람 😲', 'green'],
    ['불안 😨', 'purple'],
    ['혐오 😖', 'black'],
    ['기대 😍', 'pink'],
    ['행복 😁', 'orange'],
    ['평온 😌', 'gray'],
    ['무표정 😐', 'black'],
  ]

  const [hoveredNode, setHoveredNode] = useState(null)
  const [explainedNode, setExplainedNode] = useState([])

  const nodes = useMemo(() => {
    const nodes = []
    const baseRadius = 100 // 기본 반경
    const maxVariation = 50 // 최대 변동 반경

    for (let i = 0; i < length; i++) {
      const alpha = Math.random() * Math.PI * 2
      const beta = Math.random() * Math.PI - Math.PI / 2
      const variation = Math.random() * maxVariation * radiusSensitivity
      const radius = baseRadius + variation // 슬라이더 값에 따라 반경 설정
      const x = radius * Math.sin(alpha) * Math.cos(beta)
      const y = radius * Math.sin(alpha) * Math.sin(beta)
      const z = radius * Math.cos(alpha)

      nodes.push(new THREE.Vector3(x, y, z))
    }
    return nodes
  }, [length, radiusSensitivity]) // radiusSensitivity 의존성 추가

  const edges = useMemo(() => {
    const edges = []
    const threshold = 700
    nodes.forEach((node, i) => {
      nodes.forEach((other, j) => {
        if (i !== j && node.distanceToSquared(other) < threshold) {
          edges.push([node, other])
        }
      })
    })
    return edges
  }, [nodes])

  useEffect(() => {
    const minDistance = 50 // 노드들 사이의 최소 거리
    const maxSelectedNodes = 20 // 선택할 최대 노드 수
    let selectedNodes = []

    // 노드 배열을 셔플합니다.
    const shuffleNodes = [...nodes]
    shuffleNodes.sort(() => 0.5 - Math.random())

    for (let node of shuffleNodes) {
      let isFarEnough = true

      for (let selected of selectedNodes) {
        const distance = node.distanceTo(selected)
        if (distance < minDistance) {
          isFarEnough = false
          break
        }
      }

      if (isFarEnough) {
        selectedNodes.push(node)
        if (selectedNodes.length === maxSelectedNodes) break
      }
    }

    setExplainedNode(selectedNodes)
  }, [nodes])

  return (
    <>
      {nodes.map((node, index) => (
        <Node
          key={index}
          idx={index}
          position={node.toArray()}
          hovered={index === hoveredNode}
          onHover={() => setHoveredNode(index)}
          onUnhover={() => setHoveredNode(null)}
          explained={isEmotion && explainedNode.includes(node)}
          emotion={emotions[index % 10]}
        />
      ))}
      {edges.map((edge, index) => (
        <Edge key={index} lineWidth={lineWidth} points={edge.map((node: { toArray: () => any }) => node.toArray())} />
      ))}
    </>
  )
}

function CameraControls() {
  const {
    camera,
    gl: { domElement },
  } = useThree()
  return (
    <OrbitControls args={[camera, domElement]} autoRotate autoRotateSpeed={0.5} enableDamping dampingFactor={0.1} />
  )
}

export default function Page() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const [isPerf, setIsPerf] = useState(false)
  const [length, setLength] = useState(240)
  const [isEmotion, setIsEmotion] = useState(true)
  const [randomRadius, setRandomRadius] = useState(false) // 반경 랜덤 모드 토글
  const [lineWidth, setLineWidth] = useState(false)
  const [radiusSensitivity, setRadiusSensitivity] = useState(0) // 반경 감도 초기값 설정

  return (
    <>
      {isClient && (
        <div className='flex flex-col w-full h-full'>
          <div className='mx-auto flex w-full h-fit flex-col flex-wrap items-center p-10 md:flex-row'>
            <div className='relative h-fit w-full'>
              <h2 className='mb-2 text-3xl font-bold leading-none text-white '>POE + F </h2>
              <p className='mb-4 text-gray-300 text-xs'>
                POE means Place, Occasion, Emotion. And F means Favor, Feedback...
              </p>
              <div className='flex flex-col gap-3'>
                <div className='pretty p-switch p-fill text-xs'>
                  <input type='checkbox' onChange={(e) => setIsPerf(e.target.checked)} />
                  <div className='state'>
                    <label className='text-white'>Performance Tab</label>
                  </div>
                </div>
                <label className='text-white text-xs'>
                  <input
                    type='number'
                    defaultValue={length}
                    onChange={(e) =>
                      setLength(
                        //@ts-ignore
                        Math.min(Math.max(parseInt(e.target.value), 0), 300),
                      )
                    }
                    className='border-b-[0.5px] border-[#bdc3c7] mr-1 w-12 px-1 h-fit text-white bg-black text-xs'
                  />
                  Number of nodes
                </label>
                <div className='pretty p-switch p-fill text-xs'>
                  <input type='checkbox' checked={lineWidth} onChange={(e) => setLineWidth(e.target.checked)} />
                  <div className='state'>
                    <label className='text-white'>edges On/Off</label>
                  </div>
                </div>
                <div className='pretty p-switch p-fill text-xs'>
                  <input type='checkbox' checked={isEmotion} onChange={(e) => setIsEmotion(e.target.checked)} />
                  <div className='state'>
                    <label className='text-white'>emotion On/Off</label>
                  </div>
                </div>
                <div className='pretty p-switch p-fill text-xs'>
                  <input type='checkbox' checked={randomRadius} onChange={(e) => setRandomRadius(e.target.checked)} />
                  <div className='state'>
                    <label className='text-white'>time On/Off</label>
                  </div>
                </div>
                <div className='slider'>
                  <input
                    type='range'
                    min='0'
                    max='1'
                    step='0.01'
                    value={radiusSensitivity}
                    onChange={(e) => setRadiusSensitivity(parseFloat(e.target.value))}
                    className='w-24 bg-black'
                  />
                  <label className='text-white'>Radius Sensitivity: {radiusSensitivity}</label>
                </div>
              </div>
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
                  <Network
                    key={length}
                    length={length}
                    isEmotion={isEmotion}
                    lineWidth={lineWidth ? 0.0 : 0.1}
                    radiusSensitivity={radiusSensitivity}
                  />
                </Resize>
                <CameraControls />
              </Suspense>
              {isPerf && <Perf top='0' right='0' fontSize='small' trackGPU />}
            </View>
          </div>
        </div>
      )}
    </>
  )
}
