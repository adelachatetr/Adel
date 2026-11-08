import { setCorsHeaders } from './_store';

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);
  return res.status(200).json({
    status: 'ok',
    service: 'Transit SCHB Database Engine (Vercel Serverless)',
    timestamp: new Date().toISOString()
  });
}
