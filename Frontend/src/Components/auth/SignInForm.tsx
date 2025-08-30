import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onClose: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSwitchToSignUp, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`📋 [SIGNIN FORM] Form submitted for email: ${email}`);
    
    clearError();

    if (!email || !password) {
      console.log(`⚠️ [SIGNIN FORM] Validation failed - missing email or password`);
      return;
    }

    console.log(`✅ [SIGNIN FORM] Form validation passed, calling signIn...`);
    const success = await signIn(email, password);
    
    if (success) {
      console.log(`🎉 [SIGNIN FORM] Sign in successful, closing modal`);
      onClose();
    } else {
      console.log(`❌ [SIGNIN FORM] Sign in failed, modal remains open`);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-header">
        <LogIn className="auth-icon" />
        <h2>Sign In to ForwarDefi</h2>
        <p>Access your BNPL dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-content">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToSignUp} className="link-btn">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
