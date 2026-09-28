import express from 'express';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory alert audit logs
  const alertLogs: any[] = [];

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API 2: Proxy Google Sheet CSV fetch to avoid browser CORS issues
  app.get('/api/sheets/fetch', async (req, res) => {
    const sheetUrl = req.query.url as string;
    if (!sheetUrl) {
      return res.status(400).json({ error: 'Missing sheet url' });
    }

    try {
      let targetFetchUrl = sheetUrl;

      // Extract Sheet ID and GID if user provided a standard Google Sheets web link
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && !sheetUrl.includes('/pub') && !sheetUrl.includes('/export')) {
        const sheetId = match[1];
        const gidMatch = sheetUrl.match(/gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        targetFetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }

      const response = await fetch(targetFetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/csv,text/plain,*/*',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Failed to fetch Google Sheet (${response.status}: ${response.statusText}). Make sure the sheet is shared as "Anyone with the link can view" or "Published to web".`,
        });
      }

      const csvData = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(csvData);
    } catch (error: any) {
      console.error('Error fetching sheet:', error);
      res.status(500).json({ error: error.message || 'Internal server error fetching Google Sheet' });
    }
  });

  // API 3: Send / simulate Email Alert for Breached KPIs
  app.post('/api/email/send-alert', (req, res) => {
    try {
      const {
        recipients,
        breachedKpis,
        triggerType,
        customNote,
      } = req.body;

      const logEntry = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        recipients: recipients || ['iso-sshe@krctrans.com'],
        breachedCount: (breachedKpis || []).length,
        breachedKpis: breachedKpis || [],
        triggerType: triggerType || 'manual',
        customNote: customNote || '',
        status: 'sent',
        message: `Notification successfully dispatched for ${breachedKpis?.length || 0} below-target KPIs.`,
      };

      alertLogs.unshift(logEntry);
      // Keep last 100 logs
      if (alertLogs.length > 100) alertLogs.pop();

      res.json({
        success: true,
        log: logEntry,
        message: `Alert dispatched to ${Array.isArray(recipients) ? recipients.join(', ') : recipients}`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API 4: Get alert logs
  app.get('/api/email/logs', (req, res) => {
    res.json(alertLogs);
  });

  // API 5: Send Google Chat notification via incoming webhook
  app.post('/api/google-chat/send', async (req, res) => {
    try {
      const { webhookUrl, payload, spaceName, triggerType, textPreview } = req.body;
      if (!webhookUrl || typeof webhookUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'Google Chat Webhook URL is required' });
      }

      if (!webhookUrl.startsWith('https://chat.googleapis.com/') && !webhookUrl.startsWith('http')) {
        return res.status(400).json({
          success: false,
          error: 'รูปแบบ Webhook URL ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://chat.googleapis.com/...',
        });
      }

      const gcResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(payload || { text: textPreview || '📢 แจ้งเตือนส่งรายงาน KPI ประจำเดือน' }),
      });

      const responseText = await gcResponse.text();
      let responseBody: any;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = { raw: responseText };
      }

      if (!gcResponse.ok) {
        return res.status(gcResponse.status).json({
          success: false,
          error: `Google Chat ส่งคืนข้อผิดพลาด (${gcResponse.status}): ${responseBody?.error?.message || responseText}`,
        });
      }

      res.json({
        success: true,
        message: 'ส่งข้อความเข้าห้อง Google Chat เรียบร้อยแล้ว',
        data: responseBody,
      });
    } catch (err: any) {
      console.error('Error posting to Google Chat:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal error dispatching to Google Chat' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FY2026 Executive KPI Dashboard server running on http://localhost:${PORT}`);
  });
}

startServer();
