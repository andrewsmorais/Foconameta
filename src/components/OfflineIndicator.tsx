import React from 'react';
import { useOfflineContext } from '@/contexts/OfflineContext';
import { Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, forceSync } = useOfflineContext();
  const { t } = useTranslation();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all",
      isOnline 
        ? "bg-primary/10 border border-primary/20" 
        : "bg-destructive/10 border border-destructive/20"
    )}>
      {isOnline ? (
        <Cloud className="h-4 w-4 text-primary" />
      ) : (
        <WifiOff className="h-4 w-4 text-destructive" />
      )}
      
      <span className={cn(
        "text-sm font-medium",
        isOnline ? "text-primary" : "text-destructive"
      )}>
        {!isOnline && t('offline.offlineMode')}
        {isOnline && isSyncing && t('common.carregando')}
        {isOnline && !isSyncing && pendingCount > 0 && t('offline.syncedFail', { count: pendingCount })}
      </span>

      {isOnline && pendingCount > 0 && !isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={forceSync}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}

      {isSyncing && (
        <RefreshCw className="h-3 w-3 animate-spin text-primary" />
      )}
    </div>
  );
};
