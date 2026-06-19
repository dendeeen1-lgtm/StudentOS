import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Colors, FontSize, FontWeight, SessionState, AttendanceStatus } from '../../constants';
import { Button, Card, Badge, Avatar, SectionHeader, Divider, LoadingOverlay } from '../../components/common';
import { FadeInView, PulseView, SlideUpSheet } from '../../components/animations';
import { useSession, useRoster, usePendingExcused } from '../../hooks/useSession';
import { startSession, pauseSession, resumeSession, endSession, createSession } from '../../services/session.service';
import { autoMarkAbsent } from '../../services/attendance.service';
import { approveExcusedRequest, denyExcusedRequest } from '../../services/excused.service';
import { QRType } from '../../constants';

// ─── Adviser Home ─────────────────────────────────────────────────────────────
export const AdviserHomeScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const { session } = useSession(profile?.sectionId);
  const { roster } = useRoster(session?.id);
  const { requests } = usePendingExcused(profile?.sectionId);

  const presentCount = roster.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const lateCount = roster.filter((r) => r.status === AttendanceStatus.LATE).length;
  const absentCount = roster.filter((r) => r.status === AttendanceStatus.ABSENT).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{profile?.fullName?.split(' ')[0] ?? 'Adviser'}</Text>
          </View>
          <Avatar name={profile?.fullName ?? 'A'} size={44} />
        </FadeInView>

        {session ? (
          <FadeInView delay={100}>
            <Card style={[styles.sessionCard, session.state === SessionState.ACTIVE && styles.sessionActive]}>
              <View style={styles.sessionRow}>
                <PulseView color={session.state === SessionState.ACTIVE ? Colors.present : Colors.late} size={8} />
                <Text style={styles.sessionName}>{session.name}</Text>
                <Badge status={session.state === SessionState.ACTIVE ? 'present' : 'pending'} />
              </View>
              <View style={styles.statsRow}>
                {[
                  { label: 'Present', count: presentCount, color: Colors.present },
                  { label: 'Late', count: lateCount, color: Colors.late },
                  { label: 'Absent', count: absentCount, color: Colors.absent },
                ].map(({ label, count, color }) => (
                  <View key={label} style={styles.statItem}>
                    <Text style={[styles.statCount, { color }]}>{count}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                ))}
              </View>
              <Button label="Open session manager" onPress={() => navigation.navigate('SessionManager')} size="sm" variant="secondary" />
            </Card>
          </FadeInView>
        ) : (
          <FadeInView delay={100}>
            <Card style={styles.noSessionCard}>
              <Text style={styles.noSessionText}>No active session</Text>
              <Button label="Start new session" onPress={() => navigation.navigate('SessionManager')} size="sm" />
            </Card>
          </FadeInView>
        )}

        {requests.length > 0 && (
          <FadeInView delay={200}>
            <SectionHeader title={`Excused requests (${requests.length})`} />
            {requests.slice(0, 2).map((req) => (
              <Card key={req.id} onPress={() => navigation.navigate('ExcusedReview', { request: req })}>
                <View style={styles.reqRow}>
                  <Avatar name={req.studentName} size={36} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.reqName}>{req.studentName}</Text>
                    <Text style={styles.reqSub} numberOfLines={1}>{req.explanation}</Text>
                  </View>
                  <Badge status="pending" />
                </View>
              </Card>
            ))}
          </FadeInView>
        )}

        <FadeInView delay={300}>
          <SectionHeader title="Quick actions" />
          <View style={styles.actionsRow}>
            {[
              { label: 'Live roster', screen: 'LiveRoster' },
              { label: 'Excused requests', screen: 'ExcusedReview' },
              { label: 'Reports', screen: 'Reports' },
            ].map(({ label, screen }) => (
              <Card key={screen} onPress={() => navigation.navigate(screen)} style={styles.actionCard}>
                <Text style={styles.actionLabel}>{label}</Text>
              </Card>
            ))}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Session Manager ──────────────────────────────────────────────────────────
