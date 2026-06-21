import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors, FontSize, FontWeight, AttendanceStatus } from '../../constants';
import { Button, Card, Badge, Avatar, Input, SectionHeader, Divider, LoadingOverlay } from '../../components/common';
import { FadeInView, ScalePress } from '../../components/animations';
import { useSession } from '../../hooks/useSession';
import { useAttendanceHistory } from '../../hooks/useSession';
import { parseQRPayload } from '../../services/qr.service';
import { recordScan } from '../../services/attendance.service';
import { submitExcusedRequest } from '../../services/excused.service';
import { uploadExcuseLetter } from '../../services/storage.service';
import { generateParentLinkCode } from '../../services/parentLink.service';
import { sendPushToAdvisers, sendPushToParents } from '../../services/notification.service';

// ─── Student Home ─────────────────────────────────────────────────────────────
export const StudentHomeScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const { session } = useSession(profile?.sectionId);
  const { history } = useAttendanceHistory(profile?.uid, profile?.sectionId);

  const streak = (() => {
    let count = 0;
    for (const r of history) {
      if (r.status === AttendanceStatus.PRESENT) count++;
      else break;
    }
    return count;
  })();

  const totalPresent = history.filter((r) => r.status === AttendanceStatus.PRESENT).length;
  const totalLate = history.filter((r) => r.status === AttendanceStatus.LATE).length;
  const totalAbsent = history.filter((r) => r.status === AttendanceStatus.ABSENT).length;
  const today = history[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{profile?.fullName?.split(' ')[0] ?? 'Student'}</Text>
          </View>
          <Avatar name={profile?.fullName ?? 'S'} size={44} />
        </FadeInView>

        <FadeInView delay={100}>
          <Card style={styles.todayCard}>
            <Text style={styles.todayLabel}>Today's status</Text>
            {today ? (
              <Badge status={today.status} style={{ marginTop: 6 }} />
            ) : (
              <Text style={styles.noScan}>Not yet scanned</Text>
            )}
            {session ? (
              <ScalePress onPress={() => navigation.navigate('Scan')} style={styles.scanBtn}>
                <View style={styles.scanBtnInner}>
                  <Text style={styles.scanBtnText}>Scan QR</Text>
                </View>
              </ScalePress>
            ) : (
              <Text style={styles.noSession}>No active session right now</Text>
            )}
          </Card>
        </FadeInView>

        <FadeInView delay={200}>
          <SectionHeader title="Your stats" />
          <View style={styles.statsRow}>
            {[
              { label: 'Streak', value: `${streak}🔥`, color: Colors.late },
              { label: 'Present', value: totalPresent, color: Colors.present },
              { label: 'Late', value: totalLate, color: Colors.late },
              { label: 'Absent', value: totalAbsent, color: Colors.absent },
            ].map(({ label, value, color }) => (
              <Card key={label} style={styles.statCard}>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </Card>
            ))}
          </View>
        </FadeInView>

        <FadeInView delay={300}>
          <SectionHeader title="Quick actions" />
          <View style={styles.actionsRow}>
            <Card onPress={() => navigation.navigate('History')} style={styles.actionCard}>
              <Text style={styles.actionLabel}>View history</Text>
            </Card>
            <Card onPress={() => navigation.navigate('ParentLink')} style={styles.actionCard}>
              <Text style={styles.actionLabel}>Link parent</Text>
            </Card>
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Scan Screen ──────────────────────────────────────────────────────────────
export const ScanScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const { session } = useSession(profile?.sectionId);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || loading || !session) return;
    setScanned(true);
    Vibration.vibrate(100);

    const payload = parseQRPayload(data);
    if (!payload) {
      setResult({ status: 'error', message: 'Invalid or expired QR code.' });
      return;
    }
    if (payload.sectionId !== profile.sectionId) {
      setResult({ status: 'error', message: 'This QR code is for a different section.' });
      return;
    }
    if (payload.type === 'EXCUSED') {
      navigation.navigate('ExcusedForm', { payload, session });
      return;
    }

    setLoading(true);
    try {
      const record = await recordScan(payload, profile.uid, profile.fullName, session);
      await sendPushToParents(
        profile.uid,
        'StudentOS — Attendance',
        `${profile.fullName} is marked ${record.status} in ${profile.section}.`
      );
      setResult({ status: record.status, message: `You are marked ${record.status}!` });
    } catch (e: any) {
      setResult({ status: 'error', message: e.message ?? 'Scan failed.' });
    }
    setLoading(false);
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <FadeInView style={styles.centered}>
          <Text style={styles.noScan}>Camera permission is required to scan QR codes.</Text>
          <Button label="Grant permission" onPress={() => Camera.requestCameraPermissionsAsync()} style={{ marginTop: 16 }} />
        </FadeInView>
      </SafeAreaView>
    );
  }

  if (result) {
    const color = result.status === 'error' ? Colors.absent
      : result.status === 'present' ? Colors.present
        : result.status === 'late' ? Colors.late
          : Colors.outside;
    return (
      <SafeAreaView style={styles.container}>
        <FadeInView style={styles.resultWrap}>
          <View style={[styles.resultIcon, { backgroundColor: color + '30', borderColor: color }]}>
            <Text style={{ fontSize: 40 }}>{result.status === 'error' ? '✗' : '✓'}</Text>
          </View>
          <Text style={[styles.resultStatus, { color }]}>{result.message}</Text>
          <Button label="Done" onPress={() => { setScanned(false); setResult(null); navigation.goBack(); }} style={{ marginTop: 24, minWidth: 160 }} />
        </FadeInView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scanContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.scanOverlay}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.scanBack}>
            <Text style={styles.scanBackText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>{session ? 'Point at a QR code to scan' : 'No active session'}</Text>
        </View>
        {loading && <LoadingOverlay visible message="Recording attendance..." />}
      </View>
    </SafeAreaView>
  );
};

