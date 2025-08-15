'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface RightPaneProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function RightPane({ isOpen, onClose, children }: RightPaneProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full w-96 border-l bg-background shadow-lg"
          data-testid="right-pane"
        >
          <div className="flex h-full flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between p-4">
              <h3 className="text-lg font-bold">Details</h3>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details pane">
                <X className="h-5 w-5" />
              </Button>
            </header>
            <Separator />
            <div className="flex-1 overflow-y-auto p-4">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
                <TabsContent value="about">
                    <div className="pt-4">
                        <h4 className="font-bold mb-2">Channel Name</h4>
                        <p className="text-sm text-muted-foreground">#general</p>
                        <Separator className="my-4" />
                        <p className="text-sm">This is the default channel for everyone in the workspace.</p>
                    </div>
                </TabsContent>
                <TabsContent value="members">
                    <p className="pt-4 text-sm text-muted-foreground">Members list will be shown here.</p>
                </TabsContent>
                <TabsContent value="files">
                    <p className="pt-4 text-sm text-muted-foreground">Files shared in this channel will be listed here.</p>
                </TabsContent>
              </Tabs>
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
