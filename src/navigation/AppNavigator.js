import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY } from '../services/constants'
import { HomeIcon, BookIcon, ChartIcon } from '../components/Icons'

import HomeScreen from '../screens/HomeScreen'
import PracticeScreen from '../screens/PracticeScreen'
import ResultScreen from '../screens/ResultScreen'
import PhonicsScreen from '../screens/PhonicsScreen'
import ReportScreen from '../screens/ReportScreen'
import PreviewScreen from '../screens/PreviewScreen'
import SettingsScreen from '../screens/SettingsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const TAB_ICONS = { Home: HomeIcon, Phonics: BookIcon, Report: ChartIcon }
const TAB_LABELS = { Home: '学习', Phonics: '音素', Report: '报告' }

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const IconComponent = TAB_ICONS[route.name]
        return {
          headerShown: false,
          tabBarIcon: ({ focused }) => <IconComponent focused={focused} size={24} />,
          tabBarActiveTintColor: COLORS.PRIMARY,
          tabBarInactiveTintColor: COLORS.TEXT_HINT,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: TAB_LABELS.Home }} />
      <Tab.Screen name="Phonics" component={PhonicsScreen} options={{ tabBarLabel: TAB_LABELS.Phonics }} />
      <Tab.Screen name="Report" component={ReportScreen} options={{ tabBarLabel: TAB_LABELS.Report }} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Preview"
        component={PreviewScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Practice"
        component={PracticeScreen}
        options={{
          gestureEnabled: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: COLORS.BG_WHITE,
    borderTopWidth: 0,
    ...SHADOWS.ELEVATED,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
})
