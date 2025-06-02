// src/components/UserDashboard.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserDashboard() {
  const { userProfile, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!userProfile) return null;

  const daysLeft = userProfile.trialExpiresAt 
    ? Math.ceil((new Date(userProfile.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="bg-slate-800 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">
              🎯 Micro Ticket Deal Engine
            </h1>
            <p className="text-slate-300">Welcome back, {userProfile.brokerName} from {userProfile.company}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {userProfile.subscriptionStatus === 'trial' && (
              <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                🎯 TRIAL: {daysLeft} days left
              </div>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {userProfile.brokerName.charAt(0).toUpperCase()}
                </div>
                <span>{userProfile.brokerName}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{userProfile.email}</p>
                    <p className="text-xs text-gray-500">{userProfile.company}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}