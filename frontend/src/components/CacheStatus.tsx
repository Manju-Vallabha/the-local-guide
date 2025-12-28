import React, { useState } from 'react';
import { useCacheManagement, useStorageQuota, useOfflineMode } from '../hooks/useCacheManagement';

interface CacheStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const {
    cacheHealth,
    cacheStats,
    performCleanup,
    clearAllCaches,
    formatStorageSize,
    getCacheAge,
    canWorkOffline,
  } = useCacheManagement();

  const { quotaInfo, isNearLimit } = useStorageQuota();
  const { isOffline, getOfflineDurationText } = useOfflineMode();

  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await performCleanup(true);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all cached data? This will remove offline capabilities until data is reloaded.')) {
      setIsClearingAll(true);
      try {
        await clearAllCaches();
      } finally {
        setIsClearingAll(false);
      }
    }
  };

  // Simple status indicator
  if (!showDetails) {
    return (
      <div className={`cache-status-indicator ${className}`}>
        {isOffline && (
          <div className="offline-indicator" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#ff9800',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.8rem',
          }}>
            <span>📡</span>
            <span>Offline {getOfflineDurationText()}</span>
            {canWorkOffline() && <span>✓</span>}
          </div>
        )}
        
        {isNearLimit && (
          <div className="storage-warning" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#f44336',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.8rem',
          }}>
            <span>⚠️</span>
            <span>Storage Full</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed status panel
  return (
    <div className={`cache-status-panel ${className}`} style={{
      padding: '1rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Cache Status</h3>
      
      {/* Online/Offline Status */}
      <div className="connection-status" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{isOffline ? '📡' : '🌐'}</span>
          <span style={{ fontWeight: 'bold' }}>
            {isOffline ? 'Offline' : 'Online'}
          </span>
          {isOffline && getOfflineDurationText() && (
            <span style={{ color: '#666', fontSize: '0.9rem' }}>
              ({getOfflineDurationText()})
            </span>
          )}
        </div>
        
        {isOffline && (
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
            {canWorkOffline() ? 
              '✅ App can work offline with cached data' : 
              '⚠️ Limited offline functionality'
            }
          </div>
        )}
      </div>

      {/* Storage Information */}
      {quotaInfo && (
        <div className="storage-info" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Storage Usage</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              flex: 1,
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(quotaInfo.percentage * 100, 100)}%`,
                height: '100%',
                backgroundColor: quotaInfo.percentage > 0.8 ? '#f44336' : 
                                quotaInfo.percentage > 0.6 ? '#ff9800' : '#4caf50',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.9rem', minWidth: '80px' }}>
              {(quotaInfo.percentage * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
            {formatStorageSize(quotaInfo.used)} of {formatStorageSize(quotaInfo.quota)} used
          </div>
        </div>
      )}

      {/* Cache Statistics */}
      {cacheStats && (
        <div className="cache-stats" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Cache Statistics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div>Items: {cacheStats.totalItems}</div>
            <div>Size: {formatStorageSize(cacheStats.totalSize)}</div>
            <div>Expired: {cacheStats.expiredItems}</div>
            <div>Oldest: {getCacheAge(cacheStats.oldestItem)}</div>
          </div>
        </div>
      )}

      {/* Health Warnings */}
      {cacheHealth && !cacheHealth.healthy && (
        <div className="cache-warnings" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold', color: '#f44336', marginBottom: '0.5rem' }}>
            ⚠️ Cache Issues
          </div>
          {cacheHealth.warnings.map((warning, index) => (
            <div key={index} style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>
              • {warning}
            </div>
          ))}
          {cacheHealth.recommendations.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                Recommendations:
              </div>
              {cacheHealth.recommendations.map((rec, index) => (
                <div key={index} style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                  • {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="cache-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleCleanup}
          disabled={isCleaningUp}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isCleaningUp ? 'not-allowed' : 'pointer',
            opacity: isCleaningUp ? 0.6 : 1,
            fontSize: '0.9rem',
          }}
        >
          {isCleaningUp ? 'Cleaning...' : 'Clean Cache'}
        </button>
        
        <button
          onClick={handleClearAll}
          disabled={isClearingAll}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isClearingAll ? 'not-allowed' : 'pointer',
            opacity: isClearingAll ? 0.6 : 1,
            fontSize: '0.9rem',
          }}
        >
          {isClearingAll ? 'Clearing...' : 'Clear All'}
        </button>
      </div>
    </div>
  );
};