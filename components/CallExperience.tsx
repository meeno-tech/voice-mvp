import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { Participant } from 'livekit-client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AudioVisualizer } from './AudioVisualizer';

export const CallExperience = () => {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  // Filter out the local participant to get only remote participants
  const remoteParticipants = participants.filter(
    (p: Participant) => p.identity !== localParticipant.identity
  );

  return (
    <View style={styles.container}>
      {/* Local participant (you) */}
      <View style={styles.participantContainer}>
        <AudioVisualizer isLocal={true} barCount={5} color="#3B82F6" maxHeight={24} label="You" />
      </View>

      {/* Remote participants */}
      {remoteParticipants.map((participant: Participant) => (
        <View key={participant.identity} style={styles.participantContainer}>
          <AudioVisualizer
            participantIdentity={participant.identity}
            barCount={5}
            color="#FD4C18"
            maxHeight={24}
            label={participant.name || 'AI'}
            sensitivityMultiplier={3}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 40,
  },
  participantContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localAvatar: {
    backgroundColor: '#3B82F6',
  },
  remoteAvatar: {
    backgroundColor: '#FD4C18',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
