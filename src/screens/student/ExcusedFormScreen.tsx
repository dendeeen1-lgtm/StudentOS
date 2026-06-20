import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight } from '../../constants';
import { Button, Card, Input, SectionHeader, Divider, LoadingOverlay } from '../../components/common';
import { FadeInView } from '../../components/animations';
import { submitExcusedRequest } from '../../services/excused.service';
import { sendPushToAdvisers } from '../../services/notification.service';

interface Props { navigation: any; profile: any; route: any; }

export const ExcusedFormScreen: React.FC<Props> = ({ navigation, profile, route }) => {
  const { session } = route.params;
  const [explanation, setExplanation] = useState('');
  const [excuseLetter, setExcuseLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!explanation.trim()) { Alert.alert('Required', 'Please provide a reason.'); return; }
    if (!excuseLetter.trim()) { Alert.alert('Required', 'Please write your excuse letter.'); return; }
    setLoading(true);
    try {
      await submitExcusedRequest({
        sessionId: session.id,
        sectionId: session.sectionId,
        studentUid: profile.uid,
        studentName: profile.fullName,
        studentAge: profile.age,
        explanation,
        excuseLetter,
        letterPhotoURL: '',
      });
      await sendPushToAdvisers(
        session.sectionId,
        'New excuse request',
        `${profile.fullName} submitted an excuse request.`
      );
      Alert.alert(
        'Submitted!',
        'Your excuse request has been sent for review. If approved, you will be notified to bring a printed and signed copy of your excuse letter to class.',
        [{ text: 'OK', onPress: () => navigation.navigate('StudentHome') }]
      );
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInView style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Excuse request</Text>
          </FadeInView>

          <FadeInView delay={100}>
            <Card>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.fieldValue}>{profile.fullName}</Text>
              <Divider />
              <Text style={styles.fieldLabel}>Age</Text>
              <Text style={styles.fieldValue}>{profile.age}</Text>
            </Card>

            <Input
              label="Reason for absence"
              value={explanation}
              onChangeText={setExplanation}
              placeholder="Briefly explain why you were absent..."
              multiline
              numberOfLines={3}
            />

            <Input
              label="Excuse letter"
              value={excuseLetter}
              onChangeText={setExcuseLetter}
              placeholder="Write your formal excuse letter here. Example: To Whom It May Concern, I am writing to inform you that I was unable to attend class on..."
              multiline
              numberOfLines={8}
            />

            <Card style={styles.noteCard}>
              <Text style={styles.noteText}>
                If your request is approved, you will receive a notification to bring a printed copy of this letter with your teacher's signature to class.
              </Text>
            </Card>

            <Button label="Submit excuse request" onPress={handleSubmit} loading={loading} size="lg" style={{ marginTop: 8 }} />
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={loading} message="Submitting request..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 10 },
  back: { color: Colors.primaryLight, fontSize: FontSize.base, marginRight: 12 },
  screenTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  fieldValue: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  noteCard: { backgroundColor: Colors.presentSurface, borderColor: Colors.present },
  noteText: { fontSize: FontSize.sm, color: Colors.present, lineHeight: 20 },
});
