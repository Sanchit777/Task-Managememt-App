import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getTasks, updateTaskStatus } from '../services/api';
import { ThemeContext } from '../constants/ThemeContext';
import TaskDetailModal from '../components/TaskDetailModal';
import axios from 'axios';

// Suppose local API
const API_URL = 'http://192.168.1.100:5000/api';

export default function TasksScreen({ navigation }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

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
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
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
                <Text style={[styles.headerTitle, { color: COLORS.slate900 }]}>All Tasks</Text>
            </View>

            <FlatList
                data={tasks}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadTasks} colors={[COLORS.primary]} />
                }
                renderItem={renderTask}
                ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 40, color: COLORS.slate400}}>No tasks available</Text>}
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
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    taskCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
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
