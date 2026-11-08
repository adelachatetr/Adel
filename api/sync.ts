import { getDatabaseState, saveDatabaseState, setCorsHeaders } from './_store';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'GET') {
    const state = getDatabaseState();
    return res.status(200).json({
      success: true,
      version: state.version,
      lastModified: state.lastModified,
      dossiers: state.dossiers,
      cheques: state.cheques,
      settings: state.settings,
      users: state.users,
      auditLogs: state.auditLogs
    });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* ignore */ }
    }
    const { dossiers, cheques, settings, users, actor } = body || {};
    const updateData: any = {};
    if (Array.isArray(dossiers)) updateData.dossiers = dossiers;
    if (Array.isArray(cheques)) updateData.cheques = cheques;
    if (settings && typeof settings === 'object') updateData.settings = settings;
    if (Array.isArray(users)) updateData.users = users;

    const state = saveDatabaseState(updateData, actor);
    return res.status(200).json({
      success: true,
      version: state.version,
      lastModified: state.lastModified,
      dossiers: state.dossiers,
      cheques: state.cheques,
      settings: state.settings,
      users: state.users
    });
  }

  return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
}
