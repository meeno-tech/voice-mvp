import { ThemedText } from 'components/ThemedText';
import { Colors } from 'constants/Colors';
import { useAuth } from 'contexts/AuthContext';
import { useColorScheme } from 'hooks/useColorScheme';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface OtpVerificationFormProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OtpVerificationForm({ email, onSuccess, onCancel }: OtpVerificationFormProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { verifyOtp } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  const handleVerify = async () => {
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await verifyOtp(email, otp);
      onSuccess();
    } catch (err) {
      console.error('OTP verification error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to verify code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Reuse the signIn.email method to resend the OTP
      await useAuth().signIn.email(email);
      
      setError(''); // Clear any existing errors
      alert('A new verification code has been sent to your email.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Verify Your Email</ThemedText>
      
      <ThemedText style={styles.description}>
        We've sent a verification code to {email}. Please enter it below.
      </ThemedText>
      
      <TextInput
        style={[
          styles.input, 
          { 
            color: Colors[theme].text,
            backgroundColor: Colors[theme].surfaceElement,
            borderColor: Colors[theme].border
          }
        ]}
        placeholder="Verification Code"
        placeholderTextColor={Colors[theme].tabIconDefault}
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        editable={!loading}
        maxLength={6}
      />
      
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: Colors[theme].tint },
          loading && styles.buttonDisabled,
        ]}
        onPress={handleVerify}
        disabled={loading}>
        <ThemedText style={styles.buttonText} lightColor="#FFFFFF" darkColor="#FFFFFF">
          {loading ? 'Verifying...' : 'Verify Code'}
        </ThemedText>
        {loading && <ActivityIndicator color="#FFFFFF" style={styles.spinner} />}
      </TouchableOpacity>
      
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleResend}
          style={styles.textButton}
          disabled={loading}>
          <ThemedText style={[styles.textButtonText, loading && styles.textDisabled]}>
            Resend Code
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onCancel}
          style={styles.textButton}
          disabled={loading}>
          <ThemedText style={[styles.textButtonText, loading && styles.textDisabled]}>
            Back
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  error: {
    color: '#ff3b30',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  spinner: {
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  textButton: {
    padding: 8,
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textDisabled: {
    opacity: 0.5,
  },
}); 