// ─── Excused Form ─────────────────────────────────────────────────────────────
export const ExcusedFormScreen: React.FC<{ navigation: any; profile: any; route: any }> = ({ navigation, profile, route }) => {
  const { payload, session } = route.params;
  const [explanation, setExplanation] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!explanation) { Alert.alert('Required', 'Please provide an explanation.'); return; }
    if (!photoUri) { Alert.alert('Required', 'Please attach your excuse letter.'); return; }
    setLoading(true);
    try {
      const letterPhotoURL = await uploadExcuseLetter(photoUri, profile.uid, session.id);
      await submitExcusedRequest({
        sessionId: session.id,
        sectionId: session.sectionId,
        studentUid: profile.uid,
        studentName: profile.fullName,
        studentAge: profile.age,
        explanation,
        letterPhotoURL,
      });
      await sendPushToAdvisers(
        session.sectionId,
        'Excused request',
        `${profile.fullName} submitted an excuse request.`
      );
      Alert.alert('Submitted', 'Your request has been sent for review.', [
        { text: 'OK', onPress: () => navigation.navigate('StudentHome') },
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Excuse request</Text>
        </FadeInView>
        <FadeInView delay={100}>
          <Card>
            <Text style={styles.formField}><Text style={styles.fieldLabel}>Name: </Text>{profile.fullName}</Text>
            <Text style={styles.formField}><Text style={styles.fieldLabel}>Age: </Text>{profile.age}</Text>
          </Card>
          <Input
            label="Excuse explanation"
            value={explanation}
            onChangeText={setExplanation}
            placeholder="Explain why you were absent or excused..."
            multiline
            numberOfLines={4}
          />
          <SectionHeader title="Excuse letter (photo)" />
          {photoUri ? (
            <Card>
              <Text style={{ color: Colors.present, fontSize: FontSize.sm }}>Photo attached</Text>
              <TouchableOpacity onPress={() => setPhotoUri(null)}>
                <Text style={{ color: Colors.absent, fontSize: FontSize.sm, marginTop: 4 }}>Remove</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={styles.photoRow}>
              <Button label="Take photo" onPress={takePhoto} variant="secondary" style={{ flex: 1 }} />
              <Button label="Choose file" onPress={pickPhoto} variant="secondary" style={{ flex: 1 }} />
            </View>
          )}
          <Button label="Submit excuse request" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} size="lg" />
        </FadeInView>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Submitting request..." />
    </SafeAreaView>
  );
};

// ─── History Screen ───────────────────────────────────────────────────────────
export const HistoryScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const { history, loading } = useAttendanceHistory(profile?.uid, profile?.sectionId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Attendance history</Text>
        </FadeInView>
        {loading ? null : history.length === 0 ? (
          <Card><Text style={styles.noScan}>No attendance records yet.</Text></Card>
        ) : (
          history.map((record, i) => (
            <FadeInView key={record.id} delay={i * 30}>
              <Card style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>
                    {record.updatedAt ? new Date(record.updatedAt as any).toLocaleDateString('en-PH', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    }) : '—'}
                  </Text>
                  {record.note ? <Text style={styles.historyNote}>{record.note}</Text> : null}
                </View>
                <Badge status={record.status} />
              </Card>
            </FadeInView>
          ))
        )}
      </ScrollView>
      <LoadingOverlay visible={loading} message="Loading history..." />
    </SafeAreaView>
  );
};

