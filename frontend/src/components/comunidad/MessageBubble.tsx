import { timeAgo } from '@/lib/utils';
import type { ChatMessage } from '@shared/types';

export function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          message.mine ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm bg-light text-primary'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <span className={`mt-0.5 block text-[10px] ${message.mine ? 'text-white/60' : 'text-brand-gray'}`}>
          {timeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
