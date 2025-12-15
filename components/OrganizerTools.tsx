
import React, { useState } from 'react';
import { ArrowLeft, Plus, MessageSquare, Users, Trash2, Ban, MicOff, MoreHorizontal, ShieldCheck, Search } from 'lucide-react';
import { Language, ChatRoom, Person } from '../types';
import { TRANSLATIONS, MOCK_PEOPLE } from '../constants';

interface OrganizerToolsProps {
  language: Language;
  onBack: () => void;
  onCreateRoom: () => void;
  chatRooms: ChatRoom[];
  initialTab?: 'rooms' | 'members';
}

const OrganizerTools: React.FC<OrganizerToolsProps> = ({ 
  language, 
  onBack, 
  onCreateRoom, 
  chatRooms,
  initialTab = 'rooms'
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'rooms' | 'members'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter mocked data for display
  const myRooms = chatRooms; // In real app, filter by hostId
  const members = MOCK_PEOPLE; // Mock member list

  const filteredRooms = myRooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-24 animate-fade-in min-h-screen bg-black flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-black/90 backdrop-blur z-30 border-b border-gray-800">
        <div className="flex items-center gap-3">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
            >
                <ArrowLeft size={20} className="text-white" />
            </button>
            <h2 className="text-xl font-athletic tracking-wide text-white flex items-center gap-2">
                <ShieldCheck size={24} className="text-yellow-500" />
                {t.organizerTools}
            </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3">
         <div className="flex bg-gray-900 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('rooms')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                 activeTab === 'rooms' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
               {t.roomList}
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                 activeTab === 'members' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
               {t.manageMembers}
            </button>
         </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
         <div className="relative">
             <input 
               type="text" 
               placeholder={t.searchMessages}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-gray-700"
             />
             <Search size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
         {activeTab === 'rooms' ? (
             <div className="space-y-3">
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-400 text-sm">{t.activeRooms} ({myRooms.length})</span>
                     <button 
                       onClick={onCreateRoom}
                       className="text-red-500 text-xs font-bold flex items-center gap-1 hover:text-red-400"
                     >
                        <Plus size={14} /> {t.createRoom}
                     </button>
                 </div>

                 {filteredRooms.map(room => (
                     <div key={room.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 items-center group">
                         <img src={room.image} className="w-12 h-12 rounded-lg object-cover bg-gray-800" />
                         <div className="flex-1 min-w-0">
                             <h3 className="text-white font-bold text-sm truncate">{room.name}</h3>
                             <div className="flex items-center gap-3 mt-1">
                                 <span className="text-xs text-gray-500 flex items-center gap-1">
                                     <Users size={12} /> {room.members}
                                 </span>
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                     room.type === 'private' ? 'border-yellow-900 text-yellow-500' : 'border-blue-900 text-blue-500'
                                 }`}>
                                     {room.type}
                                 </span>
                             </div>
                         </div>
                         <button className="p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-800">
                             <MoreHorizontal size={18} />
                         </button>
                     </div>
                 ))}
             </div>
         ) : (
             <div className="space-y-3">
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-400 text-sm">{t.totalMembers} ({members.length})</span>
                 </div>

                 {filteredMembers.map(member => (
                     <div key={member.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 items-center">
                         <div className="relative">
                             <img src={member.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                             {member.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>}
                         </div>
                         <div className="flex-1 min-w-0">
                             <h3 className="text-white font-bold text-sm truncate">{member.username}</h3>
                             <span className="text-xs text-gray-500 block">Followers: {member.followers}</span>
                         </div>
                         <div className="flex gap-2">
                             <button className="p-2 text-gray-500 hover:text-yellow-500 bg-gray-800 rounded-lg" title={t.muteUser}>
                                 <MicOff size={16} />
                             </button>
                             <button className="p-2 text-gray-500 hover:text-red-500 bg-gray-800 rounded-lg" title={t.banUser}>
                                 <Ban size={16} />
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </div>

    </div>
  );
};

export default OrganizerTools;
