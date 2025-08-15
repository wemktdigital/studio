'use client';

import { Calendar, Mail, Phone } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { User } from '@/lib/types';
import { UserAvatar } from './user-avatar';

const UserDetailsPane = ({ user }: { user: User }) => (
  <div className="p-4 flex flex-col items-center text-center">
    <UserAvatar user={user} className="h-24 w-24 mt-4" />
    <h3 className="text-xl font-bold mt-4">{user.displayName}</h3>
    <p className="text-muted-foreground">@{user.handle}</p>
    <p className="text-sm my-2 capitalize p-1 px-2 rounded-full" >
        <span className={`inline-block h-2 w-2 rounded-full mr-1 ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        {user.status}
    </p>

    <Separator className="my-4" />

    <div className="w-full text-left text-sm space-y-3">
        <h4 className="font-bold mb-2">Contact Information</h4>
        <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.handle}@example.com</span>
        </div>
        <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>+1 (555) 123-4567</span>
        </div>
        <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Local time: 10:30 AM</span>
        </div>
    </div>
    
  </div>
);

export default UserDetailsPane;
