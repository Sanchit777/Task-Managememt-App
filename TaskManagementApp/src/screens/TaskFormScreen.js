import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { createTask } from '../services/api';
import { ThemeContext } from '../constants/ThemeContext';
import AppCustomModal from '../components/AppCustomModal';
import { scheduleTaskReminder, sendImmediateNotification } from '../services/NotificationService';

export default function TaskFormScreen({ navigation }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        clientName: '',
        systemName: '',
        taskType: '',
        description: '',
        responsiblePerson: '',
        status: 'Pending',
        assignedDate: new Date().toISOString().split('T')[0],
        completionDate: '',
        deadline: '',
        remarks: '',
        startTime: '',
        endTime: '',
        priority: 'Medium'
    });

    const [loading, setLoading] = useState(false);
    const [showAssignedDatePicker, setShowAssignedDatePicker] = useState(false);
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'success', onSuccess: null });

    const onAssignedDateChange = (event, selectedDate) => {
        setShowAssignedDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            handleChange('assignedDate', selectedDate.toISOString().split('T')[0]);
        }
    };

    const onDeadlineChange = (event, selectedDate) => {
        setShowDeadlinePicker(Platform.OS === 'ios');
        if (selectedDate) {
            handleChange('deadline', selectedDate.toISOString().split('T')[0]);
        }
    };

    const onStartTimeChange = (event, selectedDate) => {
        setShowStartTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            handleChange('startTime', selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    };

    const onEndTimeChange = (event, selectedDate) => {
        setShowEndTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            handleChange('endTime', selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (status) => {
        handleChange('status', status);
    };

    const handlePriorityChange = (priority) => {
        handleChange('priority', priority);
    };

    const handleSubmit = async () => {
        if (!formData.clientName || !formData.description) {
            setModalConfig({
                title: 'Missing Info',
                message: 'Please fill out required fields (Client, Description) before saving.',
                type: 'warning'
            });
            setModalVisible(true);
            return;
        }

        setLoading(true);
        try {
            const result = await createTask(formData);
            
            // Notifications
            if (result.success && result.task) {
                await scheduleTaskReminder(result.task);
                await sendImmediateNotification(
                    'Task Created!',
                    `Task for ${result.task.clientName} has been recorded.`
                );
            }
            
            setModalConfig({
                title: 'Task Created!',
                message: 'Your new task has been successfully recorded in the system.',
                type: 'success',
                onSuccess: () => navigation.goBack()
            });
            setModalVisible(true);
        } catch (error) {
            setModalConfig({
                title: 'Creation Failed',
                message: error.error || error.message || 'We encountered an error while creating your task.',
                type: 'error'
            });
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppCustomModal 
                visible={modalVisible} 
                onClose={() => {
                    setModalVisible(false);
                    if (modalConfig.onSuccess) modalConfig.onSuccess();
                }} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                type={modalConfig.type} 
            />
            {/* Top App Bar */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.slate900} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Task</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="more-vert" size={24} color={COLORS.slate900} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Visual Header / Banner */}
                <View style={[styles.bannerCard, { backgroundColor: COLORS.white, borderColor: COLORS.slate200 }]}>
                    <View style={[styles.bannerTop, { backgroundColor: `${COLORS.primary}1A` }]}>
                        <MaterialIcons name="assignment-add" size={48} color={`${COLORS.primary}66`} />
                    </View>
                    <View style={styles.bannerBottom}>
                        <Text style={[styles.bannerSubtitle, { color: COLORS.primary }]}>REFERENCE NUMBER</Text>
                        <Text style={[styles.bannerTitle, { color: COLORS.slate900 }]}>Auto-Generated</Text>
                        <Text style={[styles.bannerDesc, { color: COLORS.slate500 }]}>Identifier for project tracking</Text>
                    </View>
                </View>

                {/* Form Sections */}
                
                {/* General Information */}
                <View style={[styles.sectionCard, { backgroundColor: COLORS.white, borderColor: COLORS.slate200 }]}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="info" size={20} color={COLORS.primary} />
                        <Text style={[styles.sectionTitle, { color: COLORS.slate900 }]}>General Information</Text>
                    </View>
                    
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: COLORS.slate700 }]}>Client Name *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: COLORS.slate50, borderColor: COLORS.slate200, color: COLORS.slate900 }]}
                            placeholder="e.g. Acme Corporation"
                            placeholderTextColor={COLORS.slate400}
                            value={formData.clientName}
                            onChangeText={(text) => handleChange('clientName', text)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: COLORS.slate700 }]}>System Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: COLORS.slate50, borderColor: COLORS.slate200, color: COLORS.slate900 }]}
                            placeholder="e.g. CRM Portal"
                            placeholderTextColor={COLORS.slate400}
                            value={formData.systemName}
                            onChangeText={(text) => handleChange('systemName', text)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: COLORS.slate700 }]}>Task Type</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: COLORS.slate50, borderColor: COLORS.slate200, color: COLORS.slate900 }]}
                            placeholder="Bug Fix, Feature Request, etc."
                            placeholderTextColor={COLORS.slate400}
                            value={formData.taskType}
                            onChangeText={(text) => handleChange('taskType', text)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: COLORS.slate700 }]}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: COLORS.slate50, borderColor: COLORS.slate200, color: COLORS.slate900 }]}
                            placeholder="Describe the task details..."
                            placeholderTextColor={COLORS.slate400}
                            multiline
                            numberOfLines={4}
                            value={formData.description}
                            onChangeText={(text) => handleChange('description', text)}
                        />
                    </View>
                </View>

                {/* Assignment & Status */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="group" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Assignment & Status</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: COLORS.slate700 }]}>Responsible Person</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: COLORS.slate50, borderColor: COLORS.slate200, color: COLORS.slate900 }]}
                            placeholder="e.g. Alex Rivera"
                            placeholderTextColor={COLORS.slate400}
                            value={formData.responsiblePerson}
                            onChangeText={(text) => handleChange('responsiblePerson', text)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: COLORS.slate700 }]}>Task Status</Text>
                        <View style={styles.statusRow}>
                            <TouchableOpacity 
                                style={[styles.statusBtn, { borderColor: COLORS.slate100, backgroundColor: COLORS.slate50 }, formData.status === 'Pending' && { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}1A` }]}
                                onPress={() => handleStatusChange('Pending')}
                            >
                                <MaterialIcons name="schedule" size={20} color={formData.status === 'Pending' ? COLORS.primary : COLORS.slate500} style={{marginBottom: 4}} />
                                <Text style={[styles.statusBtnText, { color: COLORS.slate500 }, formData.status === 'Pending' && { color: COLORS.primary }]}>Pending</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.statusBtn, { borderColor: COLORS.slate100, backgroundColor: COLORS.slate50 }, formData.status === 'In Progress' && { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}1A` }]}
                                onPress={() => handleStatusChange('In Progress')}
                            >
                                <MaterialIcons name="sync" size={20} color={formData.status === 'In Progress' ? COLORS.primary : COLORS.slate500} style={{marginBottom: 4}} />
                                <Text style={[styles.statusBtnText, { color: COLORS.slate500 }, formData.status === 'In Progress' && { color: COLORS.primary }]}>In Progress</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.statusBtn, { borderColor: COLORS.slate100, backgroundColor: COLORS.slate50 }, formData.status === 'Completed' && { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}1A` }]}
                                onPress={() => handleStatusChange('Completed')}
                            >
                                <MaterialIcons name="check-circle" size={20} color={formData.status === 'Completed' ? COLORS.primary : COLORS.slate500} style={{marginBottom: 4}} />
                                <Text style={[styles.statusBtnText, { color: COLORS.slate500 }, formData.status === 'Completed' && { color: COLORS.primary }]}>Completed</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.inputGroup, { marginTop: 16 }]}>
                        <Text style={[styles.label, { color: COLORS.slate700 }]}>Priority Level</Text>
                        <View style={styles.statusRow}>
                            <TouchableOpacity 
                                style={[styles.statusBtn, { borderColor: COLORS.slate100, backgroundColor: COLORS.slate50 }, formData.priority === 'High' && { borderColor: COLORS.rose600, backgroundColor: `${COLORS.rose600}1A` }]}
                                onPress={() => handlePriorityChange('High')}
                            >
                                <MaterialIcons name="priority-high" size={20} color={formData.priority === 'High' ? COLORS.rose600 : COLORS.slate500} style={{marginBottom: 4}} />
                                <Text style={[styles.statusBtnText, { color: COLORS.slate500 }, formData.priority === 'High' && { color: COLORS.rose600 }]}>High</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.statusBtn, { borderColor: COLORS.slate100, backgroundColor: COLORS.slate50 }, formData.priority === 'Medium' && { borderColor: COLORS.amber600, backgroundColor: `${COLORS.amber600}1A` }]}
                                onPress={() => handlePriorityChange('Medium')}
                            >
                                <MaterialIcons name="low-priority" size={20} color={formData.priority === 'Medium' ? COLORS.amber600 : COLORS.slate500} style={{marginBottom: 4}} />
                                <Text style={[styles.statusBtnText, { color: COLORS.slate500 }, formData.priority === 'Medium' && { color: COLORS.amber600 }]}>Medium</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.statusBtn, { borderColor: COLORS.slate100, backgroundColor: COLORS.slate50 }, formData.priority === 'Low' && { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}1A` }]}
                                onPress={() => handlePriorityChange('Low')}
                            >
                                <MaterialIcons name="keyboard-arrow-down" size={20} color={formData.priority === 'Low' ? COLORS.primary : COLORS.slate500} style={{marginBottom: 4}} />
                                <Text style={[styles.statusBtnText, { color: COLORS.slate500 }, formData.priority === 'Low' && { color: COLORS.primary }]}>Low</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Timeline & Notes */}
                <View style={[styles.sectionCard, { backgroundColor: COLORS.white, borderColor: COLORS.slate200 }]}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                        <Text style={[styles.sectionTitle, { color: COLORS.slate900 }]}>Timeline & Notes</Text>
                    </View>

                    <View style={styles.dateRow}>
                        <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                            <Text style={[styles.label, { color: COLORS.slate700 }]}>Assigned Date</Text>
                            <TouchableOpacity 
                                style={[styles.input, { justifyContent: 'center', backgroundColor: COLORS.slate50, borderColor: COLORS.slate200 }]}
                                onPress={() => setShowAssignedDatePicker(true)}
                            >
                                <Text style={{ color: formData.assignedDate ? COLORS.slate900 : COLORS.slate400 }}>
                                    {formData.assignedDate || "YYYY-MM-DD"}
                                </Text>
                            </TouchableOpacity>
                            {showAssignedDatePicker && (
                                <DateTimePicker
                                    value={formData.assignedDate ? new Date(formData.assignedDate) : new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onAssignedDateChange}
                                />
                            )}
                        </View>
                        <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                            <Text style={[styles.label, { color: COLORS.slate700 }]}>Deadline</Text>
                            <TouchableOpacity 
                                style={[styles.input, { justifyContent: 'center', backgroundColor: COLORS.slate50, borderColor: COLORS.slate200 }]}
                                onPress={() => setShowDeadlinePicker(true)}
                            >
                                <Text style={{ color: formData.deadline ? COLORS.slate900 : COLORS.slate400 }}>
                                    {formData.deadline || "YYYY-MM-DD"}
                                </Text>
                            </TouchableOpacity>
                            {showDeadlinePicker && (
                                <DateTimePicker
                                    value={formData.deadline ? new Date(formData.deadline) : new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={onDeadlineChange}
                                />
                            )}
                        </View>
                    </View>

                    <View style={styles.dateRow}>
                        <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                            <Text style={[styles.label, { color: COLORS.slate700 }]}>Start Time</Text>
                            <TouchableOpacity 
                                style={[styles.input, { justifyContent: 'center', backgroundColor: COLORS.slate50, borderColor: COLORS.slate200 }]}
                                onPress={() => setShowStartTimePicker(true)}
                            >
                                <Text style={{ color: formData.startTime ? COLORS.slate900 : COLORS.slate400 }}>
                                    {formData.startTime || "HH:MM"}
                                </Text>
                            </TouchableOpacity>
                            {showStartTimePicker && (
                                <DateTimePicker
                                    value={new Date()}
                                    mode="time"
                                    display="default"
                                    onChange={onStartTimeChange}
                                />
                            )}
                        </View>
                        <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                            <Text style={[styles.label, { color: COLORS.slate700 }]}>End Time</Text>
                            <TouchableOpacity 
                                style={[styles.input, { justifyContent: 'center', backgroundColor: COLORS.slate50, borderColor: COLORS.slate200 }]}
                                onPress={() => setShowEndTimePicker(true)}
                            >
                                <Text style={{ color: formData.endTime ? COLORS.slate900 : COLORS.slate400 }}>
                                    {formData.endTime || "HH:MM"}
                                </Text>
                            </TouchableOpacity>
                            {showEndTimePicker && (
                                <DateTimePicker
                                    value={new Date()}
                                    mode="time"
                                    display="default"
                                    onChange={onEndTimeChange}
                                />
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Remarks</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Additional notes..."
                            placeholderTextColor={COLORS.slate400}
                            value={formData.remarks}
                            onChangeText={(text) => handleChange('remarks', text)}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Footer Action */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.saveBtn, loading && {opacity: 0.7}]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <MaterialIcons name="save" size={20} color={COLORS.white} />
                    <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save Task"}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate200,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.slate900,
        flex: 1,
        marginLeft: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100, // Space for fixed footer
    },
    bannerCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        overflow: 'hidden',
        marginBottom: 24,
    },
    bannerTop: {
        height: 120,
        backgroundColor: `${COLORS.primary}1A`, // 10% opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerBottom: {
        padding: 16,
    },
    bannerSubtitle: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    bannerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    bannerDesc: {
        fontSize: 14,
        color: COLORS.slate500,
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.slate200,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.slate700,
        marginBottom: 6,
    },
    input: {
        backgroundColor: COLORS.slate50,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        fontSize: 14,
        color: COLORS.slate900,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.slate100,
        backgroundColor: COLORS.slate50,
    },
    statusBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}1A`,
    },
    statusBtnText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.slate500,
    },
    statusBtnTextActive: {
        color: COLORS.primary,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.slate200,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    saveBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});
