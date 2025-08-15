
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Hash, Lock } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const addChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').max(80, 'Channel name must be 80 characters or less.'),
  description: z.string().max(250, 'Description must be 250 characters or less.').optional(),
  isPrivate: z.boolean().default(false),
});

type AddChannelFormValues = z.infer<typeof addChannelSchema>;

interface AddChannelDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: AddChannelFormValues) => void;
}

export function AddChannelDialog({ isOpen, onOpenChange, onSubmit }: AddChannelDialogProps) {
  const form = useForm<AddChannelFormValues>({
    resolver: zodResolver(addChannelSchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
    },
  });
  
  const isPrivate = form.watch('isPrivate');

  const handleFormSubmit = (data: AddChannelFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isPrivate ? 'Create a private channel' : 'Create a channel'}</DialogTitle>
          <DialogDescription>
            Channels are where conversations happen around a topic. Use a name that is easy to find and descriptive.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         {isPrivate ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Hash className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <Input {...field} placeholder="e.g. plan-budget" className="pl-9" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="What's this channel about?" />
                  </FormControl>
                   <FormDescription>
                    This will be displayed at the top of the channel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Make private
                    </FormLabel>
                    <FormDescription>
                      When a channel is set to private, it can only be viewed or joined by invitation.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Create Channel</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
