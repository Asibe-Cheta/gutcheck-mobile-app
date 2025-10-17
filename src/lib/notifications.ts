import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface MotivationalNotification {
  id: string;
  type: 'encouragement' | 'check-in' | 'reminder' | 'affirmation' | 'goal-prompt';
  title: string;
  body: string;
  chatPrompt?: string; // What to say when they tap to chat
}

// Library of motivational messages
const MOTIVATIONAL_MESSAGES: MotivationalNotification[] = [
  // Encouragement
  {
    id: 'enc_1',
    type: 'encouragement',
    title: '💪 You Got This!',
    body: 'Yo! Wherever you are right now, keep moving forward. You are important and you matter.',
    chatPrompt: 'Hey! Just wanted to check in. How are you doing today?'
  },
  {
    id: 'enc_2',
    type: 'encouragement',
    title: '✨ Keep Going',
    body: 'Every step forward counts. You\'re doing better than you think.',
    chatPrompt: 'I see you opened this. What\'s on your mind today?'
  },
  {
    id: 'enc_3',
    type: 'encouragement',
    title: '🌟 Your Worth',
    body: 'Your value doesn\'t decrease based on someone else\'s inability to see it. Remember that.',
    chatPrompt: 'How are you feeling about things today?'
  },
  {
    id: 'enc_4',
    type: 'encouragement',
    title: '💫 Small Wins',
    body: 'Celebrate the small victories. Progress isn\'t always loud, but it\'s still progress.',
    chatPrompt: 'What\'s one thing you did well today, no matter how small?'
  },

  // Check-ins
  {
    id: 'check_1',
    type: 'check-in',
    title: '👋 How Are You?',
    body: 'Just checking in. How\'s your day going?',
    chatPrompt: 'I\'m here if you want to talk. What\'s been on your mind lately?'
  },
  {
    id: 'check_2',
    type: 'check-in',
    title: '🤔 Quick Check-In',
    body: 'Been thinking about you. How are you holding up?',
    chatPrompt: 'Talk to me. What\'s going on in your world?'
  },
  {
    id: 'check_3',
    type: 'check-in',
    title: '💭 Thinking of You',
    body: 'Hope you\'re doing alright. Want to share what\'s on your mind?',
    chatPrompt: 'I\'m here. What\'s happening with you?'
  },

  // Reminders (self-care practices)
  {
    id: 'rem_1',
    type: 'reminder',
    title: '🙏 Take a Moment',
    body: 'Have you done something for yourself today? Pray, meditate, breathe - whatever centers you.',
    chatPrompt: 'What do you usually do to take care of yourself? Prayer? Meditation? Something else?'
  },
  {
    id: 'rem_2',
    type: 'reminder',
    title: '🧘 Self-Care Check',
    body: 'When\'s the last time you did something that grounds you? Now might be a good time.',
    chatPrompt: 'What helps you feel centered when life gets heavy?'
  },
  {
    id: 'rem_3',
    type: 'reminder',
    title: '💆 Pause',
    body: 'Take 5 minutes today. Pray, meditate, or just breathe. You deserve that space.',
    chatPrompt: 'Do you have any practices that help you reset? I\'d love to encourage you in those.'
  },

  // Affirmations
  {
    id: 'aff_1',
    type: 'affirmation',
    title: '💎 You Are Enough',
    body: 'You don\'t need to prove your worth. You already have it.',
    chatPrompt: 'Sometimes we forget our worth. Want to talk about what\'s making you doubt yourself?'
  },
  {
    id: 'aff_2',
    type: 'affirmation',
    title: '🌈 There\'s Always Hope',
    body: 'Things might be tough right now, but this isn\'t the end of your story. There\'s always hope.',
    chatPrompt: 'What\'s been weighing on you? Let\'s talk about it.'
  },
  {
    id: 'aff_3',
    type: 'affirmation',
    title: '🔥 Your Strength',
    body: 'You\'ve survived every bad day you\'ve had so far. That\'s 100%. You\'re stronger than you think.',
    chatPrompt: 'You\'re stronger than you realize. Want to talk about what you\'re going through?'
  },
  {
    id: 'aff_4',
    type: 'affirmation',
    title: '🌺 Self-Worth',
    body: 'Treating yourself with respect isn\'t selfish. It\'s necessary.',
    chatPrompt: 'How have you been treating yourself lately? Are you being kind to yourself?'
  },

  // Goal Prompts
  {
    id: 'goal_1',
    type: 'goal-prompt',
    title: '🎯 Moving Forward',
    body: 'What\'s one thing you can do today to move closer to where you want to be?',
    chatPrompt: 'Let\'s talk about your goals. What are you working toward right now?'
  },
  {
    id: 'goal_2',
    type: 'goal-prompt',
    title: '📈 Your Goals',
    body: 'Where do you want to be in 3 months? Small steps today, big changes tomorrow.',
    chatPrompt: 'What are you working on improving in your life? I can help you think through it.'
  },
  {
    id: 'goal_3',
    type: 'goal-prompt',
    title: '🚀 Next Steps',
    body: 'What\'s one boundary you could set this week that would improve your life?',
    chatPrompt: 'What\'s one thing you could do this week to improve your situation?'
  },
  {
    id: 'goal_4',
    type: 'goal-prompt',
    title: '💪 Build Your Life',
    body: 'You can\'t control others, but you can control your response. What will you choose today?',
    chatPrompt: 'What\'s something you have control over that you want to work on?'
  },
];

export class NotificationService {
  private static instance: NotificationService;
  private notificationListener: any;
  private responseListener: any;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('motivation', {
          name: 'Motivational Tips',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4FD1C7',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule motivational notifications (3x per week)
   */
  async scheduleWeeklyNotifications(): Promise<void> {
    try {
      // Cancel existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule for Monday, Wednesday, Friday
      const days = [1, 3, 5]; // 0 = Sunday, 1 = Monday, etc.

      for (const day of days) {
        // Random time between 8 AM and 10 PM (varies each notification)
        const hour = Math.floor(Math.random() * (22 - 8 + 1)) + 8;
        const minute = Math.floor(Math.random() * 60);

        // Get a random message
        const message = this.getRandomMessage();

        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.body,
            data: {
              messageId: message.id,
              type: message.type,
              chatPrompt: message.chatPrompt,
            },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday: day,
            hour: hour,
            minute: minute,
            repeats: true,
          },
        });
      }

      // Store that we've scheduled notifications
      await AsyncStorage.setItem('notifications_scheduled', 'true');
      console.log('Weekly motivational notifications scheduled');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  /**
   * Get a random motivational message
   */
  private getRandomMessage(): MotivationalNotification {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    return MOTIVATIONAL_MESSAGES[randomIndex];
  }

  /**
   * Send an immediate test notification
   */
  async sendTestNotification(): Promise<void> {
    const message = this.getRandomMessage();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: {
          messageId: message.id,
          type: message.type,
          chatPrompt: message.chatPrompt,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(
    onNotificationTap: (chatPrompt: string) => void
  ): void {
    // Listener for when notification is received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const chatPrompt = response.notification.request.content.data.chatPrompt as string;
        if (chatPrompt && onNotificationTap) {
          onNotificationTap(chatPrompt);
        }
      }
    );
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('notifications_scheduled', 'false');
  }

  /**
   * Get all scheduled notifications (for debugging)
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export const notificationService = NotificationService.getInstance();

