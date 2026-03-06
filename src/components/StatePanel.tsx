import { Pressable, StyleSheet, Text, View } from 'react-native';

interface StatePanelProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'info' | 'warning' | 'error';
}

export const StatePanel = ({
  title,
  description,
  actionLabel,
  onAction,
  tone = 'info',
}: StatePanelProps) => (
  <View style={[styles.container, tone === 'error' && styles.error, tone === 'warning' && styles.warning]}>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
    {actionLabel && onAction ? (
      <Pressable style={styles.button} onPress={onAction}>
        <Text style={styles.buttonLabel}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    gap: 8,
  },
  warning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  title: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  description: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});

