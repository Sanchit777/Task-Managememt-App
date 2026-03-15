import React, { useContext } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../constants/ThemeContext';

export default function SummaryListModal({ visible, title, tasks, onClose, onTaskPress }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

    const renderTask = ({ item }) => {
        let statusColor = COLORS.slate600;
        let statusBg = COLORS.slate100 || '#f1f5f9';
        
        if (item.status === 'In Progress') {
            statusColor = COLORS.amber600;
            statusBg = COLORS.amber100;
        } else if (item.status === 'Completed') {
            statusColor = COLORS.emerald600;
            statusBg = COLORS.emerald100;
        }

        return (
            <TouchableOpacity 
                style={styles.taskCard}
                onPress={() => onTaskPress(item)}
            >
                <View style={styles.taskHeader}>
                    <View style={styles.taskHeaderLeft}>
                        <Text style={styles.taskTitle}>{item.description || item.taskType || 'Task'}</Text>
                        <Text style={styles.taskSubtitle}>Client: {item.clientName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                    </View>
                </View>
                
                <View style={styles.taskFooter}>
                    <Text style={styles.taskId}>{item.id}</Text>
                    <View style={styles.taskDateContainer}>
                        <MaterialIcons name="event" size={14} color={COLORS.slate500} />
                        <Text style={styles.taskDate}>{item.deadline || 'No Deadline'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

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
                        <Text style={styles.headerTitle}>{title} ({tasks.length})</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <MaterialIcons name="close" size={24} color={COLORS.slate500} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={tasks}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        contentContainerStyle={styles.scrollContent}
                        renderItem={renderTask}
                        ListEmptyComponent={<Text style={styles.empty}>No tasks found.</Text>}
                    />
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
        backgroundColor: COLORS.bgLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate200,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 16,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: COLORS.slate400,
        fontStyle: 'italic',
    },
    taskCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        marginBottom: 12,
        shadowColor: COLORS.slate900,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    taskHeaderLeft: {
        flex: 1,
        paddingRight: 8,
    },
    taskTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.slate900,
    },
    taskSubtitle: {
        fontSize: 12,
        color: COLORS.slate500,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.slate50,
    },
    taskId: {
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: COLORS.slate400,
    },
    taskDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    taskDate: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.slate500,
    }
});
