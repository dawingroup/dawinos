/**
 * MatFlow Layout Component
 * Simple pass-through layout - no sidebar, content rendered directly
 */

import React from 'react';
import { Outlet } from 'react-router-dom';

export const MatFlowLayout: React.FC = () => {
  return (
    <div className="min-h-full bg-gray-50">
      <Outlet />
    </div>
  );
};
