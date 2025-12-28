import React from 'react';

interface TempleIconProps {
  size?: number;
  className?: string;
}

const TempleIcon: React.FC<TempleIconProps> = ({ size = 64, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Temple base */}
      <rect x="20" y="70" width="60" height="25" fill="currentColor" opacity="0.8" />
      
      {/* Temple middle section */}
      <rect x="25" y="55" width="50" height="20" fill="currentColor" opacity="0.9" />
      
      {/* Temple upper section */}
      <rect x="30" y="40" width="40" height="20" fill="currentColor" />
      
      {/* Temple top section */}
      <rect x="35" y="25" width="30" height="20" fill="currentColor" opacity="0.9" />
      
      {/* Temple spire */}
      <rect x="45" y="15" width="10" height="15" fill="currentColor" opacity="0.8" />
      
      {/* Temple dome/top */}
      <ellipse cx="50" cy="12" rx="8" ry="6" fill="currentColor" opacity="0.7" />
      
      {/* Temple entrance */}
      <rect x="42" y="75" width="16" height="20" fill="white" opacity="0.3" />
      
      {/* Temple pillars */}
      <rect x="28" y="60" width="4" height="15" fill="currentColor" opacity="0.6" />
      <rect x="38" y="60" width="4" height="15" fill="currentColor" opacity="0.6" />
      <rect x="58" y="60" width="4" height="15" fill="currentColor" opacity="0.6" />
      <rect x="68" y="60" width="4" height="15" fill="currentColor" opacity="0.6" />
      
      {/* Decorative elements */}
      <circle cx="50" cy="8" r="2" fill="currentColor" opacity="0.9" />
      <circle cx="45" cy="32" r="1.5" fill="white" opacity="0.4" />
      <circle cx="55" cy="32" r="1.5" fill="white" opacity="0.4" />
    </svg>
  );
};

export default TempleIcon;