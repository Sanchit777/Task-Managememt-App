import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text, Image, SafeAreaView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getTasks } from '../services/api';
import { ThemeContext } from '../constants/ThemeContext';
import SummaryListModal from '../components/SummaryListModal';
import TaskDetailModal from '../components/TaskDetailModal';

export default function DashboardScreen({ navigation }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);
    const [taskModalVisible, setTaskModalVisible] = useState(false);

    const [summaryVisible, setSummaryVisible] = useState(false);
    const [summaryTitle, setSummaryTitle] = useState('');
    const [summaryTasks, setSummaryTasks] = useState([]);

    const openSummary = (title, filteredTasks) => {
        setSummaryTitle(title);
        setSummaryTasks(filteredTasks);
        setSummaryVisible(true);
    };

    const handleTaskPress = (task) => {
        setSelectedTask(task);
        if (summaryVisible) setSummaryVisible(false); // OPTIONAL: close summary to just show detail? Let's just overlay it. Actually it's okay.
        setTaskModalVisible(true);
    };

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await getTasks();
            setTasks(data);
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadTasks();
        });
        return unsubscribe;
    }, [navigation]);

    const logout = () => {
         navigation.replace('Login');
    };

    // Derived states
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const totalTasks = tasks.length;
    
    // Simplistic 'near deadline' mock for UI
    const nearDeadline = tasks.filter(t => t.status !== 'Completed').length > 0 ? 1 : 0;

    const renderTask = ({ item }) => {
        let statusColor = COLORS.slate600;
        let statusBg = COLORS.slate100;
        
        if (item.status === 'In Progress') {
            statusColor = COLORS.amber600;
            statusBg = COLORS.amber100;
        } else if (item.status === 'Completed') {
            statusColor = COLORS.emerald600;
            statusBg = COLORS.emerald100;
        } else if (item.status === 'Pending') {
            statusColor = COLORS.slate600;
            statusBg = COLORS.slate200;
        }

        return (
            <TouchableOpacity style={styles.taskCard} onPress={() => handleTaskPress(item)}>
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
        <SafeAreaView style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <MaterialIcons name="person" size={24} color={COLORS.primary} />
                    </View>
                    <View>
                        <Text style={styles.userName}>Task Admin</Text>
                        <Text style={styles.userRole}>Manager</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <MaterialIcons name="logout" size={16} color={COLORS.rose600} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadTasks} colors={[COLORS.primary]} />
                }
                ListHeaderComponent={() => (
                    <View>
                        {/* Search Bar Placeholder */}
                        <View style={styles.searchContainer}>
                            <MaterialIcons name="search" size={20} color={COLORS.slate400} style={styles.searchIcon} />
                            <Text style={styles.searchPlaceholder}>Search tasks, IDs, or clients...</Text>
                        </View>

                        {/* KPI Cards */}
                        <View style={styles.kpiGrid}>
                            <TouchableOpacity style={[styles.kpiCard, styles.kpiTotal]} onPress={() => openSummary('Total Tasks', tasks)}>
                                <MaterialIcons name="assignment" size={24} color={COLORS.primary} style={styles.kpiIcon} />
                                <Text style={styles.kpiLabel}>Total Tasks</Text>
                                <Text style={styles.kpiValue}>{totalTasks}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.kpiCard, styles.kpiCompleted]} onPress={() => openSummary('Completed Tasks', tasks.filter(t => t.status === 'Completed'))}>
                                <MaterialIcons name="task-alt" size={24} color={COLORS.emerald600} style={styles.kpiIcon} />
                                <Text style={styles.kpiLabel}>Completed</Text>
                                <Text style={styles.kpiValue}>{completedTasks}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.kpiCard, styles.kpiPending]} onPress={() => openSummary('Pending Tasks', tasks.filter(t => t.status === 'Pending'))}>
                                <MaterialIcons name="pending-actions" size={24} color={COLORS.amber600} style={styles.kpiIcon} />
                                <Text style={styles.kpiLabel}>Pending</Text>
                                <Text style={styles.kpiValue}>{pendingTasks}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.kpiCard, styles.kpiNearDeadline]} onPress={() => openSummary('Near Deadline', tasks.filter(t => t.status !== 'Completed'))}>
                                <MaterialIcons name="alarm" size={24} color={COLORS.rose600} style={styles.kpiIcon} />
                                <Text style={styles.kpiLabel}>Near Deadline</Text>
                                <Text style={styles.kpiValue}>{nearDeadline}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Recent Tasks Header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Tasks</Text>
                            <TouchableOpacity>
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                renderItem={renderTask}
                ListEmptyComponent={<Text style={styles.empty}>No tasks available</Text>}
            />
            
            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: COLORS.primary }]}
                onPress={() => navigation.navigate('TaskForm')}
            >
                <MaterialIcons name="add" size={32} color={COLORS.white} />
            </TouchableOpacity>

            <SummaryListModal
                visible={summaryVisible}
                title={summaryTitle}
                tasks={summaryTasks}
                onClose={() => setSummaryVisible(false)}
                onTaskPress={handleTaskPress}
            />

            <TaskDetailModal 
                visible={taskModalVisible}
                task={selectedTask}
                onClose={() => setTaskModalVisible(false)}
                onRefresh={() => { loadTasks(); setSummaryVisible(false); }}
            />
        </SafeAreaView>
    );
}

const getStyles = (COLORS) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        zIndex: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(50, 17, 212, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    userRole: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.rose50,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    logoutText: {
        color: COLORS.rose600,
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // Space for FAB and Bottom Nav
        paddingTop: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 24,
        shadowColor: COLORS.slate900,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchPlaceholder: {
        color: COLORS.slate400,
        fontSize: 14,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    kpiCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    kpiTotal: {
        backgroundColor: 'rgba(50, 17, 212, 0.1)',
        borderColor: 'rgba(50, 17, 212, 0.2)',
    },
    kpiCompleted: {
        backgroundColor: COLORS.emerald50,
        borderColor: COLORS.emerald100,
    },
    kpiPending: {
        backgroundColor: COLORS.amber50,
        borderColor: COLORS.amber100,
    },
    kpiNearDeadline: {
        backgroundColor: COLORS.rose50,
        borderColor: COLORS.rose100,
    },
    kpiIcon: {
        marginBottom: 8,
    },
    kpiLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.slate500,
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
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
    },
    empty: {
         textAlign: 'center',
         marginTop: 40,
         fontSize: 16,
         color: COLORS.slate400,
         fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 30,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.slate200,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        zIndex: 20,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    navText: {
        fontSize: 10,
        fontWeight: '500',
        color: COLORS.slate400,
    }
});
