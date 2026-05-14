import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationStorageService } from './notificationStorage';

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
  type: 'encouragement' | 'check-in' | 'reminder' | 'affirmation' | 'goal-prompt' | 'digital-wellness' | 'health-safety' | 'addiction-recovery' | 'life-ethics' | 'toxic-awareness';
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

  // Digital Wellness & Social Media Safety
  {
    id: 'digital_1',
    type: 'digital-wellness',
    title: '📱 Social Media Check',
    body: 'How\'s your social media consumption today? Remember, you control what you see.',
    chatPrompt: 'How are you feeling about your social media use lately?'
  },
  {
    id: 'digital_2',
    type: 'digital-wellness',
    title: '🛡️ Protect Your Mind',
    body: 'Not everything online is worth your attention. What content serves you today?',
    chatPrompt: 'What kind of content makes you feel better vs. worse?'
  },
  {
    id: 'digital_3',
    type: 'digital-wellness',
    title: '⚡ Dopamine Awareness',
    body: 'Social media is designed to be addictive. Take breaks and connect with real life.',
    chatPrompt: 'How do you feel when you step away from social media?'
  },
  {
    id: 'digital_4',
    type: 'digital-wellness',
    title: '🔍 Content Quality',
    body: 'Ask yourself: Does this content add value to my life or just fill time?',
    chatPrompt: 'What kind of content actually makes you feel good about yourself?'
  },

  // Health & Safety
  {
    id: 'health_1',
    type: 'health-safety',
    title: '🏥 Health Check',
    body: 'Your physical health affects your mental health. How are you taking care of your body?',
    chatPrompt: 'How are you feeling physically today? Any concerns?'
  },
  {
    id: 'health_2',
    type: 'health-safety',
    title: '🚨 Scam Alert',
    body: 'If it sounds too good to be true, it probably is. Trust your instincts.',
    chatPrompt: 'Have you encountered any suspicious offers or messages lately?'
  },
  {
    id: 'health_3',
    type: 'health-safety',
    title: '💊 Substance Awareness',
    body: 'Your body is your temple. What you put into it affects everything else.',
    chatPrompt: 'How are you taking care of your physical and mental health?'
  },
  {
    id: 'health_4',
    type: 'health-safety',
    title: '🛡️ Safety First',
    body: 'Your safety matters more than anyone\'s opinion. Trust your gut feelings.',
    chatPrompt: 'Are there any situations where you feel unsafe or uncomfortable?'
  },

  // Addiction Recovery & Dopamine Management
  {
    id: 'recovery_1',
    type: 'addiction-recovery',
    title: '🔄 Recovery Check',
    body: 'Every day is a new chance to choose yourself. How are you doing today?',
    chatPrompt: 'How are you feeling about your recovery journey today?'
  },
  {
    id: 'recovery_2',
    type: 'addiction-recovery',
    title: '⚡ Dopamine Reset',
    body: 'Your brain needs real rewards, not artificial ones. What brings you genuine joy?',
    chatPrompt: 'What activities make you feel truly satisfied, not just temporarily stimulated?'
  },
  {
    id: 'recovery_3',
    type: 'addiction-recovery',
    title: '🎯 Healthy Rewards',
    body: 'Find joy in real connections, not just digital ones. What matters most to you?',
    chatPrompt: 'What are some healthy ways you like to reward yourself?'
  },
  {
    id: 'recovery_4',
    type: 'addiction-recovery',
    title: '💪 Progress Over Perfection',
    body: 'Recovery isn\'t linear. Every small step counts. How are you growing?',
    chatPrompt: 'What\'s one small positive change you\'ve made recently?'
  },

  // Life Navigation & Ethics
  {
    id: 'ethics_1',
    type: 'life-ethics',
    title: '🧭 Moral Compass',
    body: 'What values guide your decisions? Stay true to what you believe is right.',
    chatPrompt: 'What values are most important to you in how you live your life?'
  },
  {
    id: 'ethics_2',
    type: 'life-ethics',
    title: '🤝 Human Connection',
    body: 'Real relationships require real effort. Invest in people who invest in you.',
    chatPrompt: 'Who are the people in your life that truly support and care about you?'
  },
  {
    id: 'ethics_3',
    type: 'life-ethics',
    title: '⚖️ Right vs Easy',
    body: 'The right thing isn\'t always the easy thing. What feels right to you today?',
    chatPrompt: 'What\'s a decision you\'re facing where you know what\'s right but it\'s hard?'
  },
  {
    id: 'ethics_4',
    type: 'life-ethics',
    title: '🌟 Authentic Living',
    body: 'Be yourself. Everyone else is already taken. What makes you uniquely you?',
    chatPrompt: 'What are the things about yourself that you\'re most proud of?'
  },

  // Toxic Environment Awareness
  {
    id: 'toxic_1',
    type: 'toxic-awareness',
    title: '🚫 Toxic Patterns',
    body: 'You can\'t change toxic people, but you can change how you respond to them.',
    chatPrompt: 'Are there any relationships or situations that feel draining to you?'
  },
  {
    id: 'toxic_2',
    type: 'toxic-awareness',
    title: '🛡️ Boundary Check',
    body: 'Healthy boundaries aren\'t walls, they\'re doors with locks. You decide who enters.',
    chatPrompt: 'What boundaries do you need to set to protect your wellbeing?'
  },
  {
    id: 'toxic_3',
    type: 'toxic-awareness',
    title: '💎 Self-Worth',
    body: 'You don\'t have to prove your worth to anyone. You\'re valuable just as you are.',
    chatPrompt: 'What makes you feel most confident and secure in yourself?'
  },
  {
    id: 'toxic_4',
    type: 'toxic-awareness',
    title: '🌱 Growth Environment',
    body: 'Surround yourself with people who want to see you grow, not just grow around you.',
    chatPrompt: 'Who in your life genuinely wants the best for you?'
  },
];

