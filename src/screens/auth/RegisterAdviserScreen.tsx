import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, UserRole } from '../../constants';
import { Button, Input, Card } from '../../components/common';
import { FadeInView } from '../../components/animations';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

// Your private adviser code — only YOU know this
// Do NOT share this with students or parents
const ADVISER_SECRET = 'SOS-ADV-2024-PRIVATE';

interface Props { navigation: any; }

export const RegisterAdviserScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({
    fullName: '',
    school: '',
    sectionName: '',
    secretCode: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);

  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { fullName, school, sectionName, secretCode, email, password } = form;

    if (!fullName || !school || !sectionName || !secretCode || !email || !password) {
      setError('Please fill in all fields.'); return;
    }

    if (secretCode.trim() !== ADVISER_SECRET) {
      setError('Incorrect adviser code. This code is private and only for the section adviser.'); return;
    }

    setLoading(true); setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      const joinCode = sectionName.replace(/\s+/g, '').toUpperCase().substring(0, 4) +
        '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        role: UserRole.ADVISER,
        fullName,
        school,
        sectionName,
        sectionId: joinCode,
        joinCode,
        isApproved: true,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'sections', joinCode), {
        id: joinCode,
        name: sectionName,
        school,
        adviserUid: uid,
        joinCode,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Adviser account created!',
        `Your section join code is:\n\n${joinCode}\n\nShare this with your students only. Keep your adviser code private.`,
        [{ text: 'Got it!' }]
      );
    } catch (e: any) {
      setError(e.message?.replace('Firebase:', '').trim() ?? 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInView style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Adviser registration</Text>
            <Text style={styles.sub}>This account is for section advisers only</Text>
          </FadeInView>

          <FadeInView delay={150}>
            <Card style={styles.warningCard}>
              <Text style={styles.warningText}>
                This registration requires a private adviser code. This code is only known by the section adviser and should never be shared with students or parents.
              </Text>
            </Card>

            {error ? (
              <Card style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </Card>
            ) : null}

            <Input label="Full name" value={form.fullName} onChangeText={set('fullName')} placeholder="Your full name" />
            <Input label="School name" value={form.school} onChangeText={set('school')} placeholder="Name of your school" />
            <Input label="Section name" value={form.sectionName} onChangeText={set('sectionName')} placeholder="e.g. Grade 10 - Rizal" />

            <View style={styles.divider} />

            <Input
              label="Private adviser code"
              value={form.secretCode}
              onChangeText={set('secretCode')}
              placeholder="Enter your private code"
              secureTextEntry={!showCode}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCode(!showCode)} style={styles.showBtn}>
              <Text style={styles.showBtnText}>{showCode ? 'Hide code' : 'Show code'}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Input label="Email address" value={form.email} onChangeText={set('email')} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="Min 6 characters" secureTextEntry />

            <Button label="Create adviser account" onPress={handleRegister} loading={loading} size="lg" style={styles.btn} />
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 16, paddingBottom: 24 },
  back: { marginBottom: 20 },
  backText: { color: Colors.primaryLight, fontSize: FontSize.base },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  sub: { fontSize: FontSize.base, color: Colors.textSecondary },
  warningCard: { backgroundColor: Colors.lateSurface, borderColor: Colors.late, marginBottom: 16 },
  warningText: { fontSize: FontSize.sm, color: Colors.late, lineHeight: 20 },
  errorCard: { backgroundColor: Colors.absentSurface, borderColor: Colors.absent, marginBottom: 16 },
  errorText: { color: Colors.absent, fontSize: FontSize.sm },
  divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: 16 },
  btn: { marginTop: 8 },
  showBtn: { marginTop: -10, marginBottom: 8 },
  showBtnText: { color: Colors.primaryLight, fontSize: FontSize.sm },
});
