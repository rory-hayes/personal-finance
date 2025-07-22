import { Transaction } from '../types';

export const parseCSV = (content: string, userName?: string): Transaction[] => {
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
            userName: userName,
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

export const parsePDF = (content: string, userName?: string): Transaction[] => {
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
          userName: userName,
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
  
  // Try multiple date formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // DD/MM/YY or MM/DD/YY (2-digit year)
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/, // DD.MM.YYYY (European)
    /(\d{1,2})\.(\d{1,2})\.(\d{2})/, // DD.MM.YY (European)
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY or DD-MM-YYYY
    /(\d{1,2})-(\d{1,2})-(\d{2})/, // MM-DD-YY or DD-MM-YY
    /(\d{1,2})\s+(\w+)\s+(\d{4})/, // DD Month YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      try {
        let date: Date;
        const [, part1, part2, part3] = match;
        
        if (format.source.includes('\\d{4}-')) {
          // YYYY-MM-DD format
          date = new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
        } else if (format.source.includes('\\w+')) {
          // DD Month YYYY format
          date = new Date(`${part2} ${part1}, ${part3}`);
        } else {
          // Handle 2-digit years
          let year = parseInt(part3);
          if (year < 100) {
            // Convert 2-digit year to 4-digit (assume 20xx for years 00-99)
            year = year < 50 ? 2000 + year : 1900 + year;
          }
          
          // Try DD/MM/YYYY first (European), then MM/DD/YYYY
          const day = parseInt(part1);
          const month = parseInt(part2);
          
          if (day > 12) {
            // Must be DD/MM/YYYY
            date = new Date(year, month - 1, day);
          } else if (month > 12) {
            // Must be MM/DD/YYYY
            date = new Date(year, day - 1, month);
          } else {
            // Ambiguous - default to DD/MM/YYYY (European)
            date = new Date(year, month - 1, day);
          }
        }
        
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {
        continue;
      }
    }
  }

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