export class NotificationService {
  private static instance: NotificationService;
  private notificationListener: any;
  private responseListener: any;
  private static readonly RECOMMEND_PUSH_OPT_IN_KEY = 'recommend_protect_push_opt_in';
  private static readonly RECOMMEND_PUSH_FIRED_KEY = 'recommend_protect_push_fired';

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Schedule one daily Awareness Hub reminder (opt-in feature).
   */
  async scheduleAwarenessHubDailyReminder(hour: number = 18, minute: number = 0): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('awareness-hub', {
          name: 'Awareness Hub',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 200, 120, 200],
          lightColor: '#4FD1C7',
          sound: 'default',
        });
      }

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existingHub = scheduled.filter(
        (n) => (n.content.data as any)?.type === 'awareness-hub-reminder'
      );
      await Promise.all(existingHub.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Awareness Hub check-in',
          body: 'Take 2 minutes to strengthen your red-flag awareness today.',
          data: { type: 'awareness-hub-reminder' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
      });
      await AsyncStorage.setItem('awareness_hub_reminders_enabled', 'true');
    } catch (error) {
      console.error('Error scheduling Awareness Hub reminders:', error);
    }
  }

  /**
   * Cancel Awareness Hub reminders only.
   */
  async cancelAwarenessHubReminders(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existingHub = scheduled.filter(
        (n) => (n.content.data as any)?.type === 'awareness-hub-reminder'
      );
      await Promise.all(existingHub.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      await AsyncStorage.setItem('awareness_hub_reminders_enabled', 'false');
    } catch (error) {
      console.error('Error cancelling Awareness Hub reminders:', error);
    }
  }

  /**
   * Schedule one-time Recommend & Protect push notification (opt-in).
   * Fires once per install and never repeats.
   */
  async scheduleRecommendProtectOneTimePrompt(delayHours: number = 24): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const alreadyFired = (await AsyncStorage.getItem(NotificationService.RECOMMEND_PUSH_FIRED_KEY)) === 'true';
      if (alreadyFired) return false;

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existingRecommend = scheduled.filter(
        (n) => (n.content.data as any)?.type === 'recommend-protect-once'
      );
      if (existingRecommend.length > 0) {
        await AsyncStorage.setItem(NotificationService.RECOMMEND_PUSH_OPT_IN_KEY, 'true');
        return true;
      }

      const seconds = Math.max(60, Math.floor(delayHours * 60 * 60));
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recommend & Protect',
          body: 'GutChecks is not just for you. If someone could use this, you can share it safely.',
          data: { type: 'recommend-protect-once' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        },
      });

      await AsyncStorage.multiSet([
        [NotificationService.RECOMMEND_PUSH_OPT_IN_KEY, 'true'],
        [NotificationService.RECOMMEND_PUSH_FIRED_KEY, 'true'],
      ]);
      return true;
    } catch (error) {
      console.error('Error scheduling Recommend & Protect push:', error);
      return false;
    }
  }

  async cancelRecommendProtectOneTimePrompt(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const existingRecommend = scheduled.filter(
        (n) => (n.content.data as any)?.type === 'recommend-protect-once'
      );
      await Promise.all(existingRecommend.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      await AsyncStorage.setItem(NotificationService.RECOMMEND_PUSH_OPT_IN_KEY, 'false');
    } catch (error) {
      console.error('Error cancelling Recommend & Protect push:', error);
    }
  }

  async isRecommendProtectPushOptedIn(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(NotificationService.RECOMMEND_PUSH_OPT_IN_KEY);
    return raw === 'true';
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
   * Schedule motivational notifications (daily)
   */
  async scheduleDailyNotifications(): Promise<void> {
    try {
      // Cancel existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule for every day of the week (0 = Sunday, 1 = Monday, etc.)
      const days = [0, 1, 2, 3, 4, 5, 6]; // All days of the week

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
      console.log('Daily motivational notifications scheduled');
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
    onNotificationTap: (notificationData: { title: string; body: string; type: string; chatPrompt: string }) => void
  ): void {
    // Listener for when notification is received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        console.log('Notification received:', notification);
        
        // Save notification to history
        const data = notification.request.content.data;
        await NotificationStorageService.saveNotification({
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          type: (data?.type as string) || '',
          chatPrompt: (data?.chatPrompt as string) || '',
        });
      }
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data;
        const notificationData = {
          title: response.notification.request.content.title || '',
          body: response.notification.request.content.body || '',
          type: (data?.type as string) || '',
          chatPrompt: (data?.chatPrompt as string) || '',
        };
        
        // Save notification to history if not already saved
        await NotificationStorageService.saveNotification(notificationData);
        
        if (onNotificationTap) {
          onNotificationTap(notificationData);
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

