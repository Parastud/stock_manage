import { useEffect, useRef } from 'react';
import syncOfflineData from '../utils/syncOfflineData';

let globalSyncState = {
  hasExecuted: false,
  isExecuting: false
};

export const useAppSync = (isConnected) => {
  const componentSyncExecuted = useRef(false);

  useEffect(() => {
    if (isConnected && 
        !componentSyncExecuted.current && 
        !globalSyncState.hasExecuted && 
        !globalSyncState.isExecuting) {
      
      componentSyncExecuted.current = true;
      globalSyncState.isExecuting = true;
      
      
      const performSync = async () => {
        try {
          const result = await syncOfflineData();
          
          if (result?.success && result?.results?.total?.success > 0) {
          } else if (result?.message) {
          } else if (result?.error) {
            console.warn("⚠️ Sync error:", result.error);
          }
        } catch (error) {
          console.error("❌ Sync failed:", error.message);
        } finally {
          globalSyncState.isExecuting = false;
          globalSyncState.hasExecuted = true;
        }
      };

      performSync();
    }
  }, [isConnected]);
};

// Reset function for development/testing
export const resetSyncState = () => {
  globalSyncState.hasExecuted = false;
  globalSyncState.isExecuting = false;
};
