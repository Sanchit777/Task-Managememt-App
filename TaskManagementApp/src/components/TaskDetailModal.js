import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { ThemeContext } from '../constants/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { updateTaskStatus, updateTask } from '../services/api';
import AppCustomModal from './AppCustomModal';

export default function TaskDetailModal({ visible, task: initialTask, onClose, onRefresh }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [loading, setLoading] = useState(false);
    const [task, setTask] = useState(initialTask);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'success' });
    const [showConfirmComplete, setShowConfirmComplete] = useState(false);

    useEffect(() => {
        if (visible) setTask(initialTask);
    }, [initialTask, visible]);

    // Live Timer Engine
    const parseStartTime = (timeStr) => {
        if (!timeStr) return Date.now();
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
        if (!match) return Date.now();
        let hours = parseInt(match[1], 10);
        let minutes = parseInt(match[2], 10);
        const ampm = match[3] ? match[3].toUpperCase() : null;
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d.getTime();
    };

    const isUnstarted = task && task.status === 'Pending';
    const starts = (task && task.startTime && !isUnstarted) ? String(task.startTime).split(',').map(s => s.trim()).filter(Boolean) : [];
    const ends = (task && task.endTime && !isUnstarted) ? String(task.endTime).split(',').map(s => s.trim()).filter(Boolean) : [];
    const isRunning = task && task.status === 'In Progress' && starts.length > ends.length;

    const getTotalPreviousElapsed = () => {
        let sum = 0;
        for (let i = 0; i < ends.length; i++) {
           const sMs = parseStartTime(starts[i]);
           const eMs = parseStartTime(ends[i]);
           if (eMs >= sMs) sum += Math.floor((eMs - sMs) / 1000);
        }
        return sum;
    };

    useEffect(() => {
        let interval;
        const previousElapsed = getTotalPreviousElapsed();

        if (isRunning && visible && task.status !== 'Completed') {
            const currentStartMs = parseStartTime(starts[starts.length - 1]);
            setElapsedSeconds(previousElapsed + Math.max(0, Math.floor((Date.now() - currentStartMs) / 1000)));
            interval = setInterval(() => {
                setElapsedSeconds(previousElapsed + Math.max(0, Math.floor((Date.now() - currentStartMs) / 1000)));
            }, 1000);
        } else {
            setElapsedSeconds(previousElapsed);
        }
        return () => clearInterval(interval);
    }, [task, visible]);

    const formatElapsed = (totalSecs) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!task) return null;

    const handleStartTimer = async () => {
        try {
            setLoading(true);
            const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let newStarts = stamp;
            let newEnds = '';
            
            if (task.status === 'In Progress') {
                newStarts = [...starts, stamp].join(', ');
                newEnds = task.endTime || '';
            }
            
            setTask(prev => ({ ...prev, startTime: newStarts, endTime: newEnds, status: 'In Progress' }));
            await updateTask(task.id, { startTime: newStarts, endTime: newEnds, status: 'In Progress' });
            onRefresh();
        } catch (err) {
            setTask(initialTask);
            setModalConfig({ title: 'Timer Error', message: 'Could not start the clock. Please check your connection.', type: 'error' });
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleEndTimer = async () => {
        try {
             setLoading(true);
             const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
             const newEnds = [...ends, stamp].join(', ');
             setTask(prev => ({ ...prev, endTime: newEnds }));
             await updateTask(task.id, { endTime: newEnds }); 
             onRefresh();
        } catch (err) {
             setTask(initialTask);
             setModalConfig({ title: 'Error', message: 'Failed to pause timer.', type: 'error' });
             setModalVisible(true);
        } finally {
             setLoading(false);
        }
    };

    const handleCompletePress = () => {
        setShowConfirmComplete(true);
    };

    const confirmComplete = async () => {
        setShowConfirmComplete(false);
        try {
            setLoading(true);
            setTask(prev => ({ ...prev, status: 'Completed', completionDate: moment().format('YYYY-MM-DD') }));
            await updateTaskStatus(task.id, 'Completed');
            onRefresh();
            onClose();
        } catch (err) {
            setTask(initialTask);
            setModalConfig({ title: 'Error', message: 'Could not complete task.', type: 'error' });
            setModalVisible(true);
        } finally {
            setLoading(false);
        }
    };

    let statusColor = COLORS.slate600;
    let statusBg = COLORS.slate100;
    if (task.status === 'In Progress') {
        statusColor = COLORS.amber600;
        statusBg = COLORS.amber100;
    } else if (task.status === 'Completed') {
        statusBg = COLORS.emerald100;
    }

    let priorityColor = COLORS.primary;
    let priorityBg = `${COLORS.primary}1A`;
    if (task.priority === 'High') {
        priorityColor = COLORS.rose600;
        priorityBg = `${COLORS.rose600}1A`;
    } else if (task.priority === 'Medium') {
        priorityColor = COLORS.amber600;
        priorityBg = `${COLORS.amber600}1A`;
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
                        <View style={styles.statusSection}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={[styles.statusBadge, { backgroundColor: priorityBg }]}>
                                    <Text style={[styles.statusText, { color: priorityColor }]}>{task.priority || 'Medium'}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                    <Text style={[styles.statusText, { color: statusColor }]}>{task.status}</Text>
                                </View>
                            </View>
                            <Text style={styles.taskId}>{task.id}</Text>
                        </View>

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
                                {task.completionDate ? <Text style={styles.dateText}>Completed On: {task.completionDate}</Text> : null}
                            </View>
                        </View>

                        {!isUnstarted && starts.length > 0 && (
                            <View style={styles.detailRow}>
                                <Text style={styles.label}>Time Tracking Logs</Text>
                                <View style={styles.dateContainer}>
                                    {starts.map((startLog, index) => {
                                        const endLog = ends[index];
                                        return (
                                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <MaterialIcons name="schedule" size={14} color={COLORS.slate500} style={{ marginRight: 6 }} />
                                                <Text style={styles.dateText}>
                                                    Session {index + 1}: {startLog} - {endLog || "Running"}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.slate200 }}>
                                        <Text style={[styles.dateText, { fontWeight: 'bold' }]}>Total Tracked Time: {formatElapsed(getTotalPreviousElapsed() + (isRunning ? Math.max(0, Math.floor((Date.now() - parseStartTime(starts[starts.length - 1])) / 1000)) : 0))}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        {(elapsedSeconds > 0 || isRunning) && task.status !== 'Completed' && (
                           <View style={{ alignItems: 'center', marginBottom: 16 }}>
                               <Text style={{ fontSize: 12, color: COLORS.slate500, fontWeight: 'bold', textTransform: 'uppercase' }}>
                                   {isRunning ? "Timer Running" : "Timer Paused"}
                               </Text>
                               <Text style={{ fontSize: 32, fontWeight: 'bold', color: isRunning ? COLORS.emerald600 : COLORS.slate600, fontVariant: ['tabular-nums'] }}>{formatElapsed(elapsedSeconds)}</Text>
                           </View> 
                        )}

                        <View style={{ gap: 12 }}>
                            {!isRunning && task.status !== 'Completed' && (
                                <TouchableOpacity 
                                    style={[styles.completeButton, { backgroundColor: COLORS.primary }]}
                                    onPress={handleStartTimer}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <>
                                            <MaterialIcons name="play-arrow" size={24} color={COLORS.white} />
                                            <Text style={styles.completeButtonText}>{starts.length === 0 ? "Start Task Timer" : "Resume Timer"}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            {isRunning && task.status !== 'Completed' && (
                                <TouchableOpacity 
                                    style={[styles.completeButton, { backgroundColor: COLORS.amber600 }]}
                                    onPress={handleEndTimer}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <>
                                            <MaterialIcons name="pause" size={24} color={COLORS.white} />
                                            <Text style={styles.completeButtonText}>Pause Timer</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            {task.status !== 'Completed' && (
                                <TouchableOpacity 
                                    style={[styles.completeButton, { backgroundColor: COLORS.slate200 }]}
                                    onPress={handleCompletePress}
                                    disabled={loading}
                                >
                                    <MaterialIcons name="check-circle" size={20} color={COLORS.slate600} />
                                    <Text style={[styles.completeButtonText, { color: COLORS.slate600, fontSize: 14 }]}>Mark Complete Directly</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            <AppCustomModal 
                visible={modalVisible} 
                onClose={() => setModalVisible(false)} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                type={modalConfig.type} 
            />

            <AppCustomModal 
                visible={showConfirmComplete} 
                onClose={() => setShowConfirmComplete(false)} 
                title="Complete Task" 
                message={`Are you sure you want to mark this task as completed? This will finalize all time logs.`} 
                type="warning"
                actionText="Yes, Complete"
                onAction={confirmComplete}
            />
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
