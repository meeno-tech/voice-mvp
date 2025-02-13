import { Colors } from "constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRoomContext, useVoiceAssistant } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";

/**
 * Smoothly chase one Animated.Value to a target,
 * moving e.g. 20% closer per frame.
 */
function chase(animatedValue: Animated.Value, target: number, factor = 0.2) {
  // WARNING: We access the internal _value for brevity.
  // Officially you'd do animatedValue.stopAnimation(callback => {...})
  // to get the current. But for demonstration:
  const current = (animatedValue as any)._value ?? 4;
  const next = current + factor * (target - current);
  animatedValue.setValue(next);
}

export function SimpleVoiceAssistant(props: {
  onStateChange: (state: string) => void;
  onInteractionSuccess: (interactionSuccess: boolean) => void;
  onConnectButtonClick: () => void;
  onDisconnectButtonClick: () => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const room = useRoomContext();

  room.on(RoomEvent.DataReceived, (payload, participant) => {
    const dataStr = new TextDecoder().decode(payload);
    let message;
    try {
      message = JSON.parse(dataStr);
    } catch (err) {
      console.error("Could not parse JSON from data channel:", dataStr);
      return;
    }
    if (message.type === "interaction_success") {
      props.onInteractionSuccess(true);
    } else {
      //Received unknown data. Skip.
    }
  });

  // Keep track of speaking vs. not
  const isSpeakingRef = useRef(false);

  // 2) Animated Values for each bar
  const animationValues = useRef([
    new Animated.Value(4),
    new Animated.Value(4),
    new Animated.Value(4),
    new Animated.Value(4),
  ]).current;

  // 3) AudioContext + AnalyserNode Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // 4) We do a single loop that runs until component unmount.
  //    Each frame, if speaking => we chase to amplitude from Analyser.
  //    If not speaking => chase to 4.
  //    If everything is stable at 4, we can optionally skip more frames.
  //    But let's keep it simple and run continuously.
  const loopActiveRef = useRef(true);

  useEffect(() => {
    const loop = () => {
      if (!loopActiveRef.current) return; // If unmounted, stop.

      const analyser = analyserRef.current;
      if (analyser && isSpeakingRef.current) {
        // We're speaking => read amplitude data
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // map 0..255 => 4..24
        for (let i = 0; i < animationValues.length; i++) {
          const amplitude = dataArray[i] / 255; // 0..1
          const target = 4 + amplitude * (24 - 4);
          chase(animationValues[i], target, 0.2); // chase ~20% each frame
        }
      } else {
        // Not speaking => chase all bars back to 4
        for (let i = 0; i < animationValues.length; i++) {
          chase(animationValues[i], 4, 0.2);
        }
      }

      requestAnimationFrame(loop);
    };

    loop(); // start the loop

    return () => {
      // Clean up on unmount
      loopActiveRef.current = false;
    };
  }, [animationValues]);

  /**
   * 5) Setup the AudioContext + AnalyserNode
   *    once we have an audioTrack with a valid mediaStream.
   */
  useEffect(() => {
    if (!audioTrack) return;

    const rawMediaTrack = audioTrack.publication.audioTrack;
    if (!rawMediaTrack) return;

    const stream = rawMediaTrack.mediaStream;
    if (!stream) return;

    // Create (or reuse) an AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;

    // Create an AnalyserNode
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32; // small FFT => fewer frequency bins
    source.connect(analyser);

    analyserRef.current = analyser;

    // Cleanup if the track changes
    return () => {
      source.disconnect();
      analyser.disconnect();
    };
  }, [audioTrack]);

  /**
   * 6) Start or stop "speaking" mode
   */
  useEffect(() => {
    // We'll let the loop do its thing.
    // We just toggle isSpeakingRef for the loop logic
    isSpeakingRef.current = state === "speaking";
    props.onStateChange(state);
  }, [state, props]);

  return (
    <View style={styles.controlBar}>
      <View style={styles.roomConnectionControl}>
        {state === "disconnected" ? (
          <TouchableOpacity onPress={props.onConnectButtonClick}>
            <Ionicons name="call" size={25} color={Colors.dark.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={props.onDisconnectButtonClick}>
            <Ionicons name="stop" size={25} color={Colors.dark.background} />
          </TouchableOpacity>
        )}
      </View>

      {state !== "disconnected" && (
        <View style={styles.soundBarsContainer}>
          {animationValues.map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.soundBar, { height: anim }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controlBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  roomConnectionControl: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  soundBarsContainer: {
    height: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  soundBar: {
    width: 4,
    backgroundColor: Colors.dark.tint,
    borderRadius: 2,
  },
});
