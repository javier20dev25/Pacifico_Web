import React from 'react';

// --- TIPOS ---
type User = {
  nombre?: string | null;
  plan?: string | null;
  status?: string | null;
};

type UserInfoProps = {
  user: User | null;
};

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Bienvenido, {user.nombre || 'Usuario'}</h2>
      <p className="text-gray-600">
        Plan: <span className="font-semibold text-blue-600">{user.plan || 'Sin plan'}</span> | 
        Estado: <span className="font-semibold text-green-600">{user.status || '-'}</span>
      </p>
    </div>
  );
};

export default UserInfo;