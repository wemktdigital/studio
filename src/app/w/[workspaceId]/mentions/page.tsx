
import React from 'react';
import { AtSign } from 'lucide-react';

export default function MentionsPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <AtSign className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Mentions & Reactions</h1>
      <p className="max-w-md text-muted-foreground">
        All your mentions and reactions will be shown here. Stay on top of conversations that you're a part of.
      </p>
    </div>
  );
}
