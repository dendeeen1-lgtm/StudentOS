import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, FontSize, FontWeight, UserRole } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { LoginScreen, RegisterStudentScreen, RegisterParentScreen, PendingApprovalScreen } from '../screens/auth/AuthScreens';
import { AdviserHomeScreen, SessionManagerScreen, LiveRosterScreen, ExcusedReviewScreen } from '../screens/adviser/AdviserScreens';
import { StudentHomeScreen, ScanScreen, ExcusedFormScreen, HistoryScreen, ParentLinkScreen, StudentProfileScreen } from '../screens/student/StudentScreens';
import { ParentHomeScreen, ChildHistoryScreen, LinkChildScreen, ParentProfileScreen } from '../screens/parent/ParentScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right' as const,
};

const tabBarStyle = {
  backgroundColor: Colors.backgroundCard,
  borderTopColor: Colors.border,
  borderTopWidth: 0.5,
  paddingTop: 6,
  paddingBottom: 6,
  height: 62,
};

const tabBarLabelStyle = {
  fontSize: FontSize.xs,
  fontWeight: FontWeight.medium as any,
  marginTop: 2,
};

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ScanIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M7 12h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const HistoryIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
  </Svg>
);

const RosterIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const SessionIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path d="M10 8l6 4-6 4V8z" fill={color} />
  </Svg>
);

const AdviserTabs: React.FC<{ profile: any }> = ({ profile }) => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: Colors.primaryLight, tabBarInactiveTintColor: Colors.textTertiary, tabBarLabelStyle }}>
    <Tab.Screen name="Home" options={{ tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}>
      {(props) => <AdviserHomeScreen {...props} profile={profile} />}
    </Tab.Screen>
    <Tab.Screen name="Roster" options={{ tabBarIcon: ({ color }) => <RosterIcon color={color} /> }}>
      {(props) => <LiveRosterScreen {...props} profile={profile} />}
    </Tab.Screen>
    <Tab.Screen name="SessionManager" options={{ title: 'Session', tabBarIcon: ({ color }) => <SessionIcon color={color} /> }}>
      {(props) => <SessionManagerScreen {...props} profile={profile} />}
    </Tab.Screen>
    <Tab.Screen name="ExcusedReview" options={{ title: 'Excused', tabBarIcon: ({ color }) => <HistoryIcon color={color} /> }}>
      {(props) => <ExcusedReviewScreen {...props} profile={profile} route={{ params: {} } as any} />}
    </Tab.Screen>
  </Tab.Navigator>
);

const StudentTabs: React.FC<{ profile: any }> = ({ profile }) => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: Colors.primaryLight, tabBarInactiveTintColor: Colors.textTertiary, tabBarLabelStyle }}>
    <Tab.Screen name="StudentHome" options={{ title: 'Home', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}>
      {(props) => <StudentHomeScreen {...props} profile={profile} />}
    </Tab.Screen>
    <Tab.Screen name="Scan" options={{ tabBarIcon: ({ color }) => <ScanIcon color={color} /> }}>
      {(props) => <ScanScreen {...props} profile={profile} />}
    </Tab.Screen>
    <Tab.Screen name="History" options={{ tabBarIcon: ({ color }) => <HistoryIcon color={color} /> }}>
      {(props) => <HistoryScreen {...props} profile={profile} />}
    </Tab.Screen>
    <Tab.Screen name="Profile" options={{ tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }}>
      {(props) => <StudentProfileScreen {...props} profile={profile} />}
    </Tab.Screen>
  </Tab.Navigator>
);

const ParentTabs: React.FC<{ profile: any }> = ({ profile }) => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle, tabBarActiveTintColor: Colors.primaryLight, tabBarInactiveTintColor: Colors.textTertiary, tabBarLabelStyle }}>
    <Tab.Screen name="ParentHome" options={{ title: 'Home', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}>
      {(props) => <ParentHomeScreen {...props} profile={profile} />}
    </Tab.Screen>
    <Tab.Screen name="Profile" options={{ tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }}>
      {(props) => <ParentProfileScreen {...props} profile={profile} />}
    </Tab.Screen>
  </Tab.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="RegisterStudent" component={RegisterStudentScreen} />
    <Stack.Screen name="RegisterParent" component={RegisterParentScreen} />
    <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
  </Stack.Navigator>
);

const AdviserStack: React.FC<{ profile: any }> = ({ profile }) => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="AdviserTabs">{() => <AdviserTabs profile={profile} />}</Stack.Screen>
    <Stack.Screen name="SessionManager">{(props) => <SessionManagerScreen {...props} profile={profile} />}</Stack.Screen>
    <Stack.Screen name="LiveRoster">{(props) => <LiveRosterScreen {...props} profile={profile} />}</Stack.Screen>
    <Stack.Screen name="ExcusedReview">{(props) => <ExcusedReviewScreen {...props} profile={profile} />}</Stack.Screen>
  </Stack.Navigator>
);

const StudentStack: React.FC<{ profile: any }> = ({ profile }) => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="StudentTabs">{() => <StudentTabs profile={profile} />}</Stack.Screen>
    <Stack.Screen name="Scan">{(props) => <ScanScreen {...props} profile={profile} />}</Stack.Screen>
    <Stack.Screen name="ExcusedForm">{(props) => <ExcusedFormScreen {...props} profile={profile} />}</Stack.Screen>
    <Stack.Screen name="History">{(props) => <HistoryScreen {...props} profile={profile} />}</Stack.Screen>
    <Stack.Screen name="ParentLink">{(props) => <ParentLinkScreen {...props} profile={profile} />}</Stack.Screen>
  </Stack.Navigator>
);

const ParentStack: React.FC<{ profile: any }> = ({ profile }) => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="ParentTabs">{() => <ParentTabs profile={profile} />}</Stack.Screen>
    <Stack.Screen name="ChildHistory">{(props) => <ChildHistoryScreen {...props} />}</Stack.Screen>
    <Stack.Screen name="LinkChild">{(props) => <LinkChildScreen {...props} profile={profile} />}</Stack.Screen>
  </Stack.Navigator>
);

export const RootNavigator: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>StudentOS</Text>
      </View>
    );
  }

  const getNavigator = () => {
    if (!user || !profile) return <AuthNavigator />;
    const role = profile.role;
    if ((role === UserRole.STUDENT || role === UserRole.MONITOR) && !(profile as any).isApproved) {
      return (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        </Stack.Navigator>
      );
    }
    if (role === UserRole.ADVISER || role === UserRole.MONITOR) return <AdviserStack profile={profile} />;
    if (role === UserRole.STUDENT) return <StudentStack profile={profile} />;
    if (role === UserRole.PARENT) return <ParentStack profile={profile} />;
    return <AuthNavigator />;
  };

  return <NavigationContainer>{getNavigator()}</NavigationContainer>;
};

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
