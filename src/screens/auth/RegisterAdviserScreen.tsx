import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, UserRole } from '../../constants';
import { Button, Input, Card } from '../../components/common';
import { FadeInView } from '../../components/animations';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

// Secret code the adviser must enter to prove they are the real adviser
const ADVISER_SECRET_CODE = 'ADVISER2024';

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

  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { fullName, school, sectionName, secretCode, email, password } = form;

    if (!fullName || !school || !sectionName || !secretCode || !email || !password) {
      setError('Please fill in all fields.'); return;
    }

    if (secretCode.trim().toUpperCase() !== ADVISER_SECRET_CODE) {
      setError('Invalid adviser code. Ask your school admin for the correct code.'); return;
    }

    setLoading(true); setError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      // Generate a section join code for students
      const joinCode = sectionName.replace(/\s+/g, '').toUpperCase().substring(0, 4) +
        Math.random().toString(36).substring(2, 6).toUpperCase();

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
        'Account created!',
        `Your section join code is: ${joinCode}\n\nShare this with your students so they can join your section.`,
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
            <Text style={styles.sub}>Create your section and adviser account</Text>
          </FadeInView>

          <FadeInView delay={150} style={styles.form}>
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
              label="Adviser secret code"
              value={form.secretCode}
              onChangeText={set('secretCode')}
              placeholder="Enter the adviser code"
              autoCapitalize="characters"
            />
            <Text style={styles.hint}>Ask your school admin for the adviser code. Default is ADVISER2024</Text>

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
  form: { gap: 0 },
  btn: { marginTop: 8 },
  divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: 16 },
  errorCard: { backgroundColor: Colors.absentSurface, borderColor: Colors.absent, marginBottom: 16 },
  errorText: { color: Colors.absent, fontSize: FontSize.sm },
  hint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: -10, marginBottom: 16 },
});
