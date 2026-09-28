import { GoogleChatLog, GoogleChatSettings } from '../types';

const STORAGE_KEY_GC_SETTINGS = 'fy2026_kpi_google_chat_settings';
const STORAGE_KEY_GC_LOGS = 'fy2026_kpi_google_chat_logs';

export const DEFAULT_GOOGLE_CHAT_SETTINGS: GoogleChatSettings = {
  enabled: true,
  webhookUrl: '',
  reminderDayOfMonth: 10,
  reminderTime: '09:00',
  deadlineDayOfMonth: 15,
  spaceName: 'ห้องแจ้งเตือน KPI ผู้บริหาร (KPI Executive Room)',
  customNote: 'ขอความร่วมมือหัวหน้าฝ่ายทุกท่านตรวจสอบความถูกต้องของข้อมูลก่อนบันทึกเข้าระบบ',
};

export function getInitialGoogleChatSettings(): GoogleChatSettings {
  const saved = localStorage.getItem(STORAGE_KEY_GC_SETTINGS);
  if (saved) {
    try {
      return { ...DEFAULT_GOOGLE_CHAT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to parse Google Chat settings:', e);
    }
  }
  return DEFAULT_GOOGLE_CHAT_SETTINGS;
}

export function saveGoogleChatSettings(settings: GoogleChatSettings) {
  localStorage.setItem(STORAGE_KEY_GC_SETTINGS, JSON.stringify(settings));
}

export function getGoogleChatLogs(): GoogleChatLog[] {
  const saved = localStorage.getItem(STORAGE_KEY_GC_LOGS);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse Google Chat logs:', e);
    }
  }
  return [];
}

export function saveGoogleChatLog(log: GoogleChatLog) {
  const existing = getGoogleChatLogs();
  existing.unshift(log);
  if (existing.length > 50) existing.pop();
  localStorage.setItem(STORAGE_KEY_GC_LOGS, JSON.stringify(existing));
}

/**
 * Formats the monthly reminder message for Google Chat
 */
