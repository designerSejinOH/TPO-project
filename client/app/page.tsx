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

function Edge({ points }) {
  return <Line points={points} color='skyblue' lineWidth={0.1} />
}

function Network({ length, isEmotion }: { length?: number; isEmotion?: boolean }) {
  const [hoveredNode, setHoveredNode] = useState(null)

  const [explainedNode, setExplainedNode] = useState([])

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

  const nodes = useMemo(() => {
    const nodes = []
    const radius = 100
    const minDistance = 5 // 최소 거리를 15로 설정

    for (let i = 0; i < length; i++) {
      let x: number, y: number, z: number // 노드의 x, y, z 좌표
      let tooClose: boolean

      do {
        const alpha = Math.random() * Math.PI * 2
        const beta = Math.random() * Math.PI - Math.PI / 2
        x = radius * Math.sin(alpha) * Math.cos(beta)
        y = radius * Math.sin(alpha) * Math.sin(beta)
        z = radius * Math.cos(alpha)

        tooClose = false
        for (let node of nodes) {
          const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2 + (node.z - z) ** 2)
          if (distance < minDistance) {
            tooClose = true
            break
          }
        }
      } while (tooClose) // 이 조건이 참일 때까지 새 위치를 생성

      nodes.push(new THREE.Vector3(x, y, z))
    }
    return nodes
  }, [length])

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
        <Edge key={index} points={edge.map((node: { toArray: () => any }) => node.toArray())} />
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
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const [isPerf, setIsPerf] = useState(false)
  const [length, setLength] = useState(240)
  const [isEmotion, setIsEmotion] = useState(true)

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
                  <input type='checkbox' checked={isEmotion} onChange={(e) => setIsEmotion(e.target.checked)} />
                  <div className='state'>
                    <label className='text-white'>emotion On/Off</label>
                  </div>
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
                  <Network key={length} length={length} isEmotion={isEmotion} />
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
