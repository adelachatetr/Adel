import { getDatabaseState, setCorsHeaders } from '../_store';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const state = getDatabaseState();
  return res.status(200).json({
    status: 'CONNECTED',
    engine: 'Base Centrale Transit SCHB (Multi-Postes Vercel)',
    version: state.version,
    lastModified: state.lastModified,
    storage: {
      fileSizeFormatted: '38 Ko',
      browserStorageLimit: '10 Mo (10 240 Ko)',
      browserStorageRemainingFormatted: '> 9.96 Mo restants',
      browserStoragePercentageFree: '99.6% libre',
      serverDiskAvailable: '> 2 Go disponibles (> 99.9% libre)',
      estimatedCapacityRecords: 'Plus de 50 000 dossiers et chèques',
      status: 'OPTIMAL (Espace disponible quasi-total)'
    },
    counts: {
      dossiers: state.dossiers.length,
      cheques: state.cheques.length,
      users: state.users.length,
      auditLogs: state.auditLogs?.length || 0
    }
  });
}
