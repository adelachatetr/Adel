import { getDatabaseState, saveDatabaseState, setCorsHeaders } from './_store';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const state = getDatabaseState();

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* ignore */ }
    }
    const { cheque, actor } = body || {};
    if (!cheque || !cheque.id) {
      return res.status(400).json({ success: false, error: 'Chèque invalide ou ID manquant' });
    }
    const cheques = [...state.cheques];
    const idx = cheques.findIndex(c => c.id === cheque.id);
    if (idx >= 0) {
      cheques[idx] = { ...cheques[idx], ...cheque };
    } else {
      cheques.unshift(cheque);
    }
    const updated = saveDatabaseState({ cheques }, actor);
    return res.status(200).json({ success: true, version: updated.version, cheques: updated.cheques });
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) return res.status(400).json({ success: false, error: 'ID requis' });
    const cheques = state.cheques.filter(c => c.id !== id);
    const updated = saveDatabaseState({ cheques }, req.query?.actor as string);
    return res.status(200).json({ success: true, version: updated.version, cheques: updated.cheques });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}
