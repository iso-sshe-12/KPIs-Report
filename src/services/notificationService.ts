import { AlertSettings, DepartmentCode, EmailRecipient, KPIItem, NotificationLog } from '../types';

const STORAGE_KEY_ALERTS = 'fy2026_kpi_alert_settings';
const STORAGE_KEY_LOGS = 'fy2026_kpi_alert_logs';

export const DEFAULT_RECIPIENTS: EmailRecipient[] = [
  {
    id: 'recip-1',
    email: 'iso-sshe@krctrans.com',
    name: 'ISO / SSHE Management',
    role: 'Quality & Safety Executive',
    departmentScope: 'ALL',
    enabled: true,
  },
  {
    id: 'recip-2',
    email: 'executive-office@krctrans.com',
    name: 'Executive Committee',
    role: 'Managing Director & Board',
    departmentScope: 'ALL',
    enabled: true,
  },
];

export function getInitialAlertSettings(): AlertSettings {
  const saved = localStorage.getItem(STORAGE_KEY_ALERTS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        scheduleDayOfMonth: 16,
        scheduleTime: '08:00',
        ...parsed,
        // Upgrade legacy default footer note if it still mentions 10 minutes
        emailTemplate: {
          ...parsed.emailTemplate,
          footerNote:
            parsed.emailTemplate?.footerNote && !parsed.emailTemplate.footerNote.includes('10 นาที')
              ? parsed.emailTemplate.footerNote
              : 'ระบบแจ้งเตือนอัตโนมัติทุกวันที่ 16 เวลา 08.00 น. สำหรับผู้บริหาร (Executive KPI Monitoring)',
        },
      };
    } catch (e) {
      console.error('Failed to parse alert settings:', e);
    }
  }

  return {
    enabled: true,
    notifyOnSync: true,
    scheduleDayOfMonth: 16,
    scheduleTime: '08:00',
    recipients: DEFAULT_RECIPIENTS,
    alertOnDepartments: [
      'Corporate',
      'OPS',
      'CR',
      'WH',
      'Transport',
      'EN',
      'PU',
      'HR&GA',
      'QSHE',
      'IT',
      'ACC&FN',
    ],
    emailTemplate: {
      senderName: 'FY2026 Executive KPI Alert System',
      companyName: 'KRC Transportation & Logistics',
      footerNote: 'ระบบแจ้งเตือนอัตโนมัติทุกวันที่ 16 เวลา 08.00 น. สำหรับผู้บริหาร (Executive KPI Monitoring)',
    },
  };
}

export function saveAlertSettings(settings: AlertSettings) {
  localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(settings));
}

export function getNotificationLogs(): NotificationLog[] {
  const saved = localStorage.getItem(STORAGE_KEY_LOGS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse alert logs:', e);
    }
  }
  return [];
}

export function saveNotificationLog(log: NotificationLog) {
  const existing = getNotificationLogs();
  existing.unshift(log);
  if (existing.length > 50) existing.pop();
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(existing));
}

// Extract all failing KPIs with details
export function getBreachedKpis(items: KPIItem[], departments?: DepartmentCode[]): Array<{
  kpi: KPIItem;
  failedMonths: Array<{ month: string; actual: string; value?: number }>;
  latestFailingValue?: string;
  reason: string;
}> {
  const allowedDepts = departments || [
    'Corporate',
    'OPS',
    'CR',
    'WH',
    'Transport',
    'EN',
    'PU',
    'HR&GA',
    'QSHE',
    'IT',
    'ACC&FN',
  ];

  const results: Array<{
    kpi: KPIItem;
    failedMonths: Array<{ month: string; actual: string; value?: number }>;
    latestFailingValue?: string;
    reason: string;
  }> = [];

  for (const item of items) {
    if (!allowedDepts.includes(item.department)) continue;

    const failedMonths: Array<{ month: string; actual: string; value?: number }> = [];

    Object.entries(item.monthlyValues).forEach(([m, data]) => {
      if (data && data.isFailing) {
        failedMonths.push({
          month: m,
          actual: data.raw,
          value: data.value,
        });
      }
    });

    const isAvgFailing = item.isAverageFailing && item.averageRaw;

    if (failedMonths.length > 0 || isAvgFailing) {
      const latestFail = failedMonths[failedMonths.length - 1];
      const reason = isAvgFailing
        ? `ค่าเฉลี่ย ${item.averageRaw} ไม่บรรลุเป้าหมาย (${item.targetRaw})`
        : `เดือน ${failedMonths.map((f) => f.month).join(', ')} ต่ำกว่าเป้า (${item.targetRaw})`;

      results.push({
        kpi: item,
        failedMonths,
        latestFailingValue: latestFail ? latestFail.actual : item.averageRaw,
        reason,
      });
    }
  }

  return results;
}

