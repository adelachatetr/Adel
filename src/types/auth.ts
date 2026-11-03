export type UserRole = 
  | 'ADMIN'          // Administrateur Système / Direction
  | 'CHEF_TRANSIT'   // Chef de Service Transit & Douane
  | 'CAISSIER'       // Service Caisse & Trésorerie
  | 'DECLARANT'      // Déclarant en Douane / Agent de Transit
  | 'CONSULTANT';    // Consultation & Audit (Lecture seule)

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  passwordHash: string; // Stored password
  isActive: boolean;
  avatarColor: string;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
}

export interface AuthSession {
  user: UserAccount;
  token: string;
  loginTime: string;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; badgeClass: string; description: string }> = {
  ADMIN: {
    label: 'Administrateur',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Accès total, paramétrage général et gestion des comptes utilisateurs'
  },
  CHEF_TRANSIT: {
    label: 'Chef Département Appro',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'Chef de Département Approvisionnements & Transit SCHB'
  },
  CAISSIER: {
    label: 'Caisse & Finance',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Émission des chèques, suivi des décaissements et encaissements'
  },
  DECLARANT: {
    label: 'Déclarant / Coursier',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Dépôt des titres en douane/compagnie et restitution des conteneurs vides'
  },
  CONSULTANT: {
    label: 'Auditeur / Consultation',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Consultation des états, suivi du tableau de bord et impressions'
  }
};
