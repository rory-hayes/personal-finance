import { Transaction } from '../types';

export const parseCSV = (content: string, userId?: string): Transaction[] => {
  const lines = content.trim().split('\n');
  const transactions: Transaction[] = [];
  
  if (lines.length < 2) {
    console.warn('CSV file appears to be empty or has no data rows');
    return transactions;
  }

  // Get header row to understand the format
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  console.log('CSV Headers detected:', headers);

  // Try to identify column positions
  const dateIndex = findColumnIndex(headers, ['date', 'transaction date', 'posting date', 'value date', 'datum']);
  const descriptionIndex = findColumnIndex(headers, ['description', 'memo', 'details', 'transaction details', 'payee', 'beschreibung', 'verwendungszweck']);
  const amountIndex = findColumnIndex(headers, ['amount', 'debit', 'credit', 'transaction amount', 'value', 'betrag', 'umsatz']);
  const categoryIndex = findColumnIndex(headers, ['category', 'type', 'transaction type', 'kategorie']);

  console.log('Column mapping:', { dateIndex, descriptionIndex, amountIndex, categoryIndex });

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    
    if (fields.length >= Math.max(dateIndex, descriptionIndex, amountIndex) + 1) {
      try {
        const dateStr = fields[dateIndex]?.replace(/"/g, '').trim();
        const description = fields[descriptionIndex]?.replace(/"/g, '').trim() || 'Transaction';
        const amountStr = fields[amountIndex]?.replace(/"/g, '').trim();
        const category = fields[categoryIndex]?.replace(/"/g, '').trim();

        console.log(`Row ${i}: date="${dateStr}", desc="${description}", amount="${amountStr}"`);

        const date = parseDate(dateStr);
        const amount = parseAmount(amountStr);

        console.log(`Parsed: date=${date}, amount=${amount}`);

        if (!isNaN(amount) && amount !== 0 && date) {
          transactions.push({
            id: `${i}-${Date.now()}`,
            date: date,
            description: description,
            amount: amount,
            category: category || categorizeTransaction(description),
            userId: userId || 'unknown',
          });
          console.log(`Added transaction: ${description} - ${amount}`);
        }
      } catch (error) {
        console.warn(`Error parsing CSV line ${i}:`, line, error);
      }
    }
  }

  console.log(`Parsed ${transactions.length} transactions from CSV`);
  return transactions;
};

export const parsePDF = (content: string, userId?: string): Transaction[] => {
  // For MVP, we'll do basic PDF text parsing
  // In production, you'd use a proper PDF parsing library
  const lines = content.split('\n');
  const transactions: Transaction[] = [];
  
  lines.forEach((line, index) => {
    // Look for lines that might contain transaction data
    // This is a simplified pattern - in production you'd need more sophisticated parsing
    const transactionPattern = /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([-$]?\d+\.\d{2})/;
    const match = line.match(transactionPattern);
    
    if (match) {
      const [, dateStr, description, amountStr] = match;
      const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
      
      if (!isNaN(amount)) {
        transactions.push({
          id: `pdf-${index}-${Date.now()}`,
          date: parseDate(dateStr) || new Date().toISOString(),
          description: description.trim(),
          amount: amount,
          category: categorizeTransaction(description),
          userId: userId || 'unknown',
        });
      }
    }
  });

  return transactions;
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(header => 
      header.includes(name) || name.includes(header)
    );
    if (index !== -1) return index;
  }
  // Default fallback positions
  if (possibleNames.includes('date')) return 0;
  if (possibleNames.includes('description')) return 1;
  if (possibleNames.includes('amount')) return 2;
  return -1;
};

const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  
  // Remove currency symbols, commas, and extra spaces
  let cleanAmount = amountStr.replace(/[€$£¥,\s]/g, '');
  
  // Handle parentheses as negative (accounting format)
  if (cleanAmount.includes('(') && cleanAmount.includes(')')) {
    cleanAmount = '-' + cleanAmount.replace(/[()]/g, '');
  }
  
  // Handle different decimal separators
  if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
    // Assume comma is thousands separator if both present
    cleanAmount = cleanAmount.replace(/,/g, '');
  } else if (cleanAmount.includes(',')) {
    // Check if comma is decimal separator (European format)
    const parts = cleanAmount.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleanAmount = cleanAmount.replace(',', '.');
    } else {
      cleanAmount = cleanAmount.replace(/,/g, '');
    }
  }
  
  return parseFloat(cleanAmount) || 0;
};

