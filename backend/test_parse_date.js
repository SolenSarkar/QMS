const { parseDate } = require('./server.js'); // Won't work, inline copy

function testParseDate() {
  function parseDate(dateStr) {
    if (!dateStr) return null;
    dateStr = dateStr.trim();
    const monthMap = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
      'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    
  // Month name - flexible for "30-October-2001" 
  let match = dateStr.match(/^(\\d{1,2})(?:\\s*- |-) ([a-zA-Z]+)(?:\\s*- |-)(\\d{4})$/i);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthName = match[2].toLowerCase().trim();
      const year = match[3];
      const month = monthMap[monthName];
      if (month) {
        return {day, month, year, formatted: `${day}-${month}-${year}` };
      }
    }
    
  // Numeric for "30-10-2001"
  match = dateStr.match(/^(\\d{1,2})(?:\\s*- |-)(\\d{1,2})(?:\\s*- |-)(\\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return { day, month, year, formatted: `${day}-${month}-${year}` };
    }
    
    return null;
  }

  console.log('=== parseDate TESTS ===');
  
  const tests = [
    '30-10-2001',
    '30-October-2001', 
    ' 30 - 10 - 2001 ',
    '30 - October - 2001'
  ];
  
  tests.forEach(test => {
    const result = parseDate(test);
    console.log(`'${test}' →`, result);
  });
}

testParseDate();
