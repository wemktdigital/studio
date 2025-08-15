'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RightPaneContextType {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  content: ReactNode | null;
  setContent: (content: ReactNode) => void;
  panelTitle: string;
  setPanelTitle: (title: string) => void;
}

const RightPaneContext = createContext<RightPaneContextType | undefined>(undefined);

export function RightPaneProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [panelTitle, setPanelTitle] = useState('Details');

  return (
    <RightPaneContext.Provider value={{ isOpen, setOpen, content, setContent, panelTitle, setPanelTitle }}>
      {children}
    </RightPaneContext.Provider>
  );
}

export function useRightPane() {
  const context = useContext(RightPaneContext);
  if (context === undefined) {
    throw new Error('useRightPane must be used within a RightPaneProvider');
  }
  return context;
}
