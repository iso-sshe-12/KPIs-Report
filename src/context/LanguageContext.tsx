import React, { createContext, useContext, useEffect, useState } from 'react';
import { DepartmentCode, KPIItem, MonthKey } from '../types';

export type Language = 'th' | 'en';

export interface Translations {
  navbar: {
    title: string;
    liveBadge: string;
    subCorporate: string;
    sheetsConnected: string;
    defaultData: string;
    syncInterval: string;
    syncNow: string;
    syncing: string;
    sheetsBtn: string;
    chatBtn: string;
    chatBadge: string;
    emailAlertsBtn: string;
    langBtn: string;
  };
  subheader: {
    fiscalCycle: string;
    dataSource: string;
    syncTimer: string;
    emailAlerts: string;
    active: string;
    disabled: string;
    chatReminder: string;
  };
  executiveCards: {
    safetyTitle: string;
    safetySubtitle: string;
    safetyTarget: string;
    safetySafe: string;
    safetyIncident: string;
    safetyActive: string;
    csatTitle: string;
    csatSubtitle: string;
    csatTarget: string;
    csatCorporateBenchmark: string;
    csatTargetMet: string;
    csatBelowTarget: string;
    profitTitle: string;
    profitSubtitle: string;
    profitTarget: string;
    profitDept: string;
    profitMet: string;
    profitNotMet: string;
    profitPending: string;
    profitOverTarget: string;
    profitGap: string;
    overallTitle: string;
    overallEvaluated: string;
    overallStandard: string;
    passedBadge: string;
    failedBadge: string;
    pendingBadge: string;
    transport: string;
    depot: string;
    warehouse: string;
    pendingEvaluation: string;
  };
  breachBanner: {
    executiveAlert: string;
    breachDetected: string;
    headline: string;
    sendEmailBtn: string;
    target: string;
    actual: string;
    pic: string;
  };
  csatChart: {
    title: string;
    subtitle: string;
    fy2026Tab: string;
    fy2025Tab: string;
    transport: string;
    depot: string;
    warehouse: string;
    overall: string;
    target95: string;
    pendingEvaluation: string;
    overallCorporateTarget: string;
    drillDownHint: string;
  };
  departmentOverview: {
    title: string;
    subtitle: string;
    allDepartments: string;
    passed: string;
    failed: string;
    pending: string;
    waitingEval: string;
    all: string;
    falling: string;
    items: string;
  };
  kpiAnalytics: {
    title: string;
    subtitle: string;
    deptBreakdownTab: string;
    monthlyDrilldownTab: string;
    passedLabel: string;
    failedLabel: string;
    pendingLabel: string;
    achievementRate: string;
    selectKpiHint: string;
    trendTitle: string;
  };
  kpiTable: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterFailed: string;
    filterPassed: string;
    filterPending: string;
    exportCsv: string;
    printPdf: string;
    colDept: string;
    colNo: string;
    colKpiName: string;
    colTarget: string;
    colTotal: string;
    colAverage: string;
    colPic: string;
    statusPassed: string;
    statusFailed: string;
    statusPending: string;
    newBadge: string;
    noMatchingKpi: string;
    legendTitle: string;
    legendRed: string;
    legendBlue: string;
    legendGreen: string;
    footerShowing: string;
    footerHint: string;
  };
  kpiModal: {
    newKpiBadge: string;
    unmetTarget: string;
    passedTarget: string;
    pendingEvaluation: string;
    target: string;
    average: string;
    total: string;
    pic: string;
    divisionBreakdown: string;
    divisionTarget: string;
    noMonthlyData: string;
    profitSummaryTitle: string;
    profitSummaryDesc: string;
    safetySummaryTitle: string;
    safetySummaryDesc: string;
    comparisonChartTitle: string;
    actualResult: string;
    noNumericData: string;
    monthlyTableTitle: string;
    criteriaPrefix: string;
    gte: string;
    lte: string;
    sendAlertBtn: string;
    closeBtn: string;
  };
  months: Record<MonthKey, string>;
  departments: Record<DepartmentCode, { short: string; full: string }>;
}

