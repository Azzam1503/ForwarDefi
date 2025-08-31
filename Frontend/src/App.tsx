
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './Components/Header';
import Dashboard from './Components/Dashboard';
import Profile from './Components/Profile';
import Loans from './Components/Loans/Loans';
import History from './Components/History';
import LoadingSpinner from './Components/LoadingSpinner';
import PageTransition from './Components/PageTransition';
import "@rainbow-me/rainbowkit/styles.css";
import "./styles/global.css";
import "./styles/loans.css";

// Page wrapper for transitions
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  return (
    <PageTransition
      stage={transitionStage}
      onAnimationEnd={() => {
        if (transitionStage === "fadeOut") {
          setDisplayLocation(location);
          setTransitionStage("fadeIn");
        }
      }}
    >
      <Routes location={displayLocation}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
};

function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isAppLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <div className="app-background">
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
          </div>
          <Header />
          <main className="main-content">
            <PageWrapper />
          </main>
          <footer className="app-footer">
            <div className="footer-content">
              <p>&copy; 2024 ForwarDefi. Built on Avalanche. Empowering decentralized finance.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
