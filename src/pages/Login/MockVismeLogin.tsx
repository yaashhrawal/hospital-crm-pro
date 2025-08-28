import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const MockVismeLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  
  const { login, loading } = useAuth();

  useEffect(() => {
    // Simulate the "scroll and wait 3 seconds" behavior from Visme forms
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    const handleScroll = () => {
      if (!hasScrolled) {
        setHasScrolled(true);
        setIsVisible(true);
      }
    };

    const handleMouseMove = () => {
      if (!hasScrolled) {
        setHasScrolled(true);
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasScrolled]);

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
      {/* Note: If the code is not running, just scroll on white screen using mouse and wait for 3 seconds */}
      {/* This form mimics the Visme.co embedded form behavior */}
      
      <div style={{
        margin: 0,
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f0f0',
        fontFamily: 'Arial, sans-serif'
      }}>
        
        {/* Mock Visme Container - exactly like the div class="visme_d" */}
        <div 
          className="visme_d" 
          data-title="Hospital Login Form" 
          data-url="g7ddqxx0-untitled-project?fullPage=true" 
          data-domain="forms" 
          data-full-page="true" 
          data-min-height="100vh" 
          data-form-id="133190"
          style={{
            height: '200px',
            width: '100%',
            minHeight: '100vh',
            position: 'relative'
          }}
        >
          
          {!isVisible ? (
            // Show white screen with hint (like Visme loading behavior)
            <div style={{
              width: '100%',
              height: '100vh',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              color: '#ccc',
              fontSize: '14px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setIsVisible(true)}
            >
              <div style={{ marginBottom: '20px', fontSize: '18px' }}>
                🖱️ Scroll or move mouse to activate form
              </div>
              <div>
                Wait for 3 seconds or interact with the screen
              </div>
              <div style={{ 
                marginTop: '10px', 
                opacity: 0.5,
                fontSize: '12px'
              }}>
                (Simulating Visme.co embedded form behavior)
              </div>
            </div>
          ) : (
            // Show the actual login form (simulating Visme form appearance)
            <div style={{
              width: '100%',
              height: '100vh',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              animation: 'fadeIn 1s ease-in-out',
              position: 'relative'
            }}>
              
              {/* Visme-style decorative elements */}
              <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: '20px',
                height: '20px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '50%',
                animation: 'float 3s ease-in-out infinite'
              }} />
              
              <div style={{
                position: 'absolute',
                top: '20%',
                right: '15%',
                width: '15px',
                height: '15px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                animation: 'float 3s ease-in-out infinite 1s'
              }} />
              
              <div style={{
                position: 'absolute',
                bottom: '15%',
                left: '20%',
                width: '25px',
                height: '25px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                animation: 'float 3s ease-in-out infinite 2s'
              }} />

              {/* Main Form Container */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '40px',
                minWidth: '350px',
                maxWidth: '400px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                animation: 'slideIn 0.8s ease-out'
              }}>
                
                {/* Header with Visme-style character/mascot */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: '50%',
                    margin: '0 auto 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '35px',
                    animation: 'bounce 2s infinite',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                  }}>
                    🏥
                  </div>
                  
                  <h2 style={{
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: '0 0 5px 0'
                  }}>
                    Welcome to Valant
                  </h2>
                  
                  <p style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '14px',
                    margin: '0'
                  }}>
                    Hospital CRM System
                  </p>
                </div>

                {/* Error message */}
                {errors.general && (
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#FFE0E0',
                    fontSize: '14px',
                    textAlign: 'center',
                    animation: 'shake 0.5s ease-in-out'
                  }}>
                    {errors.general}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  
                  {/* Email Field */}
                  <div style={{ marginBottom: '20px' }}>
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
                        border: errors.email ? '2px solid #FF6B6B' : '2px solid transparent',
                        borderRadius: '25px',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(5px)',
                        color: 'white',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    {errors.email && (
                      <div style={{ 
                        color: '#FFE0E0', 
                        fontSize: '12px', 
                        marginTop: '5px', 
                        textAlign: 'center' 
                      }}>
                        {errors.email}
                      </div>
                    )}
                  </div>

                  {/* Password Field */}
                  <div style={{ marginBottom: '25px' }}>
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
                        border: errors.password ? '2px solid #FF6B6B' : '2px solid transparent',
                        borderRadius: '25px',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(5px)',
                        color: 'white',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    {errors.password && (
                      <div style={{ 
                        color: '#FFE0E0', 
                        fontSize: '12px', 
                        marginTop: '5px', 
                        textAlign: 'center' 
                      }}>
                        {errors.password}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
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
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                      }
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
                  </button>
                </form>

                {/* Footer */}
                <p style={{
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  marginTop: '20px'
                }}>
                  Secure hospital management system
                </p>

                {/* Visme branding simulation */}
                <p style={{
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '10px',
                  marginTop: '10px'
                }}>
                  Powered by Visme-style forms
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-10px);
          }
          70% {
            transform: translateY(-5px);
          }
          90% {
            transform: translateY(-2px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        input::placeholder {
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </>
  );
};

export default MockVismeLogin;