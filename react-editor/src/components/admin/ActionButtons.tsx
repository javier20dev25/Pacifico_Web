import React from 'react';

const ActionButtons = ({ user, onAction }) => {
  const handleButtonClick = (action) => {
    onAction(action, user);
  };

  const buttonStyle = "px-2 py-1 text-xs rounded-md font-semibold transition-colors";
  const baseBtn = buttonStyle + ' bg-gray-200 text-gray-800 hover:bg-gray-300';
  const dangerBtn = buttonStyle + ' bg-red-500 text-white hover:bg-red-600';
  const primaryBtn = buttonStyle + ' bg-blue-500 text-white hover:bg-blue-600';
  const successBtn = buttonStyle + ' bg-green-500 text-white hover:bg-green-600';

  return (
    <div className="flex flex-col sm:flex-row gap-1">
      {user.status === 'temporary' && (
        <button 
          onClick={() => handleButtonClick('show-credentials')}
          className={successBtn}
        >
          Credenciales
        </button>
      )}
      <button 
        onClick={() => handleButtonClick('renew')}
        disabled={user.status !== 'active'}
        className={baseBtn + ' disabled:opacity-50 disabled:cursor-not-allowed'}
      >
        Renovar
      </button>
      <button 
        onClick={() => handleButtonClick('reset-password')}
        className={baseBtn}
      >
        Resetear Pass
      </button>
      {user.status === 'suspended' ? (
        <button 
          onClick={() => handleButtonClick('reactivate')}
          className={primaryBtn}
        >
          Reactivar
        </button>
      ) : (
        <button 
          onClick={() => handleButtonClick('suspend')}
          className={dangerBtn}
        >
          Suspender
        </button>
      )}
      <button 
        onClick={() => handleButtonClick('revoke')}
        className={dangerBtn}
      >
        Revocar
      </button>
    </div>
  );
};

export default ActionButtons;