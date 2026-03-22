import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text, Image, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getTasks } from '../services/api';
import { ThemeContext } from '../constants/ThemeContext';
import { AuthContext } from '../constants/AuthContext';
import SummaryListModal from '../components/SummaryListModal';
import TaskDetailModal from '../components/TaskDetailModal';
import useDebounce from '../hooks/useDebounce';

export default function DashboardScreen({ navigation }) {
    const { COLORS } = useContext(ThemeContext);
    const { user } = useContext(AuthContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

    const { logout: clearSession } = useContext(AuthContext);

    const logout = async () => {
         await clearSession();
         navigation.replace('Login');
    };

    // Derived states
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const totalTasks = tasks.length;
    
    // Calculate total time worked today
    const parseStartTime = (timeStr) => {
        if (!timeStr) return Date.now();
        const match = String(timeStr).match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
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

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr);

    // Filter tasks based on debounced search query
    const filteredTodayTasks = todayTasks.filter(task => {
        const query = debouncedSearchQuery.toLowerCase();
        return (
            task.description?.toLowerCase().includes(query) ||
            task.clientName?.toLowerCase().includes(query) ||
            task.id?.toString().includes(query) ||
            task.taskType?.toLowerCase().includes(query)
        );
    });

    let totalTrackedSecondsToday = 0;
    todayTasks.forEach(task => {
        const isUnstarted = task.status === 'Pending';
        if (isUnstarted) return;
        
        const starts = task.startTime ? String(task.startTime).split(',').map(s => s.trim()).filter(Boolean) : [];
        const ends = task.endTime ? String(task.endTime).split(',').map(s => s.trim()).filter(Boolean) : [];
        const isRunning = task.status === 'In Progress' && starts.length > ends.length;
        
        for (let i = 0; i < ends.length; i++) {
           const sMs = parseStartTime(starts[i]);
           const eMs = parseStartTime(ends[i]);
           if (eMs >= sMs) totalTrackedSecondsToday += Math.floor((eMs - sMs) / 1000);
        }
        
        if (isRunning && starts.length > 0) {
            const currentStartMs = parseStartTime(starts[starts.length - 1]);
            totalTrackedSecondsToday += Math.max(0, Math.floor((Date.now() - currentStartMs) / 1000));
        }
    });

    const formatElapsedShort = (totalSecs) => {
        if (totalSecs === 0) return "0h 0m";
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        return `${h}h ${m}m`;
    };
    
    const timeWorkedTodayText = formatElapsedShort(totalTrackedSecondsToday);

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

        let priorityColor = COLORS.primary;
        let priorityBg = `${COLORS.primary}1A`;
        if (item.priority === 'High') {
            priorityColor = COLORS.rose600;
            priorityBg = `${COLORS.rose600}1A`;
        } else if (item.priority === 'Medium') {
            priorityColor = COLORS.amber600;
            priorityBg = `${COLORS.amber600}1A`;
        }

        return (
            <TouchableOpacity style={styles.taskCard} onPress={() => handleTaskPress(item)}>
                <View style={styles.taskHeader}>
                    <View style={styles.taskHeaderLeft}>
                        <Text style={styles.taskTitle}>{item.description || item.taskType || 'Task'}</Text>
                        <Text style={styles.taskSubtitle}>Client: {item.clientName}</Text>
                    </View>
                    <View style={styles.taskHeaderRight}>
                        <View style={[styles.statusBadge, { backgroundColor: priorityBg, marginRight: 6 }]}>
                            <Text style={[styles.statusText, { color: priorityColor, fontSize: 8 }]}>{item.priority || 'Medium'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                        </View>
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
                        <Text style={styles.userName}>{user?.name || 'Task User'}</Text>
                        <Text style={styles.userRole}>{user?.position || user?.role || 'Member'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <MaterialIcons name="logout" size={16} color={COLORS.rose600} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredTodayTasks}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.scrollContent}
                removeClippedSubviews={Platform.OS === 'android'}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadTasks} colors={[COLORS.primary]} />
                }
                ListHeaderComponent={
                    <View>
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <MaterialIcons name="search" size={20} color={COLORS.slate400} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search tasks, IDs, or clients..."
                                placeholderTextColor={COLORS.slate400}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="close" size={20} color={COLORS.slate400} />
                                </TouchableOpacity>
                            )}
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
                            <TouchableOpacity style={[styles.kpiCard, styles.kpiNearDeadline]} onPress={() => openSummary('Today\'s Tasks', todayTasks)}>
                                <MaterialIcons name="schedule" size={24} color={COLORS.rose600} style={styles.kpiIcon} />
                                <Text style={styles.kpiLabel}>Time Worked</Text>
                                <Text style={styles.kpiValue}>{timeWorkedTodayText}</Text>
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
                }
                renderItem={renderTask}
                ListFooterComponent={
                    <View style={styles.createdFooter}>
                        <Text style={styles.createdText}>Created By Sanchit</Text>
                    </View>
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>
                        {searchQuery ? `No tasks found matching "${searchQuery}"` : "No tasks available for today"}
                    </Text>
                }
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
    searchInput: {
        flex: 1,
        color: COLORS.slate900,
        fontSize: 14,
        paddingVertical: 8,
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
    },
    taskHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
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
    },
    createdFooter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingBottom: 100, // accommodate fab
    },
    createdText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.slate400,
        letterSpacing: 0.5,
    }
});
