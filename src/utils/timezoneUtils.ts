export const getDualTimezoneStrings = (
  date: string | Date,
  patientTimezone?: string,
): { localTime: string; istTime: string } => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { localTime: 'Invalid Date', istTime: 'Invalid Date' };
  }

  // Fallback to browser's timezone if none is provided
  const resolvedTimezone = patientTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format local time
  const localTime = new Intl.DateTimeFormat('en-US', {
    timeZone: resolvedTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);

  // Format IST time
  const istTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);

  return { localTime, istTime };
};

export function getOffsetInMinutes(timeZone: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(date);
    
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (!offsetPart || offsetPart === 'GMT') return 0;
    
    const sign = offsetPart.includes('-') ? -1 : 1;
    const match = offsetPart.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    
    return sign * (parseInt(match[1], 10) * 60 + parseInt(match[2], 10));
  } catch (e) {
    return 0;
  }
}

export function getTzAbbr(timeZone: string, date: Date): string {
  if (timeZone === 'Asia/Kolkata') return 'IST';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value || '';
  } catch (e) {
    return '';
  }
}

export function toDisplayTimeWithAbbr(value: string, timeZone: string, date: Date): string {
  const parts = toDisplayTimeParts(value, timeZone, date);
  return `${parts.time} ${parts.abbr ? `(${parts.abbr})` : ''}`;
}

export function toDisplayTimeParts(value: string, timeZone: string, date: Date): { time: string, abbr: string } {
  const [h, m] = value.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const normalizedHour = h % 12 === 0 ? 12 : h % 12;
  const abbr = getTzAbbr(timeZone, date);
  return {
    time: `${normalizedHour}:${String(m).padStart(2, '0')} ${period}`,
    abbr: abbr || ''
  };
}

export function getEquivalentIstTime(timeString: string, patientTimezone: string, date: Date): string {
  if (patientTimezone === 'Asia/Kolkata') return '';
  
  const patientOffset = getOffsetInMinutes(patientTimezone, date);
  const istOffset = 330;
  
  const diffMinutes = istOffset - patientOffset;
  
  const [h, m] = timeString.split(':').map(Number);
  const totalMinutes = h * 60 + m + diffMinutes;
  
  let newTotal = totalMinutes % (24 * 60);
  if (newTotal < 0) newTotal += 24 * 60;
  
  const newH = Math.floor(newTotal / 60);
  const newM = newTotal % 60;
  
  const period = newH >= 12 ? 'PM' : 'AM';
  const normalizedHour = newH % 12 === 0 ? 12 : newH % 12;
  
  return `${normalizedHour}:${String(newM).padStart(2, '0')} ${period}`;
}
