import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export async function requestPermissions() {
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    // For local notifications on emulator, we still need permission
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Send an immediate notification (for testing)
 * @param {string} title 
 * @param {string} body 
 */
export async function sendImmediateNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || 'Task Update',
      body: body || 'You have a new task assigned.',
      data: { data: 'goes here' },
    },
    trigger: null, // null means send immediately
  });
}

/**
 * Schedule a reminder for a task
 * @param {object} task - The task object from the backend
 */
export async function scheduleTaskReminder(task) {
  if (!task || !task.id) return;

  // Cancel any existing notification for this task ID just in case
  await Notifications.cancelScheduledNotificationAsync(task.id);

  // If task is completed, don't schedule a reminder
  if (task.status === 'Completed') return;

  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  if (!deadlineDate || isNaN(deadlineDate.getTime())) return;

  // Set reminder for 9 AM on the deadline day (or now if deadline is today)
  const reminderTime = new Date(deadlineDate);
  reminderTime.setHours(9, 0, 0, 0);

  // If 9 AM has already passed today, don't schedule for the past
  if (reminderTime.getTime() < Date.now()) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: task.id,
    content: {
      title: `Task Reminder: ${task.clientName}`,
      body: `Don't forget: ${task.description || task.taskType}`,
      data: { taskId: task.id },
    },
    trigger: reminderTime,
  });
  
  console.log(`Scheduled reminder for task ${task.id} at ${reminderTime.toLocaleString()}`);
}

/**
 * Cancel a specific task reminder
 * @param {string} taskId 
 */
export async function cancelTaskReminder(taskId) {
  if (taskId) {
    await Notifications.cancelScheduledNotificationAsync(taskId);
  }
}
