import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { getTasks } from '../services/api';
import { ThemeContext } from '../constants/ThemeContext';
import TaskDetailModal from '../components/TaskDetailModal';

export default function CalendarScreen({ navigation }) {
    const { COLORS } = useContext(ThemeContext);
    const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
    const [selectedDate, setSelectedDate] = useState('');
    const [tasks, setTasks] = useState([]);
    const [tasksForDate, setTasksForDate] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [filterResponsible, setFilterResponsible] = useState('All');
    const [filterClient, setFilterClient] = useState('All');

    // Dynamically get unique values for filters
    const responsiblePersons = ['All', ...new Set(tasks.map(t => t.responsiblePerson).filter(Boolean))];
    const clientNames = ['All', ...new Set(tasks.map(t => t.clientName).filter(Boolean))];

    const filteredTasksForDate = tasksForDate.filter(t => {
        const matchResponsible = filterResponsible === 'All' || t.responsiblePerson === filterResponsible;
        const matchClient = filterClient === 'All' || t.clientName === filterClient;
        return matchResponsible && matchClient;
    });

    const loadTasks = async () => {
        try {
            const data = await getTasks();
            setTasks(data);
            
            // Updates currently selected date with new tasks
            const dateToLoad = selectedDate || new Date().toISOString().split('T')[0];
            if (!selectedDate) setSelectedDate(dateToLoad);
            setTasksForDate(data.filter(t => t.deadline === dateToLoad || t.date === dateToLoad));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadTasks);
        return unsubscribe;
    }, [navigation, selectedDate]);

    const getMarkedDates = () => {
        let marks = {};
        tasks.forEach((t) => {
             const date = t.deadline || t.date;
             if (date) {
                 marks[date] = { marked: true, dotColor: COLORS.primary };
             }
        });

        if (selectedDate) {
             marks[selectedDate] = { 
                 ...marks[selectedDate], 
                 selected: true, 
                 selectedColor: COLORS.primary 
             };
        }
        return marks;
    };

    const onDayPress = (day) => {
        setSelectedDate(day.dateString);
        const filtered = tasks.filter(t => t.deadline === day.dateString || t.date === day.dateString);
        setTasksForDate(filtered);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.openDrawer ? navigation.openDrawer() : navigation.goBack()}>
                    <MaterialIcons name="menu" size={24} color={COLORS.slate900} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendar</Text>
                <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('TaskForm')}>
                    <MaterialIcons name="add-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Calendar Widget */}
                <View style={styles.calendarWrapper}>
                    <Calendar
                        onDayPress={onDayPress}
                        markedDates={getMarkedDates()}
                        theme={{
                            backgroundColor: COLORS.white,
                            calendarBackground: COLORS.white,
                            textSectionTitleColor: COLORS.slate400,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: COLORS.white,
                            todayTextColor: COLORS.primary,
                            dayTextColor: COLORS.slate900,
                            textDisabledColor: COLORS.slate200,
                            dotColor: COLORS.primary,
                            selectedDotColor: COLORS.white,
                            arrowColor: COLORS.slate900,
                            monthTextColor: COLORS.slate900,
                            textDayFontFamily: 'System',
                            textMonthFontFamily: 'System',
                            textDayHeaderFontFamily: 'System',
                            textDayFontWeight: '500',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: 'bold',
                            textDayFontSize: 14,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 11,
                        }}
                    />
                </View>

                {/* Filters */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterTitle}>RESPONSIBLE PERSON</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {responsiblePersons.map((person, index) => {
                            const isActive = filterResponsible === person;
                            return (
                                <TouchableOpacity 
                                    key={`resp-${index}`}
                                    style={[styles.filterBadge, isActive && styles.filterBadgeActive]}
                                    onPress={() => setFilterResponsible(person)}
                                >
                                    <Text style={isActive ? styles.filterBadgeTextActive : styles.filterBadgeText}>{person}</Text>
                                    <MaterialIcons 
                                        name={isActive ? "check" : "person"} 
                                        size={14} 
                                        color={isActive ? COLORS.white : COLORS.slate500} 
                                    />
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                <View style={styles.filterSection}>
                    <Text style={styles.filterTitle}>CLIENT NAME</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {clientNames.map((client, index) => {
                            const isActive = filterClient === client;
                            return (
                                <TouchableOpacity 
                                    key={`client-${index}`}
                                    style={[styles.filterBadge, isActive && styles.filterBadgeActive]}
                                    onPress={() => setFilterClient(client)}
                                >
                                    <Text style={isActive ? styles.filterBadgeTextActive : styles.filterBadgeText}>{client}</Text>
                                    <MaterialIcons 
                                        name={isActive ? "check" : "business"} 
                                        size={14} 
                                        color={isActive ? COLORS.white : COLORS.slate500} 
                                    />
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                {/* Tasks List */}
                <View style={styles.taskListSection}>
                    <View style={styles.taskListHeader}>
                        <Text style={styles.taskListTitle}>Tasks for {selectedDate || '...'}</Text>
                        <View style={styles.taskCountBadge}>
                            <Text style={styles.taskCountText}>{filteredTasksForDate.length} items</Text>
                        </View>
                    </View>

                    {filteredTasksForDate.length === 0 ? (
                        <Text style={styles.empty}>No tasks scheduled for this date matching filters.</Text>
                    ) : (
                        filteredTasksForDate.map((item, index) => {
                            let isCompleted = item.status === 'Completed';
                            let isInProgress = item.status === 'In Progress';

                            return (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.taskItem, isCompleted && styles.taskItemCompleted]}
                                    onPress={() => {
                                        setSelectedTask(item);
                                        setModalVisible(true);
                                    }}
                                >
                                    <View style={styles.taskItemLeft}>
                                        <Text style={styles.taskClient}>{item.clientName}</Text>
                                        <Text style={[styles.taskDesc, isCompleted && {textDecorationLine: 'line-through'}]}>{item.description}</Text>
                                        <View style={styles.taskMeta}>
                                            <View style={styles.taskMetaItem}>
                                                <MaterialIcons name="person" size={14} color={COLORS.slate500} />
                                                <Text style={styles.taskMetaText}>{item.responsiblePerson || 'Unassigned'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View style={styles.taskItemRight}>
                                        {isCompleted ? (
                                            <>
                                                <View style={[styles.statusTag, {backgroundColor: COLORS.emerald100}]}>
                                                    <Text style={[styles.statusTagText, {color: COLORS.emerald700}]}>COMPLETED</Text>
                                                </View>
                                                <MaterialIcons name="check-circle" size={24} color={COLORS.emerald700} style={{marginTop: 8}} />
                                            </>
                                        ) : isInProgress ? (
                                            <>
                                                <View style={[styles.statusTag, {backgroundColor: COLORS.amber100}]}>
                                                    <Text style={[styles.statusTagText, {color: COLORS.amber700}]}>IN PROGRESS</Text>
                                                </View>
                                                <View style={styles.pulseDot} />
                                            </>
                                        ) : (
                                            <>
                                                <View style={[styles.statusTag, {backgroundColor: COLORS.bgLight}]}>
                                                    <Text style={[styles.statusTagText, {color: COLORS.slate500}]}>PENDING</Text>
                                                </View>
                                                <View style={styles.greyDot} />
                                            </>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )
                        })
                    )}
                </View>
            </ScrollView>

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
        backgroundColor: COLORS.bgLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.bgLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate200,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.slate900,
        textAlign: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Space for nav
    },
    calendarWrapper: {
        margin: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        overflow: 'hidden',
    },
    filterSection: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    filterTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.slate500,
        letterSpacing: 1,
        marginBottom: 12,
    },
    filterScroll: {
        gap: 8,
    },
    filterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        gap: 8,
    },
    filterBadgeActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterBadgeText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.slate900,
    },
    filterBadgeTextActive: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.white,
    },
    taskListSection: {
        padding: 16,
    },
    taskListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    taskListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.slate900,
    },
    taskCountBadge: {
        backgroundColor: `${COLORS.primary}1A`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    taskCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    empty: {
        color: COLORS.slate400,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    taskItem: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.slate200,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    taskItemCompleted: {
        opacity: 0.75,
    },
    taskItemLeft: {
        flex: 1,
    },
    taskClient: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    taskDesc: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.slate900,
        marginTop: 4,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    taskMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    taskMetaText: {
        fontSize: 12,
        color: COLORS.slate500,
    },
    taskItemRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusTagText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.amber500,
        marginTop: 4,
    },
    greyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.slate400,
        marginTop: 4,
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
