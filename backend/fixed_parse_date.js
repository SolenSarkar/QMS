function parseDate(dateStr) {
  if (!dateStr) return null;
  
  dateStr = dateStr.trim().toLowerCase();
  
  const monthMap = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  
  // Month name: "30-October-2001" 
  let match = dateStr.match(/^(\\d{1,2})-([a-z]+)-(\\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2];
    const year = match[3];
    const month = monthMap[monthName];
    if (month) {
      const result = {day, month, year, formatted: `${day}-${month}-${year}` };
      console.log(`parseDate "${dateStr}" → `, result);
      return result;
    }
  }
  
  // Numeric: "30-10-2001"
  match = dateStr.match(/^(\\d{1,2})-(\\d{1,2})-(\\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    const result = { day, month, year, formatted: `${day}-${month}-${year}` };
    console.log(`parseDate "${dateStr}" → `, result);
    return result;
  }
  
  console.log(`parseDate FAILED on: "${dateStr}"`);
  return null;
}

// Test
console.log('TEST 30-October-2001:', parseDate('30-October-2001'));
console.log('TEST 30-10-2001:', parseDate('30-10-2001'));

