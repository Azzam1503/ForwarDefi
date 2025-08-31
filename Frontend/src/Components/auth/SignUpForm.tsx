import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onClose: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`📋 [SIGNUP FORM] Form submitted for email: ${email}`);
    console.log(`📋 [SIGNUP FORM] User details:`, {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || 'Not provided',
    });
    
    clearError();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      console.log(`⚠️ [SIGNUP FORM] Validation failed - missing required fields`);
      return;
    }

    if (password !== confirmPassword) {
      console.log(`⚠️ [SIGNUP FORM] Validation failed - passwords do not match`);
      return;
    }

    if (password.length < 6) {
      console.log(`⚠️ [SIGNUP FORM] Validation failed - password too short`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`⚠️ [SIGNUP FORM] Validation failed - invalid email format`);
      return;
    }

    console.log(`✅ [SIGNUP FORM] Form validation passed, calling signUp...`);
    const success = await signUp(firstName, lastName, email, password, phoneNumber || undefined);
    
    if (success) {
      console.log(`🎉 [SIGNUP FORM] Sign up successful, closing modal`);
      onClose();
    } else {
      console.log(`❌ [SIGNUP FORM] Sign up failed, modal remains open`);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-header">
        <UserPlus className="auth-icon" />
        <h2>Join ForwarDefi</h2>
        <p>Create your BNPL account</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form-content">
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>

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
          <label htmlFor="phoneNumber">Phone Number (Optional)</label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
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
              placeholder="Create a password"
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

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToSignIn} className="link-btn">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
