import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';

interface ProfileScreenProps {
  mode: 'loading' | 'error';
  onRetry?: () => void;
  error?: string;
}

export function ProfileScreen({ mode, onRetry, error }: ProfileScreenProps) {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Pulse<Text style={styles.dot}>.</Text></Text>
      {mode === 'loading' ? (
        <>
          <ActivityIndicator size="large" color="#cbff67" />
          <Text style={styles.body}>Loading your profile...</Text>
        </>
      ) : (
        <>
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111813',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 28,
  },
  brand: { color: '#f5f6ef', fontSize: 34, fontWeight: '800' },
  dot: { color: '#cbff67' },
  body: { color: '#d8ddd2', fontSize: 16 },
  error: { color: '#ffc0b8', fontSize: 16, textAlign: 'center' },
  button: { backgroundColor: '#cbff67', borderRadius: 12, padding: 15, minWidth: 180, alignItems: 'center' },
  buttonText: { color: '#111813', fontWeight: '700' },
  secondaryButton: { borderColor: '#667166', borderWidth: 1, borderRadius: 12, padding: 14, minWidth: 180, alignItems: 'center' },
  secondaryButtonText: { color: '#f5f6ef', fontWeight: '700' },
});