export function formatGoogleChatMessage(
  settings: GoogleChatSettings,
  monthLabel: string = 'ปัจจุบัน'
) {
  const text = `📢 *[แจ้งเตือนการส่งรายงาน KPI ประจำเดือน]*
🏢 *KRC Transportation & Logistics*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *รอบการส่งข้อมูล:* ทุกวันที่ ${settings.reminderDayOfMonth} ของเดือน
⏰ *กำหนดส่งสุดท้าย (Deadline):* ก่อนวันที่ *${settings.deadlineDayOfMonth}* เวลา 17:00 น.

🔔 *เรียน:* ผู้จัดการฝ่ายและผู้รับผิดชอบตัวชี้วัด (PIC) ทุกฝ่าย
1. ฝ่ายบริหารองค์กร (Corporate)
2. ฝ่ายปฏิบัติการ (OPS)
3. ฝ่ายลูกค้าสัมพันธ์ (CR)
4. ฝ่ายคลังสินค้า (WH)
5. ฝ่ายขนส่ง (Transport)
6. ฝ่ายวิศวกรรมและก่อสร้าง (EN)
7. ฝ่ายจัดซื้อ (PU)
8. ฝ่ายทรัพยากรบุคคลและบริหารงานทั่วไป (HR & GA)
9. ฝ่ายคุณภาพ ความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม (QSHE)
10. ฝ่ายเทคโนโลยีสารสนเทศ (IT)
11. ฝ่ายบัญชีและการเงิน (ACC & FN)

📌 *สิ่งที่ต้องดำเนินการ:*
กรุณาบันทึกและอัปเดตผลการดำเนินงานจริง (Actual Performance) ลงในระบบ Google Sheets หรือผ่าน Dashboard ก่อนกำหนดส่งวันที่ ${settings.deadlineDayOfMonth} เพื่อให้คณะผู้บริหารสรุปผลการประเมิน

${settings.customNote ? `💡 *หมายเหตุ:* ${settings.customNote}\n` : ''}
🔗 *ลิงก์เปิด Dashboard:* ${window.location.origin}
━━━━━━━━━━━━━━━━━━━━━━━━━━
_ระบบแจ้งเตือนอัตโนมัติ FY2026 Executive KPI Reminder Center_`;

  // Return formatted payload with cardsV2 for modern Google Chat rich card display
  const cardPayload = {
    text: text,
    cardsV2: [
      {
        cardId: 'kpi-reminder-card',
        card: {
          header: {
            title: 'แจ้งเตือนส่งรายงาน KPI ประจำเดือน',
            subtitle: `กำหนดส่ง: ก่อนวันที่ ${settings.deadlineDayOfMonth} ของทุกเดือน`,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              header: 'กำหนดการรอบรายงานผลงาน (Deadline)',
              widgets: [
                {
                  decoratedText: {
                    topLabel: 'วันแจ้งเตือนประจำเดือน',
                    text: `ทุกวันที่ <b>${settings.reminderDayOfMonth}</b> เวลา ${settings.reminderTime} น.`,
                    startIcon: { knownIcon: 'CLOCK' },
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'กำหนดส่งรายงาน KPI',
                    text: `<font color="#d93025"><b>ก่อนวันที่ ${settings.deadlineDayOfMonth}</b></font> ของทุกเดือน (17:00 น.)`,
                    startIcon: { knownIcon: 'DESCRIPTION' },
                  },
                },
              ],
            },
            {
              header: 'ฝ่ายที่ต้องส่งรายงาน (11 ฝ่าย)',
              widgets: [
                {
                  textParagraph: {
                    text: '• Corporate • OPS • CR • WH • Transport • EN • PU • HR&GA • QSHE • IT • ACC&FN',
                  },
                },
                {
                  textParagraph: {
                    text: settings.customNote || 'กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก',
                  },
                },
              ],
            },
            {
              widgets: [
                {
                  buttonList: {
                    buttons: [
                      {
                        text: '📊 เปิดดู Executive KPI Dashboard',
                        onClick: {
                          openLink: {
                            url: window.location.origin,
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  return { text, cardPayload };
}

/**
 * Dispatch message via server-side proxy
 */
export async function sendGoogleChatMessage(
  settings: GoogleChatSettings,
  triggerType: 'manual_test' | 'scheduled_monthly' = 'manual_test'
): Promise<GoogleChatLog> {
  if (!settings.webhookUrl.trim()) {
    throw new Error('กรุณาระบุ Google Chat Webhook URL ก่อนกดส่ง');
  }

  const { text, cardPayload } = formatGoogleChatMessage(settings);

  const response = await fetch('/api/google-chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookUrl: settings.webhookUrl.trim(),
      payload: cardPayload,
      spaceName: settings.spaceName || 'Google Chat Space',
      triggerType,
      textPreview: text,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.error || 'Failed to send to Google Chat';
    const failLog: GoogleChatLog = {
      id: `gc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      spaceName: settings.spaceName || 'Google Chat',
      status: 'failed',
      message: errorMsg,
      triggerType,
    };
    saveGoogleChatLog(failLog);
    throw new Error(errorMsg);
  }

  const successLog: GoogleChatLog = {
    id: `gc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    spaceName: settings.spaceName || 'Google Chat',
    status: 'sent',
    message: 'ส่งข้อความแจ้งเตือนเข้าห้อง Google Chat สำเร็จเรียบร้อย',
    triggerType,
  };
  saveGoogleChatLog(successLog);
  return successLog;
}

/**
 * Generate Google Apps Script code to copy and paste directly into Google Sheets
 */
export function generateGoogleAppsScriptCode(
  webhookUrl: string = 'YOUR_GOOGLE_CHAT_WEBHOOK_URL_HERE',
  reminderDay: number = 10,
  deadlineDay: number = 15
): string {
  return `/**
 * Google Apps Script สำหรับส่งแจ้งเตือนส่ง KPI เข้า Google Chat อัตโนมัติทุกวันที่ ${reminderDay}
 * 
 * วิธีติดตั้ง:
 * 1. ใน Google Sheets ไปที่เมนู "ส่วนขยาย (Extensions)" > "Apps Script"
 * 2. ลบโค้ดเดิมทั้งหมด แล้วนำโค้ดนี้ไปวางแทนที่
 * 3. แทนที่ตัวแปร WEBHOOK_URL ด้วย Webhook URL ของ Google Chat ของคุณ
 * 4. คลิกไอคอนรูปนาฬิกา (Triggers) ทางซ้าย > "เพิ่มทริกเกอร์ (Add Trigger)"
 *    - ฟังก์ชันที่จะทำงาน: sendKpiMonthlyReminder
 *    - แหล่งที่มาของเหตุการณ์: ขับเคลื่อนตามเวลา (Time-driven)
 *    - ประเภทตัวจับเวลา: ตัวจับเวลารายเดือน (Month timer)
 *    - เลือกวันที่: วันที่ ${reminderDay}
 *    - เวลาของวัน: 9:00 - 10:00 น.
 */

const WEBHOOK_URL = "${webhookUrl || 'วาง_GOOGLE_CHAT_WEBHOOK_URL_ที่นี่'}";
const DEADLINE_DAY = ${deadlineDay};

function sendKpiMonthlyReminder() {
  const today = new Date();
  // ตรวจสอบว่าวันนี้เป็นวันที่ ${reminderDay} หรือไม่ (กรณีรันรายวัน)
  const currentDay = today.getDate();
  if (currentDay !== ${reminderDay}) {
    Logger.log("วันนี้ยังไม่ถึงวันที่ ${reminderDay} (ข้ามการส่ง)");
    return;
  }

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const currentMonthName = thaiMonths[today.getMonth()];
  const currentYear = today.getFullYear() + 543;

  const payload = {
    text: "📢 *[แจ้งเตือนการส่งรายงาน KPI ประจำเดือน]*\\n" +
          "🏢 *KRC Transportation & Logistics*\\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
          "📅 *รอบประเมินประจำเดือน:* " + currentMonthName + " " + currentYear + "\\n" +
          "⏰ *กำหนดส่งสุดท้าย (Deadline):* ก่อนวันที่ *" + DEADLINE_DAY + " " + currentMonthName + "* เวลา 17:00 น.\\n\\n" +
          "🔔 *เรียน:* ผู้จัดการฝ่ายและผู้รับผิดชอบตัวชี้วัด (PIC) ทุกฝ่าย\\n" +
          "1. Corporate  2. OPS  3. CR  4. WH  5. Transport\\n" +
          "6. EN  7. PU  8. HR&GA  9. QSHE  10. IT  11. ACC&FN\\n\\n" +
          "📌 *สิ่งที่ต้องดำเนินการ:*\\n" +
          "กรุณาบันทึกและตรวจสอบผลการดำเนินงานจริง (Actual Performance) ลงในระบบ Google Sheets ให้แล้วเสร็จก่อนวันที่ " + DEADLINE_DAY + " เพื่อให้ผู้บริหารจัดทำรายงานสรุป\\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━\\n" +
          "_ระบบแจ้งเตือนอัตโนมัติ FY2026 Executive KPI Reminder Center_"
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log("Google Chat Response: " + response.getContentText());
  } catch (err) {
    Logger.log("Error sending to Google Chat: " + err.toString());
  }
}

// ฟังก์ชันสำหรับทดสอบกดส่งทันที
function testSendImmediately() {
  sendKpiMonthlyReminder();
}
`;
}
