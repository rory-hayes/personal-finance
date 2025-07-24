import { test, expect } from '@playwright/test'

test.describe('User Onboarding Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the landing page
    await page.goto('/')
  })

  test('should complete full onboarding flow successfully', async ({ page }) => {
    // Step 1: Landing page interaction
    await expect(page.locator('h1')).toContainText('Your Personal Financial Command Center')
    
    const getStartedButton = page.locator('button:has-text("Get Started")')
    await expect(getStartedButton).toBeVisible()
    await getStartedButton.click()

    // Step 2: Registration
    await expect(page.locator('h2')).toContainText('Create Your Account')
    
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="fullname-input"]', 'John Doe')
    
    await page.click('[data-testid="register-button"]')
    
    // Wait for registration success (mock email verification)
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Step 3: Onboarding Flow - Welcome
    await expect(page.locator('h2')).toContainText('Welcome to BudgetTracker, John Doe!')
    
    const continueButton = page.locator('button:has-text("Get Started")')
    await continueButton.click()

    // Step 4: Household Size Selection
    await expect(page.locator('h2')).toContainText('Household Size')
    
    // Select 2 people household
    await page.click('[data-testid="household-size-2"]')
    await page.click('button:has-text("Continue")')

    // Step 5: Household Members
    await expect(page.locator('h2')).toContainText('Household Members')
    
    // Main user should be pre-filled
    await expect(page.locator('[data-testid="member-0-input"]')).toHaveValue('John Doe')
    
    // Add second household member
    await page.fill('[data-testid="member-1-input"]', 'Jane Doe')
    await page.click('button:has-text("Continue")')

    // Step 6: Income Setup
    await expect(page.locator('h2')).toContainText('Monthly Income')
    
    await page.fill('[data-testid="monthly-income-input"]', '5000')
    await page.click('button:has-text("Continue")')

    // Step 7: Initial Accounts
    await expect(page.locator('h2')).toContainText('Your Main Accounts')
    
    // Fill checking account
    await page.fill('[data-testid="account-0-name"]', 'Main Checking')
    await page.fill('[data-testid="account-0-balance"]', '2500')
    
    // Fill savings account
    await page.fill('[data-testid="account-1-name"]', 'Emergency Savings')
    await page.fill('[data-testid="account-1-balance"]', '10000')
    
    await page.click('button:has-text("Complete Setup")')

    // Step 8: Verify Dashboard Load
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Verify key metrics are displayed
    await expect(page.locator('[data-testid="net-worth-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-income-card"]')).toBeVisible()
    
    // Verify account data is reflected
    await expect(page.locator('[data-testid="account-list-card"]')).toContainText('Main Checking')
    await expect(page.locator('[data-testid="account-list-card"]')).toContainText('Emergency Savings')
  })

  test('should handle validation errors during onboarding', async ({ page }) => {
    // Navigate to registration
    await page.click('button:has-text("Get Started")')
    
    // Submit empty form
    await page.click('[data-testid="register-button"]')
    
    // Check validation errors
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
    
    // Fill invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.click('[data-testid="register-button"]')
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')
    
    // Test weak password
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', '123')
    await page.click('[data-testid="register-button"]')
    
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters')
  })

  test('should allow editing household information', async ({ page }) => {
    // Complete registration and reach household size step
    await page.click('button:has-text("Get Started")')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="fullname-input"]', 'John Doe')
    await page.click('[data-testid="register-button"]')
    
    // Skip to household size
    await page.click('button:has-text("Get Started")')
    
    // Select 3 people first
    await page.click('[data-testid="household-size-3"]')
    await page.click('button:has-text("Continue")')
    
    // Go back to change household size
    await page.click('button:has-text("Back")')
    
    // Change to 2 people
    await page.click('[data-testid="household-size-2"]')
    await page.click('button:has-text("Continue")')
    
    // Verify only 2 input fields are shown
    await expect(page.locator('[data-testid="member-0-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="member-1-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="member-2-input"]')).not.toBeVisible()
  })

  test('should persist data across page refreshes', async ({ page }) => {
    // Start onboarding
    await page.click('button:has-text("Get Started")')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="fullname-input"]', 'John Doe')
    await page.click('[data-testid="register-button"]')
    
    // Navigate to income step
    await page.click('button:has-text("Get Started")')
    await page.click('[data-testid="household-size-2"]')
    await page.click('button:has-text("Continue")')
    await page.fill('[data-testid="member-1-input"]', 'Jane Doe')
    await page.click('button:has-text("Continue")')
    
    // Fill income and refresh page
    await page.fill('[data-testid="monthly-income-input"]', '5000')
    await page.reload()
    
    // Should maintain progress and data
    await expect(page.locator('[data-testid="monthly-income-input"]')).toHaveValue('5000')
  })

  test('should handle mobile onboarding flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Complete mobile onboarding
    await page.click('[data-testid="mobile-get-started"]')
    
    // Verify mobile-optimized form layout
    await expect(page.locator('[data-testid="mobile-form"]')).toBeVisible()
    
    // Test touch-friendly interactions
    await page.tap('[data-testid="email-input"]')
    await page.fill('[data-testid="email-input"]', 'mobile@example.com')
    
    // Verify mobile keyboard doesn't interfere
    await expect(page.locator('[data-testid="register-button"]')).toBeVisible()
    
    // Complete mobile registration
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="fullname-input"]', 'Mobile User')
    await page.tap('[data-testid="register-button"]')
    
    // Verify mobile dashboard layout
    await page.tap('button:has-text("Get Started")')
    
    // Skip through onboarding steps quickly for mobile
    await page.tap('[data-testid="household-size-1"]')
    await page.tap('button:has-text("Continue")')
    
    // Verify single-column mobile layout
    await expect(page.locator('[data-testid="mobile-member-input"]')).toBeVisible()
  })

  test('should show appropriate loading states', async ({ page }) => {
    // Slow down network to test loading states
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500)
    })
    
    await page.click('button:has-text("Get Started")')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="fullname-input"]', 'John Doe')
    
    // Click register and verify loading state
    await page.click('[data-testid="register-button"]')
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    await expect(page.locator('button:has-text("Setting up...")')).toBeVisible()
    
    // Wait for loading to complete
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/auth/v1/signup', route => {
      route.abort('failed')
    })
    
    await page.click('button:has-text("Get Started")')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!')
    await page.fill('[data-testid="fullname-input"]', 'John Doe')
    await page.click('[data-testid="register-button"]')
    
    // Verify error message is shown
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error')
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible()
    
    // Restore network and retry
    await page.unroute('**/auth/v1/signup')
    await page.click('button:has-text("Try Again")')
    
    // Should succeed on retry
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should accessibility features work correctly', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator('button:has-text("Get Started")')).toBeFocused()
    
    await page.keyboard.press('Enter')
    
    // Navigate form with keyboard
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused()
    
    await page.keyboard.type('test@example.com')
    await page.keyboard.press('Tab')
    
    // Verify ARIA labels and screen reader support
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', 'Email address')
    await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', 'Password')
    
    // Test focus trap in modal
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="auth-form"]')).not.toBeVisible()
  })
}) 