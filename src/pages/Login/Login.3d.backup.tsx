import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
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
  RoundedBox,
  Circle
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Heart, Shield, Users, Activity, Loader2, Briefcase, X, Tablet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/Button';

// Image-Based Character Component
function Character3D({ isAnimating }: { isAnimating: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Load the character image texture
  const characterTexture = useLoader(THREE.TextureLoader, '/Emoji.png');
  
  useFrame((state) => {
    if (meshRef.current && isAnimating) {
      // Gentle floating animation for the image
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[-3.5, 2.0, 0]} scale={[1.5, 1.5, 1.5]}>
      {/* Character Image Plane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2, 3.2]} />
        <meshStandardMaterial 
          map={characterTexture}
          transparent={true} 
          alphaTest={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Shadow under the character */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0.1]} receiveShadow>
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Image-Based iPad Component
function IPadComponent({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Load the iPad image texture
  const ipadTexture = useLoader(THREE.TextureLoader, '/Ipad.png');
  
  useFrame((state) => {
    if (meshRef.current && isOpen) {
      // Gentle floating animation when opened
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group 
      ref={meshRef} 
      position={[0, 0, 0]} 
      scale={[1.2, 1.2, 1.2]}
      onClick={onClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      {/* iPad Image Plane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.5, 2]} />
        <meshStandardMaterial 
          map={ipadTexture}
          transparent={true} 
          alphaTest={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Shadow under the iPad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0.1]} receiveShadow>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// 3D Scene Component
function Scene3D({ onBriefcaseClick, isBriefcaseOpen }: { onBriefcaseClick: () => void; isBriefcaseOpen: boolean }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 8]} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -5]} intensity={0.5} />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
        <Character3D isAnimating={!isBriefcaseOpen} />
      </Float>
      
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        <group position={[-1.5, 0, 0]}>
          <IPadComponent isOpen={isBriefcaseOpen} onClick={onBriefcaseClick} />
        </group>
      </Float>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <MeshReflectorMaterial
          blur={[400, 200]}
          resolution={1024}
          mixBlur={0.8}
          mixStrength={15}
          roughness={0.8}
          depthScale={0.8}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.2}
          color="#0056B3"
          metalness={0.3}
        />
      </mesh>
      
      <ContactShadows 
        position={[0, -1.99, 0]} 
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
    if (isBriefcaseOpen) {
      // Close briefcase and hide form
      setShowLoginForm(false);
      setTimeout(() => {
        setIsBriefcaseOpen(false);
      }, 300);
    } else {
      // Open briefcase and show form
      setIsBriefcaseOpen(true);
      setTimeout(() => {
        setShowLoginForm(true);
      }, 600);
    }
  };

  const features = [
    { icon: Users, title: 'Patient Management', color: '#10B981' },
    { icon: Activity, title: 'Appointments', color: '#3B82F6' },
    { icon: Shield, title: 'Analytics', color: '#8B5CF6' },
    { icon: Heart, title: 'Billing', color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      {/* 3D Scene Section - Full Width */}
      <div className="w-full h-screen relative">
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
            <p className="text-lg font-semibold mb-2">Click the iPad to begin</p>
            <Tablet className="h-8 w-8 mx-auto animate-bounce" />
          </motion.div>
        )}
        
        {/* Login Form Overlay - appears from iPad */}
        <AnimatePresence>
          {showLoginForm && (
            <motion.div
              initial={{ 
                scale: 0, 
                opacity: 0, 
                x: -150,
                y: 0
              }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                x: 200,
                y: 0
              }}
              exit={{ 
                scale: 0, 
                opacity: 0, 
                x: -150,
                y: 0
              }}
              transition={{ 
                type: "spring",
                stiffness: 120,
                damping: 18,
                duration: 1.4
              }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              style={{
                transformOrigin: 'center center'
              }}
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md pointer-events-auto relative"
                initial={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                animate={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* Close Button */}
                <button
                  onClick={handleBriefcaseClick}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
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
                      placeholder="Enter Username"
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Message Overlay */}
        <AnimatePresence>
          {!showLoginForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-10 left-1/2 transform -translate-x-1/2 text-center text-white z-40"
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