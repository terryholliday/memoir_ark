import React from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';

export function Button(
  props: PressableProps & {
    title: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }
) {
  const variant = props.variant ?? 'primary';

  const base = 'px-4 py-3 rounded-lg items-center justify-center';
  const styles =
    variant === 'primary'
      ? 'bg-white'
      : variant === 'secondary'
        ? 'bg-white/10 border border-white/20'
        : 'bg-red-600';

  const textColor = variant === 'primary' ? 'text-black' : 'text-white';

  return (
    <Pressable
      {...props}
      className={`${base} ${styles} ${props.className ?? ''}`}
      accessibilityRole="button"
    >
      <Text className={`font-semibold ${textColor}`}>{props.title}</Text>
    </Pressable>
  );
}
