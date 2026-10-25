import React, { useState } from 'react';
import { X, Lock, KeyRound, Check, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types/auth';
import { changePassword } from '../utils/authStorage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onPasswordChanged: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPasswordChanged
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Le nouveau mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    const res = changePassword(currentUser.id, oldPassword, newPassword);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        onPasswordChanged();
        onClose();
        setSuccess(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1200);
    } else {
      setError(res.error || 'Erreur lors du changement de mot de passe');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Modifier mon mot de passe
              </h3>
              <p className="text-[11px] text-slate-500">
                Compte : <strong className="text-slate-800 font-semibold">{currentUser.fullName}</strong> ({currentUser.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>Mot de passe mis à jour avec succès !</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Mot de passe actuel :
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={e => { setOldPassword(e.target.value); setError(null); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white transition-colors"
                placeholder="Saisissez votre mot de passe actuel"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nouveau mot de passe :
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="h-3.5 w-3.5" />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(null); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white transition-colors"
                placeholder="Minimum 4 caractères"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Confirmer le nouveau mot de passe :
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="h-3.5 w-3.5" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white transition-colors"
                placeholder="Répétez le nouveau mot de passe"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={success}
              className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-sm shadow-cyan-700/30 transition-all cursor-pointer disabled:opacity-50"
            >
              Enregistrer le mot de passe
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
