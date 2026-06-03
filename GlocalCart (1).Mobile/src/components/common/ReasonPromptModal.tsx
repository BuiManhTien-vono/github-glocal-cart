import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, borderRadius, shadow } from '../../theme/colors';

type ReasonPromptModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  errorText?: string;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
};

export default function ReasonPromptModal({
  visible,
  title,
  message,
  placeholder = 'Nhập lý do',
  confirmText = 'Xác nhận',
  errorText = 'Lý do không được để trống.',
  onCancel,
  onSubmit,
}: ReasonPromptModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setReason('');
      setError('');
    }
  }, [visible]);

  const submit = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(errorText);
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <TextInput
            value={reason}
            onChangeText={(value) => {
              setReason(value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            autoFocus={Platform.OS !== 'web'}
            textAlignVertical="top"
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={submit}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadow.md,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  message: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.md,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 8, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: spacing.lg },
  cancelBtn: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  confirmBtn: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: colors.white, fontWeight: '800' },
});
