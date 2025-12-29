import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="rgba(255,255,255,0.4)"
      className={`bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white ${props.className ?? ''}`}
    />
  );
}