export const SessionManagerScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const { session, loading } = useSession(profile?.sectionId);
  const [elapsed, setElapsed] = useState(0);
  const [working, setWorking] = useState(false);
  const [sessionName, setSessionName] = useState('Morning attendance');
  const [presentWindow, setPresentWindow] = useState(10);
  const [duration, setDuration] = useState(60);
  const [activeQR, setActiveQR] = useState<QRType | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (session?.state === SessionState.ACTIVE) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.state]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return [h, m, ss].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const handleStart = async () => {
    setWorking(true);
    try {
      const id = await createSession(profile.sectionId, profile.uid, {
        name: sessionName, presentWindowMinutes: presentWindow, durationMinutes: duration,
      });
      await startSession(id, profile.sectionId, duration);
      setElapsed(0);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setWorking(false);
  };

  const handleEnd = async () => {
    if (!session) return;
    Alert.alert('End session?', 'Students who haven\'t scanned will be marked Absent.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End session', style: 'destructive', onPress: async () => {
          setWorking(true);
          try {
            await autoMarkAbsent(session.id, profile.sectionId);
            await endSession(session.id);
          } catch (e: any) { Alert.alert('Error', e.message); }
          setWorking(false);
        },
      },
    ]);
  };

  const isActive = session?.state === SessionState.ACTIVE;
  const isPaused = session?.state === SessionState.PAUSED;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Session manager</Text>
        </FadeInView>

        <FadeInView delay={100}>
          <Card style={styles.timerCard}>
            <Text style={styles.timerDisplay}>{fmt(elapsed)}</Text>
            <Text style={styles.timerLabel}>
              {!session ? 'No session active'
                : isActive ? (elapsed < presentWindow * 60 ? 'Present window open' : 'Late window open')
                  : isPaused ? 'Session paused'
                    : 'Session ended'}
            </Text>
            <View style={styles.btnRow}>
              {!session ? (
                <Button label="Start session" onPress={handleStart} loading={working} style={{ flex: 1 }} />
              ) : isActive ? (
                <>
                  <Button label="Pause" onPress={async () => { setWorking(true); await pauseSession(session.id); setWorking(false); }} variant="secondary" style={{ flex: 1 }} loading={working} />
                  <Button label="End session" onPress={handleEnd} variant="danger" style={{ flex: 1 }} loading={working} />
                </>
              ) : isPaused ? (
                <>
                  <Button label="Resume" onPress={async () => { setWorking(true); await resumeSession(session.id); setWorking(false); }} style={{ flex: 1 }} loading={working} />
                  <Button label="End session" onPress={handleEnd} variant="danger" style={{ flex: 1 }} />
                </>
              ) : (
                <Button label="New session" onPress={handleStart} style={{ flex: 1 }} />
              )}
            </View>
          </Card>
        </FadeInView>

        {session && (isActive || isPaused) && (
          <FadeInView delay={200}>
            <SectionHeader title="QR codes" />
            <View style={styles.qrRow}>
              {([
                { type: QRType.PRESENT, label: 'Present', color: Colors.present, payload: session.qrPayloadPresent },
                { type: QRType.EXCUSED, label: 'Excused', color: Colors.excused, payload: session.qrPayloadExcused },
                { type: QRType.OUTSIDE, label: 'Outside', color: Colors.outside, payload: session.qrPayloadOutside },
              ] as const).map(({ type, label, color, payload }) => (
                <Card key={type} onPress={() => setActiveQR(activeQR === type ? null : type)} style={[styles.qrCard, activeQR === type && { borderColor: color }]}>
                  <Text style={[styles.qrLabel, { color }]}>{label}</Text>
                  {activeQR === type && payload ? (
                    <View style={styles.qrCodeWrap}>
                      <QRCode value={payload} size={120} backgroundColor={Colors.backgroundCard} color={Colors.textPrimary} />
                    </View>
                  ) : (
                    <View style={[styles.qrPlaceholder, { borderColor: color + '40' }]}>
                      <Text style={{ color: Colors.textTertiary, fontSize: FontSize.xs }}>Tap to show</Text>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          </FadeInView>
        )}

        {!session && (
          <FadeInView delay={200}>
            <SectionHeader title="Session settings" />
            <Card>
              <Text style={styles.settingLabel}>Session name</Text>
              <View style={styles.settingInput}>
                <Text style={styles.settingValue}>{sessionName}</Text>
              </View>
              <Divider />
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Present window</Text>
                  <Text style={styles.settingHint}>Scans within = Present</Text>
                </View>
                <Text style={styles.settingValue}>{presentWindow} min</Text>
              </View>
              <Divider />
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Session duration</Text>
                  <Text style={styles.settingHint}>Auto-ends after</Text>
                </View>
                <Text style={styles.settingValue}>{duration} min</Text>
              </View>
            </Card>
          </FadeInView>
        )}
      </ScrollView>
      <LoadingOverlay visible={loading} message="Loading session..." />
    </SafeAreaView>
  );
};

// ─── Live Roster ──────────────────────────────────────────────────────────────
export const LiveRosterScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const { session } = useSession(profile?.sectionId);
  const { roster, loading } = useRoster(session?.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Live roster</Text>
          {session && <PulseView color={Colors.present} size={6} />}
        </FadeInView>

        {!session ? (
          <Card style={styles.noSessionCard}>
            <Text style={styles.noSessionText}>No active session to show roster for.</Text>
          </Card>
        ) : (
          <FadeInView delay={100}>
            {roster.length === 0 ? (
              <Card><Text style={styles.noSessionText}>No scans yet.</Text></Card>
            ) : (
              roster.map((record, i) => (
                <FadeInView key={record.id} delay={i * 40}>
                  <Card style={styles.rosterRow}>
                    <Avatar name={record.studentName} size={38} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.rosterName}>{record.studentName}</Text>
                      <Text style={styles.rosterTime}>
                        {record.scannedAt ? new Date(record.scannedAt as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Auto-marked'}
                      </Text>
                    </View>
                    <Badge status={record.status} />
                  </Card>
                </FadeInView>
              ))
            )}
          </FadeInView>
        )}
      </ScrollView>
      <LoadingOverlay visible={loading} message="Loading roster..." />
    </SafeAreaView>
  );
};

// ─── Excused Review ───────────────────────────────────────────────────────────
export const ExcusedReviewScreen: React.FC<{ navigation: any; profile: any; route: any }> = ({ navigation, profile, route }) => {
  const { requests } = usePendingExcused(profile?.sectionId);
  const [working, setWorking] = useState<string | null>(null);
  const reqFromRoute = route.params?.request;
  const displayList = reqFromRoute ? [reqFromRoute] : requests;

  const handle = async (req: any, approve: boolean) => {
    setWorking(req.id);
    try {
      if (approve) await approveExcusedRequest(req.id, req.attendanceRecordId, profile.uid);
      else await denyExcusedRequest(req.id, req.attendanceRecordId, profile.uid);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setWorking(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Excused requests</Text>
        </FadeInView>
        {displayList.length === 0 ? (
          <Card><Text style={styles.noSessionText}>No pending requests.</Text></Card>
        ) : (
          displayList.map((req) => (
            <FadeInView key={req.id} delay={100}>
              <Card>
                <View style={styles.reqRow}>
                  <Avatar name={req.studentName} size={40} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.reqName}>{req.studentName}</Text>
                    <Text style={styles.reqSub}>Age {req.studentAge}</Text>
                  </View>
                  <Badge status="pending" />
                </View>
                <Divider />
                <Text style={styles.settingLabel}>Explanation</Text>
                <Text style={styles.explanation}>{req.explanation}</Text>
                <Divider />
                <Text style={styles.settingLabel}>Excuse letter</Text>
                <View style={styles.photoPlaceholder}>
                  <Text style={{ color: Colors.textTertiary, fontSize: FontSize.sm }}>Photo attached — view in image viewer</Text>
                </View>
                <View style={styles.btnRow}>
                  <Button label="Deny" onPress={() => handle(req, false)} variant="danger" style={{ flex: 1 }} loading={working === req.id} />
                  <Button label="Approve" onPress={() => handle(req, true)} style={{ flex: 1 }} loading={working === req.id} />
                </View>
              </Card>
            </FadeInView>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, gap: 10 },
  greeting: { fontSize: FontSize.base, color: Colors.textSecondary },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  back: { color: Colors.primaryLight, fontSize: FontSize.base, marginRight: 12 },
  screenTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sessionCard: { marginBottom: 16, gap: 12 },
  sessionActive: { borderColor: Colors.present + '60' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  noSessionCard: { alignItems: 'center', gap: 12 },
  noSessionText: { color: Colors.textSecondary, fontSize: FontSize.base, textAlign: 'center' },
  reqRow: { flexDirection: 'row', alignItems: 'center' },
  reqName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  reqSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionCard: { flex: 1, minWidth: 100, alignItems: 'center', paddingVertical: 20 },
  actionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, textAlign: 'center' },
  timerCard: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  timerDisplay: { fontSize: 48, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: -1 },
  timerLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  qrRow: { flexDirection: 'row', gap: 10 },
  qrCard: { flex: 1, alignItems: 'center', gap: 8 },
  qrLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  qrCodeWrap: { alignItems: 'center' },
  qrPlaceholder: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: 4 },
  settingHint: { fontSize: FontSize.xs, color: Colors.textTertiary },
  settingValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  settingInput: { paddingVertical: 4 },
  rosterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rosterName: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  rosterTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  explanation: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22, marginBottom: 4 },
  photoPlaceholder: { backgroundColor: Colors.backgroundElevated, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
});
