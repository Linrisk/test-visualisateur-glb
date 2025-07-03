"use client"

import React, { useRef, useState, useEffect, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import {Environment, Grid, Stats, useGLTF, Center, Html, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RotateCcw, Move3D, Upload, Eye, EyeOff, Grid3X3, Sun, Moon } from "lucide-react"


function GLTFModel({
  url,
  explodeAmount,
  wireframe,
  showBoundingBox,
}: {
  url: string
  explodeAmount: number
  wireframe: boolean
  showBoundingBox: boolean
}) {
  const { scene, materials } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const [originalPositions, setOriginalPositions] = useState<Map<string, THREE.Vector3>>(new Map())

  useEffect(() => {
    const positions = new Map<string, THREE.Vector3>()
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        positions.set(child.uuid, child.position.clone())
      }
    })
    setOriginalPositions(positions)
  }, [scene])

  useFrame(() => {
    if (originalPositions.size > 0) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const originalPos = originalPositions.get(child.uuid)
          if (originalPos) {
            const direction = originalPos.clone().normalize()
            const explodedPos = originalPos.clone().add(direction.multiplyScalar(explodeAmount))
            child.position.lerp(explodedPos, 0.1)
          }
        }
      })
    }
  })

  useEffect(() => {
    Object.values(materials).forEach((material: any) => {
      if (material?.isMaterial) {
        material.wireframe = wireframe
      }
    })
  }, [materials, wireframe])

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={scene} />
        {showBoundingBox && (
          <mesh>
            <boxGeometry args={[4, 4, 4]} />
            <meshBasicMaterial color="yellow" wireframe />
          </mesh>
        )}
      </Center>
    </group>
  )
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-white">Chargement du modèle...</span>
      </div>
    </Html>
  )
}

// Main Component
export default function Component() {
  const [modelUrl, setModelUrl] = useState("/ISS_stationary.glb")
  const [explodeAmount, setExplodeAmount] = useState(0)
  const [wireframe, setWireframe] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [showBoundingBox, setShowBoundingBox] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [environment, setEnvironment] = useState("sunset")
  const [cameraPosition] = useState<[number, number, number]>([5, 5, 5])

  const controlsRef = useRef<any>(null)

  const resetCamera = () => {
    controlsRef.current?.reset()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setModelUrl(url)
    }
  }

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <div className="absolute top-4 left-4 z-10 space-y-4">
        <Card className="w-80 bg-black/80 backdrop-blur-sm border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Move3D className="w-5 h-5" />
              Visualiseur GLTF/GLB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Charger un modèle</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".gltf,.glb"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-300">Sélectionner un fichier</span>
                </label>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vue éclatée: {explodeAmount.toFixed(1)}
              </label>
              <Slider
                value={[explodeAmount]}
                onValueChange={([v]) => setExplodeAmount(v)}
                max={5}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Mode filaire</span>
                <Button variant={wireframe ? "default" : "outline"} size="sm" onClick={() => setWireframe(!wireframe)}>
                  {wireframe ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Grille</span>
                <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Boîte englobante</span>
                <Button
                  variant={showBoundingBox ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowBoundingBox(!showBoundingBox)}
                >
                  <Move3D className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">FPS</span>
                <Button variant={showStats ? "default" : "outline"} size="sm" onClick={() => setShowStats(!showStats)}>
                  📊
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Environnement</label>
              <div className="flex gap-2">
                <Button
                  variant={environment === "sunset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnvironment("sunset")}
                >
                  <Sun className="w-4 h-4" />
                </Button>
                <Button
                  variant={environment === "night" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnvironment("night")}
                >
                  <Moon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetCamera} className="flex-1 bg-transparent">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-80 bg-black/80 backdrop-blur-sm border-gray-700">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Contrôles:</span>
                <Badge variant="secondary">Souris</Badge>
              </div>
              <div className="text-xs space-y-1 text-gray-400">
                <div>• Clic gauche + glisser: Rotation</div>
                <div>• Molette: Zoom</div>
                <div>• Clic droit + glisser: Panoramique</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Canvas camera={{ position: cameraPosition, fov: 50 }} shadows className="w-full h-full">
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <Environment preset={environment as any} />

        {showGrid && (
          <Grid
            renderOrder={-1}
            position={[0, -3, 0]}
            infiniteGrid
            cellSize={0.6}
            cellThickness={0.6}
            sectionSize={3.3}
            sectionThickness={1.5}
            sectionColor="#4A90E2"
            fadeDistance={30}
          />
        )}

        <Suspense fallback={<LoadingSpinner />}>
          <GLTFModel
            url={modelUrl}
            explodeAmount={explodeAmount}
            wireframe={wireframe}
            showBoundingBox={showBoundingBox}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          enableRotate
          enableDamping
          dampingFactor={0.05}
        />

        {showStats && <Stats />}
      </Canvas>

      <div className="absolute bottom-4 right-4">
        <Badge variant="outline" className="bg-black/80 text-white border-gray-600">
          Github: Linrisk
        </Badge>
      </div>
    </div>
  )
}