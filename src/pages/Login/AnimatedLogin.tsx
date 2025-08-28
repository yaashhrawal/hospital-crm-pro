import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Heart, Shield, Users, Activity, Loader2, Stethoscope, HeartHandshake } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AnimatedLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const { login, loading } = useAuth();

  // Animated features rotation
  const features = [
    {
      icon: Users,
      title: 'Patient Management',
      description: 'Comprehensive patient records and history',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Activity,
      title: 'Real-time Updates',
      description: 'Live data synchronization across all devices',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'HIPAA compliant with enterprise security',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: HeartHandshake,
      title: 'Patient Care',
      description: 'Streamlined workflows for better care',
      color: 'from-red-500 to-orange-500'
    }
  ];

  // Auto-rotate features and set page title
  useEffect(() => {
    setIsLoaded(true);
    document.title = 'Valant Hospital - Login';
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
      document.title = 'Valant Hospital - Logging In...';
      const result = await login({ email, password });
      
      if (!result.success) {
        document.title = 'Valant Hospital - Login';
        setErrors({ 
          general: result.error || 'Login failed. Please check your credentials and try again.' 
        });
      } else {
        document.title = 'Valant Hospital - Success';
      }
    } catch (error) {
      document.title = 'Valant Hospital - Login';
      setErrors({ 
        general: 'An unexpected error occurred. Please try again.' 
      });
    }
  };

  const floatingIcons = [
    { icon: Stethoscope, delay: 0 },
    { icon: Heart, delay: 1 },
    { icon: Shield, delay: 2 },
    { icon: Activity, delay: 3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -30, 30, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Floating medical icons */}
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute text-white/10"
            style={{
              left: `${20 + index * 20}%`,
              top: `${10 + index * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {React.createElement(item.icon, { size: 40 })}
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding and Features */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -100 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center lg:text-left space-y-8"
          >
            {/* Logo Section */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
              className="flex items-center justify-center lg:justify-start space-x-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center p-4"
                >
                  <img 
                    src="/logo.png" 
                    alt="Valant Hospital Logo" 
                    className="h-28 w-28 object-contain"
                  />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full"
                />
              </div>
            </motion.div>

            {/* Rotating Features */}
            <div className="h-32">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${features[currentFeature].color} flex items-center justify-center`}
                    >
                      {React.createElement(features[currentFeature].icon, {
                        className: "w-6 h-6 text-white"
                      })}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white">
                      {features[currentFeature].title}
                    </h2>
                  </div>
                  <p className="text-gray-300 text-lg max-w-md">
                    {features[currentFeature].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Feature indicators */}
            <div className="flex justify-center lg:justify-start space-x-2">
              {features.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentFeature ? 'bg-cyan-400' : 'bg-gray-600'
                  }`}
                  animate={{
                    scale: index === currentFeature ? 1.5 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Right Side - Animated Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 100 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            {/* Form Container with Glass Effect */}
            <motion.div
              className="relative backdrop-blur-lg bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Animated border glow */}
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-3xl blur opacity-25"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />

              <div className="relative">
                {/* Form Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-gray-300">Sign in to access your dashboard</p>
                </motion.div>

                {/* Error Message */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-sm"
                    >
                      <p className="text-sm text-red-200">{errors.general}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Email Address
                    </label>
                    <div className="relative group">
                      <motion.input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                        placeholder="Enter your email"
                        disabled={loading}
                        whileFocus={{ scale: 1.02 }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-cyan-400/50 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(34, 211, 238, 0.3)",
                            "0 0 40px rgba(34, 211, 238, 0.1)",
                            "0 0 20px rgba(34, 211, 238, 0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 text-sm text-red-300"
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <motion.input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                        placeholder="Enter your password"
                        disabled={loading}
                        whileFocus={{ scale: 1.02 }}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        disabled={loading}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </motion.button>
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-cyan-400/50 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(34, 211, 238, 0.3)",
                            "0 0 40px rgba(34, 211, 238, 0.1)",
                            "0 0 20px rgba(34, 211, 238, 0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 text-sm text-red-300"
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: loading ? 1 : 1.05 }}
                      whileTap={{ scale: loading ? 1 : 0.95 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                        animate={{
                          x: loading ? [-200, 200] : [-200, -200],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: loading ? Infinity : 0,
                          ease: "linear"
                        }}
                      />
                      <div className="relative flex items-center justify-center">
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Valant Hospital Logging...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* Decorative elements around form */}
            <motion.div
              className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 opacity-70"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -bottom-6 -left-6 w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-70"
              animate={{
                rotate: [360, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLogin;