import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, UserRole } from '../../constants';
import { Button, Input, Card } from '../../components/common';
import { FadeInView } from '../../components/animations';
import { signIn } from '../../services/auth.service';

interface Props { navigation: any; route: any; }

// ─── Login Screen ─────────────────────────────────────────────────────────────
export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const role: UserRole | null = route.params?.role ?? null;

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message?.replace('Firebase:', '').trim() ?? 'Login failed.');
    } finally { setLoading(false); }
  };

  const goRegister = () => {
    if (role === UserRole.PARENT) navigation.navigate('RegisterParent');
    else if (role === UserRole.ADVISER) navigation.navigate('RegisterAdviser');
    else navigation.navigate('RegisterStudent', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInView style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.sub}>Sign in to StudentOS</Text>
          </FadeInView>

          <FadeInView delay={150} style={styles.form}>
            {error ? <Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Card> : null}
            <Input label="Email address" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
            <View>
              <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPass}>
                <Text style={styles.showPassText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
              </TouchableOpacity>
            </View>
            <Button label="Sign in" onPress={handleLogin} loading={loading} style={styles.btn} size="lg" />
          </FadeInView>

          <FadeInView delay={300} style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.footerLink} onPress={goRegister}>Register</Text>
            </Text>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Register Student ─────────────────────────────────────────────────────────
export const RegisterStudentScreen: React.FC<Props> = ({ navigation, route }) => {
  const role: UserRole = route.params?.role ?? UserRole.STUDENT;
  const [form, setForm] = useState({
    fullName: '', age: '', birthday: '', section: '', lrn: '',
    school: '', address: '', email: '', password: '', sectionId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { fullName, age, birthday, section, lrn, school, address, email, password, sectionId } = form;
    if (!fullName || !age || !birthday || !section || !lrn || !school || !address || !email || !password || !sectionId) {
      setError('Please fill in all fields.'); return;
    }
    setLoading(true); setError('');
    try {
      const { registerStudent } = await import('../../services/auth.service');
      await registerStudent(email, password, {
        fullName, age: parseInt(age), birthday, section, lrn, school, address,
        isApproved: false, sectionId,
      });
      navigation.navigate('PendingApproval');
    } catch (e: any) {
      setError(e.message?.replace('Firebase:', '').trim() ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInView style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.sub}>{role === UserRole.MONITOR ? 'Class Monitor' : 'Student'} registration</Text>
          </FadeInView>
          <FadeInView delay={150} style={styles.form}>
            {error ? <Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Card> : null}
            <Input label="Full name" value={form.fullName} onChangeText={set('fullName')} placeholder="Juan dela Cruz" />
            <View style={styles.row}>
              <Input label="Age" value={form.age} onChangeText={set('age')} placeholder="16" keyboardType="numeric" style={{ flex: 1 }} />
              <Input label="Birthday" value={form.birthday} onChangeText={set('birthday')} placeholder="MM/DD/YYYY" style={{ flex: 2, marginLeft: 10 }} />
            </View>
            <Input label="Section" value={form.section} onChangeText={set('section')} placeholder="10-A" />
            <Input label="Section join code" value={form.sectionId} onChangeText={set('sectionId')} placeholder="Code from adviser" autoCapitalize="characters" />
            <Input label="LRN" value={form.lrn} onChangeText={set('lrn')} placeholder="123456789012" keyboardType="numeric" />
            <Input label="School" value={form.school} onChangeText={set('school')} placeholder="Name of your school" />
            <Input label="Address" value={form.address} onChangeText={set('address')} placeholder="Street, City, Province" multiline numberOfLines={2} />
            <View style={styles.divider} />
            <Input label="Email address" value={form.email} onChangeText={set('email')} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
            <View>
              <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="Min 6 characters" secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPass}>
                <Text style={styles.showPassText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
              </TouchableOpacity>
            </View>
            <Button label="Create account" onPress={handleRegister} loading={loading} size="lg" style={styles.btn} />
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Register Parent ──────────────────────────────────────────────────────────
export const RegisterParentScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({ fullName: '', relationship: '', mobileNumber: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (key: string) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { fullName, relationship, mobileNumber, email, password } = form;
    if (!fullName || !mobileNumber || !email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const { registerParent } = await import('../../services/auth.service');
      await registerParent(email, password, { fullName, mobileNumber, relationship: relationship || 'Parent' });
    } catch (e: any) {
      setError(e.message?.replace('Firebase:', '').trim() ?? 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInView style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Parent account</Text>
            <Text style={styles.sub}>Register to track your child's attendance</Text>
          </FadeInView>
          <FadeInView delay={150} style={styles.form}>
            {error ? <Card style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></Card> : null}
            <Input label="Full name" value={form.fullName} onChangeText={set('fullName')} placeholder="Maria dela Cruz" />
            <Input label="Relationship to student" value={form.relationship} onChangeText={set('relationship')} placeholder="Mother / Father / Guardian" />
            <Input label="Mobile number" value={form.mobileNumber} onChangeText={set('mobileNumber')} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
            <Input label="Email address" value={form.email} onChangeText={set('email')} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
            <View>
              <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="Min 6 characters" secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPass}>
                <Text style={styles.showPassText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
              </TouchableOpacity>
            </View>
            <Button label="Create parent account" onPress={handleRegister} loading={loading} size="lg" style={styles.btn} />
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Pending Approval ─────────────────────────────────────────────────────────
export const PendingApprovalScreen: React.FC<Props> = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <FadeInView style={styles.pendingWrap}>
      <Text style={styles.pendingIcon}>⏳</Text>
      <Text style={styles.pendingTitle}>Account pending</Text>
      <Text style={styles.pendingSub}>
        Your account has been submitted. Your adviser or class monitor needs to approve it before you can use StudentOS.
      </Text>
      <Text style={styles.pendingHint}>You will be able to sign in once approved.</Text>
      <Button label="Back to sign in" onPress={() => navigation.navigate('Login', { role: null })} variant="ghost" style={{ marginTop: 24 }} />
    </FadeInView>
  </SafeAreaView>
);

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
  row: { flexDirection: 'row' },
  divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: 16 },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  footerLink: { color: Colors.primaryLight, fontWeight: FontWeight.semibold },
  errorCard: { backgroundColor: Colors.absentSurface, borderColor: Colors.absent, marginBottom: 16 },
  errorText: { color: Colors.absent, fontSize: FontSize.sm },
  showPass: { marginTop: -10, marginBottom: 12 },
  showPassText: { color: Colors.primaryLight, fontSize: FontSize.sm },
  pendingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  pendingIcon: { fontSize: 48, marginBottom: 16 },
  pendingTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  pendingSub: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  pendingHint: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', marginTop: 12 },
});
