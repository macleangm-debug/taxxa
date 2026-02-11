import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

// Country configurations
const COUNTRIES = {
  tanzania: { name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', vatRate: 18 },
  kenya: { name: 'Kenya', flag: '🇰🇪', currency: 'KES', vatRate: 16 },
  uganda: { name: 'Uganda', flag: '🇺🇬', currency: 'UGX', vatRate: 18 },
  rwanda: { name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', vatRate: 18 },
};

type CountryKey = keyof typeof COUNTRIES;

// Entry calculation methods
const ENTRY_METHODS = {
  fixed: {
    id: 'fixed',
    name: 'Fixed Per Receipt',
    description: 'Award a fixed number of entries for each valid receipt scan',
    icon: 'ticket',
  },
  amount: {
    id: 'amount',
    name: 'Amount-Based',
    description: 'Award entries based on total purchase amount',
    icon: 'cash',
  },
  tiered: {
    id: 'tiered',
    name: 'Tiered Brackets',
    description: 'Award entries based on amount brackets with increasing rewards',
    icon: 'layers',
  },
  vat: {
    id: 'vat',
    name: 'VAT-Based',
    description: 'Award entries based on VAT amount paid',
    icon: 'receipt',
  },
};

// Default draw configuration
const DEFAULT_DRAW_CONFIG = {
  // Basic Info
  name: '',
  type: 'weekly' as 'weekly' | 'monthly' | 'quarterly' | 'special',
  country: 'tanzania' as CountryKey,
  startDate: '',
  endDate: '',
  drawDate: '',
  
  // Prize Pool
  prizePool: 50000000,
  prizes: [
    { rank: 1, amount: 25000000, quantity: 1 },
    { rank: 2, amount: 5000000, quantity: 5 },
    { rank: 3, amount: 1000000, quantity: 20 },
    { rank: 4, amount: 100000, quantity: 100 },
  ],
  
  // Entry Calculation Method
  entryMethod: 'amount' as keyof typeof ENTRY_METHODS,
  
  // Fixed Method Settings
  fixedEntries: 1,
  
  // Amount-Based Settings
  amountPerEntry: 10000,
  baseEntries: 1,
  
  // Tiered Settings
  tiers: [
    { minAmount: 0, maxAmount: 50000, entries: 1 },
    { minAmount: 50001, maxAmount: 100000, entries: 3 },
    { minAmount: 100001, maxAmount: 250000, entries: 5 },
    { minAmount: 250001, maxAmount: 500000, entries: 8 },
    { minAmount: 500001, maxAmount: null, entries: 12 },
  ],
  
  // VAT-Based Settings
  vatAmountPerEntry: 1000,
  vatBaseEntries: 0,
  
  // Entry Caps
  capsEnabled: true,
  maxEntriesPerReceipt: 20,
  maxEntriesPerDay: 50,
  maxEntriesPerWeek: 200,
  
  // Bonus Multipliers
  bonusesEnabled: true,
  firstScanBonus: {
    enabled: true,
    multiplier: 2,
    description: 'First scan of the day',
  },
  weekendBonus: {
    enabled: true,
    multiplier: 1.5,
    description: 'Weekend scans (Sat-Sun)',
  },
  holidayBonus: {
    enabled: false,
    multiplier: 3,
    holidays: [] as string[],
    description: 'Public holidays',
  },
  merchantCategoryBonus: {
    enabled: true,
    categories: [
      { name: 'Groceries', multiplier: 1, enabled: true },
      { name: 'Electronics', multiplier: 1.2, enabled: true },
      { name: 'Fuel', multiplier: 1.5, enabled: true },
      { name: 'Healthcare', multiplier: 2, enabled: true },
      { name: 'Education', multiplier: 2, enabled: true },
    ],
  },
  streakBonus: {
    enabled: true,
    daysRequired: 7,
    multiplier: 1.5,
    description: 'Scan every day for 7 days',
  },
  
  // Advanced Settings
  minimumReceiptAmount: 1000,
  requireVerifiedMerchant: true,
  allowDuplicateReceipts: false,
  receiptValidityHours: 72,
};

type DrawConfig = typeof DEFAULT_DRAW_CONFIG;

export default function DrawSetup() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [config, setConfig] = useState<DrawConfig>({ ...DEFAULT_DRAW_CONFIG });
  const [activeTab, setActiveTab] = useState<'basic' | 'entries' | 'bonuses' | 'caps' | 'preview'>('basic');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [testAmount, setTestAmount] = useState('125000');
  const [testResult, setTestResult] = useState<any>(null);

  const country = COUNTRIES[config.country];

  // Calculate entries based on configuration
  const calculateEntries = (amount: number, isFirstScan = false, isWeekend = false, isHoliday = false, merchantCategory = 'Groceries', streakDays = 0) => {
    let baseEntries = 0;
    
    // Calculate base entries based on method
    switch (config.entryMethod) {
      case 'fixed':
        baseEntries = config.fixedEntries;
        break;
      case 'amount':
        baseEntries = Math.floor(amount / config.amountPerEntry) + config.baseEntries;
        break;
      case 'tiered':
        for (const tier of config.tiers) {
          if (amount >= tier.minAmount && (tier.maxAmount === null || amount <= tier.maxAmount)) {
            baseEntries = tier.entries;
            break;
          }
        }
        break;
      case 'vat':
        const vatAmount = Math.floor(amount * (country.vatRate / 100));
        baseEntries = Math.floor(vatAmount / config.vatAmountPerEntry) + config.vatBaseEntries;
        break;
    }
    
    // Apply bonuses
    let multiplier = 1;
    const appliedBonuses: string[] = [];
    
    if (config.bonusesEnabled) {
      if (config.firstScanBonus.enabled && isFirstScan) {
        multiplier *= config.firstScanBonus.multiplier;
        appliedBonuses.push(`First Scan: ${config.firstScanBonus.multiplier}x`);
      }
      if (config.weekendBonus.enabled && isWeekend) {
        multiplier *= config.weekendBonus.multiplier;
        appliedBonuses.push(`Weekend: ${config.weekendBonus.multiplier}x`);
      }
      if (config.holidayBonus.enabled && isHoliday) {
        multiplier *= config.holidayBonus.multiplier;
        appliedBonuses.push(`Holiday: ${config.holidayBonus.multiplier}x`);
      }
      if (config.merchantCategoryBonus.enabled) {
        const category = config.merchantCategoryBonus.categories.find(c => c.name === merchantCategory);
        if (category && category.enabled && category.multiplier > 1) {
          multiplier *= category.multiplier;
          appliedBonuses.push(`${merchantCategory}: ${category.multiplier}x`);
        }
      }
      if (config.streakBonus.enabled && streakDays >= config.streakBonus.daysRequired) {
        multiplier *= config.streakBonus.multiplier;
        appliedBonuses.push(`${streakDays}-day streak: ${config.streakBonus.multiplier}x`);
      }
    }
    
    let finalEntries = Math.floor(baseEntries * multiplier);
    
    // Apply caps
    if (config.capsEnabled) {
      if (config.maxEntriesPerReceipt > 0 && finalEntries > config.maxEntriesPerReceipt) {
        finalEntries = config.maxEntriesPerReceipt;
        appliedBonuses.push(`Capped at ${config.maxEntriesPerReceipt}/receipt`);
      }
    }
    
    return {
      baseEntries,
      multiplier,
      finalEntries,
      appliedBonuses,
      vatAmount: Math.floor(amount * (country.vatRate / 100)),
    };
  };

  // Test calculation
  const runTestCalculation = () => {
    const amount = parseInt(testAmount) || 0;
    const result = calculateEntries(amount, true, true, false, 'Healthcare', 7);
    setTestResult(result);
  };

  useEffect(() => {
    if (testAmount) {
      runTestCalculation();
    }
  }, [testAmount, config]);

  const formatCurrency = (amount: number) => {
    return `${country.currency} ${amount.toLocaleString()}`;
  };

  const updateConfig = (updates: Partial<DrawConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateTier = (index: number, field: string, value: any) => {
    const newTiers = [...config.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    updateConfig({ tiers: newTiers });
  };

  const addTier = () => {
    const lastTier = config.tiers[config.tiers.length - 1];
    const newTiers = [...config.tiers];
    newTiers[newTiers.length - 1] = { ...lastTier, maxAmount: lastTier.minAmount + 100000 };
    newTiers.push({ minAmount: lastTier.minAmount + 100001, maxAmount: null, entries: lastTier.entries + 2 });
    updateConfig({ tiers: newTiers });
  };

  const removeTier = (index: number) => {
    if (config.tiers.length > 2) {
      const newTiers = config.tiers.filter((_, i) => i !== index);
      if (index === config.tiers.length - 1) {
        newTiers[newTiers.length - 1].maxAmount = null;
      }
      updateConfig({ tiers: newTiers });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.logoIcon}>
            <Ionicons name="trophy" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Draw Configuration</Text>
            <Text style={styles.headerSubtitle}>Configure lottery rules and entry calculations</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.countryBadge}>
            <Text style={styles.countryFlag}>{country.flag}</Text>
            <Text style={styles.countryName}>{country.name}</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={() => setShowSaveModal(true)}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Draw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'basic', label: 'Basic Info', icon: 'information-circle' },
          { id: 'entries', label: 'Entry Rules', icon: 'ticket' },
          { id: 'bonuses', label: 'Bonuses', icon: 'gift' },
          { id: 'caps', label: 'Limits & Caps', icon: 'shield-checkmark' },
          { id: 'preview', label: 'Preview & Test', icon: 'eye' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.id ? '#8B5CF6' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Draw Details</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Draw Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Weekly Lucky Draw - Week 6"
                placeholderTextColor="#64748B"
                value={config.name}
                onChangeText={(text) => updateConfig({ name: text })}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Draw Type</Text>
                <View style={styles.typeSelector}>
                  {['weekly', 'monthly', 'quarterly', 'special'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeOption, config.type === type && styles.typeOptionActive]}
                      onPress={() => updateConfig({ type: type as any })}
                    >
                      <Text style={[styles.typeOptionText, config.type === type && styles.typeOptionTextActive]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Country</Text>
              <View style={styles.countrySelector}>
                {Object.entries(COUNTRIES).map(([key, c]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.countryOption, config.country === key && styles.countryOptionActive]}
                    onPress={() => updateConfig({ country: key as CountryKey })}
                  >
                    <Text style={styles.countryOptionFlag}>{c.flag}</Text>
                    <Text style={[styles.countryOptionName, config.country === key && styles.countryOptionNameActive]}>
                      {c.name}
                    </Text>
                    <Text style={styles.countryOptionCurrency}>{c.currency}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Prize Pool</Text>
              <View style={styles.prizePoolInput}>
                <Text style={styles.currencyPrefix}>{country.currency}</Text>
                <TextInput
                  style={styles.prizePoolValue}
                  placeholder="50000000"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={config.prizePool.toString()}
                  onChangeText={(text) => updateConfig({ prizePool: parseInt(text) || 0 })}
                />
              </View>
              <View style={styles.quickAmounts}>
                {[10000000, 25000000, 50000000, 100000000, 500000000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.quickAmount, config.prizePool === amount && styles.quickAmountActive]}
                    onPress={() => updateConfig({ prizePool: amount })}
                  >
                    <Text style={styles.quickAmountText}>{amount >= 1000000000 ? `${amount / 1000000000}B` : `${amount / 1000000}M`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Entry Rules Tab */}
        {activeTab === 'entries' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entry Calculation Method</Text>
            <Text style={styles.sectionSubtitle}>Choose how entries are awarded for each receipt scan</Text>
            
            <View style={styles.methodGrid}>
              {Object.values(ENTRY_METHODS).map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodCard, config.entryMethod === method.id && styles.methodCardActive]}
                  onPress={() => updateConfig({ entryMethod: method.id as any })}
                >
                  <View style={[styles.methodIcon, config.entryMethod === method.id && styles.methodIconActive]}>
                    <Ionicons name={method.icon as any} size={28} color={config.entryMethod === method.id ? '#fff' : '#8B5CF6'} />
                  </View>
                  <Text style={[styles.methodName, config.entryMethod === method.id && styles.methodNameActive]}>
                    {method.name}
                  </Text>
                  <Text style={styles.methodDesc}>{method.description}</Text>
                  {config.entryMethod === method.id && (
                    <View style={styles.methodCheck}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Method-specific settings */}
            <View style={styles.methodSettings}>
              {config.entryMethod === 'fixed' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>Fixed Entry Settings</Text>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Entries per receipt</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberBtn}
                        onPress={() => updateConfig({ fixedEntries: Math.max(1, config.fixedEntries - 1) })}
                      >
                        <Ionicons name="remove" size={20} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{config.fixedEntries}</Text>
                      <TouchableOpacity 
                        style={styles.numberBtn}
                        onPress={() => updateConfig({ fixedEntries: config.fixedEntries + 1 })}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>Every valid receipt = {config.fixedEntries} entr{config.fixedEntries > 1 ? 'ies' : 'y'}</Text>
                  </View>
                </View>
              )}

              {config.entryMethod === 'amount' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>Amount-Based Settings</Text>
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>{country.currency} per entry</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="10000"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        value={config.amountPerEntry.toString()}
                        onChangeText={(text) => updateConfig({ amountPerEntry: parseInt(text) || 1 })}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Base entries (always awarded)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        value={config.baseEntries.toString()}
                        onChangeText={(text) => updateConfig({ baseEntries: parseInt(text) || 0 })}
                      />
                    </View>
                  </View>
                  <Text style={styles.hint}>
                    Formula: ⌊amount ÷ {formatCurrency(config.amountPerEntry)}⌋ + {config.baseEntries} base
                  </Text>
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleTitle}>Example:</Text>
                    <Text style={styles.exampleText}>
                      {formatCurrency(125000)} purchase = ⌊125,000 ÷ {config.amountPerEntry.toLocaleString()}⌋ + {config.baseEntries} = {Math.floor(125000 / config.amountPerEntry) + config.baseEntries} entries
                    </Text>
                  </View>
                </View>
              )}

              {config.entryMethod === 'tiered' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>Tiered Bracket Settings</Text>
                  <View style={styles.tiersContainer}>
                    <View style={styles.tierHeader}>
                      <Text style={[styles.tierHeaderText, { flex: 2 }]}>Amount Range ({country.currency})</Text>
                      <Text style={[styles.tierHeaderText, { flex: 1 }]}>Entries</Text>
                      <Text style={[styles.tierHeaderText, { width: 50 }]}></Text>
                    </View>
                    {config.tiers.map((tier, index) => (
                      <View key={index} style={styles.tierRow}>
                        <View style={[styles.tierRange, { flex: 2 }]}>
                          <TextInput
                            style={styles.tierInput}
                            keyboardType="numeric"
                            value={tier.minAmount.toString()}
                            onChangeText={(text) => updateTier(index, 'minAmount', parseInt(text) || 0)}
                          />
                          <Text style={styles.tierDash}>—</Text>
                          {tier.maxAmount !== null ? (
                            <TextInput
                              style={styles.tierInput}
                              keyboardType="numeric"
                              value={tier.maxAmount.toString()}
                              onChangeText={(text) => updateTier(index, 'maxAmount', parseInt(text) || 0)}
                            />
                          ) : (
                            <Text style={styles.tierUnlimited}>∞</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <TextInput
                            style={styles.tierInput}
                            keyboardType="numeric"
                            value={tier.entries.toString()}
                            onChangeText={(text) => updateTier(index, 'entries', parseInt(text) || 1)}
                          />
                        </View>
                        <TouchableOpacity 
                          style={styles.tierRemove}
                          onPress={() => removeTier(index)}
                          disabled={config.tiers.length <= 2}
                        >
                          <Ionicons name="trash" size={18} color={config.tiers.length <= 2 ? '#475569' : '#EF4444'} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={styles.addTierBtn} onPress={addTier}>
                      <Ionicons name="add" size={20} color="#8B5CF6" />
                      <Text style={styles.addTierText}>Add Tier</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {config.entryMethod === 'vat' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>VAT-Based Settings</Text>
                  <Text style={styles.vatRate}>VAT Rate: {country.vatRate}%</Text>
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>{country.currency} VAT per entry</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="1000"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        value={config.vatAmountPerEntry.toString()}
                        onChangeText={(text) => updateConfig({ vatAmountPerEntry: parseInt(text) || 1 })}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Base entries</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        value={config.vatBaseEntries.toString()}
                        onChangeText={(text) => updateConfig({ vatBaseEntries: parseInt(text) || 0 })}
                      />
                    </View>
                  </View>
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleTitle}>Example:</Text>
                    <Text style={styles.exampleText}>
                      {formatCurrency(125000)} purchase → VAT = {formatCurrency(Math.floor(125000 * country.vatRate / 100))}
                    </Text>
                    <Text style={styles.exampleText}>
                      Entries = ⌊{Math.floor(125000 * country.vatRate / 100).toLocaleString()} ÷ {config.vatAmountPerEntry.toLocaleString()}⌋ + {config.vatBaseEntries} = {Math.floor(Math.floor(125000 * country.vatRate / 100) / config.vatAmountPerEntry) + config.vatBaseEntries} entries
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bonuses Tab */}
        {activeTab === 'bonuses' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Bonus Multipliers</Text>
                <Text style={styles.sectionSubtitle}>Configure special bonuses to increase engagement</Text>
              </View>
              <View style={styles.masterToggle}>
                <Text style={styles.masterToggleLabel}>Enable Bonuses</Text>
                <Switch
                  value={config.bonusesEnabled}
                  onValueChange={(value) => updateConfig({ bonusesEnabled: value })}
                  trackColor={{ false: '#475569', true: '#8B5CF6' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={[styles.bonusGrid, !config.bonusesEnabled && styles.disabled]}>
              {/* First Scan Bonus */}
              <View style={styles.bonusCard}>
                <View style={styles.bonusHeader}>
                  <View style={styles.bonusIconWrapper}>
                    <Ionicons name="sunny" size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.bonusInfo}>
                    <Text style={styles.bonusName}>First Scan of Day</Text>
                    <Text style={styles.bonusDesc}>Bonus for the first receipt scanned each day</Text>
                  </View>
                  <Switch
                    value={config.firstScanBonus.enabled}
                    onValueChange={(value) => updateConfig({ 
                      firstScanBonus: { ...config.firstScanBonus, enabled: value } 
                    })}
                    trackColor={{ false: '#475569', true: '#8B5CF6' }}
                    thumbColor="#fff"
                    disabled={!config.bonusesEnabled}
                  />
                </View>
                {config.firstScanBonus.enabled && (
                  <View style={styles.bonusSettings}>
                    <Text style={styles.multiplierLabel}>Multiplier</Text>
                    <View style={styles.multiplierPicker}>
                      {[1.5, 2, 2.5, 3].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.multiplierOption, config.firstScanBonus.multiplier === m && styles.multiplierOptionActive]}
                          onPress={() => updateConfig({ firstScanBonus: { ...config.firstScanBonus, multiplier: m } })}
                        >
                          <Text style={[styles.multiplierText, config.firstScanBonus.multiplier === m && styles.multiplierTextActive]}>{m}x</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Weekend Bonus */}
              <View style={styles.bonusCard}>
                <View style={styles.bonusHeader}>
                  <View style={styles.bonusIconWrapper}>
                    <Ionicons name="calendar" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.bonusInfo}>
                    <Text style={styles.bonusName}>Weekend Bonus</Text>
                    <Text style={styles.bonusDesc}>Extra entries for Saturday & Sunday scans</Text>
                  </View>
                  <Switch
                    value={config.weekendBonus.enabled}
                    onValueChange={(value) => updateConfig({ 
                      weekendBonus: { ...config.weekendBonus, enabled: value } 
                    })}
                    trackColor={{ false: '#475569', true: '#8B5CF6' }}
                    thumbColor="#fff"
                    disabled={!config.bonusesEnabled}
                  />
                </View>
                {config.weekendBonus.enabled && (
                  <View style={styles.bonusSettings}>
                    <Text style={styles.multiplierLabel}>Multiplier</Text>
                    <View style={styles.multiplierPicker}>
                      {[1.25, 1.5, 1.75, 2].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.multiplierOption, config.weekendBonus.multiplier === m && styles.multiplierOptionActive]}
                          onPress={() => updateConfig({ weekendBonus: { ...config.weekendBonus, multiplier: m } })}
                        >
                          <Text style={[styles.multiplierText, config.weekendBonus.multiplier === m && styles.multiplierTextActive]}>{m}x</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Streak Bonus */}
              <View style={styles.bonusCard}>
                <View style={styles.bonusHeader}>
                  <View style={styles.bonusIconWrapper}>
                    <Ionicons name="flame" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.bonusInfo}>
                    <Text style={styles.bonusName}>Streak Bonus</Text>
                    <Text style={styles.bonusDesc}>Reward users who scan daily</Text>
                  </View>
                  <Switch
                    value={config.streakBonus.enabled}
                    onValueChange={(value) => updateConfig({ 
                      streakBonus: { ...config.streakBonus, enabled: value } 
                    })}
                    trackColor={{ false: '#475569', true: '#8B5CF6' }}
                    thumbColor="#fff"
                    disabled={!config.bonusesEnabled}
                  />
                </View>
                {config.streakBonus.enabled && (
                  <View style={styles.bonusSettings}>
                    <View style={styles.formRow}>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.multiplierLabel}>Days required</Text>
                        <View style={styles.multiplierPicker}>
                          {[3, 5, 7, 14, 30].map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[styles.multiplierOption, config.streakBonus.daysRequired === d && styles.multiplierOptionActive]}
                              onPress={() => updateConfig({ streakBonus: { ...config.streakBonus, daysRequired: d } })}
                            >
                              <Text style={[styles.multiplierText, config.streakBonus.daysRequired === d && styles.multiplierTextActive]}>{d}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.multiplierLabel}>Multiplier</Text>
                        <View style={styles.multiplierPicker}>
                          {[1.5, 2, 2.5, 3].map((m) => (
                            <TouchableOpacity
                              key={m}
                              style={[styles.multiplierOption, config.streakBonus.multiplier === m && styles.multiplierOptionActive]}
                              onPress={() => updateConfig({ streakBonus: { ...config.streakBonus, multiplier: m } })}
                            >
                              <Text style={[styles.multiplierText, config.streakBonus.multiplier === m && styles.multiplierTextActive]}>{m}x</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Merchant Category Bonus */}
              <View style={styles.bonusCard}>
                <View style={styles.bonusHeader}>
                  <View style={styles.bonusIconWrapper}>
                    <Ionicons name="storefront" size={24} color="#10B981" />
                  </View>
                  <View style={styles.bonusInfo}>
                    <Text style={styles.bonusName}>Merchant Category Bonus</Text>
                    <Text style={styles.bonusDesc}>Different multipliers for different merchant types</Text>
                  </View>
                  <Switch
                    value={config.merchantCategoryBonus.enabled}
                    onValueChange={(value) => updateConfig({ 
                      merchantCategoryBonus: { ...config.merchantCategoryBonus, enabled: value } 
                    })}
                    trackColor={{ false: '#475569', true: '#8B5CF6' }}
                    thumbColor="#fff"
                    disabled={!config.bonusesEnabled}
                  />
                </View>
                {config.merchantCategoryBonus.enabled && (
                  <View style={styles.categorySettings}>
                    {config.merchantCategoryBonus.categories.map((cat, index) => (
                      <View key={cat.name} style={styles.categoryRow}>
                        <Switch
                          value={cat.enabled}
                          onValueChange={(value) => {
                            const newCategories = [...config.merchantCategoryBonus.categories];
                            newCategories[index] = { ...cat, enabled: value };
                            updateConfig({ merchantCategoryBonus: { ...config.merchantCategoryBonus, categories: newCategories } });
                          }}
                          trackColor={{ false: '#475569', true: '#8B5CF6' }}
                          thumbColor="#fff"
                        />
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        <View style={styles.categoryMultiplier}>
                          {[1, 1.2, 1.5, 2, 3].map((m) => (
                            <TouchableOpacity
                              key={m}
                              style={[styles.catMultOption, cat.multiplier === m && styles.catMultOptionActive]}
                              onPress={() => {
                                const newCategories = [...config.merchantCategoryBonus.categories];
                                newCategories[index] = { ...cat, multiplier: m };
                                updateConfig({ merchantCategoryBonus: { ...config.merchantCategoryBonus, categories: newCategories } });
                              }}
                            >
                              <Text style={[styles.catMultText, cat.multiplier === m && styles.catMultTextActive]}>{m}x</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Caps Tab */}
        {activeTab === 'caps' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Entry Limits & Caps</Text>
                <Text style={styles.sectionSubtitle}>Prevent gaming and ensure fair distribution</Text>
              </View>
              <View style={styles.masterToggle}>
                <Text style={styles.masterToggleLabel}>Enable Caps</Text>
                <Switch
                  value={config.capsEnabled}
                  onValueChange={(value) => updateConfig({ capsEnabled: value })}
                  trackColor={{ false: '#475569', true: '#8B5CF6' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={[styles.capsGrid, !config.capsEnabled && styles.disabled]}>
              <View style={styles.capCard}>
                <Ionicons name="receipt" size={32} color="#8B5CF6" />
                <Text style={styles.capTitle}>Per Receipt</Text>
                <Text style={styles.capDesc}>Maximum entries from a single receipt</Text>
                <View style={styles.capInput}>
                  <TouchableOpacity 
                    style={styles.capBtn}
                    onPress={() => updateConfig({ maxEntriesPerReceipt: Math.max(1, config.maxEntriesPerReceipt - 5) })}
                  >
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.capValue}>{config.maxEntriesPerReceipt}</Text>
                  <TouchableOpacity 
                    style={styles.capBtn}
                    onPress={() => updateConfig({ maxEntriesPerReceipt: config.maxEntriesPerReceipt + 5 })}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.capCard}>
                <Ionicons name="today" size={32} color="#3B82F6" />
                <Text style={styles.capTitle}>Per Day</Text>
                <Text style={styles.capDesc}>Maximum entries per user per day</Text>
                <View style={styles.capInput}>
                  <TouchableOpacity 
                    style={styles.capBtn}
                    onPress={() => updateConfig({ maxEntriesPerDay: Math.max(1, config.maxEntriesPerDay - 10) })}
                  >
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.capValue}>{config.maxEntriesPerDay}</Text>
                  <TouchableOpacity 
                    style={styles.capBtn}
                    onPress={() => updateConfig({ maxEntriesPerDay: config.maxEntriesPerDay + 10 })}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.capCard}>
                <Ionicons name="calendar" size={32} color="#10B981" />
                <Text style={styles.capTitle}>Per Week</Text>
                <Text style={styles.capDesc}>Maximum entries per user per week</Text>
                <View style={styles.capInput}>
                  <TouchableOpacity 
                    style={styles.capBtn}
                    onPress={() => updateConfig({ maxEntriesPerWeek: Math.max(1, config.maxEntriesPerWeek - 50) })}
                  >
                    <Ionicons name="remove" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.capValue}>{config.maxEntriesPerWeek}</Text>
                  <TouchableOpacity 
                    style={styles.capBtn}
                    onPress={() => updateConfig({ maxEntriesPerWeek: config.maxEntriesPerWeek + 50 })}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.advancedSettings}>
              <Text style={styles.settingTitle}>Advanced Settings</Text>
              
              <View style={styles.advancedRow}>
                <View style={styles.advancedInfo}>
                  <Text style={styles.advancedLabel}>Minimum Receipt Amount</Text>
                  <Text style={styles.advancedDesc}>Receipts below this amount won't earn entries</Text>
                </View>
                <View style={styles.advancedInput}>
                  <Text style={styles.currencySmall}>{country.currency}</Text>
                  <TextInput
                    style={styles.advancedTextInput}
                    keyboardType="numeric"
                    value={config.minimumReceiptAmount.toString()}
                    onChangeText={(text) => updateConfig({ minimumReceiptAmount: parseInt(text) || 0 })}
                  />
                </View>
              </View>

              <View style={styles.advancedRow}>
                <View style={styles.advancedInfo}>
                  <Text style={styles.advancedLabel}>Require Verified Merchant</Text>
                  <Text style={styles.advancedDesc}>Only accept receipts from registered EFD/ETR machines</Text>
                </View>
                <Switch
                  value={config.requireVerifiedMerchant}
                  onValueChange={(value) => updateConfig({ requireVerifiedMerchant: value })}
                  trackColor={{ false: '#475569', true: '#8B5CF6' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.advancedRow}>
                <View style={styles.advancedInfo}>
                  <Text style={styles.advancedLabel}>Receipt Validity Period</Text>
                  <Text style={styles.advancedDesc}>How long after purchase can a receipt be scanned</Text>
                </View>
                <View style={styles.validityPicker}>
                  {[24, 48, 72, 168].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[styles.validityOption, config.receiptValidityHours === hours && styles.validityOptionActive]}
                      onPress={() => updateConfig({ receiptValidityHours: hours })}
                    >
                      <Text style={[styles.validityText, config.receiptValidityHours === hours && styles.validityTextActive]}>
                        {hours < 48 ? `${hours}h` : `${hours / 24}d`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Preview & Test Tab */}
        {activeTab === 'preview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Entry Calculation</Text>
            <Text style={styles.sectionSubtitle}>See how entries are calculated with current settings</Text>

            <View style={styles.testPanel}>
              <View style={styles.testInput}>
                <Text style={styles.testLabel}>Receipt Amount</Text>
                <View style={styles.testAmountInput}>
                  <Text style={styles.currencyPrefix}>{country.currency}</Text>
                  <TextInput
                    style={styles.testAmountValue}
                    placeholder="125000"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={testAmount}
                    onChangeText={setTestAmount}
                  />
                </View>
              </View>

              {testResult && (
                <View style={styles.testResult}>
                  <View style={styles.testResultHeader}>
                    <Text style={styles.testResultTitle}>Result</Text>
                    <View style={styles.testResultEntries}>
                      <Text style={styles.testResultNumber}>{testResult.finalEntries}</Text>
                      <Text style={styles.testResultLabel}>entries</Text>
                    </View>
                  </View>

                  <View style={styles.testBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Method</Text>
                      <Text style={styles.breakdownValue}>{ENTRY_METHODS[config.entryMethod].name}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Base Entries</Text>
                      <Text style={styles.breakdownValue}>{testResult.baseEntries}</Text>
                    </View>
                    {config.entryMethod === 'vat' && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>VAT Amount</Text>
                        <Text style={styles.breakdownValue}>{formatCurrency(testResult.vatAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Multiplier</Text>
                      <Text style={styles.breakdownValue}>{testResult.multiplier}x</Text>
                    </View>
                    {testResult.appliedBonuses.length > 0 && (
                      <View style={styles.breakdownBonuses}>
                        <Text style={styles.breakdownLabel}>Applied Bonuses:</Text>
                        {testResult.appliedBonuses.map((bonus: string, i: number) => (
                          <View key={i} style={styles.bonusBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.bonusBadgeText}>{bonus}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              <Text style={styles.testNote}>
                * Test includes: First scan of day, weekend, healthcare category, 7-day streak
              </Text>
            </View>

            <View style={styles.configSummary}>
              <Text style={styles.summaryTitle}>Configuration Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Ionicons name="ticket" size={20} color="#8B5CF6" />
                  <Text style={styles.summaryLabel}>Method</Text>
                  <Text style={styles.summaryValue}>{ENTRY_METHODS[config.entryMethod].name}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="gift" size={20} color="#F59E0B" />
                  <Text style={styles.summaryLabel}>Bonuses</Text>
                  <Text style={styles.summaryValue}>{config.bonusesEnabled ? 'Enabled' : 'Disabled'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={styles.summaryLabel}>Caps</Text>
                  <Text style={styles.summaryValue}>{config.capsEnabled ? `${config.maxEntriesPerReceipt}/receipt` : 'None'}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="cash" size={20} color="#3B82F6" />
                  <Text style={styles.summaryLabel}>Min Amount</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(config.minimumReceiptAmount)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Modal */}
      <Modal visible={showSaveModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Draw Configuration</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              <Text style={styles.modalMessage}>
                Draw configuration saved successfully!
              </Text>
              <Text style={styles.modalDetails}>
                {config.name || 'Untitled Draw'} • {country.flag} {country.name}
              </Text>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowSaveModal(false)}>
              <Text style={styles.modalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(10, 10, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryName: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 60, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#8B5CF6',
  },
  
  // Content
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  masterToggleLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  
  // Forms
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#fff',
  },
  hint: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  
  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  
  // Country Selector
  countrySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  countryOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  countryOptionFlag: {
    fontSize: 24,
  },
  countryOptionName: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  countryOptionNameActive: {
    color: '#fff',
  },
  countryOptionCurrency: {
    fontSize: 12,
    color: '#64748B',
  },
  
  // Prize Pool
  prizePoolInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  prizePoolValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    paddingVertical: 14,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickAmount: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  quickAmountActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  quickAmountText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  
  // Method Grid
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  methodCard: {
    width: isWeb ? 'calc(25% - 12px)' as any : '100%',
    minWidth: 200,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  methodCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  methodIconActive: {
    backgroundColor: '#8B5CF6',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  methodNameActive: {
    color: '#fff',
  },
  methodDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  methodCheck: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  
  // Method Settings
  methodSettings: {
    marginTop: 8,
  },
  settingCard: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  numberBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
  },
  exampleBox: {
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
  },
  vatRate: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 16,
  },
  
  // Tiers
  tiersContainer: {
    marginTop: 8,
  },
  tierHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 12,
  },
  tierHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tierRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierInput: {
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    minWidth: 80,
    textAlign: 'center',
  },
  tierDash: {
    fontSize: 16,
    color: '#64748B',
  },
  tierUnlimited: {
    fontSize: 20,
    color: '#8B5CF6',
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
  },
  tierRemove: {
    padding: 8,
  },
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addTierText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  
  // Bonuses
  bonusGrid: {
    gap: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  bonusCard: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bonusIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusInfo: {
    flex: 1,
  },
  bonusName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  bonusDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  bonusSettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
  },
  multiplierLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  multiplierPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  multiplierOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  multiplierOptionActive: {
    backgroundColor: '#8B5CF6',
  },
  multiplierText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  multiplierTextActive: {
    color: '#fff',
  },
  categorySettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.1)',
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
  },
  categoryMultiplier: {
    flexDirection: 'row',
    gap: 4,
  },
  catMultOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  catMultOptionActive: {
    backgroundColor: '#8B5CF6',
  },
  catMultText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  catMultTextActive: {
    color: '#fff',
  },
  
  // Caps
  capsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  capCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  capTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  capDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  capInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  capBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    minWidth: 50,
    textAlign: 'center',
  },
  advancedSettings: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
  },
  advancedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.1)',
  },
  advancedInfo: {
    flex: 1,
  },
  advancedLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E2E8F0',
    marginBottom: 2,
  },
  advancedDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  advancedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySmall: {
    fontSize: 13,
    color: '#64748B',
    marginRight: 6,
  },
  advancedTextInput: {
    fontSize: 14,
    color: '#fff',
    paddingVertical: 10,
    minWidth: 80,
  },
  validityPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  validityOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  validityOptionActive: {
    backgroundColor: '#8B5CF6',
  },
  validityText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  validityTextActive: {
    color: '#fff',
  },
  
  // Test Panel
  testPanel: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  testInput: {
    marginBottom: 24,
  },
  testLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
  },
  testAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  testAmountValue: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    paddingVertical: 16,
  },
  testResult: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  testResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  testResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  testResultEntries: {
    alignItems: 'center',
  },
  testResultNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10B981',
  },
  testResultLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  testBreakdown: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  breakdownValue: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  breakdownBonuses: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  bonusBadgeText: {
    fontSize: 12,
    color: '#10B981',
  },
  testNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 16,
    fontStyle: 'italic',
  },
  
  // Config Summary
  configSummary: {
    backgroundColor: 'rgba(30, 30, 60, 0.5)',
    borderRadius: 16,
    padding: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'rgba(10, 10, 26, 0.5)',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  saveModal: {
    backgroundColor: '#0f0f1f',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalBody: {
    padding: 32,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  modalDetails: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  modalBtn: {
    margin: 20,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
