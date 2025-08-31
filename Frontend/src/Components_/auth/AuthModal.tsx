import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin', onModeChange }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Helper function to handle mode changes
  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        {mode === 'signin' ? (
          <SignInForm
            onSwitchToSignUp={() => handleModeChange('signup')}
            onClose={onClose}
          />
        ) : (
          <SignUpForm
            onSwitchToSignIn={() => handleModeChange('signin')}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;
