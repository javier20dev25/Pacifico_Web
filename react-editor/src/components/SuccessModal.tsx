// src/components/SuccessModal.tsx
import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import useRielStore from '@/stores/rielStore'; // Asumimos que lo manejaremos desde el Riel store por ahora

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500); // Cierra automáticamente después de 2.5 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-8">
        <CheckCircle className="w-16 h-16 mx-auto text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-800 mt-4">¡Éxito!</h2>
        <p className="text-slate-600 mt-2">{message}</p>
      </div>
    </div>
  );
};

// Componente Wrapper que se conecta al store
export const RielSuccessModal: React.FC = () => {
    const { isSuccessModalOpen, successModalMessage, closeSuccessModal } = useRielStore();

    if (!isSuccessModalOpen) {
        return null;
    }

    return <SuccessModal message={successModalMessage} onClose={closeSuccessModal} />;
}
