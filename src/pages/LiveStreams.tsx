import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LiveChannel } from '@/types';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Tv, Loader2 } from 'lucide-react';

export const LiveStreams: React.FC = () => {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'channels'));
        const channelList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LiveChannel[];

        setChannels(channelList);
        if (channelList.length > 0) {
          setSelectedChannel(channelList[0]);
        }
      } catch (err) {
        console.error('فشل في جلب القنوات المباشرة:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center text-gold-500">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-extrabold text-gold-500 flex items-center gap-3">
          <Tv className="w-8 h-8" /> البث المباشر
        </h1>

        {selectedChannel && selectedChannel.streamSources.length > 0 ? (
          <div className="space-y-4">
            <VideoPlayer
              source={selectedChannel.streamSources[0]}
              posterUrl={selectedChannel.logoUrl}
            />
            <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedChannel.titleAr}</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedChannel.descriptionAr || 'بث مباشر عالي الجودة'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center rounded-2xl text-gray-400">
            لا توجد قنوات مباشرة متاحة حالياً.
          </div>
        )}

        {/* Channel Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`glass-card glass-card-hover p-4 rounded-xl flex flex-col items-center gap-3 border transition-all ${
                selectedChannel?.id === channel.id
                  ? 'border-gold-500 bg-gold-500/10'
                  : 'border-gold-500/10 hover:border-gold-500/30'
              }`}
            >
              <img
                src={channel.logoUrl}
                alt={channel.titleAr}
                className="w-16 h-16 object-contain rounded-lg bg-dark-800 p-2"
                loading="lazy"
              />
              <span className="text-sm font-semibold text-center line-clamp-1">{channel.titleAr}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveStreams;
