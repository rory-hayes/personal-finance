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
          const detectedCategory = category || categorizeTransaction(description);
          const normalizedAmount = normalizeAmountByCategory(amount, detectedCategory, description);
          
          transactions.push({
            id: `${i}-${Date.now()}`,
            date: date,
            description: description,
            amount: normalizedAmount,
            category: detectedCategory,
            userId: userId || 'unknown',
          });
          console.log(`Added transaction: ${description} - ${normalizedAmount} (${detectedCategory})`);
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
        const detectedCategory = categorizeTransaction(description);
        const normalizedAmount = normalizeAmountByCategory(amount, detectedCategory, description);
        
        transactions.push({
          id: `pdf-${index}-${Date.now()}`,
          date: parseDate(dateStr) || new Date().toISOString(),
          description: description.trim(),
          amount: normalizedAmount,
          category: detectedCategory,
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
  
  // Income detection
  if (desc.includes('salary') || desc.includes('payroll') || desc.includes('paycheck') || 
      desc.includes('direct deposit') || desc.includes('wages') || desc.includes('income') ||
      desc.includes('refund') || desc.includes('cashback') || desc.includes('dividend') ||
      desc.includes('interest') || desc.includes('bonus') || desc.includes('commission') ||
      desc.includes('freelance') || desc.includes('consulting') || desc.includes('settlement') ||
      desc.includes('reimbursement') || desc.includes('transfer in') || desc.includes('deposit') ||
      desc.includes('credit') && !desc.includes('credit card')) {
    return 'Income';
  }
  
  // Food & Dining
  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('food') ||
      desc.includes('whole foods') || desc.includes('trader joe') || desc.includes('walmart') ||
      desc.includes('costco') || desc.includes('target') || desc.includes('safeway') ||
      desc.includes('kroger') || desc.includes('publix') || desc.includes('aldi')) {
    return 'Groceries';
  }
  
  if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining') ||
      desc.includes('mcdonald') || desc.includes('starbucks') || desc.includes('subway') ||
      desc.includes('pizza') || desc.includes('burger') || desc.includes('taco') ||
      desc.includes('kfc') || desc.includes('domino') || desc.includes('chipotle') ||
      desc.includes('dunkin') || desc.includes('coffee') || desc.includes('bar ') ||
      desc.includes('pub ') || desc.includes('grill') || desc.includes('bistro') ||
      desc.includes('diner') || desc.includes('bakery') || desc.includes('buffet')) {
    return 'Dining';
  }
  
  // Transportation
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('shell') || 
      desc.includes('bp') || desc.includes('exxon') || desc.includes('chevron') ||
      desc.includes('mobil') || desc.includes('citgo') || desc.includes('sunoco') ||
      desc.includes('valero') || desc.includes('texaco') || desc.includes('arco') ||
      desc.includes('uber') || desc.includes('lyft') || desc.includes('taxi') ||
      desc.includes('metro') || desc.includes('transit') || desc.includes('parking') ||
      desc.includes('toll') || desc.includes('dmv') || desc.includes('registration') ||
      desc.includes('insurance') && desc.includes('auto') || desc.includes('car wash') ||
      desc.includes('oil change') || desc.includes('tire') || desc.includes('mechanic') ||
      desc.includes('repair') && (desc.includes('auto') || desc.includes('car'))) {
    return 'Transportation';
  }
  
  // Housing & Utilities
  if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('property tax') ||
      desc.includes('homeowner') || desc.includes('renter') || desc.includes('property mgmt') ||
      desc.includes('landlord') || desc.includes('lease')) {
    return 'Housing';
  }
  
  if (desc.includes('utility') || desc.includes('electric') || desc.includes('water') ||
      desc.includes('gas bill') || desc.includes('power') || desc.includes('energy') ||
      desc.includes('pge') || desc.includes('con ed') || desc.includes('sdge') ||
      desc.includes('duke energy') || desc.includes('water dept') || desc.includes('sewage') ||
      desc.includes('trash') || desc.includes('waste') || desc.includes('recycling')) {
    return 'Utilities';
  }
  
  // Shopping & Retail
  if (desc.includes('amazon') || desc.includes('ebay') || desc.includes('target') ||
      desc.includes('walmart') || desc.includes('costco') || desc.includes('best buy') ||
      desc.includes('home depot') || desc.includes('lowes') || desc.includes('ikea') ||
      desc.includes('macy') || desc.includes('nordstrom') || desc.includes('gap') ||
      desc.includes('h&m') || desc.includes('zara') || desc.includes('uniqlo') ||
      desc.includes('shopping') || desc.includes('store') || desc.includes('mall') ||
      desc.includes('retail') || desc.includes('purchase') || desc.includes('etsy') ||
      desc.includes('wayfair') || desc.includes('overstock')) {
    return 'Shopping';
  }
  
  // Healthcare
  if (desc.includes('medical') || desc.includes('health') || desc.includes('pharmacy') ||
      desc.includes('cvs') || desc.includes('walgreens') || desc.includes('rite aid') ||
      desc.includes('doctor') || desc.includes('hospital') || desc.includes('clinic') ||
      desc.includes('dentist') || desc.includes('dental') || desc.includes('vision') ||
      desc.includes('optical') || desc.includes('medicare') || desc.includes('medicaid') ||
      desc.includes('prescription') || desc.includes('therapist') || desc.includes('therapy') ||
      desc.includes('chiropractor') || desc.includes('dermatology') || desc.includes('radiology') ||
      desc.includes('lab corp') || desc.includes('quest') || desc.includes('kaiser')) {
    return 'Healthcare';
  }
  
  // Entertainment & Subscriptions
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('hulu') ||
      desc.includes('disney') || desc.includes('apple music') || desc.includes('youtube') ||
      desc.includes('amazon prime') || desc.includes('hbo') || desc.includes('paramount') ||
      desc.includes('peacock') || desc.includes('entertainment') || desc.includes('movie') ||
      desc.includes('theater') || desc.includes('cinema') || desc.includes('concert') ||
      desc.includes('gaming') || desc.includes('steam') || desc.includes('playstation') ||
      desc.includes('xbox') || desc.includes('nintendo') || desc.includes('subscription') ||
      desc.includes('membership') || desc.includes('gym') || desc.includes('fitness') ||
      desc.includes('planet fitness') || desc.includes('la fitness') || desc.includes('yoga') ||
      desc.includes('peloton')) {
    return 'Entertainment';
  }
  
  // Bills & Financial Services
  if (desc.includes('phone') || desc.includes('mobile') || desc.includes('verizon') ||
      desc.includes('at&t') || desc.includes('t-mobile') || desc.includes('sprint') ||
      desc.includes('internet') || desc.includes('cable') || desc.includes('comcast') ||
      desc.includes('xfinity') || desc.includes('spectrum') || desc.includes('cox') ||
      desc.includes('dish') || desc.includes('directv') || desc.includes('telecom') ||
      desc.includes('broadband') || desc.includes('wifi')) {
    return 'Bills';
  }
  
  if (desc.includes('insurance') && !desc.includes('auto') ||
      desc.includes('premium') || desc.includes('policy') || desc.includes('coverage') ||
      desc.includes('allstate') || desc.includes('geico') || desc.includes('state farm') ||
      desc.includes('progressive') || desc.includes('aetna') || desc.includes('blue cross') ||
      desc.includes('life insurance') || desc.includes('health insurance')) {
    return 'Insurance';
  }
  
  if (desc.includes('bank') || desc.includes('atm') || desc.includes('fee') ||
      desc.includes('service charge') || desc.includes('overdraft') || desc.includes('maintenance') ||
      desc.includes('transfer') || desc.includes('wire') || desc.includes('check') ||
      desc.includes('loan') || desc.includes('credit card') || desc.includes('payment') ||
      desc.includes('finance charge') || desc.includes('interest charge')) {
    return 'Banking';
  }
  
  // Investment & Savings
  if (desc.includes('investment') || desc.includes('401k') || desc.includes('ira') ||
      desc.includes('retirement') || desc.includes('pension') || desc.includes('mutual fund') ||
      desc.includes('etf') || desc.includes('stock') || desc.includes('bond') ||
      desc.includes('brokerage') || desc.includes('fidelity') || desc.includes('vanguard') ||
      desc.includes('schwab') || desc.includes('robinhood') || desc.includes('td ameritrade') ||
      desc.includes('e*trade') || desc.includes('savings') || desc.includes('cd ') ||
      desc.includes('certificate of deposit')) {
    return 'Investments';
  }
  
  // Travel
  if (desc.includes('airline') || desc.includes('flight') || desc.includes('airport') ||
      desc.includes('hotel') || desc.includes('airbnb') || desc.includes('booking') ||
      desc.includes('expedia') || desc.includes('travel') || desc.includes('vacation') ||
      desc.includes('trip') || desc.includes('rental car') || desc.includes('hertz') ||
      desc.includes('enterprise') || desc.includes('budget rent') || desc.includes('avis') ||
      desc.includes('marriott') || desc.includes('hilton') || desc.includes('hyatt') ||
      desc.includes('delta') || desc.includes('american air') || desc.includes('united') ||
      desc.includes('southwest') || desc.includes('jetblue')) {
    return 'Travel';
  }
  
  // Education
  if (desc.includes('tuition') || desc.includes('school') || desc.includes('college') ||
      desc.includes('university') || desc.includes('education') || desc.includes('student') ||
      desc.includes('textbook') || desc.includes('course') || desc.includes('training') ||
      desc.includes('certification') || desc.includes('udemy') || desc.includes('coursera') ||
      desc.includes('khan academy') || desc.includes('masterclass')) {
    return 'Education';
  }
  
  // Personal Care
  if (desc.includes('salon') || desc.includes('barber') || desc.includes('haircut') ||
      desc.includes('spa') || desc.includes('massage') || desc.includes('beauty') ||
      desc.includes('cosmetic') || desc.includes('skincare') || desc.includes('personal care') ||
      desc.includes('ulta') || desc.includes('sephora') || desc.includes('sally beauty')) {
    return 'Personal Care';
  }
  
  // Taxes & Government
  if (desc.includes('tax') || desc.includes('irs') || desc.includes('federal') ||
      desc.includes('state tax') || desc.includes('property tax') || desc.includes('dmv') ||
      desc.includes('license') || desc.includes('permit') || desc.includes('government') ||
      desc.includes('city hall') || desc.includes('court') || desc.includes('fine') ||
      desc.includes('penalty') || desc.includes('toll')) {
    return 'Taxes';
  }
  
  // Charitable & Donations
  if (desc.includes('donation') || desc.includes('charity') || desc.includes('nonprofit') ||
      desc.includes('church') || desc.includes('temple') || desc.includes('mosque') ||
      desc.includes('goodwill') || desc.includes('salvation army') || desc.includes('red cross') ||
      desc.includes('united way') || desc.includes('give') || desc.includes('tithe') ||
      desc.includes('offering')) {
    return 'Charitable';
  }
  
  // Default fallback
  return 'Other';
};

const normalizeAmountByCategory = (amount: number, category: string, description: string): number => {
  const desc = description.toLowerCase();
  
  // If category is Income, amount should be positive
  if (category === 'Income') {
    return Math.abs(amount);
  }
  
  // For most expense categories, amount should be negative
  const expenseCategories = [
    'Groceries', 'Dining', 'Transportation', 'Housing', 'Utilities', 
    'Shopping', 'Healthcare', 'Entertainment', 'Bills', 'Insurance', 
    'Banking', 'Travel', 'Education', 'Personal Care', 'Taxes', 'Other'
  ];
  
  if (expenseCategories.includes(category)) {
    // Check for specific income keywords in description that might override category
    const incomeKeywords = ['refund', 'cashback', 'rebate', 'return', 'credit', 'reimbursement'];
    const hasIncomeKeyword = incomeKeywords.some(keyword => desc.includes(keyword));
    
    if (hasIncomeKeyword) {
      return Math.abs(amount); // Income, should be positive
    }
    
    return amount > 0 ? -amount : amount; // Expense, should be negative
  }
  
  // For Investments and Charitable, preserve the original sign as it could be either
  return amount;
};