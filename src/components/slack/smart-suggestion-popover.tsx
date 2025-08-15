"use client";

import { User, Channel } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "./user-avatar";
import { Hash } from "lucide-react";

interface SmartSuggestionPopoverProps {
  suggestions: any[];
  onSelect: (name: string) => void;
  prefix: string;
}

export default function SmartSuggestionPopover({
  suggestions,
  onSelect,
  prefix,
}: SmartSuggestionPopoverProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="absolute bottom-full mb-2 w-72" data-testid="smart-suggestion-popover">
      <CardContent className="p-2">
        <p className="p-2 text-xs font-semibold text-muted-foreground">
          Suggestions for "{prefix}"
        </p>
        <ul>
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                onClick={() => onSelect(item.name)}
              >
                {item.type === 'user' ? (
                  <UserAvatar user={{...item, avatarUrl: `https://i.pravatar.cc/40?u=${item.handle}`}} className="h-6 w-6" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <span className="font-medium">{item.name}</span>
                {item.type === 'user' && (
                  <span className="text-muted-foreground">@{item.handle}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
