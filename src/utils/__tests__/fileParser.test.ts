import { describe, it, expect, beforeEach } from 'vitest'
import { parseCSV, parsePDF } from '../fileParser'

describe('fileParser Utilities', () => {
  describe('parseCSV', () => {
    describe('Basic CSV Parsing', () => {
      it('should parse simple CSV with standard headers', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Grocery Store,-125.50
2024-01-16,Gas Station,-45.00
2024-01-17,Salary Deposit,2500.00`

        const transactions = parseCSV(csvContent, 'Test User')

        expect(transactions).toHaveLength(3)
        
        expect(transactions[0]).toMatchObject({
          date: expect.any(String),
          description: 'Grocery Store',
          amount: -125.50,
          category: 'Groceries',
          userName: 'Test User'
        })

        expect(transactions[1]).toMatchObject({
          description: 'Gas Station',
          amount: -45.00,
          category: 'Transportation'
        })

        expect(transactions[2]).toMatchObject({
          description: 'Salary Deposit',
          amount: 2500.00
        })
      })

      it('should handle CSV with different header formats', () => {
        const csvContent = `Transaction Date,Memo,Debit,Credit
01/15/2024,Coffee Shop,5.50,
01/16/2024,Paycheck,,2000.00`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].amount).toBe(5.50)
        expect(transactions[1].amount).toBe(2000.00)
      })

      it('should handle European date formats', () => {
        const csvContent = `Date,Description,Amount
15.01.2024,Restaurant,-35.75
16/01/2024,Supermarket,-89.20`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(new Date(transactions[0].date).getDate()).toBe(15)
        expect(new Date(transactions[1].date).getDate()).toBe(16)
      })

      it('should handle CSV with quoted fields containing commas', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,"Coffee Shop, Downtown",-5.50
2024-01-16,"Amazon.com, Purchase",-125.99`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].description).toBe('Coffee Shop, Downtown')
        expect(transactions[1].description).toBe('Amazon.com, Purchase')
      })

      it('should handle CSV with missing optional fields', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Coffee Shop,-5.50
2024-01-16,,-15.00
2024-01-17,Gas Station,`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(1) // Only valid transactions
        expect(transactions[0].description).toBe('Coffee Shop')
      })
    })

    describe('Amount Parsing', () => {
      it('should parse various currency formats', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Test1,$-25.50
2024-01-16,Test2,€35.75
2024-01-17,Test3,£-45.25
2024-01-18,Test4,¥1500`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(4)
        expect(transactions[0].amount).toBe(-25.50)
        expect(transactions[1].amount).toBe(35.75)
        expect(transactions[2].amount).toBe(-45.25)
        expect(transactions[3].amount).toBe(1500)
      })

      it('should handle accounting format with parentheses', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Expense,(125.50)
2024-01-16,Income,200.00`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].amount).toBe(-125.50)
        expect(transactions[1].amount).toBe(200.00)
      })

      it('should handle amounts with thousands separators', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Large Purchase,"1,250.50"
2024-01-16,Salary,"2,500.00"`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].amount).toBe(1250.50)
        expect(transactions[1].amount).toBe(2500.00)
      })

      it('should handle European decimal format', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,European Amount,"1.250,50"
2024-01-16,Another Amount,"2.500,75"`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].amount).toBe(1250.50)
        expect(transactions[1].amount).toBe(2500.75)
      })

      it('should filter out invalid amounts', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Valid Transaction,-25.50
2024-01-16,Invalid Amount,abc
2024-01-17,Zero Amount,0
2024-01-18,Empty Amount,`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(1)
        expect(transactions[0].amount).toBe(-25.50)
      })
    })

    describe('Date Parsing', () => {
      it('should parse various date formats', () => {
        const csvContent = `Date,Description,Amount
01/15/2024,MM/DD/YYYY Format,-25.50
15/01/2024,DD/MM/YYYY Format,-35.75
2024-01-15,YYYY-MM-DD Format,-45.25
15.01.2024,DD.MM.YYYY Format,-55.00`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(4)
        transactions.forEach(transaction => {
          expect(transaction.date).toMatch(/^\d{4}-\d{2}-\d{2}T/)
        })
      })

      it('should handle 2-digit years', () => {
        const csvContent = `Date,Description,Amount
01/15/24,Recent Year,-25.50
01/15/99,Old Year,-35.75`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(new Date(transactions[0].date).getFullYear()).toBe(2024)
        expect(new Date(transactions[1].date).getFullYear()).toBe(1999)
      })

      it('should handle written date formats', () => {
        const csvContent = `Date,Description,Amount
15 January 2024,Written Format,-25.50
Jan 15 2024,Short Format,-35.75`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(new Date(transactions[0].date).getMonth()).toBe(0) // January
        expect(new Date(transactions[1].date).getMonth()).toBe(0) // January
      })

      it('should filter out transactions with invalid dates', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Valid Date,-25.50
invalid-date,Invalid Date,-35.75
,Empty Date,-45.25`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(1)
        expect(transactions[0].description).toBe('Valid Date')
      })
    })

    describe('Category Detection', () => {
      it('should categorize transactions based on description keywords', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Whole Foods Market,-125.50
2024-01-16,Shell Gas Station,-45.00
2024-01-17,McDonald's Restaurant,-12.50
2024-01-18,Electric Company Bill,-89.75
2024-01-19,Amazon.com Purchase,-67.25
2024-01-20,CVS Pharmacy,-23.45`

        const transactions = parseCSV(csvContent)

        expect(transactions[0].category).toBe('Groceries')
        expect(transactions[1].category).toBe('Transportation')
        expect(transactions[2].category).toBe('Dining')
        expect(transactions[3].category).toBe('Utilities')
        expect(transactions[4].category).toBe('Shopping')
        expect(transactions[5].category).toBe('Healthcare')
      })

      it('should use provided category when available', () => {
        const csvContent = `Date,Description,Amount,Category
2024-01-15,Coffee Shop,-5.50,Entertainment
2024-01-16,Gas Station,-45.00,Transportation`

        const transactions = parseCSV(csvContent)

        expect(transactions[0].category).toBe('Entertainment')
        expect(transactions[1].category).toBe('Transportation')
      })

      it('should fallback to Other for unrecognized descriptions', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Mysterious Transaction,-25.50`

        const transactions = parseCSV(csvContent)

        expect(transactions[0].category).toBe('Other')
      })
    })

    describe('Error Handling', () => {
      it('should handle empty CSV content', () => {
        const transactions = parseCSV('')
        expect(transactions).toEqual([])
      })

      it('should handle CSV with only headers', () => {
        const csvContent = 'Date,Description,Amount'
        const transactions = parseCSV(csvContent)
        expect(transactions).toEqual([])
      })

      it('should handle malformed CSV lines gracefully', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Valid Transaction,-25.50
malformed line without proper structure
2024-01-17,Another Valid,-35.75`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].description).toBe('Valid Transaction')
        expect(transactions[1].description).toBe('Another Valid')
      })

      it('should handle CSV with mismatched column counts', () => {
        const csvContent = `Date,Description,Amount
2024-01-15,Valid Transaction,-25.50
2024-01-16,Missing Amount
2024-01-17,Extra,Column,Here,-35.75,Extra`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].description).toBe('Valid Transaction')
        expect(transactions[1].description).toBe('Extra')
      })

      it('should skip rows with critical missing data', () => {
        const csvContent = `Date,Description,Amount
,Missing Date,-25.50
2024-01-16,,
2024-01-17,Valid Transaction,-35.75`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(1)
        expect(transactions[0].description).toBe('Valid Transaction')
      })
    })

    describe('Bank-Specific Formats', () => {
      it('should handle Chase Bank CSV format', () => {
        const csvContent = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
01/15/2024,01/16/2024,STARBUCKS #12345,Food & Drink,Sale,-5.67,
01/16/2024,01/17/2024,PAYCHECK DEPOSIT,Income,Direct Deposit,2500.00,COMPANY NAME`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].description).toBe('STARBUCKS #12345')
        expect(transactions[0].category).toBe('Food & Drink')
        expect(transactions[1].amount).toBe(2500.00)
      })

      it('should handle Bank of America CSV format', () => {
        const csvContent = `Posted Date,Reference Number,Payee,Address,Amount
01/15/2024,123456789,GROCERY STORE,CITY ST,-89.45
01/16/2024,123456790,DIRECT DEPOSIT,,-2500.00`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].description).toBe('GROCERY STORE')
        expect(transactions[1].amount).toBe(-2500.00)
      })

      it('should handle Wells Fargo CSV format', () => {
        const csvContent = `"Date","Amount","*","","Description"
"1/15/2024","-45.67","*","","GAS STATION PURCHASE"
"1/16/2024","2500.00","","","PAYROLL DEPOSIT"`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].amount).toBe(-45.67)
        expect(transactions[1].description).toBe('PAYROLL DEPOSIT')
      })
    })

    describe('Performance', () => {
      it('should handle large CSV files efficiently', () => {
        // Generate a large CSV with 1000 transactions
        let csvContent = 'Date,Description,Amount\n'
        for (let i = 0; i < 1000; i++) {
          csvContent += `2024-01-${String(i % 28 + 1).padStart(2, '0')},Transaction ${i},-${(i * 1.5).toFixed(2)}\n`
        }

        const startTime = Date.now()
        const transactions = parseCSV(csvContent)
        const endTime = Date.now()

        expect(transactions).toHaveLength(1000)
        expect(endTime - startTime).toBeLessThan(1000) // Should process in under 1 second
      })

      it('should handle CSV with very long descriptions', () => {
        const longDescription = 'A'.repeat(1000)
        const csvContent = `Date,Description,Amount
2024-01-15,"${longDescription}",-25.50`

        const transactions = parseCSV(csvContent)

        expect(transactions).toHaveLength(1)
        expect(transactions[0].description).toBe(longDescription)
      })
    })
  })

  describe('parsePDF', () => {
    describe('Basic PDF Parsing', () => {
      it('should parse simple PDF bank statement text', () => {
        const pdfContent = `Bank Statement
Account Number: 1234567890

01/15/2024    GROCERY STORE PURCHASE      -125.50
01/16/2024    GAS STATION                 -45.00
01/17/2024    PAYROLL DEPOSIT            2500.00
01/18/2024    RENT PAYMENT               -800.00`

        const transactions = parsePDF(pdfContent, 'Test User')

        expect(transactions).toHaveLength(4)
        
        expect(transactions[0]).toMatchObject({
          description: expect.stringContaining('GROCERY'),
          amount: -125.50,
          category: 'Groceries',
          userName: 'Test User'
        })

        expect(transactions[1]).toMatchObject({
          description: expect.stringContaining('GAS'),
          amount: -45.00,
          category: 'Transportation'
        })
      })

      it('should handle different PDF date formats', () => {
        const pdfContent = `
1/15/2024     Coffee Shop                  -5.50
01-16-2024    Gas Station                 -25.00
15/01/2024    Restaurant                  -35.75`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(3)
        transactions.forEach(transaction => {
          expect(transaction.date).toMatch(/^\d{4}-\d{2}-\d{2}T/)
        })
      })

      it('should handle PDF with currency symbols', () => {
        const pdfContent = `
01/15/2024    Coffee Purchase            $-5.50
01/16/2024    Deposit                   $1000.00
01/17/2024    ATM Withdrawal            $-100.00`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(3)
        expect(transactions[0].amount).toBe(-5.50)
        expect(transactions[1].amount).toBe(1000.00)
        expect(transactions[2].amount).toBe(-100.00)
      })

      it('should categorize PDF transactions correctly', () => {
        const pdfContent = `
01/15/2024    AMAZON.COM                  -67.25
01/16/2024    NETFLIX SUBSCRIPTION        -15.99
01/17/2024    MEDICAL CENTER              -125.00
01/18/2024    MORTGAGE PAYMENT           -1200.00`

        const transactions = parsePDF(pdfContent)

        expect(transactions[0].category).toBe('Shopping')
        expect(transactions[1].category).toBe('Entertainment')
        expect(transactions[2].category).toBe('Healthcare')
        expect(transactions[3].category).toBe('Housing')
      })
    })

    describe('PDF Error Handling', () => {
      it('should handle empty PDF content', () => {
        const transactions = parsePDF('')
        expect(transactions).toEqual([])
      })

      it('should handle PDF with no transaction patterns', () => {
        const pdfContent = `This is a PDF document
with no transaction data
just random text content`

        const transactions = parsePDF(pdfContent)
        expect(transactions).toEqual([])
      })

      it('should skip invalid transaction lines', () => {
        const pdfContent = `
01/15/2024    Valid Transaction           -25.50
Invalid line without proper format
Random text that doesn't match pattern
01/17/2024    Another Valid Transaction   -35.75`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].description).toContain('Valid Transaction')
        expect(transactions[1].description).toContain('Another Valid')
      })

      it('should handle malformed amounts in PDF', () => {
        const pdfContent = `
01/15/2024    Valid Amount                -25.50
01/16/2024    Invalid Amount              abc.def
01/17/2024    Another Valid               -35.75`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].amount).toBe(-25.50)
        expect(transactions[1].amount).toBe(-35.75)
      })
    })

    describe('Real-World PDF Scenarios', () => {
      it('should handle Chase Bank PDF format', () => {
        const pdfContent = `CHASE BANK STATEMENT
Account Summary
Beginning Balance: $1,500.00

01/15/2024  STARBUCKS STORE #12345        SEATTLE WA     -5.67
01/16/2024  DIRECT DEPOSIT PAYROLL        COMPANY INC  2,500.00
01/17/2024  AMAZON.COM PURCHASE           SEATTLE WA    -89.99`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(3)
        expect(transactions[0].description).toContain('STARBUCKS')
        expect(transactions[1].amount).toBe(2500.00)
        expect(transactions[2].category).toBe('Shopping')
      })

      it('should handle Bank of America PDF format', () => {
        const pdfContent = `Bank of America Account Statement
Date        Description                             Amount
1/15/2024   GROCERY STORE PURCHASE                 -125.50
1/16/2024   PAYCHECK DIRECT DEPOSIT               2,500.00
1/17/2024   UTILITY BILL AUTOPAY                   -89.75`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(3)
        expect(transactions[0].category).toBe('Groceries')
        expect(transactions[2].category).toBe('Utilities')
      })

      it('should handle credit card statement PDF', () => {
        const pdfContent = `Credit Card Statement
Transaction Date  Post Date   Description                    Amount
01/15/2024       01/16/2024   RESTAURANT PURCHASE           $45.67
01/16/2024       01/17/2024   GAS STATION                   $32.45
01/17/2024       01/18/2024   ONLINE SHOPPING               $89.99`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(3)
        expect(transactions[0].category).toBe('Dining')
        expect(transactions[1].category).toBe('Transportation')
        expect(transactions[2].category).toBe('Shopping')
      })
    })

    describe('Performance and Edge Cases', () => {
      it('should handle large PDF content efficiently', () => {
        let pdfContent = 'Bank Statement\n'
        for (let i = 0; i < 500; i++) {
          pdfContent += `01/${String(i % 28 + 1).padStart(2, '0')}/2024    Transaction ${i}    -${(i * 1.5).toFixed(2)}\n`
        }

        const startTime = Date.now()
        const transactions = parsePDF(pdfContent)
        const endTime = Date.now()

        expect(transactions).toHaveLength(500)
        expect(endTime - startTime).toBeLessThan(1000)
      })

      it('should handle PDF with special characters', () => {
        const pdfContent = `
01/15/2024    CAFÉ MÜNCHËN                 -25.50
01/16/2024    JOSÉ'S RESTAURANT            -35.75
01/17/2024    NAÏVE BOUTIQUE               -89.99`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(3)
        expect(transactions[0].description).toContain('CAFÉ')
        expect(transactions[1].description).toContain('JOSÉ')
        expect(transactions[2].description).toContain('NAÏVE')
      })

      it('should handle PDF with line breaks in descriptions', () => {
        const pdfContent = `
01/15/2024    AMAZON.COM SERVICES LLC
              PURCHASE                      -67.25
01/16/2024    MONTHLY SUBSCRIPTION
              NETFLIX.COM                   -15.99`

        const transactions = parsePDF(pdfContent)

        expect(transactions).toHaveLength(2)
        expect(transactions[0].amount).toBe(-67.25)
        expect(transactions[1].amount).toBe(-15.99)
      })
    })
  })

  describe('Cross-Format Consistency', () => {
    it('should produce consistent results for same data in CSV and PDF', () => {
      const csvContent = `Date,Description,Amount
2024-01-15,Coffee Shop,-5.50
2024-01-16,Gas Station,-25.00`

      const pdfContent = `
01/15/2024    Coffee Shop                  -5.50
01/16/2024    Gas Station                 -25.00`

      const csvTransactions = parseCSV(csvContent)
      const pdfTransactions = parsePDF(pdfContent)

      expect(csvTransactions).toHaveLength(2)
      expect(pdfTransactions).toHaveLength(2)

      // Compare key properties
      expect(csvTransactions[0].amount).toBe(pdfTransactions[0].amount)
      expect(csvTransactions[1].amount).toBe(pdfTransactions[1].amount)
      expect(csvTransactions[0].category).toBe(pdfTransactions[0].category)
      expect(csvTransactions[1].category).toBe(pdfTransactions[1].category)
    })

    it('should handle edge cases consistently across formats', () => {
      const csvWithZeros = `Date,Description,Amount
2024-01-15,Zero Amount,0.00
2024-01-16,Valid Amount,-25.50`

      const pdfWithZeros = `
01/15/2024    Zero Amount                   0.00
01/16/2024    Valid Amount                -25.50`

      const csvTransactions = parseCSV(csvWithZeros)
      const pdfTransactions = parsePDF(pdfWithZeros)

      // Both should filter out zero amounts
      expect(csvTransactions).toHaveLength(1)
      expect(pdfTransactions).toHaveLength(1)
      expect(csvTransactions[0].amount).toBe(-25.50)
      expect(pdfTransactions[0].amount).toBe(-25.50)
    })
  })
}) 