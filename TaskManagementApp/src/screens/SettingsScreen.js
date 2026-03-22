import React, { useContext, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { ThemeContext } from '../constants/ThemeContext';
import { AuthContext } from '../constants/AuthContext';
import { updateUser } from '../services/api';
import AppCustomModal from '../components/AppCustomModal';

const ProfileField = ({ label, value, icon, field, isEditing, profileData, setProfileData, COLORS, editable = true, type = 'text', onDatePress }) => (
    <View style={styles.profileRow}>
        <View style={[styles.profileIconContainer, { backgroundColor: `${COLORS.primary}10` }]}>
            <MaterialIcons name={icon} size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.profileLabel, { color: COLORS.slate500 }]}>{label}</Text>
            {isEditing && editable ? (
                type === 'date' ? (
                    <TouchableOpacity 
                        style={[styles.profileInput, { borderBottomColor: COLORS.primary, justifyContent: 'center' }]} 
                        onPress={() => onDatePress(field)}
                    >
                        <Text style={{ color: COLORS.slate900, fontSize: 15, fontWeight: '500' }}>
                            {value || 'Select Date'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TextInput
                        style={[styles.profileInput, { color: COLORS.slate900, borderBottomColor: COLORS.primary }]}
                        value={profileData[field]}
                        onChangeText={(txt) => setProfileData(prev => ({ ...prev, [field]: txt }))}
                        autoFocus={false}
                    />
                )
            ) : (
                <Text style={[styles.profileValue, { color: COLORS.slate900 }]}>{value || 'Not set'}</Text>
            )}
        </View>
    </View>
);

