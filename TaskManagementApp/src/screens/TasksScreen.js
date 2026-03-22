import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getTasks, updateTaskStatus } from '../services/api';
import { ThemeContext } from '../constants/ThemeContext';
import TaskDetailModal from '../components/TaskDetailModal';
import axios from 'axios';

// Local API is handled in services/api.js

export default function TasksScreen({ navigation }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('All');

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await getTasks();
            const todayStr = new Date().toISOString().split('T')[0];
            setTasks(data.filter(t => t.date === todayStr));
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadTasks);
        return unsubscribe;
    }, [navigation]);

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
            <TouchableOpacity 
                style={[styles.taskCard, { backgroundColor: COLORS.white, borderColor: COLORS.slate200 }]}
                onPress={() => {
                    setSelectedTask(item);
                    setModalVisible(true);
                }}
            >
                <View style={styles.taskHeader}>
                    <View style={styles.taskHeaderLeft}>
                        <Text style={[styles.taskTitle, { color: COLORS.slate900 }]}>
                            {item.description || item.taskType || 'Task'}
                        </Text>
                        <Text style={[styles.taskSubtitle, { color: COLORS.slate500 }]}>
                            Client: {item.clientName}
                        </Text>
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
                
                <View style={[styles.taskFooter, { borderTopColor: COLORS.slate50 || '#f8fafc' }]}>
                    <Text style={[styles.taskId, { color: COLORS.slate400 }]}>{item.id}</Text>
                    <View style={styles.taskDateContainer}>
                        <MaterialIcons name="event" size={14} color={COLORS.slate500} />
                        <Text style={[styles.taskDate, { color: COLORS.slate500 }]}>
                            {item.deadline || 'No Deadline'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: COLORS.bgLight }]}>
            <View style={[styles.header, { backgroundColor: COLORS.bgLight, borderBottomColor: COLORS.slate200 }]}>
                <Text style={[styles.headerTitle, { color: COLORS.slate900 }]}>Tasks</Text>
            </View>

            <View style={styles.filterBar}>
                {['All', 'Pending', 'In Progress', 'Completed'].map(status => (
                    <TouchableOpacity 
                        key={status}
                        onPress={() => setSelectedStatus(status)}
                        style={[
                            styles.filterTab, 
                            selectedStatus === status && { borderBottomColor: COLORS.primary }
                        ]}
                    >
                        <Text style={[
                            styles.filterTabText, 
                            { color: COLORS.slate500 },
                            selectedStatus === status && { color: COLORS.primary, fontWeight: 'bold' }
                        ]}>
                            {status}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={selectedStatus === 'All' ? tasks : tasks.filter(t => t.status === selectedStatus)}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.scrollContent}
                removeClippedSubviews={Platform.OS === 'android'}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadTasks} colors={[COLORS.primary]} />
                }
                renderItem={renderTask}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 40, color: COLORS.slate400}}>No {selectedStatus !== 'All' ? selectedStatus.toLowerCase() : ''} tasks available</Text>}
            />
            
            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: COLORS.primary }]}
                onPress={() => navigation.navigate('TaskForm')}
            >
                <MaterialIcons name="add" size={32} color={COLORS.white} />
            </TouchableOpacity>

            <TaskDetailModal 
                visible={modalVisible}
                task={selectedTask}
                onClose={() => setModalVisible(false)}
                onRefresh={loadTasks}
            />
        </SafeAreaView>
    );
}

const getStyles = (COLORS) => StyleSheet.create({
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
    filterBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.bgLight,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate200,
    },
    filterTab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    filterTabText: {
        fontSize: 14,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    taskCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
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
    taskHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    taskSubtitle: {
        fontSize: 12,
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
    },
    taskId: {
        fontSize: 11,
    },
    taskDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    taskDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 30,
    }
});
