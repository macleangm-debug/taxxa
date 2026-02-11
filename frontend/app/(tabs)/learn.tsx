import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { educationAPI } from '../../src/utils/api';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  icon: string;
}

interface EducationContent {
  articles: Article[];
  tips: string[];
  stats: {
    total_receipts_scanned: number;
    total_users: number;
    estimated_tax_verified: number;
  };
}

export default function LearnScreen() {
  const [content, setContent] = useState<EducationContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      const response = await educationAPI.getContent();
      setContent(response.data);
    } catch (error) {
      console.error('Error loading education content:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadContent();
    setIsRefreshing(false);
  };

  const getIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    switch (icon) {
      case 'school':
        return 'school';
      case 'hospital':
        return 'medkit';
      case 'shield':
        return 'shield-checkmark';
      case 'document':
        return 'document-text';
      default:
        return 'information-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Learn About Tax Compliance</Text>
          <Text style={styles.subtitle}>
            Understand why your receipts matter
          </Text>
        </View>

        {/* Impact Stats */}
        {content?.stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Community Impact</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {content.stats.total_receipts_scanned.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Receipts Scanned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {content.stats.total_users.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ${content.stats.estimated_tax_verified.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Tax Verified</Text>
              </View>
            </View>
          </View>
        )}

        {/* Articles */}
        <Text style={styles.sectionTitle}>Educational Articles</Text>
        {content?.articles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => setExpandedArticle(
              expandedArticle === article.id ? null : article.id
            )}
          >
            <View style={styles.articleHeader}>
              <View style={styles.articleIcon}>
                <Ionicons
                  name={getIconName(article.icon)}
                  size={24}
                  color="#3B82F6"
                />
              </View>
              <View style={styles.articleInfo}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary}>{article.summary}</Text>
              </View>
              <Ionicons
                name={expandedArticle === article.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#64748B"
              />
            </View>
            
            {expandedArticle === article.id && (
              <View style={styles.articleContent}>
                <Text style={styles.contentText}>{article.content}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Tips */}
        <Text style={styles.sectionTitle}>Quick Tips</Text>
        <View style={styles.tipsCard}>
          {content?.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaCard}>
          <Ionicons name="megaphone" size={32} color="#F59E0B" />
          <Text style={styles.ctaTitle}>Spread the Word!</Text>
          <Text style={styles.ctaText}>
            Share TaxDraw with friends and family. Together, we can increase tax
            compliance and fund better public services for everyone.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#334155',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  articleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  articleSummary: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  articleContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  contentText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
  },
  ctaCard: {
    backgroundColor: '#F59E0B20',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 12,
  },
  ctaText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
