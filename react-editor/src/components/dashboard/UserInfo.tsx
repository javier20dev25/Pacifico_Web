import React from 'react';

// --- TIPOS ---
type User = {
  nombre?: string | null;
  plan?: string | null;
  status?: string | null;
};

type UserInfoProps = {
  user: User | null;
  className?: string; // Add className prop
};

const UserInfo: React.FC<UserInfoProps> = ({ user, className }) => {
  if (!user) return null;

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-indigo-100 shadow-lg rounded-xl p-6 mb-8 border border-gray-200 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido, {user.nombre || 'Usuario'}</h2>
      <p className="text-gray-700">
        <span className="font-semibold">Plan:</span> <span className="font-bold text-purple-700">{user.plan || 'Sin plan'}</span> | 
        <span className="font-semibold ml-2">Estado:</span> <span className="font-bold text-green-600">{user.status || '-'}</span>
      </p>
    </div>
  );
};

export default UserInfo;