import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, AttendanceStatus } from '../../constants';
import { Button, Card, Badge, Avatar, Input, SectionHeader, LoadingOverlay } from '../../components/common';
import { FadeInView } from '../../components/animations';
import { getStudentHistory } from '../../services/attendance.service';
import { consumeParentLinkCode } from '../../services/parentLink.service';
import { getUserProfile } from '../../services/auth.service';
import { AttendanceRecord, StudentProfile } from '../../constants/types';

export const ParentHomeScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const [children, setChildren] = useState<StudentProfile[]>([]);
  const [latestRecords, setLatestRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!profile?.linkedStudentUids?.length) { setLoading(false); return; }
      const profiles: StudentProfile[] = [];
      const records: Record<string, AttendanceRecord> = {};
      for (const uid of profile.linkedStudentUids) {
        const p = await getUserProfile(uid) as StudentProfile;
        if (p) {
          profiles.push(p);
          const history = await getStudentHistory(uid, p.sectionId);
          if (history.length > 0) records[uid] = history[0];
        }
      }
      setChildren(profiles);
      setLatestRecords(records);
      setLoading(false);
    };
    fetchChildren();
  }, [profile]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{profile?.fullName?.split(' ')[0] ?? 'Parent'}</Text>
          </View>
          <Avatar name={profile?.fullName ?? 'P'} size={44} />
        </FadeInView>

        {!loading && children.length === 0 ? (
          <FadeInView delay={100}>
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No child linked yet</Text>
              <Text style={styles.emptySub}>
                Ask your child to generate a link code in their StudentOS app and enter it below.
              </Text>
              <Button label="Link a child" onPress={() => navigation.navigate('LinkChild')} style={{ marginTop: 12 }} />
            </Card>
          </FadeInView>
        ) : (
          <>
            <FadeInView delay={100}>
              <SectionHeader title="Your children" />
              {children.map((child, i) => {
                const latest = latestRecords[child.uid];
                return (
                  <FadeInView key={child.uid} delay={i * 80}>
                    <Card onPress={() => navigation.navigate('ChildHistory', { child })} style={styles.childCard}>
                      <Avatar name={child.fullName} size={48} />
                      <View style={styles.childInfo}>
                        <Text style={styles.childName}>{child.fullName}</Text>
                        <Text style={styles.childSection}>{child.section} · {child.school}</Text>
                        {latest ? <Badge status={latest.status} style={{ marginTop: 6 }} /> : <Text style={styles.noRecord}>No record today</Text>}
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </Card>
                  </FadeInView>
                );
              })}
            </FadeInView>
            <FadeInView delay={300}>
              <Button label="Link another child" onPress={() => navigation.navigate('LinkChild')} variant="ghost" style={{ marginTop: 8 }} />
            </FadeInView>
          </>
        )}
      </ScrollView>
      <LoadingOverlay visible={loading} message="Loading..." />
    </SafeAreaView>
  );
};

export const ChildHistoryScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { child } = route.params as { child: StudentProfile };
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentHistory(child.uid, child.sectionId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [child]);

  const counts = {
    present: history.filter((r) => r.status === AttendanceStatus.PRESENT).length,
    late: history.filter((r) => r.status === AttendanceStatus.LATE).length,
    absent: history.filter((r) => r.status === AttendanceStatus.ABSENT).length,
    excused: history.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <FadeInView style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{child.fullName}</Text>
        </FadeInView>
        <FadeInView delay={100}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{child.section} · {child.school}</Text>
            <View style={styles.summaryRow}>
              {Object.entries(counts).map(([status, count]) => (
                <View key={status} style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, {
                    color: status === 'present' ? Colors.present : status === 'late' ? Colors.late : status === 'absent' ? Colors.absent : Colors.excused,
                  }]}>{count}</Text>
                  <Text style={styles.summaryLabel}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </View>
              ))}
            </View>
          </Card>
        </FadeInView>
        <FadeInView delay={200}>
          <SectionHeader title="Attendance records" />
          {loading ? null : history.length === 0 ? (
            <Card><Text style={styles.noRecord}>No records yet.</Text></Card>
          ) : (
            history.map((record, i) => (
              <FadeInView key={record.id} delay={i * 25}>
                <Card style={styles.recordRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordDate}>
                      {record.updatedAt ? new Date(record.updatedAt as any).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </Text>
                    {record.scannedAt && (
                      <Text style={styles.recordTime}>
                        Scanned at {new Date(record.scannedAt as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                    {record.note ? <Text style={styles.recordNote}>{record.note}</Text> : null}
                  </View>
                  <Badge status={record.status} />
                </Card>
              </FadeInView>
            ))
          )}
        </FadeInView>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Loading records..." />
    </SafeAreaView>
  );
};

export const LinkChildScreen: React.FC<{ navigation: any; profile: any }> = ({ navigation, profile }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { Alert.alert('Required', 'Please enter the link code.'); return; }
    setLoading(true);
    try {
      const result = await consumeParentLinkCode(trimmed, profile.uid);
      if (result.success) {
        Alert.alert('Linked!', `You are now connected to ${result.studentName}.`, [{ text: 'Great!', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', result.error ?? 'Could not link. Check the code and try again.');
      }
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
          <Text style={styles.screenTitle}>Link a child</Text>
        </FadeInView>
        <FadeInView delay={100}>
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.infoTitle}>How to connect</Text>
            <Text style={styles.infoText}>
              1. Ask your child to open StudentOS and go to Profile → Link Parent.{'\n'}
              2. They tap "Generate link code" and share it with you.{'\n'}
              3. Enter that code below to connect.
            </Text>
          </Card>
          <Input label="Link code" value={code} onChangeText={setCode} placeholder="e.g. JUAN-4X9K" autoCapitalize="characters" />
          <Button label="Connect to child" onPress={handleLink} loading={loading} size="lg" style={{ marginTop: 4 }} />
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
};

export const ParentProfileScreen: React.FC<{ profile: any }> = ({ profile }) => (
  <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <FadeInView style={styles.profileHeader}>
        <Avatar name={profile?.fullName ?? 'P'} size={72} />
        <Text style={styles.profileName}>{profile?.fullName}</Text>
        <Text style={styles.profileRole}>{profile?.relationship ?? 'Parent'}</Text>
      </FadeInView>
      <FadeInView delay={150}>
        <Card>
          {[
            { label: 'Email', value: profile?.email },
            { label: 'Mobile', value: profile?.mobileNumber },
            { label: 'Relationship', value: profile?.relationship },
            { label: 'Children linked', value: profile?.linkedStudentUids?.length ?? 0 },
          ].map(({ label, value }) => (
            <View key={label} style={styles.profileRow}>
              <Text style={styles.profileLabel}>{label}</Text>
              <Text style={styles.profileValue}>{String(value ?? '—')}</Text>
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
  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  childInfo: { flex: 1 },
  childName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  childSection: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  noRecord: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 6 },
  chevron: { fontSize: FontSize.xl, color: Colors.textTertiary },
  summaryCard: { marginBottom: 16 },
  summaryTitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryCount: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  recordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  recordDate: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  recordTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  recordNote: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3, fontStyle: 'italic' },
  infoTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 10 },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  profileHeader: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  profileRole: { fontSize: FontSize.base, color: Colors.textSecondary },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  profileLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  profileValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
});
