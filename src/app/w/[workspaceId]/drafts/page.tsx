
import React from 'react';
import { Braces } from 'lucide-react';

export default function DraftsPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-muted p-4">
        <Braces className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">Drafts & Sent</h1>
      <p className="max-w-md text-muted-foreground">
        Your drafted and sent messages will be shown here. You can start writing a message and come back to it later.
      </p>
    </div>
  );
}
