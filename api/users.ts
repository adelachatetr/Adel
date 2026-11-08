import { getDatabaseState, saveDatabaseState, setCorsHeaders } from './_store';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const state = getDatabaseState();

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, users: state.users });
  }

  if (req.method === 'POST') {
    let user = req.body;
    if (typeof user === 'string') {
      try { user = JSON.parse(user); } catch { /* ignore */ }
    }
    const users = [...state.users];
    const idx = users.findIndex(u => u.id === user.id || u.username === user.username);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    const updated = saveDatabaseState({ users }, 'Administration');
    return res.status(200).json({ success: true, version: updated.version, users: updated.users });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}
