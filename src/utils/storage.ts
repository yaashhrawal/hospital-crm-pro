/**
 * Safe storage operations utility
 * Addresses localStorage corruption and data integrity issues
 */

import { SecuritySanitizer } from './security';

export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StorageMetadata {
  version: string;
  timestamp: number;
  checksum: string;
  size: number;
}

/**
 * Safe localStorage manager with validation and error handling
 */
export class SafeStorageManager {
  private static readonly VERSION = '1.0';
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  private static readonly RECOVERY_PREFIX = '_recovery_';
  
  /**
   * Save data to localStorage with validation and recovery
   */
  static async save<T>(key: string, data: T): Promise<StorageResult<T>> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(key)) {
        return { 
          success: false, 
          error: 'Too many storage operations. Please wait before trying again.' 
        };
      }

      // Sanitize data before storage
      const sanitizedResult = SecuritySanitizer.sanitizeObject(data);
      if (!sanitizedResult.success) {
        return {
          success: false,
          error: `Data sanitization failed: ${sanitizedResult.error}`
        };
      }

      const sanitizedData = sanitizedResult.data;

      // Create storage object with metadata
      const storageObject = {
        version: this.VERSION,
        timestamp: Date.now(),
        data: sanitizedData,
        metadata: this.createMetadata(sanitizedData)
      };

      const jsonData = JSON.stringify(storageObject);

      // Check size limits
      if (jsonData.length > this.MAX_STORAGE_SIZE) {
        return { 
          success: false, 
          error: `Data size (${Math.round(jsonData.length / 1024)}KB) exceeds limit (${Math.round(this.MAX_STORAGE_SIZE / 1024)}KB)` 
        };
      }

      // Check available storage space
      const spaceCheck = await this.checkStorageSpace(jsonData.length);
      if (!spaceCheck.success) {
        return spaceCheck;
      }

      // Create backup before overwriting
      await this.createBackup(key);

      // Store the data
      localStorage.setItem(key, jsonData);

      // Verify storage was successful
      const verification = await this.verify(key, sanitizedData);
      if (!verification.success) {
        // Restore from backup if verification fails
        await this.restoreFromBackup(key);
        return {
          success: false,
          error: 'Storage verification failed. Data restored from backup.'
        };
      }

      // Clean up old backups
      this.cleanupBackups(key);

      return { success: true, data: sanitizedData };

    } catch (error) {
      return { 
        success: false, 
        error: `Storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Load data from localStorage with validation
   */
  static async load<T>(key: string): Promise<StorageResult<T>> {
    try {
      const storedData = localStorage.getItem(key);
      
      if (!storedData) {
        return { success: true, data: undefined };
      }

      // Parse JSON safely
      let parsedData: any;
      try {
        parsedData = JSON.parse(storedData);
      } catch (parseError) {
        // Try to recover from backup
        const backupResult = await this.restoreFromBackup(key);
        if (backupResult.success) {
          return this.load<T>(key); // Recursive call after restore
        }
        return { 
          success: false, 
          error: 'Invalid JSON data and no backup available' 
        };
      }

      // Validate structure
      if (!this.isValidStorageObject(parsedData)) {
        // Try to handle legacy data format
        const legacyResult = this.handleLegacyData<T>(parsedData);
        if (legacyResult.success) {
          // Save in new format
          await this.save(key, legacyResult.data);
          return legacyResult;
        }
        return { 
          success: false, 
          error: 'Invalid storage format' 
        };
      }

      // Verify data integrity
      const integrityCheck = this.verifyIntegrity(parsedData);
      if (!integrityCheck.success) {
        // Try to recover from backup
        const backupResult = await this.restoreFromBackup(key);
        if (backupResult.success) {
          return this.load<T>(key);
        }
        return integrityCheck;
      }

      // Additional sanitization check on load
      const sanitizedResult = SecuritySanitizer.sanitizeObject(parsedData.data);
      if (!sanitizedResult.success) {
        return {
          success: false,
          error: `Data validation failed: ${sanitizedResult.error}`
        };
      }

      return { success: true, data: sanitizedResult.data };

    } catch (error) {
      return { 
        success: false, 
        error: `Load operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Remove data from localStorage
   */
  static remove(key: string): StorageResult<void> {
    try {
      localStorage.removeItem(key);
      // Also remove backup
      localStorage.removeItem(this.RECOVERY_PREFIX + key);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Remove operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Clear all application data (emergency cleanup)
   */
  static clearAll(): StorageResult<void> {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('enhanced_patient_') || key.startsWith('patient_record_'))) {
          keys.push(key);
        }
      }

      keys.forEach(key => localStorage.removeItem(key));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Clear operation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): { used: number; available: number; total: number } {
    let used = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage.getItem(key)?.length || 0;
        }
      }
    } catch (error) {
      // Handle quota exceeded errors
    }

    const total = 10 * 1024 * 1024; // Assume 10MB total (varies by browser)
    return {
      used,
      available: total - used,
      total
    };
  }

  // Private helper methods
  private static createMetadata(data: any): StorageMetadata {
    const serialized = JSON.stringify(data);
    return {
      version: this.VERSION,
      timestamp: Date.now(),
      checksum: this.calculateChecksum(serialized),
      size: serialized.length
    };
  }

  private static calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private static isValidStorageObject(obj: any): boolean {
    return obj && 
           typeof obj === 'object' && 
           obj.version && 
           typeof obj.timestamp === 'number' && 
           obj.metadata &&
           obj.data !== undefined;
  }

  private static verifyIntegrity(storageObj: any): StorageResult<void> {
    try {
      const { data, metadata } = storageObj;
      const currentChecksum = this.calculateChecksum(JSON.stringify(data));
      
      if (currentChecksum !== metadata.checksum) {
        return { 
          success: false, 
          error: 'Data integrity check failed - possible corruption' 
        };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: 'Integrity verification failed' 
      };
    }
  }

  private static handleLegacyData<T>(data: any): StorageResult<T> {
    try {
      // Handle old format data that doesn't have our new structure
      if (data && typeof data === 'object' && !data.version) {
        // This looks like legacy patient record data
        const sanitizedResult = SecuritySanitizer.sanitizeObject(data);
        if (sanitizedResult.success) {
          return { success: true, data: sanitizedResult.data };
        }
      }
      return { success: false, error: 'Unable to handle legacy data format' };
    } catch (error) {
      return { success: false, error: 'Legacy data conversion failed' };
    }
  }

  private static async createBackup(key: string): Promise<void> {
    try {
      const existingData = localStorage.getItem(key);
      if (existingData) {
        localStorage.setItem(this.RECOVERY_PREFIX + key, existingData);
      }
    } catch (error) {
      // Backup creation failed, but don't fail the main operation
    }
  }

  private static async restoreFromBackup(key: string): Promise<StorageResult<void>> {
    try {
      const backupData = localStorage.getItem(this.RECOVERY_PREFIX + key);
      if (backupData) {
        localStorage.setItem(key, backupData);
        return { success: true };
      }
      return { success: false, error: 'No backup available' };
    } catch (error) {
      return { success: false, error: 'Backup restore failed' };
    }
  }

  private static async verify<T>(key: string, originalData: T): Promise<StorageResult<void>> {
    try {
      const storedData = localStorage.getItem(key);
      if (!storedData) {
        return { success: false, error: 'Data not found after storage' };
      }

      const parsedStored = JSON.parse(storedData);
      if (!parsedStored.data) {
        return { success: false, error: 'Invalid stored data structure' };
      }

      // Compare checksums rather than deep equality for performance
      const originalChecksum = this.calculateChecksum(JSON.stringify(originalData));
      const storedChecksum = this.calculateChecksum(JSON.stringify(parsedStored.data));
      
      if (originalChecksum !== storedChecksum) {
        return { success: false, error: 'Data verification failed - checksums do not match' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Verification process failed' };
    }
  }

  private static cleanupBackups(key: string): void {
    try {
      // Keep only the most recent backup
      const backupKey = this.RECOVERY_PREFIX + key;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const parsed = JSON.parse(backupData);
          const age = Date.now() - (parsed.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (age > maxAge) {
            localStorage.removeItem(backupKey);
          }
        } catch (error) {
          // Remove invalid backup
          localStorage.removeItem(backupKey);
        }
      }
    } catch (error) {
      // Cleanup failed, but don't affect main operation
    }
  }

  private static async checkStorageSpace(requiredBytes: number): Promise<StorageResult<void>> {
    try {
      const stats = this.getStorageStats();
      
      if (stats.available < requiredBytes) {
        // Try to free up space by removing old backups
        this.cleanupOldBackups();
        
        const newStats = this.getStorageStats();
        if (newStats.available < requiredBytes) {
          return { 
            success: false, 
            error: `Insufficient storage space. Required: ${Math.round(requiredBytes/1024)}KB, Available: ${Math.round(newStats.available/1024)}KB` 
          };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Storage space check failed' };
    }
  }

  private static cleanupOldBackups(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.RECOVERY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          // Individual removal failed, continue with others
        }
      });
    } catch (error) {
      // Cleanup failed, but don't affect main operation
    }
  }

  private static checkRateLimit(key: string): boolean {
    const rateLimitKey = `_rate_limit_${key}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxOperations = 30; // Max 30 operations per minute

    try {
      const rateLimitData = localStorage.getItem(rateLimitKey);
      let operations = 0;
      let windowStart = now;

      if (rateLimitData) {
        const parsed = JSON.parse(rateLimitData);
        if (now - parsed.windowStart < windowMs) {
          operations = parsed.operations;
          windowStart = parsed.windowStart;
        }
      }

      if (operations >= maxOperations) {
        return false;
      }

      // Update rate limit counter
      localStorage.setItem(rateLimitKey, JSON.stringify({
        operations: operations + 1,
        windowStart
      }));

      return true;
    } catch (error) {
      // If rate limiting fails, allow the operation
      return true;
    }
  }
}

export default SafeStorageManager;