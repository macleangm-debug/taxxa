import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import AdminSidebar from './AdminSidebar';

const isWeb = Platform.OS === 'web';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  if (!isWeb) {
    // On mobile, just render children without sidebar
    return <View style={styles.mobileContainer}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <AdminSidebar />
      <View style={styles.main}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  main: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
