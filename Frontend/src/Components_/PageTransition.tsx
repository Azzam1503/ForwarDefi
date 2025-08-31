import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  stage: 'fadeIn' | 'fadeOut';
  onAnimationEnd: () => void;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, stage, onAnimationEnd }) => {
  return (
    <div 
      className={`page-transition ${stage}`}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  );
};

export default PageTransition;
