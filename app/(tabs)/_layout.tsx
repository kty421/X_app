import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0284c7', headerTitleAlign: 'left' }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'フィード',
          tabBarIcon: ({ color }) => <Feather name="rss" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="themes"
        options={{
          title: 'テーマ',
          tabBarIcon: ({ color }) => <Feather name="layers" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Feather name="settings" size={18} color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
