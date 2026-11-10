import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

function AppNavigation() {
  const { tokens, isLoading } = useAuth();

  if (isLoading) {
    return <ProfileScreen mode="loading" />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator key={tokens ? 'authenticated' : 'anonymous'} screenOptions={{ headerShown: false }}>
        {tokens ? (
          <Stack.Screen name="Home" component={ActivityScreen} />
        ) : (
          <Stack.Screen name="SignIn" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}
