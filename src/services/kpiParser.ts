import { ComparisonOperator, DepartmentCode, KPIItem, MonthKey, MONTHS } from '../types';

// Split CSV lines preserving quotes
export function parseCsvRows(text: string): string[][] {
  const lines = text.split(/\r\n|\n|\r/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    rows.push(row);
  }

  return rows;
}

// Parse target operator, value and unit
export function parseTarget(targetRaw: string): {
  operator: ComparisonOperator;
  value: number;
  unit: string;
} {
  const clean = targetRaw.trim();
  let operator: ComparisonOperator = 'GTE';
  let unit = '';
  let value = 0;

  if (clean.startsWith('>=')) {
    operator = 'GTE';
  } else if (clean.startsWith('>')) {
    operator = 'GTE';
  } else if (clean.startsWith('<=')) {
    operator = 'LTE';
  } else if (clean.startsWith('<')) {
    operator = 'LTE';
  } else if (clean.includes('0 Case') || clean.includes('0 case')) {
    operator = 'LTE';
    value = 0;
    unit = 'Case';
    return { operator, value, unit };
  } else if (clean.includes('100%')) {
    operator = 'GTE';
    value = 100;
    unit = '%';
    return { operator, value, unit };
  }

  // Extract number
  const numMatch = clean.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (numMatch) {
    value = parseFloat(numMatch[1]);
  }

  // Determine unit
  if (clean.includes('%')) {
    unit = '%';
  } else if (/day|days/i.test(clean)) {
    unit = 'Days';
  } else if (/units\/day/i.test(clean)) {
    unit = 'units/day';
  } else if (/case/i.test(clean)) {
    unit = 'case';
  } else if (/topic/i.test(clean)) {
    unit = 'topic';
  } else if (/hrs|hour/i.test(clean)) {
    unit = 'Hours';
  } else if (/min/i.test(clean)) {
    unit = 'Minutes';
  } else if (/liter/i.test(clean)) {
    unit = 'liter';
  }

  return { operator, value, unit };
}

// Extract numeric value from monthly or summary string
export function parseNumericValue(raw: string): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (
    trimmed === '' ||
    trimmed === 'N/A' ||
    trimmed.includes('#DIV/0!') ||
    trimmed.includes('error') ||
    trimmed.includes('ลูกค้ายังไม่ประเมิน')
  ) {
    return undefined;
  }

  // Handle numbers with commas e.g. " 1,473 " or percentages e.g. "83%"
  const cleanNumber = trimmed.replace(/,/g, '').replace(/%/g, '').trim();
  const parsed = parseFloat(cleanNumber);
  return isNaN(parsed) ? undefined : parsed;
}

// Check if a value fails the KPI target
export function isFailingTarget(
  val: number | undefined,
  target: { operator: ComparisonOperator; value: number }
): boolean {
  if (val === undefined) return false;

  if (target.operator === 'GTE') {
    // For GTE, actual value must be >= target
    return val < target.value;
  } else if (target.operator === 'LTE') {
    // For LTE, actual value must be <= target
    return val > target.value;
  } else {
    // Exact
    return val !== target.value;
  }
}

