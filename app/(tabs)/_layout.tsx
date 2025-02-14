import { AuthButton } from 'components/auth/AuthButton';
import { HapticTab } from 'components/HapticTab';
import { IconSymbol } from 'components/ui/IconSymbol';
import TabBarBackground from 'components/ui/TabBarBackground';
import { Colors } from 'constants/Colors';
import { useBottomTabOverflow } from 'hooks/useBottomTabOverflow';
import { useColorScheme } from 'hooks/useColorScheme';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';

type IconName = React.ComponentProps<typeof IconSymbol>['name'];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const bottomOverflow = useBottomTabOverflow();

  const renderTabIcon = (iconName: IconName, color: string, focused: boolean) => (
    <View style={{ alignItems: 'center' }}>
      <IconSymbol size={Platform.select({ web: 24, default: 28 })} name={iconName} color={color} />
      {focused && (
        <View
          style={{
            position: 'absolute',
            bottom: Platform.select({ web: -25, default: -8 }),
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors[theme].tint,
          }}
        />
      )}
    </View>
  );

  return (
    <>
      <AuthButton />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[theme].tint,
          tabBarInactiveTintColor: Colors[theme].tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: () => <TabBarBackground />,
          tabBarStyle: {
            position: 'absolute',
            height: bottomOverflow,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            ...Platform.select({
              web: {
                height: 70,
              },
            }),
          },
          tabBarItemStyle: {
            paddingBottom: Platform.select({ web: 6, default: 12 }),
            flex: 1,
          },
          tabBarLabelStyle: {
            ...Platform.select({
              web: {
                fontSize: 13,
                fontWeight: '500',
                paddingTop: 4,
                marginTop: -4,
              },
              ios: {
                fontSize: 12,
                fontWeight: '500',
              },
              default: {
                fontSize: 12,
                fontWeight: '500',
              },
            }),
          },
          tabBarIconStyle: {
            marginTop: Platform.select({
              web: 0,
              ios: 0,
              default: 4,
            }),
          },
          tabBarActiveBackgroundColor: 'transparent',
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Scenery',
            tabBarIcon: ({ color, focused }) => renderTabIcon('house.fill', color, focused),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Share',
            tabBarIcon: ({ color, focused }) => renderTabIcon('paperplane.fill', color, focused),
          }}
        />
        <Tabs.Screen
          name="(learn)"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) =>
              renderTabIcon('person.crop.circle.fill', color, focused),
          }}
        />
        <Tabs.Screen
          name="[room]"
          options={{
            href: null, // Hide from tab bar
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
}
