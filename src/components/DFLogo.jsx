import React from 'react';

const DFLogo = ({ className = "", size = 40 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background circle */}
    <circle cx="50" cy="50" r="48" fill="#872E5C" />
    
    {/* D letter */}
    <path 
      d="M25 25 L25 75 L45 75 C60 75 70 65 70 50 C70 35 60 25 45 25 Z M35 35 L45 35 C55 35 60 40 60 50 C60 60 55 65 45 65 L35 65 Z" 
      fill="white"
    />
    
    {/* F letter */}
    <path 
      d="M75 25 L75 75 L85 75 L85 55 L95 55 L95 45 L85 45 L85 35 L98 35 L98 25 Z" 
      fill="#E18425"
      transform="translate(-20, 0)"
    />
  </svg>
);

export default DFLogo;
