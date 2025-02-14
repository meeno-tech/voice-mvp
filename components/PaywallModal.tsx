import { ThemedText } from 'components/ThemedText';
import { ThemedView } from 'components/ThemedView';
import { IconSymbol } from 'components/ui/IconSymbol';
import { Colors } from 'constants/Colors';
import { supabase } from 'utils/supabase';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MOBILE_PADDING = 12;
const CARD_SPACING = 8;

interface Plan {
  id: string;
  name: string;
  price: string;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
}

interface PaywallModalProps {
  onContinue: () => void;
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$0.99',
    interval: 'month',
    features: ['Access to all basic lessons', 'Practice with AI', 'Weekly challenges'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    interval: 'month',
    features: [
      'Everything in Basic',
      'Advanced conversation practice',
      'Personalized feedback',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$49.99',
    interval: 'year',
    features: [
      'Everything in Pro',
      'Lifetime access',
      '1-on-1 coaching session',
      'Early access to new features',
    ],
  },
];

export function PaywallModal({ onContinue }: PaywallModalProps) {
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePlanSelect = async () => {
    alert('During our beta period, all features are free! Enjoy!');
    onContinue();
  };

  const handleDecline = () => {
    setShowEmailForm(true);
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    setError('');
    onContinue();

    try {
      const { error: dbError } = await supabase
        .from('waitlist')
        .insert([{ email, created_at: new Date().toISOString() }]);

      if (dbError) throw dbError;

      onContinue();
    } catch {
      setError('Failed to save email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PlanCard = ({ plan }: { plan: Plan }) => (
    <ThemedView style={[styles.planCard, plan.popular && styles.popularCard]}>
      {plan.popular && (
        <View style={styles.popularBadge}>
          <ThemedText style={styles.popularBadgeText} lightColor="#FFFFFF" darkColor="#FFFFFF">
            Popular
          </ThemedText>
        </View>
      )}

      <View style={styles.planHeader}>
        <ThemedText type="subtitle" style={styles.planName}>
          {plan.name}
        </ThemedText>
        <View style={styles.priceContainer}>
          <ThemedText style={styles.price}>{plan.price}</ThemedText>
          <ThemedText style={styles.interval}>/{plan.interval}</ThemedText>
        </View>
      </View>

      <View style={styles.featureList}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.light.success} />
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <ThemedText style={{ marginRight: 4, opacity: 0.6 }}>•</ThemedText>
              <ThemedText style={styles.featureText}>{feature}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.selectButton, plan.popular && styles.popularButton]}
        onPress={() => handlePlanSelect()}>
        <ThemedText
          style={styles.selectButtonText}
          lightColor={plan.popular ? '#FFFFFF' : undefined}
          darkColor={plan.popular ? '#FFFFFF' : undefined}>
          Select Plan
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );

  if (showEmailForm) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
        <ThemedView style={styles.emailFormContainer}>
          <ThemedText type="subtitle" style={styles.emailFormTitle}>
            Stay Updated
          </ThemedText>

          <ThemedText style={styles.emailFormSubtitle}>
            Join our waitlist to get notified when we launch new features!
          </ThemedText>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            style={styles.emailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSubmitting}
          />

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleEmailSubmit}
            disabled={isSubmitting}>
            <ThemedText style={styles.submitButtonText} lightColor="#FFFFFF" darkColor="#FFFFFF">
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </ThemedText>
            {isSubmitting && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.modalOverlay}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Choose Your Plan
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Unlock all features and start your journey
            </ThemedText>
          </View>

          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </View>

          <TouchableOpacity onPress={handleDecline} style={styles.declineButton}>
            <ThemedText style={styles.declineButtonText}>Continue with limited access</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scrollView: {
    width: '100%',
    maxHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 72, // Added padding for tabbar
  },
  container: {
    margin: MOBILE_PADDING,
    padding: MOBILE_PADDING,
    borderRadius: 12,
    maxWidth: Platform.OS === 'web' ? 960 : SCREEN_WIDTH - MOBILE_PADDING / 2,
    width: '95%', // Make the container wider
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  plansContainer: {
    gap: CARD_SPACING,
    marginBottom: 12,
  },
  planCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  popularCard: {
    borderColor: Colors.light.tint,
    borderWidth: 2,
    transform: [{ scale: 1.01 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  interval: {
    fontSize: 13,
    opacity: 0.6,
  },
  featureList: {
    gap: 4,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
    paddingLeft: 4,
  },
  selectButton: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  popularButton: {
    backgroundColor: Colors.light.tint,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  declineButtonText: {
    fontSize: 13,
    opacity: 0.6,
  },
  emailFormContainer: {
    width: '90%',
    maxWidth: 360,
    padding: 16,
    borderRadius: 12,
  },
  emailFormTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  emailFormSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 12,
    fontSize: 13,
  },
  emailInput: {
    width: '100%',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 10,
    fontSize: 14,
  },
  errorText: {
    color: Colors.light.error,
    marginBottom: 10,
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: Colors.light.tint,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spinner: {
    marginLeft: 6,
  },
});

export default PaywallModal;
