export const getEffectiveIPDNumber = (providedIPDNumber?: string): string => {
  console.log(`🔍 Getting effective IPD number. Provided: ${providedIPDNumber}`);
  
  // If we have a valid provided IPD number, use it
  if (providedIPDNumber && providedIPDNumber !== 'IPD Number Not Available' && providedIPDNumber !== 'IPD Number Not Generated') {
    console.log(`✅ Using provided IPD number: ${providedIPDNumber}`);
    return providedIPDNumber;
  }
  
  // Try to find IPD number from localStorage as fallback
  try {
    const bedKeys = Object.keys(localStorage).filter(key => key.includes('-ipdNumber'));
    console.log(`🔍 Found bed IPD keys in localStorage:`, bedKeys);
    
    if (bedKeys.length > 0) {
      // Get the most recent IPD number
      const latestKey = bedKeys[bedKeys.length - 1];
      const fallbackIPD = localStorage.getItem(latestKey);
      
      if (fallbackIPD) {
        console.log(`✅ Using fallback IPD from localStorage: ${fallbackIPD}`);
        return fallbackIPD;
      }
    }
    
    // If no IPD found, try to get the latest generated IPD from today
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
                      (today.getMonth() + 1).toString().padStart(2, '0') + 
                      today.getDate().toString().padStart(2, '0');
    
    const counterKey = `ipd-counter-${dateString}`;
    const currentCounter = parseInt(localStorage.getItem(counterKey) || '0');
    
    if (currentCounter > 0) {
      const lastIPD = `IPD-${dateString}-${currentCounter.toString().padStart(3, '0')}`;
      console.log(`✅ Using last generated IPD for today: ${lastIPD}`);
      return lastIPD;
    }
    
  } catch (error) {
    console.error('❌ Error getting IPD number from localStorage:', error);
  }
  
  console.log(`❌ No IPD number available, returning placeholder`);
  return 'IPD Number Not Available';
};

export const storeIPDNumberForBed = (bedId: string, ipdNumber: string): void => {
  try {
    localStorage.setItem(`bed-${bedId}-ipdNumber`, ipdNumber);
    console.log(`💾 Stored IPD number for bed ${bedId}: ${ipdNumber}`);
  } catch (error) {
    console.error('❌ Error storing IPD number:', error);
  }
};