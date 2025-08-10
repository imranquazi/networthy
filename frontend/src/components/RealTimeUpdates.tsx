'use client';
import { useEffect, useState } from 'react';

interface RealTimeUpdate {
  type: 'platform_update' | 'initial_data' | 'connected' | 'ping';
  userId?: string;
  platform?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

interface RealTimeUpdatesProps {
  onUpdate?: (update: RealTimeUpdate) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export default function RealTimeUpdates({ onUpdate, onConnect, onDisconnect }: RealTimeUpdatesProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealTimeUpdate | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectToSSE = () => {
      try {
        // Try to get token for authentication
        const token = localStorage.getItem('authToken');
        const url = token 
          ? `http://localhost:4000/api/websocket?token=${encodeURIComponent(token)}`
          : 'http://localhost:4000/api/websocket';
        
        eventSource = new EventSource(url, {
          withCredentials: true
        });

        eventSource.onopen = () => {
          console.log('🔗 Real-time connection established');
          setIsConnected(true);
          onConnect?.();
        };

        eventSource.onmessage = (event) => {
          try {
            const data: RealTimeUpdate = JSON.parse(event.data);
            console.log('📡 Real-time update received:', data);
            
            setLastUpdate(data);
            onUpdate?.(data);
          } catch (error) {
            console.error('❌ Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.log('❌ SSE connection error (this is normal if not authenticated):', error);
          setIsConnected(false);
          onDisconnect?.();
          
          // Only attempt to reconnect if we have a token
          const token = localStorage.getItem('authToken');
          if (token) {
            setTimeout(() => {
              if (eventSource) {
                eventSource.close();
                connectToSSE();
              }
            }, 5000);
          }
        };
              } catch (error) {
          console.log('❌ Failed to establish SSE connection (this is normal if not authenticated):', error);
          setIsConnected(false);
        }
    };

    connectToSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [onUpdate, onConnect, onDisconnect]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
        isConnected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        {isConnected ? 'Live Updates' : 'Offline'}
      </div>
      
      {lastUpdate && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <div className="font-medium text-blue-800">
            Last Update: {lastUpdate.platform}
          </div>
          {lastUpdate.timestamp && (
            <div className="text-blue-600">
              {new Date(lastUpdate.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 