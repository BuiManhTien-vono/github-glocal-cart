import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, fontSize, shadow, spacing } from '../../theme/colors';

type AppAlertButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: (value?: string) => void;
};

type AppAlertRequest = {
  id: number;
  title?: string;
  message?: string;
  buttons?: AppAlertButton[];
  cancelable?: boolean;
  type?: 'alert' | 'prompt';
  defaultValue?: string;
  placeholder?: string;
};

type AppAlertContextValue = {
  showAlert: (request: Omit<AppAlertRequest, 'id' | 'type'>) => void;
  showPrompt: (request: Omit<AppAlertRequest, 'id' | 'type'>) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

let alertHandler: AppAlertContextValue['showAlert'] | null = null;
let promptHandler: AppAlertContextValue['showPrompt'] | null = null;
const nativeAlert = Alert.alert.bind(Alert);
const nativePrompt = (Alert as any).prompt?.bind(Alert);

const normalizeButtons = (buttons?: AppAlertButton[]) =>
  buttons?.length ? buttons : [{ text: 'OK' }];

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<AppAlertRequest[]>([]);
  const current = queue[0];
  const [promptValue, setPromptValue] = useState('');

  const enqueue = useCallback((request: Omit<AppAlertRequest, 'id'>) => {
    setQueue((items) => [
      ...items,
      {
        ...request,
        id: Date.now() + Math.random(),
        buttons: normalizeButtons(request.buttons),
      },
    ]);
  }, []);

  const showAlert = useCallback<AppAlertContextValue['showAlert']>(
    (request) => enqueue({ ...request, type: 'alert' }),
    [enqueue]
  );

  const showPrompt = useCallback<AppAlertContextValue['showPrompt']>(
    (request) => enqueue({ ...request, type: 'prompt' }),
    [enqueue]
  );

  const contextValue = useMemo(() => ({ showAlert, showPrompt }), [showAlert, showPrompt]);

  useEffect(() => {
    alertHandler = showAlert;
    promptHandler = showPrompt;

    Alert.alert = ((title?: string, message?: string, buttons?: AppAlertButton[], options?: { cancelable?: boolean }) => {
      if (!alertHandler) {
        nativeAlert(title ?? '', message, buttons as any, options);
        return;
      }
      alertHandler({ title, message, buttons, cancelable: options?.cancelable });
    }) as typeof Alert.alert;

    (Alert as any).prompt = (
      title?: string,
      message?: string,
      callbackOrButtons?: ((text: string) => void) | AppAlertButton[],
      _type?: string,
      defaultValue?: string
    ) => {
      const buttons =
        typeof callbackOrButtons === 'function'
          ? [{ text: 'OK', onPress: (value?: string) => callbackOrButtons(value ?? '') }]
          : callbackOrButtons;

      if (!promptHandler) {
        nativePrompt?.(title, message, callbackOrButtons, _type, defaultValue);
        return;
      }

      promptHandler({ title, message, buttons, defaultValue });
    };

    const originalWindowAlert =
      typeof window !== 'undefined' ? window.alert?.bind(window) : undefined;

    if (typeof window !== 'undefined') {
      window.alert = (message?: any) => {
        if (!alertHandler) {
          originalWindowAlert?.(message);
          return;
        }
        alertHandler({ title: 'Thong bao', message: String(message ?? '') });
      };
    }

    return () => {
      alertHandler = null;
      promptHandler = null;
      Alert.alert = nativeAlert as typeof Alert.alert;
      if (nativePrompt) (Alert as any).prompt = nativePrompt;
      if (typeof window !== 'undefined' && originalWindowAlert) {
        window.alert = originalWindowAlert;
      }
    };
  }, [showAlert, showPrompt]);

  useEffect(() => {
    setPromptValue(current?.defaultValue ?? '');
  }, [current?.id, current?.defaultValue]);

  const closeCurrent = useCallback(() => {
    setQueue((items) => items.slice(1));
  }, []);

  const handlePress = (button: AppAlertButton) => {
    closeCurrent();
    button.onPress?.(current?.type === 'prompt' ? promptValue : undefined);
  };

  const canDismiss = current?.cancelable !== false;

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}
      <Modal transparent visible={Boolean(current)} animationType="fade" onRequestClose={canDismiss ? closeCurrent : undefined}>
        <Pressable style={styles.backdrop} onPress={canDismiss ? closeCurrent : undefined}>
          <Pressable style={styles.dialog}>
            {!!current?.title && <Text style={styles.title}>{current.title}</Text>}
            {!!current?.message && <Text style={styles.message}>{current.message}</Text>}
            {current?.type === 'prompt' && (
              <TextInput
                value={promptValue}
                onChangeText={setPromptValue}
                placeholder={current.placeholder}
                placeholderTextColor={colors.textMuted}
                autoFocus
                style={styles.input}
              />
            )}
            <View style={styles.actions}>
              {current?.buttons?.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={`${button.text ?? 'button'}-${index}`}
                    activeOpacity={0.85}
                    style={[styles.button, isCancel && styles.cancelButton, isDestructive && styles.destructiveButton]}
                    onPress={() => handlePress(button)}
                  >
                    <Text
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.82}
                      style={[styles.buttonText, isCancel && styles.cancelText, isDestructive && styles.destructiveText]}
                    >
                      {button.text ?? 'OK'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used inside AppAlertProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    ...shadow.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  input: {
    marginTop: spacing.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    backgroundColor: colors.white,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 118,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.borderLight,
  },
  destructiveButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  cancelText: {
    color: colors.text,
  },
  destructiveText: {
    color: colors.white,
  },
});