const ThemeOption = ({ themeName, label, colorCode, currentTheme, setAppTheme, COLORS }) => (
    <TouchableOpacity 
        style={[
            styles.themeOption, 
            currentTheme === themeName && { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}08` }
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

export default function SettingsScreen({ navigation }) {
    const { currentTheme, setAppTheme, COLORS } = useContext(ThemeContext);
    const { user, updateUserProfile, logout } = useContext(AuthContext);
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeDateField, setActiveDateField] = useState(null);
    
    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'success' });
    const [showConfirmLogout, setShowConfirmLogout] = useState(false);
    
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        dob: user?.dob || '',
        position: user?.position || '',
        joiningDate: user?.joiningDate || '',
        password: user?.password || ''
    });

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const result = await updateUser(user.id, profileData);
            if (result.success) {
                await updateUserProfile(result.user);
                setIsEditing(false);
                setModalConfig({
                    title: 'Profile Updated',
                    message: 'Your personal information has been successfully saved to the cloud.',
                    type: 'success'
                });
                setModalVisible(true);
            }
        } catch (error) {
            setModalConfig({
                title: 'Update Failed',
                message: error.message || 'We encountered an issue while saving your profile. Please try again.',
                type: 'error'
            });
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setShowConfirmLogout(true);
    };

    const confirmLogout = async () => {
        setShowConfirmLogout(false);
        await logout();
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate && activeDateField) {
            const dateStr = moment(selectedDate).format('YYYY-MM-DD');
            setProfileData(prev => ({ ...prev, [activeDateField]: dateStr }));
        }
    };

    const openDatePicker = (field) => {
        setActiveDateField(field);
        setShowDatePicker(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgLight }]}>
            <View style={[styles.header, { backgroundColor: COLORS.bgLight, borderBottomColor: COLORS.slate200 }]}>
                <Text style={[styles.headerTitle, { color: COLORS.slate900 }]}>Settings</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <MaterialIcons name="logout" size={20} color={COLORS.rose600} />
                    <Text style={{ color: COLORS.rose600, fontWeight: '600', marginLeft: 4 }}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: COLORS.slate500 }]}>MY PROFILE</Text>
                        <TouchableOpacity 
                            onPress={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
                                    {isEditing ? 'SAVE' : 'EDIT'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    <View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.slate200 }]}>
                        <ProfileField label="User ID (Login ID)" value={user?.id} icon="fingerprint" field="id" isEditing={isEditing} profileData={profileData} setProfileData={setProfileData} COLORS={COLORS} editable={false} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate100 }]} />
                        <ProfileField label="Full Name" value={profileData.name} icon="person" field="name" isEditing={isEditing} profileData={profileData} setProfileData={setProfileData} COLORS={COLORS} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate100 }]} />
                        <ProfileField label="Password" value={profileData.password} icon="lock" field="password" isEditing={isEditing} profileData={profileData} setProfileData={setProfileData} COLORS={COLORS} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate100 }]} />
                        <ProfileField label="Position / Role" value={profileData.position} icon="badge" field="position" isEditing={isEditing} profileData={profileData} setProfileData={setProfileData} COLORS={COLORS} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate100 }]} />
                        <ProfileField 
                            label="Date of Birth" 
                            value={profileData.dob} 
                            icon="cake" 
                            field="dob" 
                            isEditing={isEditing} 
                            profileData={profileData} 
                            setProfileData={setProfileData} 
                            COLORS={COLORS} 
                            type="date"
                            onDatePress={openDatePicker}
                        />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate100 }]} />
                        <ProfileField 
                            label="Joining Date" 
                            value={profileData.joiningDate} 
                            icon="calendar-today" 
                            field="joiningDate" 
                            isEditing={isEditing} 
                            profileData={profileData} 
                            setProfileData={setProfileData} 
                            COLORS={COLORS} 
                            type="date"
                            onDatePress={openDatePicker}
                        />
                    </View>
                </View>

                {/* Theme Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: COLORS.slate500 }]}>THEME PREFERENCE</Text>
                    
                    <View style={[styles.card, { backgroundColor: COLORS.white, borderColor: COLORS.slate200 }]}>
                        <ThemeOption themeName="default" label="Indigo (Default)" colorCode="#3211d4" currentTheme={currentTheme} setAppTheme={setAppTheme} COLORS={COLORS} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                        <ThemeOption themeName="yellow" label="Yellow" colorCode="#eab308" currentTheme={currentTheme} setAppTheme={setAppTheme} COLORS={COLORS} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                        <ThemeOption themeName="black" label="Black" colorCode="#000000" currentTheme={currentTheme} setAppTheme={setAppTheme} COLORS={COLORS} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                        <ThemeOption themeName="green" label="Green" colorCode="#16a34a" currentTheme={currentTheme} setAppTheme={setAppTheme} COLORS={COLORS} />
                        <View style={[styles.divider, { backgroundColor: COLORS.slate200 }]} />
                        <ThemeOption themeName="white" label="White" colorCode="#ffffff" currentTheme={currentTheme} setAppTheme={setAppTheme} COLORS={COLORS} />
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={profileData[activeDateField] ? new Date(profileData[activeDateField]) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        maximumDate={activeDateField === 'dob' ? new Date() : undefined}
                    />
                )}

                <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.slate400, fontSize: 12 }}>TaskMaster v1.2.0 • Created By Sanchit</Text>
                </View>
            </ScrollView>

            <AppCustomModal 
                visible={modalVisible} 
                onClose={() => setModalVisible(false)} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                type={modalConfig.type} 
            />

            <AppCustomModal 
                visible={showConfirmLogout} 
                onClose={() => setShowConfirmLogout(false)} 
                title="Confirm Logout" 
                message="Are you sure you want to exit your session? You will need to sign in again to access your tasks." 
                type="warning"
                actionText="Logout"
                onAction={confirmLogout}
            />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#fff1f2',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    section: {
        padding: 16,
        paddingBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    profileIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    profileValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    profileInput: {
        fontSize: 15,
        fontWeight: '500',
        padding: 0,
        margin: 0,
        borderBottomWidth: 1,
        minHeight: 24,
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
        borderColor: '#e2e8f0', 
    },
    themeLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginLeft: 72, 
    }
});
