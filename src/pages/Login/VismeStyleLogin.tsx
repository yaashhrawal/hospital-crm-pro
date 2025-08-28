import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const VismeStyleLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { login, loading } = useAuth();

  // Handle scroll effect similar to Visme forms
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 50) {
        setIsScrolled(true);
      }
    };

    // Simulate the "wait 3 seconds" behavior mentioned in the comment
    const timer = setTimeout(() => {
      setIsScrolled(true);
    }, 3000);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
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

  return (
    <>
      {/* Note: This form was created using Visme.co style approach */}
      {/* Just like the embeddable forms from visme.co with character movement and animations */}
      
      <div 
        className="visme-login-container"
        style={{
          margin: 0,
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f0f0f0',
          fontFamily: 'Arial, sans-serif',
          overflow: 'hidden'
        }}
      >
        {/* Main login form container - mimics Visme embedded form style */}
        <div
          className={`visme-form-wrapper ${isScrolled ? 'activated' : ''}`}
          style={{
            width: '400px',
            maxWidth: '90vw',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            transform: isScrolled ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.9)',
            opacity: isScrolled ? 1 : 0.3,
            transition: 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            position: 'relative'
          }}
        >
          {/* Animated character/mascot area - like Visme forms */}
          <div 
            className="character-area"
            style={{
              textAlign: 'center',
              marginBottom: '30px',
              position: 'relative'
            }}
          >
            {/* Animated mascot/character */}
            <div
              className={`mascot ${isScrolled ? 'wave' : ''}`}
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(45deg, #FFF 0%, #E8F4FD 100%)',
                borderRadius: '50%',
                margin: '0 auto 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '35px',
                transform: isScrolled ? 'rotateY(360deg)' : 'rotateY(0deg)',
                transition: 'transform 2s ease-in-out',
                boxShadow: '0 8px 25px rgba(255,255,255,0.4)',
                position: 'relative'
              }}
            >
              🏥
              {/* Floating elements around mascot */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-5px',
                  width: '20px',
                  height: '20px',
                  background: '#4CAF50',
                  borderRadius: '50%',
                  transform: isScrolled ? 'scale(1.2)' : 'scale(0.8)',
                  transition: 'transform 0.8s ease-in-out 0.5s'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '-8px',
                  width: '15px',
                  height: '15px',
                  background: '#FF9800',
                  borderRadius: '50%',
                  transform: isScrolled ? 'scale(1.1)' : 'scale(0.9)',
                  transition: 'transform 0.8s ease-in-out 0.7s'
                }}
              />
            </div>
            
            <h2 
              style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
                transform: isScrolled ? 'translateY(0)' : 'translateY(20px)',
                opacity: isScrolled ? 1 : 0,
                transition: 'all 1s ease-in-out 0.5s'
              }}
            >
              Welcome to Valant
            </h2>
            <p 
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px',
                margin: '5px 0 0 0',
                transform: isScrolled ? 'translateY(0)' : 'translateY(15px)',
                opacity: isScrolled ? 1 : 0,
                transition: 'all 1s ease-in-out 0.7s'
              }}
            >
              Hospital CRM System
            </p>
          </div>

          {/* Error message with animation */}
          {errors.general && (
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#FFE0E0',
                fontSize: '14px',
                textAlign: 'center',
                animation: 'shake 0.5s ease-in-out'
              }}
            >
              {errors.general}
            </div>
          )}

          {/* Login form with Visme-style animations */}
          <form onSubmit={handleSubmit}>
            {/* Email field */}
            <div 
              className="form-group"
              style={{
                marginBottom: '25px',
                transform: isScrolled ? 'translateX(0)' : 'translateX(-50px)',
                opacity: isScrolled ? 1 : 0,
                transition: 'all 1.2s ease-in-out 0.8s'
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="Email Address"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  borderRadius: '25px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  border: errors.email ? '2px solid #FF6B6B' : '2px solid transparent'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.25)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.15)';
                  e.target.style.transform = 'scale(1)';
                }}
              />
              {errors.email && (
                <div style={{ color: '#FFE0E0', fontSize: '12px', marginTop: '5px', textAlign: 'center' }}>
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password field */}
            <div 
              className="form-group"
              style={{
                marginBottom: '30px',
                transform: isScrolled ? 'translateX(0)' : 'translateX(50px)',
                opacity: isScrolled ? 1 : 0,
                transition: 'all 1.2s ease-in-out 1s'
              }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="Password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  borderRadius: '25px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  border: errors.password ? '2px solid #FF6B6B' : '2px solid transparent'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.25)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.15)';
                  e.target.style.transform = 'scale(1)';
                }}
              />
              {errors.password && (
                <div style={{ color: '#FFE0E0', fontSize: '12px', marginTop: '5px', textAlign: 'center' }}>
                  {errors.password}
                </div>
              )}
            </div>

            {/* Submit button with animation */}
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              style={{
                width: '100%',
                padding: '15px',
                border: 'none',
                borderRadius: '25px',
                background: loading 
                  ? 'rgba(255,255,255,0.3)' 
                  : 'linear-gradient(45deg, #FF6B6B 0%, #4ECDC4 100%)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                transform: isScrolled ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
                opacity: isScrolled ? 1 : 0,
                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = isScrolled ? 'translateY(-2px) scale(1.05)' : 'translateY(28px) scale(0.95)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isScrolled ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
              }}
            >
              {loading ? (
                <>
                  <span style={{ marginRight: '10px' }}>⏳</span>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
              
              {/* Button wave effect */}
              {!loading && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    transition: 'left 0.5s',
                  }}
                  onAnimationEnd={(e) => {
                    if (isScrolled) {
                      e.currentTarget.style.left = '100%';
                      setTimeout(() => {
                        e.currentTarget.style.left = '-100%';
                      }, 2000);
                    }
                  }}
                />
              )}
            </button>
          </form>

          {/* Footer text with animation */}
          <p 
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '12px',
              marginTop: '20px',
              transform: isScrolled ? 'translateY(0)' : 'translateY(20px)',
              opacity: isScrolled ? 1 : 0,
              transition: 'all 1s ease-in-out 1.5s'
            }}
          >
            Secure hospital management system
          </p>

          {/* Floating particles - Visme style */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '6px',
              height: '6px',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '50%',
              transform: isScrolled ? 'translateY(-10px)' : 'translateY(0px)',
              transition: 'transform 2s ease-in-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              left: '25px',
              width: '8px',
              height: '8px',
              background: 'rgba(255,255,255,0.4)',
              borderRadius: '50%',
              transform: isScrolled ? 'translateY(10px)' : 'translateY(0px)',
              transition: 'transform 2.5s ease-in-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              width: '4px',
              height: '4px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '50%',
              transform: isScrolled ? 'translateX(5px)' : 'translateX(0px)',
              transition: 'transform 1.8s ease-in-out',
            }}
          />
        </div>
      </div>

      {/* CSS for additional animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .visme-form-wrapper:hover {
          box-shadow: 0 25px 80px rgba(0,0,0,0.4) !important;
        }

        .mascot.wave::before {
          content: '👋';
          position: absolute;
          top: -20px;
          right: -10px;
          font-size: 20px;
          animation: wave 1s ease-in-out infinite;
        }

        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        input::placeholder {
          color: rgba(255,255,255,0.7);
        }

        /* Scrollbar styling for the white screen effect */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f0f0f0;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }
      `}</style>
    </>
  );
};

export default VismeStyleLogin;