const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  // Clean the date string
  const cleanDate = dateStr.trim().replace(/["""]/g, '');
  console.log(`Parsing date: "${cleanDate}"`);
  
  // Try ISO format first (YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD)
  const isoMatch = cleanDate.match(/^(\d{4})[-/.]\s*(\d{1,2})[-/.]\s*(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && date.getFullYear() === parseInt(year)) {
      console.log(`✅ Parsed ISO date: ${cleanDate} -> ${date.toISOString()}`);
      return date.toISOString();
    }
  }

  // Try different date formats in order of reliability
  const formats = [
    // European formats (DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY)
    {
      regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/,
      parse: (match: RegExpMatchArray) => {
        const [, day, month, year] = match;
        return { day: parseInt(day), month: parseInt(month), year: parseInt(year), isEuropean: true };
      }
    },
    // European 2-digit year (DD/MM/YY, DD.MM.YY, DD-MM-YY)
    {
      regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/,
      parse: (match: RegExpMatchArray) => {
        const [, day, month, yearShort] = match;
        let year = parseInt(yearShort);
        year = year < 50 ? 2000 + year : 1900 + year; // 00-49 = 20xx, 50-99 = 19xx
        return { day: parseInt(day), month: parseInt(month), year, isEuropean: true };
      }
    },
    // US formats (MM/DD/YYYY, MM-DD-YYYY)
    {
      regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/,
      parse: (match: RegExpMatchArray) => {
        const [, month, day, year] = match;
        return { day: parseInt(day), month: parseInt(month), year: parseInt(year), isEuropean: false };
      }
    },
    // Named month formats (DD Month YYYY, Month DD YYYY)
    {
      regex: /^(\d{1,2})\s+(\w+)\s+(\d{4})$/,
      parse: (match: RegExpMatchArray) => {
        const [, day, monthName, year] = match;
        const date = new Date(`${monthName} ${day}, ${year}`);
        return { date };
      }
    },
    {
      regex: /^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/,
      parse: (match: RegExpMatchArray) => {
        const [, monthName, day, year] = match;
        const date = new Date(`${monthName} ${day}, ${year}`);
        return { date };
      }
    }
  ];

  for (const format of formats) {
    const match = cleanDate.match(format.regex);
    if (match) {
      try {
        const parsed = format.parse(match);
        
        if ('date' in parsed) {
          // Pre-parsed date from named month
          if (!isNaN(parsed.date.getTime())) {
            console.log(`✅ Parsed named month date: ${cleanDate} -> ${parsed.date.toISOString()}`);
            return parsed.date.toISOString();
          }
        } else {
          const { day, month, year, isEuropean } = parsed;
          
          // Validate day and month ranges
          if (month < 1 || month > 12 || day < 1 || day > 31) {
            continue;
          }
          
          // For ambiguous cases, try to determine format
          if (day > 12 && month <= 12) {
            // Must be DD/MM format
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              console.log(`✅ Parsed DD/MM date: ${cleanDate} -> ${date.toISOString()}`);
              return date.toISOString();
            }
          } else if (month > 12 && day <= 12) {
            // Must be MM/DD format (swap them)
            const date = new Date(year, day - 1, month);
            if (!isNaN(date.getTime())) {
              console.log(`✅ Parsed MM/DD date: ${cleanDate} -> ${date.toISOString()}`);
              return date.toISOString();
            }
          } else if (day <= 12 && month <= 12) {
            // Ambiguous case - use context or default to European
            const dateEuropean = new Date(year, month - 1, day);
            const dateUS = new Date(year, day - 1, month);
            
            // Prefer European format by default, but validate the date makes sense
            const preferredDate = isEuropean !== false ? dateEuropean : dateUS;
            if (!isNaN(preferredDate.getTime())) {
              console.log(`✅ Parsed ambiguous date (${isEuropean ? 'European' : 'US'} format): ${cleanDate} -> ${preferredDate.toISOString()}`);
              return preferredDate.toISOString();
            }
          }
        }
      } catch (error) {
        console.warn(`Error parsing date with format:`, cleanDate, error);
        continue;
      }
    }
  }

  // Final fallback: try Date constructor directly
  try {
    const fallbackDate = new Date(cleanDate);
    if (!isNaN(fallbackDate.getTime())) {
      console.log(`✅ Parsed fallback date: ${cleanDate} -> ${fallbackDate.toISOString()}`);
      return fallbackDate.toISOString();
    }
  } catch {
    // Ignore fallback errors
  }

  console.warn(`❌ Could not parse date: "${cleanDate}"`);
  return null;
};

const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('food')) {
    return 'Groceries';
  } else if (desc.includes('gas') || desc.includes('fuel') || desc.includes('shell') || desc.includes('bp')) {
    return 'Transportation';
  } else if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining')) {
    return 'Dining';
  } else if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
    return 'Utilities';
  } else if (desc.includes('rent') || desc.includes('mortgage')) {
    return 'Housing';
  } else if (desc.includes('amazon') || desc.includes('shopping') || desc.includes('store')) {
    return 'Shopping';
  } else if (desc.includes('medical') || desc.includes('health') || desc.includes('pharmacy')) {
    return 'Healthcare';
  } else if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('netflix')) {
    return 'Entertainment';
  } else {
    return 'Other';
  }
};