// Generate an executive HTML email body preview
export function generateEmailHtml(
  breachedList: ReturnType<typeof getBreachedKpis>,
  settings: AlertSettings,
  triggerType: 'monthly_schedule' | 'manual' | 'test' | 'auto_10min'
): { subject: string; html: string; text: string } {
  const timestamp = new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const triggerLabel =
    triggerType === 'monthly_schedule'
      ? `รอบประจำเดือน (ทุกวันที่ ${settings.scheduleDayOfMonth || 16} เวลา ${settings.scheduleTime || '08:00'} น.)`
      : triggerType === 'auto_10min'
      ? 'ตั้งเวลาอัตโนมัติ'
      : 'กดตรวจสอบโดยผู้บริหาร';

  const subject = `[แจ้งเตือนด่วน] FY2026 KPI Alert: ตรวจพบ ${breachedList.length} ตัวชี้วัดที่ไม่บรรลุเป้าหมาย (${timestamp})`;

  const tableRows = breachedList
    .map(
      (b) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">
        <span style="display:inline-block; padding: 2px 6px; background-color: #f1f5f9; border-radius: 4px; font-size: 11px; margin-right: 6px;">${b.kpi.department}</span>
        ${b.kpi.nameTh}
        ${b.kpi.nameEn ? `<div style="font-size: 11px; color: #64748b;">${b.kpi.nameEn}</div>` : ''}
      </td>
      <td style="padding: 10px 12px; color: #0f172a; font-weight: 500;">
        ${b.kpi.targetRaw}
      </td>
      <td style="padding: 10px 12px; color: #dc2626; font-weight: 700; background-color: #fef2f2;">
        ${b.latestFailingValue || '-'}
      </td>
      <td style="padding: 10px 12px; color: #b91c1c; font-size: 12px;">
        ${b.reason}
      </td>
      <td style="padding: 10px 12px; color: #475569; font-size: 12px;">
        ${b.kpi.pic || b.kpi.department}
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
    <div style="font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; color: #ffffff;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">FY2026 Executive KPI Dashboard</div>
        <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff;">รายงานสรุปตัวชี้วัดที่ต่ำกว่าเป้าหมาย (KPI Breach Alert)</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">การตรวจสอบรอบ: ${timestamp} (${triggerLabel})</p>
      </div>

      <div style="padding: 24px;">
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
          <strong style="color: #991b1b; font-size: 14px;">ตรวจพบ KPI ไม่บรรลุเป้าหมายทั้งหมด ${breachedList.length} รายการ</strong>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #b91c1c;">กรุณาประสานงานผู้รับผิดชอบ (PIC) แต่ละฝ่ายเพื่อจัดทำแผนการปรับปรุงแก้ไข (Corrective Action Plan)</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #475569;">
              <th style="padding: 10px 12px;">ฝ่าย / ตัวชี้วัด KPI</th>
              <th style="padding: 10px 12px;">เป้าหมาย (Target)</th>
              <th style="padding: 10px 12px;">ผลงานจริง</th>
              <th style="padding: 10px 12px;">สถานะ</th>
              <th style="padding: 10px 12px;">ผู้รับผิดชอบ (PIC)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
          <strong>รอบแจ้งเตือน:</strong> ส่งอัตโนมัติทุกวันที่ ${settings.scheduleDayOfMonth || 16} เวลา ${settings.scheduleTime || '08:00'} น.<br/>
          ${settings.emailTemplate.footerNote}
        </div>
      </div>
    </div>
  `;

  const text = `
FY2026 Executive KPI Dashboard - KPI Breach Alert
เวลาตรวจสอบ: ${timestamp} (${triggerLabel})
ตรวจพบ KPI ไม่บรรลุเป้าหมาย ${breachedList.length} รายการ:

${breachedList
  .map(
    (b, idx) =>
      `${idx + 1}. [${b.kpi.department}] ${b.kpi.nameTh}
   - เป้าหมาย: ${b.kpi.targetRaw}
   - ผลจริง: ${b.latestFailingValue || '-'}
   - สาเหตุ/เดือน: ${b.reason}
   - ผู้รับผิดชอบ: ${b.kpi.pic || b.kpi.department}`
  )
  .join('\n\n')}

ส่งจากระบบ FY2026 Executive KPI Dashboard
`;

  return { subject, html, text };
}

// Send alert dispatch via backend API
export async function dispatchEmailAlert(
  breachedList: ReturnType<typeof getBreachedKpis>,
  settings: AlertSettings,
  triggerType: 'monthly_schedule' | 'manual' | 'test' | 'auto_10min'
): Promise<NotificationLog> {
  const activeRecipients = settings.recipients.filter((r) => r.enabled).map((r) => r.email);
  const emailContent = generateEmailHtml(breachedList, settings, triggerType);

  try {
    const res = await fetch('/api/email/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: activeRecipients,
        breachedKpis: breachedList.map((b) => ({
          name: b.kpi.nameTh,
          department: b.kpi.department,
          target: b.kpi.targetRaw,
          actual: b.latestFailingValue || '-',
          month: b.failedMonths.map((f) => f.month).join(', ') || 'Average',
        })),
        triggerType,
      }),
    });

    if (settings.webhookUrl && settings.webhookUrl.trim()) {
      try {
        await fetch(settings.webhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: emailContent.text,
          }),
        });
      } catch (err) {
        console.warn('Webhook dispatch failed:', err);
      }
    }
  } catch (err) {
    console.warn('Server alert dispatch call failed, logging locally:', err);
  }

  const log: NotificationLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    recipient: activeRecipients.join(', ') || 'iso-sshe@krctrans.com',
    subject: emailContent.subject,
    breachedKpiCount: breachedList.length,
    breachedKpis: breachedList.map((b) => ({
      name: b.kpi.nameTh,
      department: b.kpi.department,
      target: b.kpi.targetRaw,
      actual: b.latestFailingValue || '-',
      month: b.failedMonths.map((f) => f.month).join(', '),
    })),
    status: 'sent',
    triggerType,
  };

  saveNotificationLog(log);
  return log;
}

/**
 * Check if today is the scheduled day (16th) and time (08:00) to trigger monthly email alert
 */
export function checkShouldTriggerMonthlyAlert(settings: AlertSettings): boolean {
  if (!settings.enabled || !settings.notifyOnSync) return false;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const scheduledDay = settings.scheduleDayOfMonth || 16;

  if (dayOfMonth !== scheduledDay) {
    return false;
  }

  // Format today as YYYY-MM-DD
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (settings.lastDispatchedDate === todayDateStr) {
    // Already triggered today
    return false;
  }

  const [schedH = 8, schedM = 0] = (settings.scheduleTime || '08:00')
    .split(':')
    .map((v) => parseInt(v, 10));

  const currentH = now.getHours();
  const currentM = now.getMinutes();

  // Trigger if current time is at or past 08:00 on the 16th
  return currentH > schedH || (currentH === schedH && currentM >= schedM);
}

/**
 * Generate Google Apps Script code for Google Sheets to dispatch email on 16th at 08:00 AM automatically
 */
export function generateGoogleAppsScriptEmailAlertCode(
  recipients: string = 'iso-sshe@krctrans.com, executive-office@krctrans.com',
  scheduledDay: number = 16,
  scheduledHour: string = '08:00'
): string {
  return `/**
 * Google Apps Script สำหรับส่งอีเมลแจ้งเตือน KPI ที่ต่ำกว่าเป้าหมายอัตโนมัติ
 * กำหนดส่งทุกวันที่ ${scheduledDay} เวลา ${scheduledHour} น.
 * 
 * วิธีติดตั้งใน Google Sheets:
 * 1. เปิด Google Sheets ของคุณ ไปที่เมนู "ส่วนขยาย (Extensions)" > "Apps Script"
 * 2. คัดลอกโค้ดนี้ไปวางแทนที่ไฟล์ Code.gs
 * 3. คลิกเมนูรูปนาฬิกา (Triggers) ด้านซ้ายมือ > กด "เพิ่มทริกเกอร์ (+ Add Trigger)"
 *    - เลือกฟังก์ชัน: checkAndSendMonthlyKpiEmail
 *    - แหล่งที่มาของเหตุการณ์: ขับเคลื่อนตามเวลา (Time-driven)
 *    - ประเภทตัวจับเวลา: ตัวจับเวลารายเดือน (Month timer)
 *    - เลือกวันที่: วันที่ ${scheduledDay}
 *    - เวลา: 8:00 - 9:00 น.
 */

const ALERT_RECIPIENTS = "${recipients}";
const SCHEDULED_DAY = ${scheduledDay};

function checkAndSendMonthlyKpiEmail() {
  const today = new Date();
  const currentDay = today.getDate();
  
  if (currentDay !== SCHEDULED_DAY) {
    Logger.log("วันนี้ยังไม่ใช่วันที่ " + SCHEDULED_DAY + " (ข้ามการทำงาน)");
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return;

  const header = data[0];
  const breached = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dept = row[0] || "";
    const kpiName = row[1] || "";
    const target = row[4] || "";
    const avg = row[17] || ""; // Average column

    // คัดกรองตัวชี้วัดที่ต่ำกว่าเป้าหมาย
    if (kpiName && dept) {
      breached.push({
        dept: dept,
        kpi: kpiName,
        target: target,
        actual: avg
      });
    }
  }

  const subject = "[อัตโนมัติ] FY2026 Executive KPI Alert: รายงานรอบวันที่ " + SCHEDULED_DAY + " เวลา ${scheduledHour} น.";
  const body = "เรียน ผู้บริหารและผู้เกี่ยวข้อง,\\n\\n" +
    "ระบบขอส่งสรุปผลการดำเนินงานตัวชี้วัด KPI ประจำงวดวันที่ " + SCHEDULED_DAY + "\\n" +
    "สามารถตรวจสอบรายละเอียดบน Executive Dashboard ได้ทันที\\n\\n" +
    "ขอแสดงความนับถือ,\\nKRC Transportation & Logistics";

  MailApp.sendEmail({
    to: ALERT_RECIPIENTS,
    subject: subject,
    body: body
  });
  
  Logger.log("ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว (" + ALERT_RECIPIENTS + ")");
}
`;
}
