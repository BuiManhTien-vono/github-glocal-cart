import React from 'react';
import { View, Text } from 'react-native';

export const MapView = ({ style, children }: any) => (
  <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' }]}>
    <Text style={{ color: '#666', fontWeight: 'bold' }}>Bản đồ không hỗ trợ trên trình duyệt Web</Text>
    {children}
  </View>
);

export const Marker = ({ title, description }: any) => null;
