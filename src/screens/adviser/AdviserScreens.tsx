import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  TextInput, Dimensions, FlatList, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Colors, FontSize, FontWeight, SessionState, AttendanceStatus } from '../../constants';
import { Button, Card, Badge, Avatar, SectionHeader, Divider, LoadingOverlay } from '../../components/common';
import { FadeInView, PulseView, ScalePress } from '../../components/animations';
import { useSession, useRoster, usePendingExcused } from '../../hooks/useSession';
import { startSession, pauseSession, resumeSession, endSession, createSession } from '../../services/session.service';
import { autoMarkAbsent } from '../../services/attendance.service';
import { approveExcusedRequest, denyExcusedRequest } from '../../services/excused.service';
import { QRType } from '../../constants';

const { width, height } = Dimensions.get('window');

// ─── Full Screen QR Modal ─────────────────────────────────────────────────────
const FullScreenQR: React.FC<{
  visible: boolean;
  onClose: () => void;
  presentPayload: string;
  excusedPayload: string;
}> = ({ visible, onClose, presentPayload, excusedPayload }) => {
  const [index, setIndex] = useState(0);
  const qrs = [
    { label: 'Present', color: Colors.present, payload: presentPayload },
    { label: 'Excused', color: Colors.excused, payload: excusedPayload },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={qrStyles.container}>
        <TouchableOpacity style={qrStyles.closeBtn} onPress={onClose}>
          <Text style={qrStyles.closeText}>✕ Close</Text>
        </TouchableOpacity>

        <View style={qrStyles.tabs}>
          {qrs.map((q, i) => (
            <TouchableOpacity
              key={q.label}
              style={[qrStyles.tab, index === i && { borderBottomColor: q.color, borderBottomWidth: 2 }]}
              onPress={() => setIndex(i)}
            >
              <Text style={[qrStyles.tabText, { color: index === i ? q.color : Colors.textTertiary }]}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={qrStyles.qrWrap}>
          <Text style={[qrStyles.qrLabel, { color: qrs[index].color }]}>{qrs[index].label} QR</Text>
          <View style={qrStyles.qrBox}>
            {qrs[index].payload ? (
              <QRCode
                value={qrs[index].payload}
                size={width * 0.75}
                backgroundColor={Colors.white}
                color={Colors.black}
              />
            ) : (
              <Text style={{ color: Colors.textTertiary }}>No session active</Text>
            )}
          </View>
          <Text style={qrStyles.qrHint}>Show this to students to scan</Text>
          <Text style={qrStyles.qrSwipe}>← Swipe tabs to switch QR →</Text>
        </View>
      </View>
    </Modal>
  );
};

// ─── Adviser Home ─────────────────────────────────────────────────────────────
export const AdviserHomeScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const { session } = useSession(profile?.sectionId);
  const { roster } = useRoster(session?.id);
  const { requests } = usePendingExcused(profile?.sectionId);
  const [showQR, setShowQR] = useState(false);

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

        {/* Section join code — always visible */}
        <FadeInView delay={50}>
          <Card style={styles.joinCodeCard}>
            <Text style={styles.joinCodeLabel}>Section join code</Text>
            <Text style={styles.joinCodeValue}>{profile?.joinCode ?? profile?.sectionId ?? '—'}</Text>
            <Text style={styles.joinCodeHint}>Share this with your students so they can join</Text>
          </Card>
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
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="QR" size="sm" onPress={() => setShowQR(true)} style={{ flex: 1 }} />
                <Button label="Session" onPress={() => navigation.navigate('SessionManager')} size="sm" variant="secondary" style={{ flex: 1 }} />
              </View>
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

      <FullScreenQR
        visible={showQR}
        onClose={() => setShowQR(false)}
        presentPayload={session?.qrPayloadPresent ?? ''}
        excusedPayload={session?.qrPayloadExcused ?? ''}
      />
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
  const [showQR, setShowQR] = useState(false);
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
    if (!sessionName.trim()) { Alert.alert('Required', 'Please enter a session name.'); return; }
    if (presentWindow < 1 || presentWindow > 60) { Alert.alert('Invalid', 'Present window must be between 1 and 60 minutes.'); return; }
    if (duration < 5 || duration > 300) { Alert.alert('Invalid', 'Duration must be between 5 and 300 minutes.'); return; }
    setWorking(true);
    try {
      const id = await createSession(profile.sectionId, profile.uid, {
        name: sessionName, presentWindowMinutes: presentWindow, durationMinutes: duration,
      });
      await startSession(id, profile.sectionId, duration);
      setElapsed(0);
      setShowQR(true);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setWorking(false);
  };

  const handleEnd = async () => {
    if (!session) return;
    Alert.alert('End session?', 'Students who have not scanned will be marked Absent.', [
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
                  <Button label="QR" size="sm" onPress={() => setShowQR(true)} style={{ flex: 1 }} />
                  <Button label="Pause" size="sm" onPress={async () => { setWorking(true); await pauseSession(session.id); setWorking(false); }} variant="secondary" style={{ flex: 1 }} loading={working} />
                  <Button label="End" size="sm" onPress={handleEnd} variant="danger" style={{ flex: 1 }} loading={working} />
                </>
              ) : isPaused ? (
                <>
                  <Button label="QR" size="sm" onPress={() => setShowQR(true)} style={{ flex: 1 }} />
                  <Button label="Resume" size="sm" onPress={async () => { setWorking(true); await resumeSession(session.id); setWorking(false); }} style={{ flex: 1 }} loading={working} />
                  <Button label="End" size="sm" onPress={handleEnd} variant="danger" style={{ flex: 1 }} />
                </>
              ) : (
                <Button label="New session" onPress={handleStart} style={{ flex: 1 }} />
              )}
            </View>
          </Card>
        </FadeInView>

        {/* Settings — only show when no active session */}
        {!session && (
          <FadeInView delay={200}>
            <SectionHeader title="Session settings" />
            <Card>
              <Text style={styles.settingLabel}>Session name</Text>
              <TextInput
                style={styles.settingInput}
                value={sessionName}
                onChangeText={setSessionName}
                placeholder="e.g. Morning attendance"
                placeholderTextColor={Colors.textTertiary}
              />
              <Divider />
              <Text style={styles.settingLabel}>Present window (minutes)</Text>
              <Text style={styles.settingHint}>Students who scan within this time = Present. After = Late.</Text>
              <TextInput
                style={styles.settingInput}
                value={presentWindow === 0 ? "" : String(presentWindow)}
                onChangeText={(v) => setPresentWindow(parseInt(v) || 0)}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={Colors.textTertiary}
              />
              <Divider />
              <Text style={styles.settingLabel}>Session duration (minutes)</Text>
              <Text style={styles.settingHint}>Session auto-ends after this time.</Text>
              <TextInput
                style={styles.settingInput}
                value={duration === 0 ? "" : String(duration)}
                onChangeText={(v) => setDuration(parseInt(v) || 0)}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={Colors.textTertiary}
              />
            </Card>
          </FadeInView>
        )}
      </ScrollView>

      <FullScreenQR
        visible={showQR}
        onClose={() => setShowQR(false)}
        presentPayload={session?.qrPayloadPresent ?? ''}
        excusedPayload={session?.qrPayloadExcused ?? ''}
      />

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
            <Text style={styles.noSessionText}>No active session.</Text>
          </Card>
        ) : roster.length === 0 ? (
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
      </ScrollView>
      <LoadingOverlay visible={loading} message="Loading roster..." />
    </SafeAreaView>
  );
};

// ─── Excused Review ───────────────────────────────────────────────────────────
export const ExcusedReviewScreen: React.FC<{ navigation: any; profile: any; route: any }> = ({ navigation, profile, route }) => {
  const { requests } = usePendingExcused(profile?.sectionId);
  const [working, setWorking] = useState<string | null>(null);
  const reqFromRoute = route?.params?.request;
  const displayList = reqFromRoute ? [reqFromRoute] : requests;

  const handle = async (req: any, approve: boolean) => {
    setWorking(req.id);
    try {
      if (approve) {
        await approveExcusedRequest(req.id, req.attendanceRecordId, profile.uid);
      } else {
        await denyExcusedRequest(req.id, req.attendanceRecordId, profile.uid);
      }
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
                <Text style={styles.settingLabel}>Reason</Text>
                <Text style={styles.explanation}>{req.explanation}</Text>
                <Divider />
                <Text style={styles.settingLabel}>Excuse letter</Text>
                <View style={styles.letterBox}>
                  <Text style={styles.letterText}>{req.excuseLetter ?? 'No letter provided.'}</Text>
                </View>
                <Divider />
                <Card style={styles.approveNoteCard}>
                  <Text style={styles.approveNoteText}>
                    If approved, the student will be notified to bring a printed and signed copy of their excuse letter to class.
                  </Text>
                </Card>
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

// ─── QR Styles ────────────────────────────────────────────────────────────────
const qrStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 50 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  closeText: { color: Colors.textSecondary, fontSize: FontSize.base },
  tabs: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 32, marginTop: 16 },
  tab: { paddingBottom: 8, paddingHorizontal: 16 },
  tabText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  qrWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrLabel: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: 24 },
  qrBox: { backgroundColor: Colors.white, padding: 20, borderRadius: 20 },
  qrHint: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 24 },
  qrSwipe: { color: Colors.textTertiary, fontSize: FontSize.xs, marginTop: 8 },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, gap: 10 },
  greeting: { fontSize: FontSize.base, color: Colors.textSecondary },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  back: { color: Colors.primaryLight, fontSize: FontSize.base, marginRight: 12 },
  screenTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  joinCodeCard: { marginBottom: 12, alignItems: 'center', paddingVertical: 20 },
  joinCodeLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  joinCodeValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primaryLight, letterSpacing: 4 },
  joinCodeHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 6 },
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
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8, width: '100%' },
  settingLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: 4 },
  settingHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 8 },
  settingInput: {
    backgroundColor: Colors.backgroundInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  rosterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rosterName: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  rosterTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  explanation: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22, marginBottom: 4 },
  letterBox: { backgroundColor: Colors.backgroundElevated, borderRadius: 10, padding: 14, marginBottom: 4 },
  letterText: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  approveNoteCard: { backgroundColor: Colors.presentSurface, borderColor: Colors.present, marginBottom: 12 },
  approveNoteText: { fontSize: FontSize.sm, color: Colors.present, lineHeight: 20 },
});
