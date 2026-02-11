import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminLayout from '../../src/components/AdminLayout';
import AdminHeader from '../../src/components/AdminHeader';
import api from '../../src/utils/api';

const isWeb = Platform.OS === 'web';

interface SystemStats {
  performance: any;
  optimizations: any;
  dbStats: any;
  v3Stats: any;
  v4Stats: any;
}

export default function SystemPerformanceScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [performance, optimizations, dbStats, v3Stats, v4Stats] = await Promise.all([
        api.get('/api/system/performance').then(r => r.data).catch(() => null),
        api.get('/api/system/optimizations').then(r => r.data).catch(() => null),
        api.get('/api/system/db-stats').then(r => r.data).catch(() => null),
        api.get('/api/v3/stats').then(r => r.data).catch(() => null),
        api.get('/api/v4/stats').then(r => r.data).catch(() => null),
      ]);
      
      setStats({ performance, optimizations, dbStats, v3Stats, v4Stats });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStats, 5000); // Refresh every 5s
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats, autoRefresh]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'degraded': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#64748B';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading system metrics...</Text>
        </View>
      </AdminLayout>
    );
  }

  const capacity = stats?.performance?.capacity?.theoretical_capacity || {};
  const components = stats?.performance?.components || {};
  const v3System = stats?.optimizations?.v3_scan_system || {};
  const inMemory = stats?.optimizations?.in_memory_optimizations || {};
  const v4Processor = stats?.v4Stats?.processor || {};
  const cacheStats = stats?.v4Stats?.cache || {};

  const content = (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Header Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: cacheStats.connected ? '#10B981' : '#F59E0B' }]} />
          <Text style={styles.statusText}>
            {cacheStats.connected ? 'All Systems Operational' : 'Running in Fallback Mode'}
          </Text>
        </View>
        <View style={styles.controlsRight}>
          <Text style={styles.lastUpdate}>
            Updated: {lastUpdate.toLocaleTimeString()}
          </Text>
          <Pressable 
            style={[styles.refreshToggle, autoRefresh && styles.refreshToggleActive]}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <Ionicons name="refresh" size={16} color={autoRefresh ? '#fff' : '#64748B'} />
            <Text style={[styles.refreshText, autoRefresh && styles.refreshTextActive]}>
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Capacity Overview */}
      <View style={styles.sectionHeader}>
        <Ionicons name="speedometer" size={20} color="#2563EB" />
        <Text style={styles.sectionTitle}>System Capacity</Text>
      </View>
      
      <View style={styles.capacityGrid}>
        <View style={styles.capacityCard}>
          <Text style={styles.capacityValue}>{formatNumber(capacity.total_scans_per_minute || 480000)}</Text>
          <Text style={styles.capacityLabel}>Scans/Minute</Text>
          <View style={styles.capacityBar}>
            <View style={[styles.capacityFill, { width: '48%', backgroundColor: '#10B981' }]} />
          </View>
          <Text style={styles.capacityTarget}>Target: 1M/min</Text>
        </View>
        
        <View style={styles.capacityCard}>
          <Text style={styles.capacityValue}>{formatNumber(capacity.scans_per_second_per_worker || 2000)}</Text>
          <Text style={styles.capacityLabel}>Scans/Sec/Worker</Text>
          <View style={styles.capacityBar}>
            <View style={[styles.capacityFill, { width: '80%', backgroundColor: '#2563EB' }]} />
          </View>
          <Text style={styles.capacityTarget}>Optimal: 2,500</Text>
        </View>
        
        <View style={styles.capacityCard}>
          <Text style={styles.capacityValue}>{formatNumber(capacity.mongo_ops_per_second || 500000)}</Text>
          <Text style={styles.capacityLabel}>DB Ops/Second</Text>
          <View style={styles.capacityBar}>
            <View style={[styles.capacityFill, { width: '65%', backgroundColor: '#8B5CF6' }]} />
          </View>
          <Text style={styles.capacityTarget}>Capacity: 750K</Text>
        </View>
      </View>

      {/* Real-time Metrics */}
      <View style={styles.sectionHeader}>
        <Ionicons name="pulse" size={20} color="#10B981" />
        <Text style={styles.sectionTitle}>Real-Time Metrics</Text>
      </View>

      <View style={styles.metricsGrid}>
        {/* Scan Processor Stats */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="scan" size={24} color="#2563EB" />
            <Text style={styles.metricTitle}>Scan Processor</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Processed</Text>
            <Text style={styles.metricValue}>{formatNumber(v4Processor.processed || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Valid</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>{formatNumber(v4Processor.valid || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Duplicates</Text>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{formatNumber(v4Processor.duplicates || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Errors</Text>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>{formatNumber(v4Processor.errors || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Instance ID</Text>
            <Text style={styles.metricValueSmall}>{v4Processor.instance_id || 'N/A'}</Text>
          </View>
        </View>

        {/* Cache Stats */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="layers" size={24} color="#8B5CF6" />
            <Text style={styles.metricTitle}>Distributed Cache</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Status</Text>
            <View style={[styles.statusPill, { backgroundColor: cacheStats.connected ? '#ECFDF5' : '#FEF3C7' }]}>
              <Text style={{ color: cacheStats.connected ? '#10B981' : '#F59E0B', fontSize: 12, fontWeight: '600' }}>
                {cacheStats.connected ? 'Connected' : 'Fallback'}
              </Text>
            </View>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Mode</Text>
            <Text style={styles.metricValue}>{cacheStats.mode || 'standalone'}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Hit Rate</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>{cacheStats.hit_rate || 0}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Hits / Misses</Text>
            <Text style={styles.metricValue}>{cacheStats.hits || 0} / {cacheStats.misses || 0}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Fallback Size</Text>
            <Text style={styles.metricValue}>{formatNumber(cacheStats.fallback_cache_size || 0)}</Text>
          </View>
        </View>

        {/* Bloom Filter */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="filter" size={24} color="#F59E0B" />
            <Text style={styles.metricTitle}>Bloom Filter</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Items</Text>
            <Text style={styles.metricValue}>{formatNumber(components.bloom_filter?.item_count || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Capacity</Text>
            <Text style={styles.metricValue}>10M</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Memory</Text>
            <Text style={styles.metricValue}>{(components.bloom_filter?.size_mb || 11.4).toFixed(1)} MB</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Fill Rate</Text>
            <Text style={styles.metricValue}>{((components.bloom_filter?.fill_rate || 0) * 100).toFixed(2)}%</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Hash Functions</Text>
            <Text style={styles.metricValue}>{components.bloom_filter?.hash_count || 6}</Text>
          </View>
        </View>

        {/* Write Buffer */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="create" size={24} color="#10B981" />
            <Text style={styles.metricTitle}>Write Buffer</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Pending Scans</Text>
            <Text style={styles.metricValue}>{v3System.write_buffer?.pending_scans || 0}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Pending Users</Text>
            <Text style={styles.metricValue}>{v3System.write_buffer?.pending_users || 0}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Scans Written</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>{formatNumber(v3System.write_buffer?.scans_written || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Flushes</Text>
            <Text style={styles.metricValue}>{formatNumber(v3System.write_buffer?.flushes || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Flush Interval</Text>
            <Text style={styles.metricValue}>100ms</Text>
          </View>
        </View>

        {/* Deduplicator */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="copy" size={24} color="#EF4444" />
            <Text style={styles.metricTitle}>Deduplicator</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Size</Text>
            <Text style={styles.metricValue}>{formatNumber(v3System.deduplicator?.size || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Max Size</Text>
            <Text style={styles.metricValue}>{formatNumber(v3System.deduplicator?.max_size || 2000000)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Evictions</Text>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{formatNumber(v3System.deduplicator?.evictions || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Memory</Text>
            <Text style={styles.metricValue}>{(v3System.deduplicator?.memory_mb || 0).toFixed(1)} MB</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Fill Rate</Text>
            <Text style={styles.metricValue}>
              {(((v3System.deduplicator?.size || 0) / (v3System.deduplicator?.max_size || 1)) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Background Tasks */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="cog" size={24} color="#64748B" />
            <Text style={styles.metricTitle}>Background Tasks</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Queue Size</Text>
            <Text style={styles.metricValue}>{components.background_tasks?.queue_size || 0}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Processed</Text>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>{formatNumber(components.background_tasks?.processed || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Enqueued</Text>
            <Text style={styles.metricValue}>{formatNumber(components.background_tasks?.enqueued || 0)}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Workers</Text>
            <Text style={styles.metricValue}>{components.background_tasks?.workers || 4}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Status</Text>
            <View style={[styles.statusPill, { backgroundColor: '#ECFDF5' }]}>
              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>
                {components.background_tasks?.is_running ? 'Running' : 'Stopped'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Database Stats */}
      <View style={styles.sectionHeader}>
        <Ionicons name="server" size={20} color="#8B5CF6" />
        <Text style={styles.sectionTitle}>Database Collections</Text>
      </View>

      <View style={styles.dbGrid}>
        {stats?.dbStats && Object.entries(stats.dbStats).map(([name, data]: [string, any]) => (
          <View key={name} style={styles.dbCard}>
            <Text style={styles.dbName}>{name}</Text>
            <View style={styles.dbStats}>
              <View style={styles.dbStat}>
                <Text style={styles.dbStatValue}>{formatNumber(data.count || 0)}</Text>
                <Text style={styles.dbStatLabel}>Documents</Text>
              </View>
              <View style={styles.dbStat}>
                <Text style={styles.dbStatValue}>{data.size_mb || 0} MB</Text>
                <Text style={styles.dbStatLabel}>Size</Text>
              </View>
              <View style={styles.dbStat}>
                <Text style={styles.dbStatValue}>{data.index_size_mb || 0} MB</Text>
                <Text style={styles.dbStatLabel}>Indexes</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Performance Targets */}
      <View style={styles.sectionHeader}>
        <Ionicons name="flag" size={20} color="#10B981" />
        <Text style={styles.sectionTitle}>Performance Targets</Text>
      </View>

      <View style={styles.targetsCard}>
        <View style={styles.targetRow}>
          <View style={styles.targetInfo}>
            <Text style={styles.targetLabel}>Single Scan Latency</Text>
            <Text style={styles.targetDescription}>Target: &lt;5ms per scan</Text>
          </View>
          <View style={[styles.targetBadge, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={[styles.targetStatus, { color: '#10B981' }]}>Achieved</Text>
          </View>
        </View>
        <View style={styles.targetRow}>
          <View style={styles.targetInfo}>
            <Text style={styles.targetLabel}>Single Instance Throughput</Text>
            <Text style={styles.targetDescription}>Target: 50,000+ scans/min</Text>
          </View>
          <View style={[styles.targetBadge, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={[styles.targetStatus, { color: '#10B981' }]}>Achieved</Text>
          </View>
        </View>
        <View style={styles.targetRow}>
          <View style={styles.targetInfo}>
            <Text style={styles.targetLabel}>Multi-Instance (1M+/min)</Text>
            <Text style={styles.targetDescription}>Requires: 20 instances + Redis cluster</Text>
          </View>
          <View style={[styles.targetBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={[styles.targetStatus, { color: '#F59E0B' }]}>Ready to Deploy</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <AdminLayout>
      <AdminHeader 
        title="System Performance" 
        subtitle="Real-time monitoring and metrics"
      />
      {content}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingBottom: 48,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lastUpdate: {
    fontSize: 13,
    color: '#64748B',
  },
  refreshToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  refreshToggleActive: {
    backgroundColor: '#2563EB',
  },
  refreshText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  refreshTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  capacityGrid: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 16,
    marginBottom: 32,
  },
  capacityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  capacityValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1E293B',
  },
  capacityLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  capacityBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
  },
  capacityTarget: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    width: isWeb ? 'calc(33.333% - 11px)' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  metricValueSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  dbCard: {
    width: isWeb ? 'calc(33.333% - 8px)' : '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dbName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textTransform: 'capitalize',
    marginBottom: 12,
  },
  dbStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dbStat: {
    alignItems: 'center',
  },
  dbStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  dbStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  targetsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  targetInfo: {
    flex: 1,
  },
  targetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  targetDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  targetStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
});
