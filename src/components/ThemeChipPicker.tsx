import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';

import { type ThemeSet } from '@/src/domain/theme';

interface ThemeChipPickerProps {
  themes: ThemeSet[];
  currentThemeId: string;
  onSelectTheme: (id: string) => void;
}

export const ThemeChipPicker = ({
  themes,
  currentThemeId,
  onSelectTheme,
}: ThemeChipPickerProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
    {themes.map((theme) => {
      const selected = theme.id === currentThemeId;

      return (
        <Pressable
          key={theme.id}
          onPress={() => onSelectTheme(theme.id)}
          style={[styles.chip, selected && styles.selectedChip]}
        >
          <Text style={[styles.label, selected && styles.selectedLabel]}>{theme.name}</Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    paddingRight: 12,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  selectedChip: {
    borderColor: '#0ea5e9',
    backgroundColor: '#e0f2fe',
  },
  label: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedLabel: {
    color: '#0369a1',
  },
});