// ─── Parent Link Screen ───────────────────────────────────────────────────────
export const ParentLinkScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const [code, setCode] = useState<string | null>(profile?.parentLinkCode ?? null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const newCode = await generateParentLinkCode(profile.uid, profile.fullName);
      setCode(newCode);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Link your parent</Text>
        </FadeInView>
        <FadeInView delay={100}>
          <Card>
            <Text style={styles.linkInfo}>
              Generate a unique link code and share it with your parent. They'll enter it in the StudentOS parent app to connect to your account.
            </Text>
            <Divider />
            <Text style={styles.linkExpiry}>Code expires after 48 hours · one-time use</Text>
          </Card>
          {code ? (
            <FadeInView delay={200}>
              <Card style={styles.codeCard}>
                <Text style={styles.codeLabel}>Your link code</Text>
                <Text style={styles.codeText}>{code}</Text>
                <Text style={styles.codeHint}>Share this with your parent</Text>
              </Card>
              <Button label="Generate new code" onPress={generate} loading={loading} variant="secondary" />
            </FadeInView>
          ) : (
            <Button label="Generate link code" onPress={generate} loading={loading} size="lg" />
          )}
          {profile?.linkedParentUids?.length > 0 && (
            <FadeInView delay={300}>
              <SectionHeader title="Linked parents" />
              <Card>
                <Text style={{ color: Colors.present, fontSize: FontSize.sm }}>
                  {profile.linkedParentUids.length} parent(s) connected
                </Text>
              </Card>
            </FadeInView>
          )}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Student Profile ──────────────────────────────────────────────────────────
export const StudentProfileScreen: React.FC<{ navigation: any; profile: any }> = ({ profile }) => (
  <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <FadeInView style={styles.profileHeader}>
        <Avatar name={profile?.fullName ?? 'S'} size={72} />
        <Text style={styles.profileName}>{profile?.fullName}</Text>
        <Badge status="present" />
      </FadeInView>
      <FadeInView delay={150}>
        <Card>
          {[
            { label: 'LRN', value: profile?.lrn },
            { label: 'Section', value: profile?.section },
            { label: 'School', value: profile?.school },
            { label: 'Age', value: profile?.age },
            { label: 'Birthday', value: profile?.birthday },
            { label: 'Address', value: profile?.address },
          ].map(({ label, value }) => (
            <View key={label} style={styles.profileRow}>
              <Text style={styles.profileLabel}>{label}</Text>
              <Text style={styles.profileValue}>{value ?? '—'}</Text>
            </View>
          ))}
        </Card>
      </FadeInView>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, gap: 10 },
  greeting: { fontSize: FontSize.base, color: Colors.textSecondary },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  back: { color: Colors.primaryLight, fontSize: FontSize.base, marginRight: 12 },
  screenTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  todayCard: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  todayLabel: { fontSize: FontSize.sm, color: Colors.textTertiary, letterSpacing: 0.5 },
  noScan: { color: Colors.textSecondary, textAlign: 'center', fontSize: FontSize.base },
  noSession: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },
  scanBtn: { marginTop: 12 },
  scanBtnInner: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
  scanBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  actionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scanContainer: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanBack: { position: 'absolute', top: 16, right: 16, backgroundColor: Colors.overlay, borderRadius: 20, padding: 8 },
  scanBackText: { color: Colors.white, fontSize: FontSize.lg },
  scanFrame: { width: 220, height: 220, borderRadius: 16, borderWidth: 2, borderColor: Colors.primaryLight },
  scanHint: { marginTop: 24, color: Colors.white, fontSize: FontSize.base, backgroundColor: Colors.overlay, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultIcon: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resultStatus: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  formField: { fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: 4 },
  fieldLabel: { fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  photoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  historyNote: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  linkInfo: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  linkExpiry: { fontSize: FontSize.xs, color: Colors.textTertiary },
  codeCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 12 },
  codeLabel: { fontSize: FontSize.sm, color: Colors.textTertiary, marginBottom: 8 },
  codeText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primaryLight, letterSpacing: 4 },
  codeHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 8 },
  profileHeader: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  profileLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  profileValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
});
export { ExcusedFormScreen } from './ExcusedFormScreen';
