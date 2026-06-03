import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Conversation, ChatMessage, SocialAuthor } from '@shared/types';

export function useConversations() {
  const [data, setData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<Conversation[]>('/community/messages').then(setData).finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

/** Conversación con un usuario; hace polling cada 5s. */
export function useConversation(code: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<SocialAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!code) return;
    const res = await api.get<{ user: SocialAuthor | null; messages: ChatMessage[] }>(
      `/community/messages/${code}`,
    );
    setUser(res.user);
    setMessages(res.messages);
  }, [code]);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetchOnce().finally(() => setLoading(false));
    timer.current = setInterval(fetchOnce, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [code, fetchOnce]);

  const send = useCallback(
    async (content: string) => {
      if (!code) return;
      const msg = await api.post<ChatMessage>(`/community/messages/${code}`, { content });
      setMessages((prev) => [...prev, msg]);
    },
    [code],
  );

  return { messages, user, loading, send };
}
