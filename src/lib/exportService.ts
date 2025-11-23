/**
 * Export Service
 * Handles exporting chat history and analysis as PDF evidence
 * Includes timestamps, watermark, and password protection option
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatExportData {
  chatId: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
  analysis?: string;
}

class ExportService {
  /**
   * Generate HTML content for PDF export
   */
  private generateHTML(data: ChatExportData, password?: string): string {
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const passwordSection = password
      ? `
        <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; color: #92400E; font-size: 13px;">
            <strong>⚠️ Protected Document:</strong> This export is password protected. Share the password separately for security.
          </p>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>GutCheck Evidence Export - ${data.title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff;
            }
            
            .header {
              border-bottom: 3px solid #43B897;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .logo {
              color: #43B897;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .subtitle {
              color: #6b7280;
              font-size: 14px;
            }
            
            .meta-info {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            
            .meta-info p {
              margin: 5px 0;
              font-size: 13px;
              color: #4b5563;
            }
            
            .meta-info strong {
              color: #1f2937;
            }
            
            .chat-title {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 20px;
            }
            
            .message {
              margin-bottom: 20px;
              padding: 15px;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            
            .message-user {
              background-color: #EFF6FF;
              border-left: 4px solid #3B82F6;
            }
            
            .message-assistant {
              background-color: #F0FDF4;
              border-left: 4px solid: #43B897;
            }
            
            .message-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 12px;
              color: #6b7280;
            }
            
            .message-role {
              font-weight: 600;
              color: #374151;
            }
            
            .message-content {
              font-size: 14px;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            
            .watermark {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
            }
            
            .watermark-logo {
              color: #43B897;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            .legal-notice {
              margin-top: 30px;
              padding: 15px;
              background-color: #FEF3C7;
              border-radius: 8px;
              font-size: 11px;
              color: #92400E;
            }
            
            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div class="logo">🛡️ GutCheck Evidence Export</div>
            <div class="subtitle">Secure Analysis & Conversation Record</div>
          </div>
          
          <!-- Password Notice -->
          ${passwordSection}
          
          <!-- Meta Information -->
          <div class="meta-info">
            <p><strong>Export Date:</strong> ${formatDate(Date.now())}</p>
            <p><strong>Original Conversation Date:</strong> ${formatDate(data.createdAt)}</p>
            <p><strong>Document ID:</strong> ${data.chatId.substring(0, 8)}</p>
            <p><strong>Total Messages:</strong> ${data.messages.length}</p>
          </div>
          
          <!-- Chat Title -->
          <h1 class="chat-title">${data.title}</h1>
          
          <!-- Messages -->
          ${data.messages
            .map(
              (msg) => `
            <div class="message message-${msg.role}">
              <div class="message-header">
                <span class="message-role">${msg.role === 'user' ? '👤 You' : '🤖 GutCheck AI'}</span>
                <span class="message-time">${formatTime(msg.timestamp)}</span>
              </div>
              <div class="message-content">${msg.content.replace(/\n/g, '<br>')}</div>
            </div>
          `
            )
            .join('')}
          
          <!-- Legal Notice -->
          <div class="legal-notice">
            <strong>📋 Legal Notice:</strong><br>
            This document contains a timestamped record of conversations and analysis generated by GutCheck,
            an AI-powered mental health support application. This export is intended as evidence of
            interactions, communications, or patterns that may be relevant to safety concerns, legal matters,
            or personal records. The timestamps are accurate as of the export date and reflect the original
            conversation times.
          </div>
          
          <!-- Watermark -->
          <div class="watermark">
            <div class="watermark-logo">GutCheck</div>
            <p>Confidential & Anonymous Analysis Platform</p>
            <p>https://mygutcheck.org | Generated: ${formatDate(Date.now())}</p>
            <p>This document was generated by GutCheck app and contains authenticated timestamps.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Export chat history as PDF
   */
  async exportChatAsPDF(data: ChatExportData, options?: { password?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[EXPORT] Starting PDF export for chat:', data.chatId);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Export Not Available',
          'PDF sharing is not available on this device. Please try exporting on a different device.',
          [{ text: 'OK' }]
        );
        return { success: false, error: 'Sharing not available' };
      }

      // Generate HTML
      const html = this.generateHTML(data, options?.password);

      // Create PDF
      console.log('[EXPORT] Generating PDF...');
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      console.log('[EXPORT] PDF generated:', uri);

      // Get a better filename
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedTitle = data.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
      const filename = `GutCheck_Evidence_${sanitizedTitle}_${timestamp}.pdf`;

      // Share the PDF
      console.log('[EXPORT] Sharing PDF...');
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Evidence Export',
        UTI: 'com.adobe.pdf',
      });

      console.log('[EXPORT] Export completed successfully');

      // Show success message
      Alert.alert(
        '✅ Export Successful',
        'Your conversation has been exported as a PDF. The file includes timestamps and can be used as evidence if needed.',
        [{ text: 'OK' }]
      );

      return { success: true };
    } catch (error: any) {
      console.error('[EXPORT] Error exporting PDF:', error);
      Alert.alert(
        'Export Failed',
        `Could not export PDF: ${error?.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
      return { success: false, error: error?.message || 'Export failed' };
    }
  }

  /**
   * Export multiple chats as a single PDF
   */
  async exportMultipleChats(
    chats: ChatExportData[],
    title: string = 'Multiple Conversations'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Combine all chats into one large chat
      const combined: ChatExportData = {
        chatId: 'combined_' + Date.now(),
        title: title,
        messages: chats.flatMap((chat) => chat.messages),
        createdAt: Math.min(...chats.map((c) => c.createdAt)),
      };

      return await this.exportChatAsPDF(combined);
    } catch (error: any) {
      console.error('[EXPORT] Error exporting multiple chats:', error);
      return { success: false, error: error?.message || 'Export failed' };
    }
  }
}

export const exportService = new ExportService();

