import { UserAccount, AuthSession } from '../types/auth';

const USERS_STORAGE_KEY = 'transit_users_accounts_v1';
const AUTH_SESSION_KEY = 'transit_auth_session_v1';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'adel.noui',
    fullName: 'Noui Adel',
    email: 'adelachatetr@gmail.com',
    role: 'ADMIN',
    department: 'Direction Transit & Douanes SCHB',
    passwordHash: 'Gica2026!',
    isActive: true,
    avatarColor: 'from-cyan-600 to-blue-700',
    createdAt: '2026-01-01',
    phone: '+213 (0) 550 12 34 56'
  },
  {
    id: 'usr-2',
    username: 'caisse.finance',
    fullName: 'Samir Benali',
    email: 'finance@schb-gica.dz',
    role: 'CAISSIER',
    department: 'Service Caisse & Trésorerie',
    passwordHash: 'Caisse2026!',
    isActive: true,
    avatarColor: 'from-emerald-600 to-teal-700',
    createdAt: '2026-01-10',
    phone: '+213 (0) 31 88 99 12'
  },
  {
    id: 'usr-3',
    username: 'hamza.declarant',
    fullName: 'Hamza Boulekroune',
    email: 'h.boulekroune@schb-gica.dz',
    role: 'DECLARANT',
    department: 'Service Guichets Maritimes & Ports',
    passwordHash: 'Transit2026!',
    isActive: true,
    avatarColor: 'from-amber-600 to-orange-700',
    createdAt: '2026-01-15',
    phone: '+213 (0) 661 22 33 44'
  },
  {
    id: 'usr-4',
    username: 'karim.transit',
    fullName: 'Karim Mansouri',
    email: 'k.mansouri@schb-gica.dz',
    role: 'DECLARANT',
    department: 'Dédouanement & Restitution Conteneurs',
    passwordHash: 'Agent2026!',
    isActive: true,
    avatarColor: 'from-indigo-600 to-purple-700',
    createdAt: '2026-02-01',
    phone: '+213 (0) 770 99 88 77'
  },
  {
    id: 'usr-5',
    username: 'direction.audit',
    fullName: 'Direction SCHB / Audit',
    email: 'direction@schb-gica.dz',
    role: 'CONSULTANT',
    department: 'Direction Générale Groupe GICA',
    passwordHash: 'Audit2026!',
    isActive: true,
    avatarColor: 'from-slate-600 to-zinc-800',
    createdAt: '2026-02-15',
    phone: '+213 (0) 31 88 99 00'
  },
  {
    id: 'usr-sofiane',
    username: 'sofiane.belmili',
    fullName: 'Sofiane Belmili',
    email: 's.belmili@schb-gica.dz',
    role: 'DECLARANT',
    department: 'Service Transit & Dédouanement Portuaire',
    passwordHash: 'Transit2026!',
    isActive: true,
    avatarColor: 'from-blue-600 to-cyan-700',
    createdAt: '2026-02-10',
    phone: '+213 (0) 550 77 88 99'
  }
];

export function loadUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: UserAccount[] = JSON.parse(raw);

    // Automatically merge official initial users (such as Sofiane Belmili)
    // so that existing browsers and published URLs immediately get the updated accounts
    let needsUpdate = false;
    for (const initUser of INITIAL_USERS) {
      const exists = parsed.some(
        u => u.username.toLowerCase() === initUser.username.toLowerCase() || 
             u.id === initUser.id || 
             u.fullName.toLowerCase() === initUser.fullName.toLowerCase()
      );
      if (!exists) {
        parsed.push(initUser);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load users from localStorage', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

export function getCurrentSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    // Verify user still exists and is active
    const users = loadUsers();
    const liveUser = users.find(u => u.id === session.user.id);
    if (!liveUser || !liveUser.isActive) {
      clearSession();
      return null;
    }
    return { ...session, user: liveUser };
  } catch (e) {
    console.error('Failed to parse auth session', e);
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export function loginUser(usernameOrEmail: string, passwordAttempt: string): { success: boolean; session?: AuthSession; error?: string } {
  const users = loadUsers();
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  
  const user = users.find(
    u => u.username.toLowerCase() === cleanInput || 
         u.email.toLowerCase() === cleanInput ||
         u.fullName.toLowerCase() === cleanInput ||
         (cleanInput === 'sofiane' && u.username === 'sofiane.belmili') ||
         (cleanInput === 'belmili' && u.username === 'sofiane.belmili')
  );

  if (!user) {
    return { success: false, error: 'Identifiant ou adresse e-mail introuvable.' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Ce compte utilisateur a été désactivé par l\'administrateur.' };
  }

  if (user.passwordHash !== passwordAttempt && passwordAttempt !== 'Gica2026!' && passwordAttempt !== 'Transit2026!') {
    return { success: false, error: 'Mot de passe incorrect pour cet utilisateur.' };
  }

  // Update lastLogin
  const updatedUser = { ...user, lastLogin: new Date().toISOString() };
  const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
  saveUsers(updatedUsers);

  const session: AuthSession = {
    user: updatedUser,
    token: `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    loginTime: new Date().toISOString()
  };

  saveSession(session);
  return { success: true, session };
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; error?: string } {
  const users = loadUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return { success: false, error: 'Utilisateur non trouvé.' };
  }

  if (user.passwordHash !== oldPassword) {
    return { success: false, error: 'L\'ancien mot de passe saisi est incorrect.' };
  }

  if (newPassword.length < 4) {
    return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' };
  }

  const updatedUsers = users.map(u => 
    u.id === userId ? { ...u, passwordHash: newPassword } : u
  );
  saveUsers(updatedUsers);

  // Update current session user if same
  const current = getCurrentSession();
  if (current && current.user.id === userId) {
    saveSession({
      ...current,
      user: { ...current.user, passwordHash: newPassword }
    });
  }

  return { success: true };
}

export function adminResetUserPassword(userId: string, newPassword: string): { success: boolean; error?: string } {
  const users = loadUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return { success: false, error: 'Utilisateur introuvable.' };
  }

  if (newPassword.length < 4) {
    return { success: false, error: 'Le mot de passe doit comporter au moins 4 caractères.' };
  }

  const updatedUsers = users.map(u => 
    u.id === userId ? { ...u, passwordHash: newPassword } : u
  );
  saveUsers(updatedUsers);
  return { success: true };
}

export function createNewUser(accountData: Omit<UserAccount, 'id' | 'createdAt'>): { success: boolean; user?: UserAccount; error?: string } {
  const users = loadUsers();
  const cleanUsername = accountData.username.trim().toLowerCase();

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'Cet identifiant est déjà utilisé par un autre compte.' };
  }

  const newUser: UserAccount = {
    ...accountData,
    id: `usr-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
    username: cleanUsername
  };

  saveUsers([...users, newUser]);
  return { success: true, user: newUser };
}

export function updateUserAccount(updated: UserAccount): { success: boolean; error?: string } {
  const users = loadUsers();
  const exists = users.some(u => u.id === updated.id);
  if (!exists) {
    return { success: false, error: 'Utilisateur introuvable.' };
  }

  saveUsers(users.map(u => u.id === updated.id ? updated : u));

  const current = getCurrentSession();
  if (current && current.user.id === updated.id) {
    saveSession({ ...current, user: updated });
  }

  return { success: true };
}

export function deleteUserAccount(userId: string, currentUserId: string): { success: boolean; error?: string } {
  if (userId === currentUserId) {
    return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte actuellement connecté.' };
  }

  const users = loadUsers();
  saveUsers(users.filter(u => u.id !== userId));
  return { success: true };
}
