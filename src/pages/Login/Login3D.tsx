import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment,
  Float,
  ContactShadows,
  MeshReflectorMaterial,
  Box,
  Sphere,
  Cylinder,
  RoundedBox
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Heart, Shield, Users, Activity, Loader2, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import * as THREE from 'three';

// 3D Character Component
function Character3D({ isAnimating }: { isAnimating: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current && isAnimating) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[-2, 0, 0]}>
      <Sphere args={[0.5]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#FFB6C1" roughness={0.5} />
      </Sphere>
      <Cylinder args={[0.3, 0.4, 1.5]} position={[0, 0.75, 0]}>
        <meshStandardMaterial color="#4169E1" roughness={0.3} />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 0.8]} position={[-0.4, 1, 0]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color="#FFB6C1" roughness={0.5} />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 0.8]} position={[0.4, 1, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color="#FFB6C1" roughness={0.5} />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 1]} position={[-0.2, -0.5, 0]}>
        <meshStandardMaterial color="#2C3E50" roughness={0.5} />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 1]} position={[0.2, -0.5, 0]}>
        <meshStandardMaterial color="#2C3E50" roughness={0.5} />
      </Cylinder>
    </group>
  );
}

// 3D Briefcase Component  
function Briefcase3D({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const lidRef = useRef<any>(null);
  
  useFrame(() => {
    if (lidRef.current) {
      const targetRotation = isOpen ? -Math.PI / 3 : 0;
      lidRef.current.rotation.x += (targetRotation - lidRef.current.rotation.x) * 0.1;
    }
  });

  return (
    <group 
      ref={meshRef} 
      position={[0, 0, 0]} 
      onClick={onClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      <RoundedBox args={[2, 1.5, 0.5]} radius={0.1} position={[0, 0, 0]}>
        <meshStandardMaterial color="#8B4513" roughness={0.4} metalness={0.3} />
      </RoundedBox>
      <RoundedBox 
        ref={lidRef}
        args={[2, 0.2, 0.5]} 
        radius={0.05}
        position={[0, 0.75, 0]}
      >
        <meshStandardMaterial color="#A0522D" roughness={0.4} metalness={0.3} />
      </RoundedBox>
      <Cylinder args={[0.05, 0.05, 1]} position={[0, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#654321" roughness={0.5} />
      </Cylinder>
      <Box args={[0.2, 0.2, 0.1]} position={[0, 0, 0.3]}>
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </Box>
    </group>
  );
}

// 3D Scene Component
function Scene3D({ onBriefcaseClick, isBriefcaseOpen }: { onBriefcaseClick: () => void; isBriefcaseOpen: boolean }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -5]} intensity={0.5} />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Character3D isAnimating={!isBriefcaseOpen} />
      </Float>
      
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        <Briefcase3D isOpen={isBriefcaseOpen} onClick={onBriefcaseClick} />
      </Float>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0056B3"
          metalness={0.5}
        />
      </mesh>
      
      <ContactShadows 
        position={[0, -0.99, 0]} 
        opacity={0.4} 
        scale={10} 
        blur={2} 
        far={4} 
      />
      
      <Environment preset="city" />
    </>
  );
}

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isBriefcaseOpen, setIsBriefcaseOpen] = useState(false);
  
  const { login, loading } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login({ email, password });
      
      if (!result.success) {
        setErrors({ 
          general: result.error || 'Login failed. Please check your credentials and try again.' 
        });
      }
    } catch (error) {
      setErrors({ 
        general: 'An unexpected error occurred. Please try again.' 
      });
    }
  };

  const handleBriefcaseClick = () => {
    setIsBriefcaseOpen(true);
    setTimeout(() => {
      setShowLoginForm(true);
    }, 500);
  };

  const features = [
    { icon: Users, title: 'Patient Management', color: '#10B981' },
    { icon: Activity, title: 'Appointments', color: '#3B82F6' },
    { icon: Shield, title: 'Analytics', color: '#8B5CF6' },
    { icon: Heart, title: 'Billing', color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex">
      {/* 3D Scene Section */}
      <div className="w-full lg:w-1/2 h-screen relative">
        <Canvas shadows className="w-full h-full">
          <Suspense fallback={null}>
            <Scene3D 
              onBriefcaseClick={handleBriefcaseClick}
              isBriefcaseOpen={isBriefcaseOpen}
            />
          </Suspense>
        </Canvas>
        
        {!showLoginForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-center"
          >
            <p className="text-lg font-semibold mb-2">Click the briefcase to begin</p>
            <Briefcase className="h-8 w-8 mx-auto animate-bounce" />
          </motion.div>
        )}
      </div>

      {/* Login Form Section */}
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-center p-8 bg-white/10 backdrop-blur-md">
        <AnimatePresence>
          {showLoginForm ? (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0, opacity: 0, rotateY: 90 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.8 
              }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gradient-to-r from-blue-600 to-green-600 p-3 rounded-xl">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Valant Hospital</h1>
                  <p className="text-sm text-gray-600 mt-1">Advanced Healthcare Management System</p>
                </div>

                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="admin@valant.com"
                      disabled={loading}
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1 text-sm text-red-600"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1 text-sm text-red-600"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in to Hospital CRM'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3 font-semibold">Features Available</p>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <motion.div
                        key={feature.title}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: feature.color }}
                      >
                        <feature.icon className="h-3 w-3" />
                        {feature.title}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white"
            >
              <h1 className="text-4xl font-bold mb-4">Welcome to Valant Hospital</h1>
              <p className="text-xl opacity-90">Advanced Healthcare Management System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};