import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, CreditCard } from 'lucide-react';
import AuthModal from './auth/AuthModal';
import ProtectedConnectButton from './ProtectedConnectButton';

const Header: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleSignOut = () => {
    signOut();
    setShowProfileMenu(false);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">
            <CreditCard size={32} />
            ForwarDefi
          </h1>
          <span className="app-subtitle">Crypto BNPL Platform</span>
        </div>

        <div className="header-right">
          <ProtectedConnectButton />
          
          {isAuthenticated ? (
            <div className="profile-section">
              <button className="profile-button" onClick={handleProfileClick}>
                <User size={20} />
                <span>{user?.username}</span>
              </button>
              
              {showProfileMenu && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <div className="profile-info">
                      <User size={24} />
                      <div>
                        <p className="profile-name">{user?.username}</p>
                        <p className="profile-email">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="profile-menu-items">
                    <button 
                      className="profile-menu-item"
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                    >
                      <Settings size={16} />
                      View Profile
                    </button>
                    <button className="profile-menu-item" onClick={handleSignOut}>
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                className="auth-btn signin-btn"
                onClick={() => {
                  setAuthModalMode('signin');
                  setShowAuthModal(true);
                }}
              >
                Sign In
              </button>
              <button 
                className="auth-btn signup-btn"
                onClick={() => {
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onModeChange={setAuthModalMode}
      />
    </header>
  );
};

export default Header;
