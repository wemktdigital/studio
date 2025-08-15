
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "./user-avatar";
import { Hash, Loader2 } from "lucide-react";
import { SmartSuggestionOutput } from "@/ai/flows/smart-suggestion";

interface SmartSuggestionPopoverProps {
  suggestions: SmartSuggestionOutput['suggestions'];
  onSelect: (name: string) => void;
  prefix: string;
  isLoading: boolean;
}

export default function SmartSuggestionPopover({
  suggestions,
  onSelect,
  prefix,
  isLoading,
}: SmartSuggestionPopoverProps) {
  
  const hasContent = suggestions && suggestions.length > 0;

  return (
    <Card className="absolute bottom-full mb-2 w-72 max-h-80 overflow-y-auto" data-testid="smart-suggestion-popover">
      <CardContent className="p-2">
        <p className="p-2 text-xs font-semibold text-muted-foreground">
          Suggestions for "{prefix}"
        </p>
        {isLoading && !hasContent && (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )}
        {!isLoading && !hasContent && (
            <p className="p-2 text-sm text-muted-foreground text-center">No suggestions found.</p>
        )}
        {hasContent && (
          <ul>
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                  onClick={() => onSelect(item.name)}
                >
                  {item.type === 'user' ? (
                    <UserAvatar user={{...item, avatarUrl: `https://i.pravatar.cc/40?u=${item.id}`, status: 'online', handle: item.name}} className="h-6 w-6" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-medium">{item.name}</span>
                  {item.type === 'user' && (
                    <span className="text-sm text-muted-foreground">@{item.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
