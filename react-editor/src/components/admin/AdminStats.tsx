import { UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline'; // Import Heroicons

interface AdminStatsProps {
  stats: {
    temp: number;
    active: number;
  } | null;
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-neutral-800 mb-4">Estadísticas Rápidas</h2>
      <div className="space-y-3"> {/* Increased space-y for better visual separation */}
        <div className="flex items-center text-neutral-700 text-lg">
          <UserGroupIcon className="h-6 w-6 text-accent-DEFAULT mr-3" /> {/* Heroicon */}
          <p>Usuarios Temporales sin Activar: <span className="font-bold text-accent-DEFAULT">{stats.temp}</span></p>
        </div>
        <div className="flex items-center text-neutral-700 text-lg">
          <CheckIcon className="h-6 w-6 text-secondary-DEFAULT mr-3" /> {/* Heroicon */}
          <p>Usuarios Oficiales Activos: <span className="font-bold text-secondary-DEFAULT">{stats.active}</span></p>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