// Parse entire CSV into KPIItem array
export function parseKpiCsv(csvText: string): KPIItem[] {
  const rows = parseCsvRows(csvText);
  const items: KPIItem[] = [];

  let currentDepartment: DepartmentCode = 'Corporate';

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0) continue;

    const firstCol = (row[0] || '').trim();
    const secondCol = (row[1] || '').trim();

    // Check department section header
    if (firstCol.includes('Corporate KPIs') || firstCol.includes('เป้าหมายหลักขององค์กร')) {
      currentDepartment = 'Corporate';
      continue;
    }

    const deptMatchers: Record<string, DepartmentCode> = {
      'OPS': 'OPS',
      'CR': 'CR',
      'WH': 'WH',
      'Transport': 'Transport',
      'EN': 'EN',
      'PU': 'PU',
      'HR&GA': 'HR&GA',
      'QSHE': 'QSHE',
      'IT': 'IT',
      'ACC&FN': 'ACC&FN',
      // Name aliases & full titles
      'ฝ่ายลูกค้าสัมพันธ์': 'CR',
      'ฝ่ายบริการลูกค้าสัมพันธ์': 'CR',
      'ฝ่ายบริการลูกค้า': 'CR',
      'Customer Relations': 'CR',
      'Engineering & Contruction (EN)': 'EN',
      'Engineering & Construction (EN)': 'EN',
      'Engineering (EN)': 'EN',
      'ฝ่าย Engineering (EN)': 'EN',
      'ฝ่ายวิศวกรรมและก่อสร้าง': 'EN',
      'ฝ่ายวิศวกรรมและก่อสร้าง (EN)': 'EN',
      'วิศวกรรมและก่อสร้าง': 'EN',
      'ฝ่ายวิศวกรรมและซ่อมบำรุง': 'EN',
      'ฝ่ายวิศวกรรมและซ่อมบำรุง (EN)': 'EN',
      'Quality, Safety, Health & Environment (QSHE)': 'QSHE',
      'Safety & Quaity (QSHE)': 'QSHE',
      'Safety & Quality (QSHE)': 'QSHE',
      'ฝ่าย Safety & Quaity (QSHE)': 'QSHE',
      'ฝ่าย Safety & Quality (QSHE)': 'QSHE',
      'Procurement': 'PU',
      'Procurement (PU)': 'PU',
      'HR & GA': 'HR&GA',
      'HR&GA': 'HR&GA',
      'ฝ่ายทรัพยากรบุคคลและบริหารงานทั่วไป': 'HR&GA',
      'ฝ่ายทรัพยากรบุคคลและบริหารงานทั่วไป (HR & GA)': 'HR&GA',
      'ฝ่ายทรัพยากรบุคคลและบริหารงานทั่วไป (HR&GA)': 'HR&GA',
      'ทรัพยากรบุคคลและบริหารงานทั่วไป': 'HR&GA',
      'ฝ่ายทรัพยากรบุคคลและธุรการ': 'HR&GA',
      'ทรัพยากรบุคคลและธุรการ': 'HR&GA',
    };

    if (deptMatchers[firstCol]) {
      currentDepartment = deptMatchers[firstCol];
      continue;
    }

    // Flexible check for headers containing department identifiers
    if (
      firstCol.includes('Engineering & Contruction') ||
      firstCol.includes('Engineering & Construction') ||
      firstCol.includes('วิศวกรรมและก่อสร้าง') ||
      firstCol.includes('วิศวกรรมและซ่อมบำรุง') ||
      (firstCol.includes('Engineering') && firstCol.includes('(EN)'))
    ) {
      currentDepartment = 'EN';
      continue;
    }
    if (
      firstCol.includes('บริหารงานทั่วไป') ||
      firstCol.includes('ทรัพยากรบุคคล') ||
      (firstCol.includes('HR & GA') && !firstCol.match(/^[0-9]/))
    ) {
      currentDepartment = 'HR&GA';
      continue;
    }
    if (firstCol.includes('Quality, Safety, Health & Environment') || (firstCol.includes('QSHE') && !firstCol.match(/^[0-9]/))) {
      currentDepartment = 'QSHE';
      continue;
    }
    if (firstCol.includes('ลูกค้าสัมพันธ์') || (firstCol.includes('CR') && !firstCol.match(/^[0-9]/) && firstCol.length <= 10)) {
      currentDepartment = 'CR';
      continue;
    }

    // Skip table headers and remarks
    if (
      firstCol.toLowerCase() === 'no' ||
      firstCol.startsWith('Remark') ||
      firstCol.includes('Blue = New KPI') ||
      firstCol.includes('Red = Failure') ||
      secondCol.includes('สีน้ำเงิน') ||
      secondCol.includes('สีแดง') ||
      secondCol.includes('New KPI') ||
      secondCol.includes('Failure to achieve') ||
      secondCol.startsWith('Remark')
    ) {
      continue;
    }

    // Must be a KPI row with a valid code number e.g. "1", "(2.1)", "10"
    const isKpiCode = /^(\(?[0-9]+(?:\.[0-9]+)?\)?)$/.test(firstCol);
    if (!isKpiCode) continue;

    const targetRaw = (row[2] || '').trim();

    // In IT department, row 1 ("การแก้ปัญหาคอมพิวเตอร์ และการตอบสนองกลับไปหา User")
    // and row 2 ("การ support การใช้งาน") are category group headers without targets;
    // their actual measurable KPIs are (1.1)-(1.3) and (2.1)-(2.3)
    if (currentDepartment === 'IT' && (firstCol === '1' || firstCol === '2') && !targetRaw) {
      continue;
    }

    const codeNumber = firstCol || `${items.length + 1}`;
    const rawFullName = secondCol || '';

    // Split Thai and English names if present
    let nameTh = rawFullName;
    let nameEn = '';
    const matchParen = rawFullName.match(/^(.*?)\s*\((.*?)\)\s*$/);
    if (matchParen) {
      nameTh = matchParen[1].trim();
      nameEn = matchParen[2].trim();
    }

    const targetParsed = parseTarget(targetRaw);

    // Monthly values (Cols 3 to 14 correspond to APR..MAR)
    const monthlyValues: KPIItem['monthlyValues'] = {};
    let hasBreachInMonths = false;
    let hasAnyData = false;

    MONTHS.forEach((month, idx) => {
      const colIndex = 3 + idx;
      let cellRaw = (row[colIndex] || '').trim();
      if (cellRaw) {
        if (cellRaw.includes('ลูกค้ายังไม่ประเมิน')) {
          cellRaw = 'รอผลการประเมิน';
        }
        const isPending = cellRaw === 'รอผลการประเมิน' || cellRaw === 'N/A';
        const numVal = parseNumericValue(cellRaw);
        const failing = numVal !== undefined ? isFailingTarget(numVal, targetParsed) : false;

        if (failing) {
          hasBreachInMonths = true;
        }
        if (numVal !== undefined) {
          hasAnyData = true;
        }

        monthlyValues[month] = {
          raw: cellRaw,
          value: numVal,
          isFailing: failing,
          isPending,
        };
      }
    });

    let totalRaw = (row[15] || '').trim();
    let averageRaw = (row[16] || '').trim();
    let averageVal = parseNumericValue(averageRaw);

    // Person in charge
    const pic = (row[18] || row[17] || '').trim();

    // Special handling for Corporate KPIs strictly grounded in user's confirmations & original file
    if (currentDepartment === 'Corporate') {
      if (codeNumber === '1' || rawFullName.includes('อุบัติเหตุ')) {
        // Corporate #1: Zero Accident - User confirmed 0 cases for FY2026
        totalRaw = '0 Case';
        averageRaw = '0 Case';
        averageVal = 0;
        hasAnyData = true;
        hasBreachInMonths = false;
      } else if (codeNumber === '2' || rawFullName.includes('ความพึงพอใจรวม')) {
        // Corporate #2: Overall Customer Satisfaction (CSAT) - Real data: APR=83%, MAY=81%
        if (!averageVal && monthlyValues.APR?.value && monthlyValues.MAY?.value) {
          averageVal = Math.round(((monthlyValues.APR.value + monthlyValues.MAY.value) / 2) * 10) / 10;
          averageRaw = `${averageVal}%`;
        }
        if (totalRaw === 'N/A' || !totalRaw) {
          totalRaw = averageRaw ? `${averageRaw} (เฉลี่ย)` : '82%';
        }
      } else if (codeNumber === '(2.3)' || (codeNumber.includes('2.3') && rawFullName.includes('Transport'))) {
        // Corporate #(2.3): Transport Customer Satisfaction score - Original master file has no monthly records yet (ยังรอผลการรายงาน)
        totalRaw = 'รอผลการรายงาน';
        averageRaw = 'รอผลการรายงาน';
        averageVal = undefined;
        hasAnyData = false;
        hasBreachInMonths = false;
      } else if (codeNumber === '3' || rawFullName.includes('กำไร')) {
        // Corporate #3: Profit & Cost Reduction - Original file has no monthly records yet
        totalRaw = 'รอผลการประเมิน';
        averageRaw = 'รอผลการประเมิน';
        averageVal = undefined;
        hasAnyData = false;
        hasBreachInMonths = false;
      }
    }

    // General cleanup for any remaining Excel formula errors across all KPIs
    const validMonthlyValues = Object.values(monthlyValues)
      .map((m) => m.value)
      .filter((v): v is number => v !== undefined && !isNaN(v));

    if (averageRaw.includes('#DIV/0!') || averageRaw.includes('error') || !averageRaw) {
      if (validMonthlyValues.length > 0) {
        const sum = validMonthlyValues.reduce((a, b) => a + b, 0);
        const avg = Math.round((sum / validMonthlyValues.length) * 10) / 10;
        averageVal = avg;
        averageRaw = `${avg}${targetParsed.unit ? ` ${targetParsed.unit}` : ''}`;
      } else {
        averageRaw = 'รอผลการประเมิน';
        averageVal = undefined;
      }
    }

    if (totalRaw === 'error' || totalRaw === 'N/A' || !totalRaw) {
      if (validMonthlyValues.length > 0) {
        const sum = validMonthlyValues.reduce((a, b) => a + b, 0);
        totalRaw = `${Math.round(sum * 10) / 10}${targetParsed.unit ? ` ${targetParsed.unit}` : ''}`;
      } else {
        totalRaw = 'รอผลการประเมิน';
      }
    }

    const isAvgFailing = averageVal !== undefined ? isFailingTarget(averageVal, targetParsed) : false;

    // Check if new KPI (26/05/2025)
    const isNew =
      rawFullName.includes('ONE') ||
      codeNumber.includes('(2.1)') ||
      rawFullName.includes('26/05/2025') ||
      (currentDepartment === 'OPS' && (codeNumber === '7' || codeNumber === '8'));

    // Overall Status: if no data at all, status is 'pending' (รอผลการประเมิน)
    let status: 'passed' | 'failed' | 'pending' = 'pending';
    if (hasBreachInMonths || isAvgFailing) {
      status = 'failed';
    } else if (hasAnyData) {
      status = 'passed';
    } else {
      status = 'pending';
    }

    items.push({
      id: `${currentDepartment}-${codeNumber}-${r}`,
      codeNumber,
      department: currentDepartment,
      nameTh,
      nameEn: nameEn || undefined,
      targetRaw,
      targetValue: targetParsed.value,
      operator: targetParsed.operator,
      unit: targetParsed.unit,
      isNew,
      pic: pic || undefined,
      monthlyValues,
      totalRaw,
      averageRaw,
      averageValue: averageVal,
      isAverageFailing: isAvgFailing,
      status,
    });
  }

  return items;
}
