import { UserCircleIcon } from '@heroicons/react/24/outline'; // Import Heroicon

interface User {
  nombre: string | null;
  plan: string | null;
  status: string | null;
}

interface UserInfoProps {
  user: User | null;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex items-center mb-2"> {/* Flex container for icon and heading */}
        <UserCircleIcon className="h-8 w-8 text-primary-dark mr-3" /> {/* Heroicon */}
        <h2 className="text-2xl font-bold text-neutral-800">Bienvenido, {user.nombre || 'Usuario'}</h2>
      </div>
      <p className="text-neutral-600 text-lg">
        Plan: <span className="font-semibold text-primary-DEFAULT">{user.plan || 'Sin plan'}</span> |
        Estado: <span className="font-semibold text-green-600">{user.status || '-'}</span>
      </p>
    </div>
  );
};

export default UserInfo;
