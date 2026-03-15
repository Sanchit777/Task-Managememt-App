import React, { useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../constants/ThemeContext';

export default function SettingsScreen() {
    const { currentTheme, setAppTheme, COLORS } = useContext(ThemeContext);

    const ThemeOption = ({ themeName, label, colorCode }) => (
        <TouchableOpacity 
            style={[
                styles.themeOption, 
                currentTheme === themeName && { borderColor: COLORS.primary, backgroundColor: COLORS.slate50 }
            ]}
            onPress={() => setAppTheme(themeName)}
        >
            <View style={[styles.colorCircle, { backgroundColor: colorCode }]} />
            <Text style={[styles.themeLabel, { color: COLORS.slate900 }]}>{label}</Text>
            {currentTheme === themeName && (
                <MaterialIcons name="check-circle" size={24} color={COLORS.primary} style={{marginLeft: 'auto'}} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgLight }]}>
            <View style={[styles.header, { backgroundColor: COLORS.bgLight, borderBottomColor: COLORS.slate200 }]}>
                <Text style={[styles.headerTitle, { color: COLORS.slate900 }]}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: COLORS.slate500 }]}>THEME PREFERENCE</Text>
                
                <View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.slate200 }]}>
                    <ThemeOption themeName="default" label="Indigo (Default)" colorCode="#3211d4" />
                    <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                    <ThemeOption themeName="yellow" label="Yellow" colorCode="#eab308" />
                    <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                    <ThemeOption themeName="black" label="Black" colorCode="#000000" />
                    <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                    <ThemeOption themeName="green" label="Green" colorCode="#16a34a" />
                    <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                    <ThemeOption themeName="white" label="White" colorCode="#ffffff" />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 8,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0', // Always subtle border
    },
    themeLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginLeft: 64, // Align with text
    }
});
