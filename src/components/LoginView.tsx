import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Building2, 
  KeyRound, 
  CheckCircle2,
  UserPlus,
  ArrowLeft,
  Briefcase,
  Mail,
  Phone,
  Check
} from 'lucide-react';
import { GICA_LOGO_BASE64 } from '../data/logoData';
import { loadUsers, loginUser, createNewUser } from '../utils/authStorage';
import { UserAccount, UserRole, ROLE_CONFIG } from '../types/auth';

interface LoginViewProps {
  onLoginSuccess: () => void;
  companyName: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, companyName }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [username, setUsername] = useState('adel.noui');
  const [password, setPassword] = useState('Gica2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('Service Transit & Douanes');
  const [regRole, setRegRole] = useState<UserRole>('DECLARANT');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const users = loadUsers();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginUser(username, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Erreur d\'authentification');
        setIsLoading(false);
      }
    }, 250);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirmPassword) {
      setError('Les deux mots de passe saisis ne sont pas identiques.');
      return;
    }

    if (regPassword.length < 4) {
      setError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = createNewUser({
        fullName: regFullName.trim(),
        username: regUsername.trim().toLowerCase().replace(/\s+/g, ''),
        email: regEmail.trim() || `${regUsername.trim().toLowerCase()}@schb-gica.dz`,
        phone: regPhone.trim() || undefined,
        department: regDepartment.trim(),
        role: regRole,
        passwordHash: regPassword.trim(),
        isActive: true,
        avatarColor: 'from-cyan-600 to-blue-700'
      });

      if (!res.success) {
        setError(res.error || 'Erreur lors de la création du compte.');
        setIsLoading(false);
        return;
      }

      // Automatically log in with the new account
      const loginRes = loginUser(regUsername.trim().toLowerCase().replace(/\s+/g, ''), regPassword.trim());
      if (loginRes.success) {
        onLoginSuccess();
      } else {
        setSuccessMsg(`Compte créé avec succès pour ${regFullName} ! Vous pouvez vous connecter.`);
        setMode('LOGIN');
        setUsername(regUsername);
        setPassword(regPassword);
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectAccount = (user: UserAccount) => {
    setUsername(user.username);
    setPassword(user.passwordHash);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Company Header Box */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200/20 mb-4 inline-flex items-center justify-center">
            <img 
              src={GICA_LOGO_BASE64} 
              alt="Groupe GICA" 
              className="h-14 w-auto object-contain" 
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide uppercase">
            {companyName}
          </h1>
          <p className="text-xs text-cyan-300 font-semibold tracking-wider uppercase mt-1">
            GROUPE INDUSTRIEL DES CIMENTS D'ALGÉRIE (GICA) · SCHB
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 text-[11px] font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Portail de Transit, Débours & Cautions Maritimes</span>
          </div>
        </div>
      </div>

      <div className={`mt-6 sm:mx-auto sm:w-full ${mode === 'REGISTER' ? 'sm:max-w-lg' : 'sm:max-w-md'} transition-all`}>
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20 animate-fade-in">
          
          {/* Header depending on mode */}
          {mode === 'LOGIN' ? (
            <div className="mb-6 border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-cyan-700" />
                  <span>Connexion Utilisateur</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accès protégé par mot de passe individuel pour chaque agent
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-bold border border-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Créer un nouveau compte agent"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Nouveau compte</span>
              </button>
            </div>
          ) : (
            <div className="mb-6 border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-cyan-700" />
                  <span>Créer un nouveau compte</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Remplissez vos informations pour accéder à l'application
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Connexion</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-shake">
              <span className="p-0.5 bg-rose-200 text-rose-900 rounded-full text-[10px] font-bold">!</span>
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* ==================== LOGIN FORM ==================== */}
          {mode === 'LOGIN' && (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Identifiant ou Adresse E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => { setUsername(e.target.value); setError(null); }}
                      placeholder="ex: adel.noui ou email"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mot de passe
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); }}
                      placeholder="Saisissez votre mot de passe"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 active:bg-cyan-900 text-white font-bold text-xs shadow-md shadow-cyan-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Vérification...' : 'Se connecter'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="pt-3 text-center border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('REGISTER');
                      setError(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-950 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="h-4 w-4 text-cyan-700" />
                    <span>Créer un nouveau compte</span>
                  </button>
                </div>
              </form>

              {/* User selector & demo accounts */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-cyan-700" />
                    <span>Comptes pré-configurés ({users.length}) :</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                    className="text-[10px] text-cyan-700 hover:underline font-semibold cursor-pointer"
                  >
                    {showDemoAccounts ? 'Masquer' : 'Afficher'}
                  </button>
                </div>

                {showDemoAccounts && (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {users.map(u => {
                      const roleCfg = ROLE_CONFIG[u.role];
                      const isSelected = username.toLowerCase() === u.username.toLowerCase();
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectAccount(u)}
                          className={`w-full text-left p-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-50/90 border-cyan-400 shadow-2xs' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${u.avatarColor} text-white flex items-center justify-center font-bold text-[11px] shadow-2xs`}>
                              {u.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                                <span>{u.fullName}</span>
                                {isSelected && <CheckCircle2 className="h-3 w-3 text-cyan-600 inline" />}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                login: <span className="text-slate-800 font-bold">{u.username}</span> · mdp: <span className="text-cyan-800 font-bold">{u.passwordHash}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${roleCfg.badgeClass}`}>
                            {roleCfg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ==================== REGISTRATION FORM ==================== */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nom & Prénom Complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="ex: Karim Boudiaf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Identifiant de Connexion (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="ex: karim.b"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Adresse E-mail
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="ex: k.boudiaf@schb-gica.dz"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    N° Téléphone
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="ex: +213 550 12 34 56"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rôle & Profil d'Accès
                  </label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  >
                    {Object.entries(ROLE_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Département / Service
                  </label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={e => setRegDepartment(e.target.value)}
                    placeholder="ex: Service Transit & Douanes"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Minimum 4 caractères"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Répéter mot de passe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 active:bg-cyan-900 text-white font-bold text-xs shadow-md shadow-cyan-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{isLoading ? 'Création en cours...' : 'Créer mon compte et se connecter'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className="w-full py-2 px-3 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer text-center"
                >
                  Déjà un compte ? Se connecter
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400">
              Groupe GICA · SCHB · Système sécurisé de gestion transit et débours
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
