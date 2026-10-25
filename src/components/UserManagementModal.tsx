import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  KeyRound, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Lock, 
  UserCheck, 
  UserX,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { UserAccount, UserRole, ROLE_CONFIG } from '../types/auth';
import { 
  loadUsers, 
  createNewUser, 
  adminResetUserPassword, 
  updateUserAccount, 
  deleteUserAccount 
} from '../utils/authStorage';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUsersUpdated: () => void;
  initialAddMode?: boolean;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
  initialAddMode = false
}) => {
  const [users, setUsers] = useState<UserAccount[]>(loadUsers());
  const [isAddMode, setIsAddMode] = useState(initialAddMode);
  const [editingPasswordUser, setEditingPasswordUser] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsers(loadUsers());
      if (initialAddMode) {
        setIsAddMode(true);
      }
    }
  }, [isOpen, initialAddMode]);

  // New user form state
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDepartment, setNewDepartment] = useState('Service Transit & Douanes');
  const [newRole, setNewRole] = useState<UserRole>('DECLARANT');
  const [newPassword, setNewPassword] = useState('Gica2026!');

  if (!isOpen) return null;

  const refreshList = () => {
    setUsers(loadUsers());
    onUsersUpdated();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = createNewUser({
      fullName: newFullName.trim(),
      username: newUsername.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@schb-gica.dz`,
      phone: newPhone.trim() || undefined,
      department: newDepartment.trim(),
      role: newRole,
      passwordHash: newPassword.trim(),
      isActive: true,
      avatarColor: 'from-cyan-600 to-indigo-700'
    });

    if (res.success) {
      setFeedback({ type: 'success', message: `Le compte utilisateur "${newFullName}" a été créé avec succès.` });
      setIsAddMode(false);
      setNewFullName('');
      setNewUsername('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('Gica2026!');
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Erreur lors de la création du compte.' });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordUser) return;
    setFeedback(null);

    const res = adminResetUserPassword(editingPasswordUser.id, newAdminPassword);
    if (res.success) {
      setFeedback({ 
        type: 'success', 
        message: `Mot de passe réinitialisé avec succès pour ${editingPasswordUser.fullName} : "${newAdminPassword}"` 
      });
      setEditingPasswordUser(null);
      setNewAdminPassword('');
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Erreur lors de la réinitialisation.' });
    }
  };

  const handleToggleActive = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      setFeedback({ type: 'error', message: 'Vous ne pouvez pas désactiver votre propre compte.' });
      return;
    }

    const updated = { ...user, isActive: !user.isActive };
    updateUserAccount(updated);
    setFeedback({ 
      type: 'success', 
      message: `Compte ${user.fullName} ${updated.isActive ? 'activé' : 'désactivé'}.` 
    });
    refreshList();
  };

  const handleDelete = (user: UserAccount) => {
    if (user.id === currentUser.id) {
      setFeedback({ type: 'error', message: 'Impossible de supprimer votre propre compte.' });
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    const deletedName = userToDelete.fullName;
    const res = deleteUserAccount(userToDelete.id, currentUser.id);
    if (res.success) {
      setFeedback({ type: 'success', message: `Le compte de "${deletedName}" a été supprimé avec succès.` });
      setUserToDelete(null);
      refreshList();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Erreur lors de la suppression.' });
      setUserToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-100 text-cyan-800 border border-cyan-200">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Gestion des Utilisateurs & Mots de Passe</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-mono font-bold">
                  {users.length} comptes
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Administration des accès, réinitialisation des mots de passe et gestion des profils
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddMode && !editingPasswordUser && (
              <button
                type="button"
                onClick={() => setIsAddMode(true)}
                className="px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-700/30 transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Nouvel Utilisateur</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`p-3 px-5 text-xs font-semibold flex items-center justify-between border-b ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* Modal sub-view: Reset Password */}
          {editingPasswordUser && (
            <div className="bg-white border border-cyan-200 rounded-2xl p-5 shadow-md mb-6 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-cyan-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Définir un nouveau mot de passe pour {editingPasswordUser.fullName} ({editingPasswordUser.username})
                  </h3>
                </div>
                <button
                  onClick={() => setEditingPasswordUser(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Annuler
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Saisissez le nouveau mot de passe"
                    value={newAdminPassword}
                    onChange={e => setNewAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  Valider le mot de passe
                </button>
              </form>
            </div>
          )}

          {/* Modal sub-view: Add User */}
          {isAddMode && (
            <div className="bg-white border border-slate-300 rounded-2xl p-5 shadow-md mb-6 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-cyan-700" />
                  <span>Créer un nouvel utilisateur avec mot de passe</span>
                </h3>
                <button
                  onClick={() => setIsAddMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Fermer
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nom Complet :</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Yacine Bensalem"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Identifiant de connexion (Login) :</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: yacine.bensalem"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rôle & Permissions :</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:outline-none focus:border-cyan-600"
                  >
                    {Object.entries(ROLE_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label} - {cfg.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Département / Service :</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Service Transit & Douanes"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mot de Passe Initial :</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Mot de passe"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-8 pr-2 p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-cyan-900 focus:outline-none focus:border-cyan-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Téléphone (Optionnel) :</label>
                  <input
                    type="text"
                    placeholder="ex: +213 550 00 00 00"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddMode(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold shadow-sm shadow-cyan-700/30 cursor-pointer"
                  >
                    Enregistrer l'utilisateur
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Liste des Utilisateurs et Accès
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Chaque agent peut se connecter avec son identifiant et son mot de passe
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Agent</th>
                    <th className="py-2.5 px-3">Identifiant</th>
                    <th className="py-2.5 px-3">Rôle & Département</th>
                    <th className="py-2.5 px-3">Mot de passe actuel</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const roleCfg = ROLE_CONFIG[u.role];
                    const isSelf = u.id === currentUser.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${u.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-2xs`}>
                              {u.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-100 text-cyan-800 text-[9px] font-bold">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                <span className="flex items-center gap-0.5">
                                  <Mail className="h-3 w-3" /> {u.email}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {u.username}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${roleCfg.badgeClass}`}>
                            {roleCfg.label}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {u.department}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-800 font-semibold">
                            <KeyRound className="h-3 w-3 text-cyan-700" />
                            <span>{u.passwordHash}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                              isSelf ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                            } ${
                              u.isActive 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                            title={isSelf ? 'Compte actuel actif' : 'Cliquez pour activer/désactiver'}
                          >
                            {u.isActive ? '● Actif' : '○ Désactivé'}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPasswordUser(u);
                                setNewAdminPassword('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Changer le mot de passe"
                            >
                              <KeyRound className="h-3 w-3" />
                              <span>Modifier MDP</span>
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDelete(u)}
                                className="px-2.5 py-1 text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                                title="Supprimer définitivement ce compte"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                <span>Supprimer</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-cyan-700" />
            <span>Tous les mots de passe sont enregistrés et modifiables instantanément.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>

      {/* In-app Deletion Confirmation Dialog (Replaces blocked window.confirm) */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-rose-300 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl border border-rose-200">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Supprimer le compte utilisateur ?
                </h4>
                <p className="text-xs text-slate-500">
                  Cette action est immédiate et irréversible.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nom de l'agent :</span>
                <span className="font-bold text-slate-900">{userToDelete.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Identifiant (login) :</span>
                <span className="font-mono font-bold text-cyan-800">{userToDelete.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rôle :</span>
                <span className="font-semibold text-slate-800">{userToDelete.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Département :</span>
                <span className="text-slate-700">{userToDelete.department}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Oui, supprimer ce compte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
