import { UserAccount, AuthSession, UserRole } from '../types/auth';

const USERS_STORAGE_KEY = 'transit_users_accounts_v1';
const AUTH_SESSION_KEY = 'transit_auth_session_v1';
const DELETED_USERS_STORAGE_KEY = 'transit_deleted_users_v1';

export function getDeletedUserKeys(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordDeletedUser(userId: string, username?: string): void {
  try {
    const deleted = getDeletedUserKeys();
    if (userId && !deleted.includes(userId)) {
      deleted.push(userId);
    }
    if (username) {
      const lower = username.toLowerCase().trim();
      if (!deleted.includes(lower)) {
        deleted.push(lower);
      }
    }
    localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(deleted));
  } catch (e) {
    console.error('Failed to record deleted user', e);
  }
}

export function unblockDeletedUser(usernameOrId: string): void {
  try {
    const deleted = getDeletedUserKeys();
    const clean = usernameOrId.toLowerCase().trim();
    const updated = deleted.filter(k => k.toLowerCase() !== clean && k !== usernameOrId);
    localStorage.setItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to unblock deleted user', e);
  }
}

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'adel.noui',
    fullName: 'Noui Adel',
    email: 'adelachatetr@gmail.com',
    role: 'ADMIN',
    department: 'Direction Transit & Douanes SCHB',
    passwordHash: 'A37869gs05app',
    isActive: true,
    avatarColor: 'from-cyan-600 to-blue-700',
    createdAt: '2026-01-01',
    phone: '+213 (0) 550 12 34 56'
  },
  {
    id: 'usr-3',
    username: 'hamza.boulekroun',
    fullName: 'Hamza Boulekroune',
    email: 'h.boulekroune@schb-gica.dz',
    role: 'DECLARANT',
    department: 'Service Guichets Maritimes & Ports',
    passwordHash: 'hamza2026++',
    isActive: true,
    avatarColor: 'from-amber-600 to-orange-700',
    createdAt: '2026-01-15',
    phone: '+213 (0) 661 22 33 44'
  },
  {
    id: 'usr-sofiane',
    username: 'sofiane.belmili',
    fullName: 'Sofiane Belmili',
    email: 's.belmili@schb-gica.dz',
    role: 'DECLARANT',
    department: 'Service Transit & Dédouanement Portuaire',
    passwordHash: 'sofiane2026++',
    isActive: true,
    avatarColor: 'from-blue-600 to-cyan-700',
    createdAt: '2026-02-10',
    phone: '+213 (0) 550 77 88 99'
  },
  {
    id: 'usr-ahmed',
    username: 'ahmed.bouzidi',
    fullName: 'Ahmed Bouzidi',
    email: 'a.bouzidi@schb-gica.dz',
    role: 'CHEF_TRANSIT',
    department: 'Département Approvisionnements (Appro)',
    passwordHash: 'ahmed2026++',
    isActive: true,
    avatarColor: 'from-teal-600 to-emerald-700',
    createdAt: '2026-02-15',
    phone: '+213 (0) 551 23 45 67'
  }
];

