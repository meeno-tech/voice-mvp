import { Stack } from 'expo-router';

function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen
        name="[room]"
        options={{
          title: 'Meeno Scene',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default HomeLayout;
