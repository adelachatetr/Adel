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
    const { dossier, actor } = body || {};
    if (!dossier || !dossier.id) {
      return res.status(400).json({ success: false, error: 'Dossier invalide ou ID manquant' });
    }
    const dossiers = [...state.dossiers];
    const idx = dossiers.findIndex(d => d.id === dossier.id);
    if (idx >= 0) {
      dossiers[idx] = { ...dossiers[idx], ...dossier };
    } else {
      dossiers.unshift(dossier);
    }
    const updated = saveDatabaseState({ dossiers }, actor);
    return res.status(200).json({ success: true, version: updated.version, dossiers: updated.dossiers });
  }

  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) return res.status(400).json({ success: false, error: 'ID requis' });
    const dossiers = state.dossiers.filter(d => d.id !== id);
    const updated = saveDatabaseState({ dossiers }, req.query?.actor as string);
    return res.status(200).json({ success: true, version: updated.version, dossiers: updated.dossiers });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}
