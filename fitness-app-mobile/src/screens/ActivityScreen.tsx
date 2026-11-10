import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { getUserId } from '../auth/claims';
import { ApiError } from '../api/client';
import { getProfileDestination } from '../domain/profileFlow';
import { ActivityEntryForm } from './ActivityEntryForm';
import { ProfileScreen } from './ProfileScreen';
import { Activity, UserProfile } from '../types';

const activityNames: Record<string, string> = {
  RUNNING: 'Running',
  WALKING: 'Walking',
  CYCLING: 'Cycling',
  SWIMMING: 'Swimming',
  WEIGHT_TRAINING: 'Weight training',
  YOGA: 'Yoga',
  HIIT: 'HIIT',
  CARDIO: 'Cardio',
  STRETCHING: 'Stretching',
  OTHER: 'Other',
};

export function ActivityScreen() {
  const { api, tokens, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [isChoosingRole, setIsChoosingRole] = useState(false);
  const choosingRole = useRef(false);

  const loadProfile = useCallback(async () => {
    if (!tokens) {
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    try {
      setProfile(await api.getProfile(getUserId(tokens.idToken)));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not load your profile.');
    } finally {
      setProfileLoading(false);
    }
  }, [api, tokens]);

  const loadActivities = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      setActivities(await api.getActivities());
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Could not load activities.');
    } finally {
      setHistoryLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.roleChosen) {
      void loadActivities();
    }
  }, [loadActivities, profile?.roleChosen]);

  const chooseRole = async (role: 'USER' | 'COACH') => {
    if (choosingRole.current) {
      return;
    }
    choosingRole.current = true;
    setIsChoosingRole(true);
    setProfileError('');
    try {
      setProfile(await api.chooseRole(role));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await loadProfile();
      } else {
        setProfileError(error instanceof Error ? error.message : 'Could not save your choice.');
      }
    } finally {
      choosingRole.current = false;
      setIsChoosingRole(false);
    }
  };

  if (profileLoading) {
    return <ProfileScreen mode="loading" />;
  }
  if (profileError && !profile) {
    return <ProfileScreen mode="error" error={profileError} onRetry={() => void loadProfile()} />;
  }
  if (!profile) {
    return <ProfileScreen mode="error" error="Your profile was not returned by the server." onRetry={() => void loadProfile()} />;
  }
  if (getProfileDestination(profile) === 'roleSelection') {
    return (
      <ScrollView contentContainerStyle={styles.centeredPage}>
        <Text style={styles.brand}>Pulse<Text style={styles.brandDot}>.</Text></Text>
        <Text style={styles.eyebrow}>WELCOME TO PULSE</Text>
        <Text style={styles.title}>How will you use Pulse?</Text>
        <Text style={styles.body}>
          This choice is permanent. Trainees can keep an activity log and send training requests to coaches. Coaches can review activities shared by trainees.
        </Text>
        {profileError ? <Text accessibilityRole="alert" style={styles.error}>{profileError}</Text> : null}
        <Pressable accessibilityRole="button" disabled={isChoosingRole} onPress={() => void chooseRole('USER')} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{isChoosingRole ? 'Saving...' : "I'm a trainee"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={isChoosingRole} onPress={() => void chooseRole('COACH')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{isChoosingRole ? 'Saving...' : "I'm a coach"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.signOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Pulse<Text style={styles.brandDot}>.</Text></Text>
          <Text style={styles.eyebrow}>YOUR MOVEMENT, MEASURED</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>Training log</Text>
      <Text style={styles.body}>
        {profile.firstName ? `Welcome, ${profile.firstName}. ` : ''}Build consistency, one session at a time.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.sectionLabel}>MAKE IT COUNT</Text>
        <Text style={styles.sectionTitle}>Log a session</Text>
        <ActivityEntryForm onSaved={loadActivities} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionLabel}>YOUR RECENT WORK</Text>
        <Text style={styles.sectionTitle}>Activity history</Text>
        {historyLoading ? <ActivityIndicator color="#cbff67" /> : null}
        {historyError ? (
          <View style={styles.errorBlock}>
            <Text accessibilityRole="alert" style={styles.error}>{historyError}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadActivities()} style={styles.retryButton}>
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
        {!historyLoading && !historyError && activities.length === 0 ? (
          <Text style={styles.body}>No activities yet. Log your first session above.</Text>
        ) : null}
        {activities.map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <Text style={styles.activityType}>{activityNames[activity.type] ?? activity.type}</Text>
            <Text style={styles.metric}>Duration: {activity.duration} min</Text>
            <Text style={styles.metric}>Calories: {activity.caloriesBurned}</Text>
            {activity.exercises?.length ? (
              <Text style={styles.metric}>{activity.exercises.length} exercise{activity.exercises.length === 1 ? '' : 's'}</Text>
            ) : null}
            {activity.createdAt ? (
              <Text style={styles.date}>{new Date(activity.createdAt).toLocaleString()}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#111813', padding: 20, paddingTop: 56, paddingBottom: 44, gap: 18 },
  centeredPage: { flexGrow: 1, backgroundColor: '#111813', justifyContent: 'center', padding: 28, gap: 17 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#f5f6ef', fontSize: 26, fontWeight: '800' },
  brandDot: { color: '#cbff67' },
  eyebrow: { color: '#cbff67', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 4 },
  title: { color: '#f5f6ef', fontSize: 34, lineHeight: 40, fontWeight: '800', marginTop: 4 },
  body: { color: '#c4cbc0', fontSize: 15, lineHeight: 22 },
  panel: { backgroundColor: '#151e18', borderColor: '#344033', borderWidth: 1, borderRadius: 16, padding: 16, gap: 12, marginTop: 4 },
  sectionLabel: { color: '#cbff67', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  sectionTitle: { color: '#f5f6ef', fontSize: 21, fontWeight: '800', marginBottom: 2 },
  signOutButton: { borderColor: '#596656', borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9 },
  signOutText: { color: '#f5f6ef', fontWeight: '700', fontSize: 13 },
  primaryButton: { backgroundColor: '#cbff67', borderRadius: 11, padding: 15, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#111813', fontWeight: '800', fontSize: 15 },
  secondaryButton: { borderColor: '#748171', borderWidth: 1, borderRadius: 11, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#f5f6ef', fontWeight: '700' },
  signOut: { alignItems: 'center', padding: 12 },
  error: { color: '#ffc0b8', lineHeight: 20 },
  errorBlock: { gap: 10 },
  retryButton: { borderColor: '#748171', borderWidth: 1, borderRadius: 10, padding: 11, alignItems: 'center', alignSelf: 'flex-start', minWidth: 100 },
  activityCard: { backgroundColor: '#1b251e', borderColor: '#384539', borderWidth: 1, borderRadius: 12, padding: 14, gap: 5 },
  activityType: { color: '#cbff67', fontWeight: '800', fontSize: 16 },
  metric: { color: '#dce2d7', fontSize: 14 },
  date: { color: '#9da89b', fontSize: 12, marginTop: 3 },
});
