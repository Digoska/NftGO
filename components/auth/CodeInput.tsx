import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: string;
}

export default function CodeInput({ length = 5, onComplete, error }: CodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Handle paste - if text is longer than 1 character, it's a paste
    if (numericText.length > 1) {
      // Clear all inputs first
      const newCode = Array(length).fill('');
      
      // Fill with pasted code starting from current index
      const pastedCode = numericText.slice(0, length);
      pastedCode.split('').forEach((char, i) => {
        const targetIndex = index + i;
        if (targetIndex < length) {
          newCode[targetIndex] = char;
        }
      });
      
      setCode(newCode);
      
      // Focus the last filled input or the last input if all are filled
      const lastFilledIndex = Math.min(index + pastedCode.length - 1, length - 1);
      setTimeout(() => {
        if (lastFilledIndex < length) {
          inputRefs.current[lastFilledIndex]?.focus();
        } else {
          inputRefs.current[length - 1]?.focus();
        }
      }, 0);
      
      // If all fields are filled, call onComplete
      if (newCode.every(c => c !== '')) {
        setTimeout(() => {
          onComplete(newCode.join(''));
        }, 100);
      }
      return;
    }

    // Single character input - only take first character
    const newCode = [...code];
    newCode[index] = numericText.slice(0, 1);
    setCode(newCode);

    // Auto-focus next input
    if (numericText && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }

    // Check if all fields are filled
    if (newCode.every(c => c !== '')) {
      setTimeout(() => {
        onComplete(newCode.join(''));
      }, 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.input,
              code[index] && styles.inputFilled,
              error && styles.inputError,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={length}
            selectTextOnFocus
            contextMenuHidden={false}
          />
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.background,
  },
  inputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundLight,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

