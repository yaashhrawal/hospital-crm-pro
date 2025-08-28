import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const EmbeddedVismeLogin: React.FC = () => {
  const { login, loading } = useAuth();

  useEffect(() => {
    // Load the Visme forms script
    const script = document.createElement('script');
    script.src = 'https://static-bundles.visme.co/forms/vismeforms-embed.js';
    script.async = true;
    document.body.appendChild(script);

    // Handle form submission if needed
    const handleFormMessage = (event: MessageEvent) => {
      // Listen for messages from the Visme form
      if (event.origin === 'https://forms.visme.co') {
        const data = event.data;
        if (data.type === 'formSubmit') {
          // Handle login with the form data
          const { email, password } = data.formData || {};
          if (email && password) {
            handleLogin(email, password);
          }
        }
      }
    };

    window.addEventListener('message', handleFormMessage);

    return () => {
      document.body.removeChild(script);
      window.removeEventListener('message', handleFormMessage);
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ email, password });
      if (!result.success) {
        console.error('Login failed:', result.error);
        // You could show error message here
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{
      margin: 0,
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f0f0f0'
    }}>
      {/* Note: If the code is not running, just scroll on white screen using mouse and wait for 3 seconds */}
      {/* This form was created using Visme.co embedded form approach */}
      
      {/* Visme Embedded Form Container */}
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
          minHeight: '100vh'
        }}
      >
        {/* Fallback content while Visme form loads */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          color: '#666'
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '20px'
          }}>
            Loading Login Form...
          </div>
          <div style={{
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            If the form doesn't load, try scrolling on the white screen and wait for 3 seconds.
            <br />
            This is a Visme.co embedded form with animations.
          </div>
          {loading && (
            <div style={{
              marginTop: '20px',
              fontSize: '16px',
              color: '#007bff'
            }}>
              🔄 Authenticating...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmbeddedVismeLogin;