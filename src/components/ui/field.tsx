import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '@/lib/theme';

import { KText } from './text';

const webInputOutline =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : undefined;

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  prefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: TextInputProps['style'];
}

export function Field({
  label,
  error,
  helper,
  prefix,
  containerStyle,
  inputStyle,
  editable = true,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <KText variant="small" color={colors.textSecondary} style={styles.label}>
          {label}
        </KText>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
          error ? styles.inputContainerError : null,
          !editable ? styles.inputContainerDisabled : null,
        ]}>
        {prefix ? (
          <KText variant="subtitle" color={colors.textSecondary} style={styles.prefix}>
            {prefix}
          </KText>
        ) : null}
        <TextInput
          {...rest}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          style={[
            styles.input,
            prefix ? styles.inputWithPrefix : null,
            webInputOutline,
            inputStyle,
          ]}
        />
      </View>
      {error ? (
        <KText variant="small" color={colors.red} style={styles.message}>
          {error}
        </KText>
      ) : helper ? (
        <KText variant="small" color={colors.textMuted} style={styles.message}>
          {helper}
        </KText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textTransform: 'none',
    color: colors.textSecondary,
  },
  inputContainer: {
    minHeight: 52,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: colors.accent,
  },
  inputContainerError: {
    borderColor: colors.red,
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  prefix: {
    fontSize: 15,
    lineHeight: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    minHeight: 50,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 12,
  },
  inputWithPrefix: {
    paddingLeft: 0,
  },
  message: {
    fontSize: 11,
    lineHeight: 15,
  },
});
