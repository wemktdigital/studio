
import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ThreadsPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <MessageSquare className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Threads</h1>
      <p className="max-w-md text-muted-foreground">
        All your followed threads will be shown here. When you follow a message, any replies will appear here.
      </p>
    </div>
  );
}
