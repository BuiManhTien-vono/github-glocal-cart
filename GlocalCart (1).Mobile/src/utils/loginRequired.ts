import { Alert } from 'react-native';

const DEFAULT_LOGIN_MESSAGE = 'Bạn cần đăng nhập để tiếp tục sử dụng tính năng này.';

export function showLoginRequired(onLogin: () => void, message = DEFAULT_LOGIN_MESSAGE) {
  Alert.alert('Yêu cầu đăng nhập', message, [
    { text: 'Để sau', style: 'cancel' },
    { text: 'Đăng nhập', onPress: onLogin },
  ]);
}
