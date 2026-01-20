import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  data: { label: string; value: number; color?: string }[];
  type?: 'bar' | 'horizontal';
}

export default function ChartCard({ title, subtitle, data, type = 'bar' }: ChartCardProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (type === 'horizontal') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.horizontalChart}>
          {data.map((item, i) => (
            <View key={i} style={styles.horizontalItem}>
              <View style={styles.horizontalLabel}>
                <Text style={styles.horizontalLabelText}>{item.label}</Text>
                <Text style={styles.horizontalValue}>{item.value.toLocaleString()}</Text>
              </View>
              <View style={styles.horizontalBarBg}>
                <View 
                  style={[
                    styles.horizontalBar, 
                    { width: `${(item.value / maxValue) * 100}%`, backgroundColor: item.color || '#2563EB' }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.chart}>
        {data.map((item, i) => (
          <View key={i} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { height: `${(item.value / maxValue) * 100}%`, backgroundColor: item.color || '#2563EB' }
                ]} 
              />
            </View>
            <Text style={styles.barLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: 32,
    height: 140,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  horizontalChart: {
    gap: 16,
  },
  horizontalItem: {
    gap: 8,
  },
  horizontalLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  horizontalLabelText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  horizontalValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  horizontalBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  horizontalBar: {
    height: '100%',
    borderRadius: 4,
  },
});