export const translations: Record<Language, Translations> = {
  th: {
    navbar: {
      title: 'FY2026 Executive KPI Dashboard',
      liveBadge: 'Live Monitoring',
      subCorporate: 'เป้าหมายหลักองค์กร & รายฝ่าย',
      sheetsConnected: 'Google Sheets เชื่อมต่อแล้ว',
      defaultData: 'ข้อมูลเริ่มต้น FY2026 (พร้อมเชื่อมต่อ Sheets)',
      syncInterval: 'รอบอัพเดต',
      syncNow: 'ซิงค์ข้อมูล',
      syncing: 'กำลังซิงค์...',
      sheetsBtn: 'Google Sheets',
      chatBtn: 'Google Chat',
      chatBadge: 'เตือนวันที่ 10',
      emailAlertsBtn: 'แจ้งเตือนอีเมล',
      langBtn: 'ภาษา',
    },
    subheader: {
      fiscalCycle: 'ปีงบประมาณ FY 2026 (รอบประเมิน เมษายน 2025 – มีนาคม 2026)',
      dataSource: 'อ้างอิงข้อมูล: KRC Transportation & Logistics',
      syncTimer: 'รอบตั้งเวลา: ทุก',
      emailAlerts: 'แจ้งเตือนอีเมล:',
      active: 'เปิดใช้งาน',
      disabled: 'ปิด',
      chatReminder: 'Google Chat: เตือนทุกวันที่',
    },
    executiveCards: {
      safetyTitle: 'อุบัติเหตุเป็นศูนย์ (Zero Accident)',
      safetySubtitle: 'จำนวนครั้งที่เกิดอุบัติเหตุตลอดปี',
      safetyTarget: 'เป้าหมาย: 0 Case (0 วันหยุดงาน)',
      safetySafe: 'ปลอดภัย 100% (ไม่มีอุบัติเหตุหยุดงาน)',
      safetyIncident: 'มีอุบัติเหตุหยุดงาน',
      safetyActive: 'บันทึกข้อมูลทุกเดือน',
      csatTitle: 'ความพึงพอใจลูกค้าสะสม (CSAT)',
      csatSubtitle: 'เฉลี่ยทุกสายงาน (Transport/Depot/WH)',
      csatTarget: 'เป้าหมาย: >= 95%',
      csatCorporateBenchmark: 'เกณฑ์ระดับองค์กร',
      csatTargetMet: 'บรรลุเป้าหมาย',
      csatBelowTarget: 'ต่ำกว่าเป้าหมาย',
      profitTitle: 'ผลกำไรและควบคุมต้นทุน',
      profitSubtitle: 'เฉลี่ยทั้งปี',
      profitTarget: 'เป้าหมาย: >= 5.0%',
      profitDept: 'ฝ่ายบัญชีและการเงิน',
      profitMet: 'บรรลุเป้าหมาย',
      profitNotMet: 'ไม่บรรลุเป้าหมาย',
      profitPending: 'รอผลการประเมิน',
      profitOverTarget: 'เกินเป้า',
      profitGap: 'Gap',
      overallTitle: 'อัตราความสำเร็จ KPIS ทั้งหมด',
      overallEvaluated: 'ประเมินแล้ว',
      overallStandard: 'เกณฑ์มาตรฐาน: >= 80%',
      passedBadge: 'ผ่าน',
      failedBadge: 'ไม่ผ่าน',
      pendingBadge: 'รอประเมิน',
      transport: 'ขนส่ง',
      depot: 'Depot',
      warehouse: 'WH',
      pendingEvaluation: 'รอผลการประเมิน',
    },
    breachBanner: {
      executiveAlert: 'แจ้งเตือนฝ่ายบริหาร',
      breachDetected: 'ตรวจพบ KPI ไม่บรรลุเป้าหมาย',
      headline: 'รายการตัวชี้วัดที่ต้องติดตามและส่งการแจ้งเตือนอีเมล',
      sendEmailBtn: 'ส่งอีเมลแจ้งเตือนผู้รับผิดชอบ',
      target: 'เป้า',
      actual: 'จริง',
      pic: 'PIC',
    },
    csatChart: {
      title: 'แนวโน้มความพึงพอใจลูกค้า (Customer Satisfaction - CSAT Trend)',
      subtitle: 'เปรียบเทียบผลงานรายเดือนกับเป้าหมายขั้นต่ำขององค์กร (>= 95%) รายสายงาน',
      fy2026Tab: 'FY 2026 (รอบปีปัจจุบัน)',
      fy2025Tab: 'FY 2025 (ข้อมูลย้อนหลัง)',
      transport: 'ขนส่ง (Transport)',
      depot: 'ลานตู้ (Depot)',
      warehouse: 'คลังสินค้า (WH)',
      overall: 'เฉลี่ยรวม (Overall)',
      target95: 'เป้าหมายองค์กร (>= 95%)',
      pendingEvaluation: 'รอผลการประเมิน',
      overallCorporateTarget: 'เกณฑ์เป้าหมายขั้นต่ำขององค์กร',
      drillDownHint: 'คลิกเพื่อดูรายละเอียดเจาะลึก',
    },
    departmentOverview: {
      title: 'สรุปผลงานตามสายงาน / ฝ่าย',
      subtitle: 'คลิกเพื่อกรองตาราง KPI เฉพาะฝ่ายนั้นๆ',
      allDepartments: 'ทุกฝ่าย',
      passed: 'ผ่าน',
      failed: 'ไม่ผ่าน',
      pending: 'รอประเมิน',
      waitingEval: 'รอประเมิน',
      all: 'ทั้งหมด',
      falling: 'ตกเป้า',
      items: 'รายการ',
    },
    kpiAnalytics: {
      title: 'การวิเคราะห์และแนวโน้มตัวชี้วัด (KPI Trends & Analytics)',
      subtitle: 'สถิติภาพรวมความสำเร็จรายสายงานและแนวโน้มตัวเลขผลงานรายเดือน',
      deptBreakdownTab: 'สัดส่วนความสำเร็จรายฝ่าย',
      monthlyDrilldownTab: 'แนวโน้มรายเดือนเจาะลึก',
      passedLabel: 'ผ่านเกณฑ์',
      failedLabel: 'ไม่ผ่านเกณฑ์',
      pendingLabel: 'รอประเมิน',
      achievementRate: 'อัตราความสำเร็จ',
      selectKpiHint: 'เลือกดูตัวชี้วัดเพื่อดูกราฟแนวโน้มรายเดือน',
      trendTitle: 'แนวโน้มผลงานรายเดือน',
    },
    kpiTable: {
      title: 'ตารางตัวชี้วัดผลงานหลัก (KPI Master Data Table)',
      subtitle: 'รายละเอียดตัวชี้วัดรายฝ่ายพร้อมตัวเลขจริงเดือน เม.ย. – มี.ค.',
      searchPlaceholder: 'ค้นหาชื่อตัวชี้วัด, ฝ่าย หรือผู้รับผิดชอบ (PIC)...',
      filterAll: 'ทั้งหมด',
      filterFailed: 'ตกเป้า',
      filterPassed: 'ผ่านเกณฑ์',
      filterPending: 'รอผลการประเมิน',
      exportCsv: 'ส่งออก CSV',
      printPdf: 'พิมพ์ / PDF',
      colDept: 'ฝ่าย',
      colNo: 'No',
      colKpiName: 'ตัวชี้วัด (KPI Name)',
      colTarget: 'เป้าหมาย',
      colTotal: 'รวม',
      colAverage: 'เฉลี่ย',
      colPic: 'ผู้รับผิดชอบ (PIC)',
      statusPassed: 'ผ่านเกณฑ์',
      statusFailed: 'ตกเป้า',
      statusPending: 'รอผลการประเมิน',
      newBadge: 'ใหม่',
      noMatchingKpi: 'ไม่พบข้อมูลตัวชี้วัดตามเงื่อนไขที่เลือก',
      legendTitle: 'คำอธิบายสี:',
      legendRed: 'สีแดง = ไม่บรรลุเป้าหมาย KPI ของเดือนนั้นๆ (แจ้งเตือน)',
      legendBlue: 'สีน้ำเงิน = KPI ตัวใหม่ เริ่มมีผลตั้งแต่ 26/05/2025',
      legendGreen: 'ผ่านเกณฑ์ตามเป้า',
      footerShowing: 'แสดง',
      footerHint: 'คลิกที่แถวของ KPI เพื่อเปิดกราฟแนวโน้มและการวิเคราะห์รายตัว',
    },
    kpiModal: {
      newKpiBadge: 'KPI ตัวใหม่ (26/05/2025)',
      unmetTarget: 'ไม่บรรลุเป้าหมาย',
      passedTarget: 'ผ่านเกณฑ์',
      pendingEvaluation: 'รอผลการประเมิน',
      target: 'เป้าหมาย (Target)',
      average: 'ค่าเฉลี่ย (Average)',
      total: 'รวมสะสม (Total)',
      pic: 'ผู้รับผิดชอบ (PIC)',
      divisionBreakdown: 'คะแนนความพึงพอใจแยกตามสายงาน (Division Breakdown):',
      divisionTarget: 'เป้าหมาย > 95%',
      noMonthlyData: 'ไม่มีข้อมูลรายเดือน',
      profitSummaryTitle: 'ผลการดำเนินงานด้านกำไรและควบคุมต้นทุน:',
      profitSummaryDesc: 'ยังไม่มีการบันทึกตัวเลขผลการดำเนินงานรายเดือนในไฟล์ต้นฉบับ FY 2026 จากฝ่ายบัญชีและการเงิน (ACC&FN) ข้อมูลจึงแสดงเป็น รอผลการประเมิน',
      safetySummaryTitle: 'สถิติความปลอดภัยขององค์กร (Zero Accident):',
      safetySummaryDesc: 'สำหรับรอบปี FY 2026 บริษัทไม่มีอุบัติเหตุถึงขั้นหยุดงานเกิน 1 วันขึ้นไป (0 Case) สอดคล้องตามนโยบายความปลอดภัยสูงสุดระดับองค์กร',
      comparisonChartTitle: 'กราฟเปรียบเทียบผลงานจริง vs เป้าหมาย (เม.ย. - มี.ค.)',
      actualResult: 'ผลจริง',
      noNumericData: 'ตัวชี้วัดนี้ยังไม่มีข้อมูลตัวเลขรายเดือนที่บันทึกในไฟล์ต้นฉบับ (สถานะ: รอผลการประเมิน)',
      monthlyTableTitle: 'ตารางค่ารายเดือน FY 2026',
      criteriaPrefix: 'เกณฑ์:',
      gte: 'ต้องมากกว่าหรือเท่ากับ',
      lte: 'ต้องน้อยกว่าหรือเท่ากับ',
      sendAlertBtn: 'ส่งอีเมลแจ้งเตือนตัวนี้',
      closeBtn: 'ปิดหน้าต่าง',
    },
    months: {
      APR: 'เม.ย.',
      MAY: 'พ.ค.',
      JUN: 'มิ.ย.',
      JUL: 'ก.ค.',
      AUG: 'ส.ค.',
      SEP: 'ก.ย.',
      OCT: 'ต.ค.',
      NOV: 'พ.ย.',
      DEC: 'ธ.ค.',
      JAN: 'ม.ค.',
      FEB: 'ก.พ.',
      MAR: 'มี.ค.',
    },
    departments: {
      Corporate: { short: 'Corporate', full: 'เป้าหมายหลักองค์กร' },
      OPS: { short: 'OPS', full: 'ปฏิบัติการ' },
      CR: { short: 'CR', full: 'ฝ่ายลูกค้าสัมพันธ์' },
      WH: { short: 'WH', full: 'คลังสินค้า' },
      Transport: { short: 'Transport', full: 'ขนส่ง' },
      EN: { short: 'EN', full: 'ฝ่ายวิศวกรรมและก่อสร้าง' },
      PU: { short: 'PU', full: 'จัดซื้อ' },
      'HR&GA': { short: 'HR&GA', full: 'ฝ่ายทรัพยากรบุคคลและบริหารงานทั่วไป' },
      QSHE: { short: 'QSHE', full: 'ฝ่ายคุณภาพ ความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม' },
      IT: { short: 'IT', full: 'เทคโนโลยีสารสนเทศ' },
      'ACC&FN': { short: 'ACC&FN', full: 'บัญชีและการเงิน' },
    },
  },
  en: {
    navbar: {
      title: 'FY2026 Executive KPI Dashboard',
      liveBadge: 'Live Monitoring',
      subCorporate: 'Corporate & Departmental Objectives',
      sheetsConnected: 'Google Sheets Connected',
      defaultData: 'FY2026 Baseline (Ready for Sheets)',
      syncInterval: 'Interval',
      syncNow: 'Sync Now',
      syncing: 'Syncing...',
      sheetsBtn: 'Google Sheets',
      chatBtn: 'Google Chat',
      chatBadge: '10th Reminder',
      emailAlertsBtn: 'Email Alerts',
      langBtn: 'Language',
    },
    subheader: {
      fiscalCycle: 'Fiscal Year FY 2026 (Evaluation: April 2025 – March 2026)',
      dataSource: 'Data Source: KRC Transportation & Logistics',
      syncTimer: 'Auto-sync: Every',
      emailAlerts: 'Email Alerts:',
      active: 'Enabled',
      disabled: 'Disabled',
      chatReminder: 'Google Chat: Monthly reminder on day',
    },
    executiveCards: {
      safetyTitle: 'Zero Accident (Safety)',
      safetySubtitle: 'Annual lost-time injury occurrences',
      safetyTarget: 'Target: 0 Case (0 Lost Workdays)',
      safetySafe: '100% Safe (Zero Lost-time Injury)',
      safetyIncident: 'Lost-time Incident Occurred',
      safetyActive: 'Monthly tracking active',
      csatTitle: 'Customer Satisfaction (CSAT)',
      csatSubtitle: 'All divisions average (Transport/Depot/WH)',
      csatTarget: 'Target: >= 95%',
      csatCorporateBenchmark: 'Corporate benchmark',
      csatTargetMet: 'Target Achieved',
      csatBelowTarget: 'Below Target',
      profitTitle: 'Profit & Cost Reduction',
      profitSubtitle: 'Annual Average',
      profitTarget: 'Target: >= 5.0%',
      profitDept: 'Accounting & Finance Dept',
      profitMet: 'Target Met',
      profitNotMet: 'Target Not Met',
      profitPending: 'Pending Evaluation',
      profitOverTarget: 'Surplus',
      profitGap: 'Gap',
      overallTitle: 'Overall KPIs Achievement Rate',
      overallEvaluated: 'Evaluated',
      overallStandard: 'Benchmark: >= 80%',
      passedBadge: 'Passed',
      failedBadge: 'Failed',
      pendingBadge: 'Pending',
      transport: 'Transport',
      depot: 'Depot',
      warehouse: 'Warehouse',
      pendingEvaluation: 'Pending Evaluation',
    },
    breachBanner: {
      executiveAlert: 'Executive Alert',
      breachDetected: 'KPIs below target identified',
      headline: 'Key Performance Indicators requiring management follow-up',
      sendEmailBtn: 'Dispatch Email Notification to PICs',
      target: 'Target',
      actual: 'Actual',
      pic: 'PIC',
    },
    csatChart: {
      title: 'Customer Satisfaction Trend (CSAT Trend)',
      subtitle: 'Monthly performance vs corporate target (>= 95%) by division',
      fy2026Tab: 'FY 2026 (Current Cycle)',
      fy2025Tab: 'FY 2025 (Historical)',
      transport: 'Transport',
      depot: 'Depot',
      warehouse: 'Warehouse (WH)',
      overall: 'Overall Average',
      target95: 'Corporate Target (>= 95%)',
      pendingEvaluation: 'Pending Evaluation',
      overallCorporateTarget: 'Corporate Minimum Benchmark',
      drillDownHint: 'Click to view deep dive details',
    },
    departmentOverview: {
      title: 'Performance by Department / Division',
      subtitle: 'Click any department to filter the KPI table',
      allDepartments: 'All Depts',
      passed: 'Passed',
      failed: 'Failed',
      pending: 'Pending',
      waitingEval: 'Pending',
      all: 'All',
      falling: 'Failing',
      items: 'items',
    },
    kpiAnalytics: {
      title: 'KPI Trends & Analytics',
      subtitle: 'Division success ratios and monthly metric drilldown',
      deptBreakdownTab: 'Department Achievement Rates',
      monthlyDrilldownTab: 'Monthly Trend Drilldown',
      passedLabel: 'Passed',
      failedLabel: 'Failed',
      pendingLabel: 'Pending',
      achievementRate: 'Achievement Rate',
      selectKpiHint: 'Select a KPI to view its monthly performance curve',
      trendTitle: 'Monthly Performance Curve',
    },
    kpiTable: {
      title: 'KPI Master Data Table',
      subtitle: 'Departmental performance metrics with actuals (Apr – Mar)',
      searchPlaceholder: 'Search KPI name, department, or PIC...',
      filterAll: 'All',
      filterFailed: 'Failed',
      filterPassed: 'Passed',
      filterPending: 'Pending Evaluation',
      exportCsv: 'Export CSV',
      printPdf: 'Print / PDF',
      colDept: 'Dept',
      colNo: 'No',
      colKpiName: 'KPI Name',
      colTarget: 'Target',
      colTotal: 'Total',
      colAverage: 'Average',
      colPic: 'PIC',
      statusPassed: 'Passed',
      statusFailed: 'Failed',
      statusPending: 'Pending Evaluation',
      newBadge: 'NEW',
      noMatchingKpi: 'No KPI records match the selected criteria',
      legendTitle: 'Color Legend:',
      legendRed: 'Red = Target missed for that month (Warning)',
      legendBlue: 'Blue = New KPI effective since 26/05/2025',
      legendGreen: 'Target met successfully',
      footerShowing: 'Showing',
      footerHint: 'Click on any KPI row to view monthly trend chart and detailed breakdown',
    },
    kpiModal: {
      newKpiBadge: 'New KPI (26/05/2025)',
      unmetTarget: 'Target Not Met',
      passedTarget: 'Target Met',
      pendingEvaluation: 'Pending Evaluation',
      target: 'Target',
      average: 'Average',
      total: 'Total YTD',
      pic: 'PIC',
      divisionBreakdown: 'Satisfaction Breakdown by Division:',
      divisionTarget: 'Target > 95%',
      noMonthlyData: 'No monthly data',
      profitSummaryTitle: 'Profit & Cost Control Performance:',
      profitSummaryDesc: 'Monthly performance data has not yet been recorded in the FY2026 master file by Accounting & Finance (ACC&FN). Status is pending evaluation.',
      safetySummaryTitle: 'Corporate Safety Record (Zero Accident):',
      safetySummaryDesc: 'For FY2026, the company sustained zero lost-time injuries exceeding 1 day (0 Case), fully achieving the corporate zero accident mandate.',
      comparisonChartTitle: 'Actual vs Target Monthly Comparison (Apr - Mar)',
      actualResult: 'Actual',
      noNumericData: 'This KPI has no monthly numeric values recorded in the master file yet (Status: Pending Evaluation).',
      monthlyTableTitle: 'FY2026 Monthly Breakdown',
      criteriaPrefix: 'Criteria:',
      gte: 'Must be greater than or equal to',
      lte: 'Must be less than or equal to',
      sendAlertBtn: 'Send Alert Email for this KPI',
      closeBtn: 'Close Window',
    },
    months: {
      APR: 'APR',
      MAY: 'MAY',
      JUN: 'JUN',
      JUL: 'JUL',
      AUG: 'AUG',
      SEP: 'SEP',
      OCT: 'OCT',
      NOV: 'NOV',
      DEC: 'DEC',
      JAN: 'JAN',
      FEB: 'FEB',
      MAR: 'MAR',
    },
    departments: {
      Corporate: { short: 'Corporate', full: 'Corporate Objectives' },
      OPS: { short: 'OPS', full: 'Operations' },
      CR: { short: 'CR', full: 'Customer Relations' },
      WH: { short: 'WH', full: 'Warehouse' },
      Transport: { short: 'Transport', full: 'Transportation' },
      EN: { short: 'EN', full: 'Engineering & Construction (EN)' },
      PU: { short: 'PU', full: 'Procurement' },
      'HR&GA': { short: 'HR&GA', full: 'HR & General Administration (HR & GA)' },
      QSHE: { short: 'QSHE', full: 'Quality, Safety, Health & Environment (QSHE)' },
      IT: { short: 'IT', full: 'Information Technology' },
      'ACC&FN': { short: 'ACC&FN', full: 'Accounting & Finance' },
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  getKpiName: (kpi: KPIItem) => string;
  getKpiSecondaryName: (kpi: KPIItem) => string | undefined;
  getDeptName: (dept: DepartmentCode) => string;
  getMonthName: (m: MonthKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'kpi_dashboard_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' || saved === 'th' ? saved : 'th';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    // Sync document language attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  const getKpiName = (kpi: KPIItem): string => {
    if (language === 'en') {
      return kpi.nameEn && kpi.nameEn.trim().length > 0 ? kpi.nameEn : kpi.nameTh;
    }
    return kpi.nameTh;
  };

  const getKpiSecondaryName = (kpi: KPIItem): string | undefined => {
    if (language === 'en') {
      // If we are in English, show Thai name as secondary hint
      return kpi.nameTh !== kpi.nameEn ? kpi.nameTh : undefined;
    }
    // In Thai mode, show English as secondary if available
    return kpi.nameEn && kpi.nameEn.trim().length > 0 ? kpi.nameEn : undefined;
  };

  const getDeptName = (dept: DepartmentCode): string => {
    return t.departments[dept]?.full || dept;
  };

  const getMonthName = (m: MonthKey): string => {
    return t.months[m] || m;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getKpiName,
        getKpiSecondaryName,
        getDeptName,
        getMonthName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
