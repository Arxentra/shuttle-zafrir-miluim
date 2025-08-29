// WebSocket service to replace Supabase real-time subscriptions
type EventCallback = (payload: any) => void;
type ChannelEvents = {
  [eventType: string]: EventCallback[];
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private channels: { [channelName: string]: ChannelEvents } = {};
  private wsUrl: string;

  constructor() {
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    const { channel, event, payload } = data;
    
    if (this.channels[channel] && this.channels[channel][event]) {
      this.channels[channel][event].forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  // Create a channel (similar to Supabase channel)
  channel(name: string) {
    if (!this.channels[name]) {
      this.channels[name] = {};
    }

    return {
      on: (event: string, callback: EventCallback) => {
        if (!this.channels[name][event]) {
          this.channels[name][event] = [];
        }
        this.channels[name][event].push(callback);

        // Subscribe to the channel on the server
        this.subscribe(name, event);

        return this;
      },
      
      subscribe: (callback?: () => void) => {
        // Send subscription message to server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'subscribe',
            channel: name
          }));
        }
        
        if (callback) callback();
        return 'SUBSCRIBED';
      },

      unsubscribe: () => {
        // Send unsubscription message to server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'unsubscribe',
            channel: name
          }));
        }

        // Clean up local channel
        delete this.channels[name];
      }
    };
  }

  private subscribe(channel: string, event: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel,
        event
      }));
    }
  }

  // Remove a channel (similar to Supabase removeChannel)
  removeChannel(channelName: string) {
    if (this.channels[channelName]) {
      // Send unsubscription message
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'unsubscribe',
          channel: channelName
        }));
      }

      // Clean up local channel
      delete this.channels[channelName];
    }
  }

  // Send a message through WebSocket
  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.channels = {};
    this.reconnectAttempts = 0;
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Auto-connect when service is imported
websocketService.connect().catch(error => {
  console.error('Failed to connect to WebSocket:', error);
});

// Mock for Supabase compatibility - channels will be handled by websocketService
export const createMockSupabaseChannel = (channelName: string) => {
  return websocketService.channel(channelName);
};