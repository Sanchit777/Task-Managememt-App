import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../constants/ThemeContext';
import axios from 'axios';

// Use the central API service to ensure we hit the right Render URL
import { getTasks, updateTaskStatus } from '../services/api'; 

export default function TaskDetailModal({ visible, task, onClose, onRefresh }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [loading, setLoading] = useState(false);

    if (!task) return null;

    const handleComplete = async () => {
        Alert.alert(
            "Complete Task",
            `Are you sure you want to mark "${task.description || task.taskType}" as complete?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Complete", 
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await updateTaskStatus(task.id, 'Completed');
                            onRefresh(); // Trigger parent refresh
                            onClose();
                        } catch (err) {
                            Alert.alert("Error", "Could not complete task.");
                        } finally {
                            setLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    let statusColor = COLORS.slate600;
    let statusBg = COLORS.slate100 || '#f1f5f9';
    if (task.status === 'In Progress') {
        statusColor = COLORS.amber600;
        statusBg = COLORS.amber100;
    } else if (task.status === 'Completed') {
        statusColor = COLORS.emerald600;
        statusBg = COLORS.emerald100;
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <MaterialIcons name="assignment" size={24} color={COLORS.primary} />
                            <Text style={styles.headerTitle}>Task Details</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <MaterialIcons name="close" size={24} color={COLORS.slate500} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollArea}>
                        {/* Status Badge */}
                        <View style={styles.statusSection}>
                            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>{task.status}</Text>
                            </View>
                            <Text style={styles.taskId}>{task.id}</Text>
                        </View>

                        {/* Details */}
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Client Name</Text>
                            <Text style={styles.value}>{task.clientName || 'N/A'}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Task Type</Text>
                            <Text style={styles.value}>{task.taskType || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Description</Text>
                            <Text style={styles.value}>{task.description || 'N/A'}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Responsible Person</Text>
                            <Text style={styles.value}>{task.responsiblePerson || 'Unassigned'}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.label}>Dates & Timings</Text>
                            <View style={styles.dateContainer}>
                                <Text style={styles.dateText}>Assigned: {task.date || task.workAssignedDate || 'N/A'}</Text>
                                <Text style={styles.dateText}>Deadline: {task.deadline || 'N/A'}</Text>
                                {task.startTime ? <Text style={styles.dateText}>Start Time: {task.startTime}</Text> : null}
                                {task.endTime ? <Text style={styles.dateText}>End Time: {task.endTime}</Text> : null}
                                {task.completionDate ? <Text style={styles.dateText}>Completed On: {task.completionDate}</Text> : null}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {task.status !== 'Completed' && (
                            <TouchableOpacity 
                                style={styles.completeButton}
                                onPress={handleComplete}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <>
                                        <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
                                        <Text style={styles.completeButtonText}>Mark as Completed</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (COLORS) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate200,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    closeButton: {
        padding: 4,
    },
    scrollArea: {
        padding: 20,
    },
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    taskId: {
        fontSize: 14,
        color: COLORS.slate400,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    detailRow: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.slate500,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    value: {
        fontSize: 16,
        color: COLORS.slate900,
        lineHeight: 24,
    },
    dateContainer: {
        gap: 4,
    },
    dateText: {
        fontSize: 15,
        color: COLORS.slate700,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.slate200,
        backgroundColor: COLORS.white,
    },
    completeButton: {
        backgroundColor: COLORS.emerald600,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    completeButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    }
});