export function loadUsers(): UserAccount[] {
  try {
    // Ensure official core accounts are never blocked by any previous deletion
    unblockDeletedUser('sofiane.belmili');
    unblockDeletedUser('usr-sofiane');
    unblockDeletedUser('adel.noui');
    unblockDeletedUser('usr-1');
    unblockDeletedUser('hamza.boulekroun');
    unblockDeletedUser('usr-3');
    unblockDeletedUser('ahmed.bouzidi');
    unblockDeletedUser('usr-ahmed');

    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const deletedKeys = getDeletedUserKeys();

    if (!raw) {
      const filteredInit = INITIAL_USERS.filter(
        u => !deletedKeys.includes(u.id) && !deletedKeys.includes(u.username.toLowerCase())
      );
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredInit));
      return filteredInit;
    }
    const parsed: UserAccount[] = JSON.parse(raw);

    // Filter out legacy demo users not in official team (so exact count is 4)
    const LEGACY_REMOVE = ['caisse.finance', 'karim.transit', 'direction.audit', 'hamza.declarant'];
    const sanitized = parsed.filter(
      u => !LEGACY_REMOVE.includes(u.username.toLowerCase()) &&
           !deletedKeys.includes(u.id) && 
           !deletedKeys.includes(u.username.toLowerCase())
    );

    // Automatically merge official initial users
    let needsUpdate = sanitized.length !== parsed.length;
    for (const initUser of INITIAL_USERS) {
      if (deletedKeys.includes(initUser.id) || deletedKeys.includes(initUser.username.toLowerCase())) {
        continue;
      }
      const exists = sanitized.some(
        u => u.username.toLowerCase() === initUser.username.toLowerCase() || 
             u.id === initUser.id
      );
      if (!exists) {
        sanitized.push(initUser);
        needsUpdate = true;
      }
    }

    // Guarantee Sofiane Belmili account is present, active, and has password sofiane2026++
    const sofianeUser = sanitized.find(u => u.username.toLowerCase() === 'sofiane.belmili' || u.id === 'usr-sofiane');
    if (!sofianeUser) {
      sanitized.push({
        id: 'usr-sofiane',
        username: 'sofiane.belmili',
        fullName: 'Sofiane Belmili',
        email: 's.belmili@schb-gica.dz',
        role: 'DECLARANT',
        department: 'Service Transit & Dédouanement Portuaire',
        passwordHash: 'sofiane2026++',
        isActive: true,
        avatarColor: 'from-blue-600 to-cyan-700',
        createdAt: '2026-02-10',
        phone: '+213 (0) 550 77 88 99'
      });
      needsUpdate = true;
    } else {
      if (sofianeUser.passwordHash !== 'sofiane2026++' || !sofianeUser.isActive) {
        sofianeUser.passwordHash = 'sofiane2026++';
        sofianeUser.isActive = true;
        needsUpdate = true;
      }
    }

    // Ensure official requested credentials, roles and departments are updated
    const OFFICIAL_ACCOUNTS: Record<string, { username: string; passwordHash: string; fullName: string; department?: string; role?: UserRole }> = {
      'adel.noui': { username: 'adel.noui', passwordHash: 'A37869gs05app', fullName: 'Noui Adel' },
      'hamza.boulekroun': { username: 'hamza.boulekroun', passwordHash: 'hamza2026++', fullName: 'Hamza Boulekroune' },
      'hamza.declarant': { username: 'hamza.boulekroun', passwordHash: 'hamza2026++', fullName: 'Hamza Boulekroune' },
      'sofiane.belmili': { username: 'sofiane.belmili', passwordHash: 'sofiane2026++', fullName: 'Sofiane Belmili' },
      'ahmed.bouzidi': { 
        username: 'ahmed.bouzidi', 
        passwordHash: 'ahmed2026++', 
        fullName: 'Ahmed Bouzidi',
        department: 'Département Approvisionnements (Appro)',
        role: 'CHEF_TRANSIT'
      }
    };

    for (const u of sanitized) {
      const lower = u.username.toLowerCase();
      const official = OFFICIAL_ACCOUNTS[lower];
      if (official) {
        if (
          u.passwordHash !== official.passwordHash || 
          u.username !== official.username || 
          !u.isActive ||
          (official.department && u.department !== official.department) ||
          (official.role && u.role !== official.role)
        ) {
          u.passwordHash = official.passwordHash;
          u.username = official.username;
          if (official.department) u.department = official.department;
          if (official.role) u.role = official.role;
          u.isActive = true;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
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
         (cleanInput === 'hamza' && (u.username === 'hamza.boulekroun' || u.username === 'hamza.declarant')) ||
         (cleanInput === 'boulekroun' && (u.username === 'hamza.boulekroun' || u.username === 'hamza.declarant')) ||
         (cleanInput === 'boulekroune' && (u.username === 'hamza.boulekroun' || u.username === 'hamza.declarant')) ||
         (cleanInput === 'hamza.boulekroune' && (u.username === 'hamza.boulekroun' || u.username === 'hamza.declarant')) ||
         (cleanInput === 'sofiane' && u.username === 'sofiane.belmili') ||
         (cleanInput === 'belmili' && u.username === 'sofiane.belmili') ||
         (cleanInput === 'ahmed' && u.username === 'ahmed.bouzidi') ||
         (cleanInput === 'bouzidi' && u.username === 'ahmed.bouzidi') ||
         (cleanInput === 'adel' && u.username === 'adel.noui')
  );

  if (!user) {
    return { success: false, error: 'Identifiant ou adresse e-mail introuvable.' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Ce compte utilisateur a été désactivé par l\'administrateur.' };
  }

  if (user.passwordHash !== passwordAttempt) {
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
  const cleanUsername = accountData.username.trim().toLowerCase();
  
  // Unblock from deleted registry if it was previously marked as deleted
  unblockDeletedUser(cleanUsername);

  const users = loadUsers();
  const existingIdx = users.findIndex(u => u.username.toLowerCase() === cleanUsername);

  if (existingIdx >= 0) {
    const updated: UserAccount = {
      ...users[existingIdx],
      ...accountData,
      isActive: true,
      username: cleanUsername
    };
    users[existingIdx] = updated;
    saveUsers(users);
    return { success: true, user: updated };
  }

  const newUser: UserAccount = {
    ...accountData,
    id: cleanUsername === 'sofiane.belmili' ? 'usr-sofiane' : `usr-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
    username: cleanUsername,
    isActive: true
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
  const target = users.find(u => u.id === userId);
  if (!target) {
    return { success: false, error: 'Utilisateur introuvable.' };
  }

  // Record into deleted keys so loadUsers() never brings back this account
  recordDeletedUser(target.id, target.username);

  const remaining = users.filter(u => u.id !== userId);
  saveUsers(remaining);

  return { success: true };
}
