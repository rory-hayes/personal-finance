/**
 * Secure Storage Utility
 * Provides encrypted localStorage with automatic expiry for sensitive data
 */

interface SecureStorageItem {
  data: any;
  timestamp: number;
  expiry: number;
  encrypted: boolean;
}

class SecureStorage {
  private static readonly EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

  /**
   * Simple encryption using base64 encoding (not cryptographically secure, but obfuscates data)
   * For production, consider using Web Crypto API or a proper encryption library
   */
  private static encrypt(data: string): string {
    try {
      return btoa(encodeURIComponent(data));
    } catch (error) {
      console.warn('Failed to encrypt data:', error);
      return data;
    }
  }

  private static decrypt(data: string): string {
    try {
      return decodeURIComponent(atob(data));
    } catch (error) {
      console.warn('Failed to decrypt data:', error);
      return data;
    }
  }

  /**
   * Check if current storage usage is within limits
   */
  private static isStorageWithinLimits(): boolean {
    try {
      const storageSize = new Blob(Object.values(localStorage)).size;
      return storageSize < this.MAX_STORAGE_SIZE;
    } catch (error) {
      return true; // Assume it's okay if we can't check
    }
  }

  /**
   * Clean up expired items
   */
  private static cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('secure_')) continue;

      try {
        const rawItem = localStorage.getItem(key);
        if (!rawItem) continue;

        const item: SecureStorageItem = JSON.parse(rawItem);
        
        // Remove expired items
        if (item.timestamp + item.expiry < now) {
          keysToRemove.push(key);
        }
      } catch (error) {
        // Remove corrupted items
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Validate that data doesn't contain sensitive information patterns
   */
  private static validateData(data: any): boolean {
    const dataString = JSON.stringify(data).toLowerCase();
    
    // Check for potentially sensitive patterns
    const sensitivePatterns = [
      /password/,
      /secret/,
      /private.*key/,
      /api.*key.*[a-z0-9]{32,}/,
      /token.*[a-z0-9]{32,}/,
      /ssn|social.*security/,
      /credit.*card/,
      /cvv|cvc/
    ];

    return !sensitivePatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Store data securely with encryption and expiry
   */
  static setItem(
    key: string, 
    data: any, 
    options: {
      encrypt?: boolean;
      expiry?: number; // in milliseconds
      allowSensitive?: boolean;
    } = {}
  ): boolean {
    try {
      const {
        encrypt = true,
        expiry = this.EXPIRY_TIME,
        allowSensitive = false
      } = options;

      // Validate data if not explicitly allowing sensitive data
      if (!allowSensitive && !this.validateData(data)) {
        console.warn(`Attempted to store potentially sensitive data in key: ${key}`);
        return false;
      }

      // Check storage limits
      if (!this.isStorageWithinLimits()) {
        this.cleanup();
        if (!this.isStorageWithinLimits()) {
          console.warn('Local storage is full. Cannot store new data.');
          return false;
        }
      }

      const item: SecureStorageItem = {
        data: encrypt ? this.encrypt(JSON.stringify(data)) : data,
        timestamp: Date.now(),
        expiry,
        encrypted: encrypt
      };

      localStorage.setItem(`secure_${key}`, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Failed to store secure item:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt data from secure storage
   */
  static getItem<T = any>(key: string): T | null {
    try {
      const rawItem = localStorage.getItem(`secure_${key}`);
      if (!rawItem) return null;

      const item: SecureStorageItem = JSON.parse(rawItem);
      const now = Date.now();

      // Check if item has expired
      if (item.timestamp + item.expiry < now) {
        this.removeItem(key);
        return null;
      }

      // Decrypt if needed
      const data = item.encrypted 
        ? JSON.parse(this.decrypt(item.data))
        : item.data;

      return data;
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      // Remove corrupted item
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove item from secure storage
   */
  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  /**
   * Check if item exists and is not expired
   */
  static hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * Clear all secure storage items
   */
  static clear(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('secure_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): {
    totalItems: number;
    secureItems: number;
    approximateSize: number;
  } {
    let secureItems = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('secure_')) {
        secureItems++;
      }
    }

    const approximateSize = new Blob(Object.values(localStorage)).size;

    return {
      totalItems: localStorage.length,
      secureItems,
      approximateSize
    };
  }
}

// Auto cleanup on page load
if (typeof window !== 'undefined') {
  SecureStorage['cleanup']();
}

export default SecureStorage; 