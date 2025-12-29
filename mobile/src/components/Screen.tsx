import React from 'react';
import { View, type ViewProps } from 'react-native';

export function Screen(props: ViewProps) {
  return <View {...props} className={`flex-1 bg-black ${props.className ?? ''}`} />;
}
