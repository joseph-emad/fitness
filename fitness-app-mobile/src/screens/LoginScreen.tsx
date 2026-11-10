import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';

export function LoginScreen() {
  const { signIn, isBusy, message, clearMessage } = useAuth();

  const startSignIn = (register: boolean) => {
    clearMessage();
    void signIn(register);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>Pulse<Text style={styles.dot}>.</Text></Text>
        <Text style={styles.eyebrow}>TRAINING, WITH INTENTION</Text>
        <Text style={styles.title}>Your effort deserves a record.</Text>
        <Text style={styles.description}>
          Keep your sessions together and make every workout part of a bigger picture.
        </Text>
        {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => startSignIn(false)}
          style={[styles.button, isBusy && styles.disabled]}
        >
          {isBusy ? <ActivityIndicator color="#111813" /> : <Text style={styles.buttonText}>Log in</Text>}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={() => startSignIn(true)}
          style={[styles.secondaryButton, isBusy && styles.disabled]}
        >
          <Text style={styles.secondaryButtonText}>Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111813', justifyContent: 'center', padding: 24 },
  content: { gap: 18, maxWidth: 440, width: '100%', alignSelf: 'center' },
  brand: { color: '#f5f6ef', fontSize: 34, fontWeight: '800' },
  dot: { color: '#cbff67' },
  eyebrow: { color: '#cbff67', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#f5f6ef', fontSize: 38, fontWeight: '800', lineHeight: 44 },
  description: { color: '#c4cbc0', fontSize: 16, lineHeight: 24 },
  error: { color: '#ffc0b8', fontSize: 14, lineHeight: 21 },
  button: { backgroundColor: '#cbff67', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#111813', fontWeight: '800', fontSize: 16 },
  secondaryButton: { borderColor: '#677367', borderWidth: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#f5f6ef', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
