
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-600 text-white py-4 px-3 rounded-xl shadow-xl border border-green-200 mb-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          שירותי הסעה לצפריר
        </h1>
        <p className="text-green-100 text-base sm:text-lg lg:text-xl">
          לוחות זמנים מפורטים לכל השירותים
        </p>
      </div>
    </div>
  );
};

export default Navigation;
