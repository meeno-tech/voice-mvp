import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateUniqueRoomName } from 'utils/roomUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Define button size based on screen size
const getButtonSize = () => {
  if (SCREEN_WIDTH < 320) {
    return 50;
  } else {
    return 60;
  }
};

const BUTTON_SIZE = getButtonSize();
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 40, 400);
// Calculate a reasonable max height based on screen size
const MODAL_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 600);

// Helper function to get modal padding based on screen size
const getModalPadding = () => {
  if (SCREEN_WIDTH < 320) {
    return 12;
  } else if (SCREEN_WIDTH < 375) {
    return 16;
  } else {
    return Platform.OS === 'web' ? 24 : 20;
  }
};

// Helper function to get content spacing based on screen size
const getContentSpacing = () => {
  if (SCREEN_WIDTH < 320) {
    return 8;
  } else if (SCREEN_WIDTH < 375) {
    return 12;
  } else {
    return 16;
  }
};

// Helper function to get input height based on screen size
const getInputHeight = () => {
  if (SCREEN_WIDTH < 320) {
    return 36;
  } else {
    return 40;
  }
};

// Helper function to get multiline input height based on screen size
const getMultilineInputHeight = () => {
  if (SCREEN_WIDTH < 320) {
    return 60;
  } else {
    return 80;
  }
};

// Helper function to get number of lines for multiline input
const getMultilineLines = () => {
  if (SCREEN_WIDTH < 320) {
    return 3;
  } else {
    return 4;
  }
};

// Helper function to get checkmark indicator size
const getCheckmarkSize = () => {
  if (SCREEN_WIDTH < 320) {
    return {
      container: 12,
      icon: 8,
    };
  } else {
    return {
      container: 16,
      icon: 12,
    };
  }
};

// Helper function to determine if mood name should be truncated
const shouldTruncateMoodName = (name: string) => {
  return SCREEN_WIDTH < 300 && name.length > 6;
};

// Define colors with proper typing
const RAINBOW_COLORS = ['#FF5F6D', '#FFC371', '#38ef7d', '#11998e', '#8E2DE2', '#4A00E0'] as const;

const MOOD_COLORS = [
  { name: 'Calm', colors: ['#4facfe', '#00f2fe'] as const, textColor: '#000', emoji: '😌' },
  { name: 'Energetic', colors: ['#ff8177', '#ff867a'] as const, textColor: '#000', emoji: '⚡' },
  { name: 'Mysterious', colors: ['#6a11cb', '#2575fc'] as const, textColor: '#fff', emoji: '🔮' },
  { name: 'Playful', colors: ['#ff9a9e', '#fad0c4'] as const, textColor: '#000', emoji: '🎮' },
  { name: 'Serious', colors: ['#434343', '#000000'] as const, textColor: '#fff', emoji: '🧐' },
  { name: 'Cheerful', colors: ['#f6d365', '#fda085'] as const, textColor: '#000', emoji: '😄' },
  { name: 'Flirty', colors: ['#ff758c', '#ff7eb3'] as const, textColor: '#000', emoji: '💖' },
  { name: 'Peaceful', colors: ['#a1c4fd', '#c2e9fb'] as const, textColor: '#000', emoji: '🕊️' },
];

// Helper function to determine mood color grid layout based on screen size
const getMoodColorGridStyle = () => {
  // For extremely small screens, use 4 columns (25% width each) with minimal margins
  if (SCREEN_WIDTH < 280) {
    return 'w-[24%] mb-1';
  }
  // For very small screens, use 4 columns (25% width each)
  else if (SCREEN_WIDTH < 320) {
    return 'w-[24%] mb-2';
  }
  // For small screens, use 4 columns (25% width each)
  else if (SCREEN_WIDTH < 375) {
    return 'w-[24%] mb-3';
  }
  // For normal screens, use 4 columns (25% width each) with more spacing
  else if (SCREEN_WIDTH < 768) {
    return 'w-[24%] mb-3';
  }
  // For large screens
  else {
    return 'w-[24%] mb-4';
  }
};

// Helper function to determine mood circle size based on screen size
const getMoodCircleSize = () => {
  if (SCREEN_WIDTH < 280) {
    return 30; // Extremely small screens
  } else if (SCREEN_WIDTH < 320) {
    return 35; // Very small screens
  } else if (SCREEN_WIDTH < 375) {
    return 40; // Small screens
  } else {
    return 50; // Normal screens
  }
};

// Helper function to determine emoji text size based on screen size
const getEmojiTextSize = () => {
  if (SCREEN_WIDTH < 320) {
    return 'text-base';
  } else {
    return 'text-xl';
  }
};

// Helper function to get button padding based on screen size
const getButtonPadding = () => {
  if (SCREEN_WIDTH < 320) {
    return 'py-2';
  } else if (SCREEN_WIDTH < 768) {
    return 'py-2.5';
  } else {
    return 'py-3';
  }
};

// Helper function to get button container margins
const getButtonContainerStyle = () => {
  if (SCREEN_WIDTH < 320) {
    return {
      marginTop: 4,
      marginBottom: 0,
    };
  } else if (SCREEN_WIDTH < 768) {
    return {
      marginTop: 0,
      marginBottom: 0,
    };
  } else {
    return {
      marginTop: 12,
      marginBottom: 0,
    };
  }
};

// Helper function to get scroll view padding
const getScrollViewPadding = () => {
  if (SCREEN_WIDTH < 320) {
    return {
      paddingBottom: 8,
      gap: 8,
    };
  } else if (SCREEN_WIDTH < 768) {
    return {
      paddingBottom: 8,
      gap: 12,
    };
  } else {
    return {
      paddingBottom: 8,
      gap: 16,
    };
  }
};

export const CreateRoomButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [personName, setPersonName] = useState('');
  const [selectedMood, setSelectedMood] = useState(MOOD_COLORS[0]);
  const animatedScale = useRef(new Animated.Value(1)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedTranslateY = useRef(new Animated.Value(100)).current;
  const animatedRotate = useRef(new Animated.Value(0)).current;
  const animatedModalScale = useRef(new Animated.Value(0.8)).current;
  const animatedPulse = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const formAnimations = {
    title: useRef(new Animated.Value(0)).current,
    promptInput: useRef(new Animated.Value(0)).current,
    nameInput: useRef(new Animated.Value(0)).current,
    colorPicker: useRef(new Animated.Value(0)).current,
    button: useRef(new Animated.Value(0)).current,
  };

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const openModal = () => {
    setModalVisible(true);

    // Main modal animation
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(animatedTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(animatedModalScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(animatedRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animation for form elements
    Animated.stagger(100, [
      Animated.spring(formAnimations.title, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.spring(formAnimations.nameInput, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.spring(formAnimations.promptInput, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.spring(formAnimations.colorPicker, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.spring(formAnimations.button, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start();
  };

  const closeModal = () => {
    // Reset form animations
    Object.values(formAnimations).forEach((anim) => {
      anim.setValue(0);
    });

    // Main modal closing animation
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedTranslateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedModalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedRotate, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      // Reset form
      setPrompt('');
      setPersonName('');
      setSelectedMood(MOOD_COLORS[0]);
    });
  };

  const handleCreateRoom = () => {
    if (!prompt.trim()) {
      alert('Please describe the conversation scenario');
      return;
    }

    // Create a custom room name based on the person's name or conversation topic
    let customRoomName = 'custom';

    // If person name is provided, use it as part of the room name
    if (personName.trim()) {
      // Convert to lowercase, replace spaces with hyphens, and remove special characters
      customRoomName = personName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    } else {
      // Otherwise, use the first few words of the prompt
      const promptWords = prompt.trim().split(/\s+/).slice(0, 3).join('-');
      customRoomName = promptWords
        .toLowerCase()
        .replace(/[^a-z0-9-\s]/g, '')
        .replace(/\s+/g, '-');
    }

    // Ensure we have a valid room name
    if (!customRoomName || customRoomName === 'custom') {
      customRoomName = 'custom-conversation';
    }

    // Generate a unique room name based on the custom name
    const timestamp = Date.now();
    const uniqueRoomId = generateUniqueRoomName(customRoomName);

    // Create simulation config for metadata
    const simulationConfig = {
      // Character customization - use the provided name or a default
      name: personName.trim() || 'Conversation Partner',

      // Scene customization
      scene_description: prompt.trim(),
      scene_goal: 'Have a meaningful conversation',
      user_role: 'yourself',
      ai_role: 'the conversation partner',

      // Add the custom room name for display in the UI
      custom_room_name: customRoomName,
    };

    // Add query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('t', timestamp.toString());

    // Add metadata as a query parameter (will be extracted in the room component)
    queryParams.append('metadata', encodeURIComponent(JSON.stringify(simulationConfig)));

    const roomPathWithParams = `/(home)/${uniqueRoomId}?${queryParams.toString()}`;

    closeModal();

    // Navigate to the new room
    if (Platform.OS === 'web') {
      const baseUrl = window.location.origin;
      const fullPath = `${baseUrl}${roomPathWithParams}`;
      window.location.href = fullPath;
    } else {
      router.push(roomPathWithParams);
    }
  };

  // Add a subtle pulse animation when the component mounts
  useEffect(() => {
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(animatedPulse, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!modalVisible) {
          pulseAnimation();
        }
      });
    };

    pulseAnimation();

    return () => {
      animatedPulse.stopAnimation();
    };
  }, [modalVisible]);

  const spin = animatedRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={openModal}
        className="absolute bottom-4 right-4 z-50 md:bottom-8 md:right-8">
        <Animated.View
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: BUTTON_SIZE / 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            transform: [
              { scale: modalVisible ? animatedScale : animatedPulse },
              { rotate: modalVisible ? spin : '0deg' },
            ],
          }}>
          <LinearGradient
            colors={RAINBOW_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-full w-full items-center justify-center rounded-full">
            <View
              className="items-center justify-center rounded-full bg-white"
              style={{
                width: BUTTON_SIZE - 4,
                height: BUTTON_SIZE - 4,
              }}>
              <Ionicons name="add" size={BUTTON_SIZE / 2} color="#000" />
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      <Modal transparent visible={modalVisible} animationType="none" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 items-center justify-center">
          <TouchableOpacity
            className="w-full flex-1 items-center justify-center bg-black/50"
            activeOpacity={1}
            onPress={closeModal}>
            <Animated.View
              style={{
                width: MODAL_WIDTH,
                backgroundColor: 'white',
                borderRadius: 20,
                padding: getModalPadding(),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
                maxHeight: MODAL_MAX_HEIGHT,
                opacity: animatedOpacity,
                transform: [{ translateY: animatedTranslateY }, { scale: animatedModalScale }],
                margin: 16,
              }}>
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{
                    ...getScrollViewPadding(),
                  }}>
                  <Animated.View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: formAnimations.title,
                      transform: [
                        {
                          translateY: formAnimations.title.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    }}>
                    <Text className="text-lg font-bold md:text-xl">New Conversation</Text>
                    <TouchableOpacity onPress={closeModal} className="p-1">
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    style={{
                      marginBottom: getContentSpacing(),
                      opacity: formAnimations.nameInput,
                      transform: [
                        {
                          translateY: formAnimations.nameInput.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    }}>
                    <Text className="mb-2 text-sm font-medium md:text-base">
                      Who do you want to talk to?
                    </Text>
                    <TextInput
                      className="rounded-xl border border-gray-300 bg-gray-50 p-2 text-sm md:p-3 md:text-base"
                      value={personName}
                      onChangeText={setPersonName}
                      placeholder="Enter a name (e.g., Einstein, Mom)"
                      placeholderTextColor="#999"
                      style={{ minHeight: getInputHeight() }}
                    />
                  </Animated.View>

                  <Animated.View
                    style={{
                      marginBottom: getContentSpacing(),
                      opacity: formAnimations.promptInput,
                      transform: [
                        {
                          translateY: formAnimations.promptInput.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    }}>
                    <Text className="mb-2 text-sm font-medium md:text-base">
                      What&apos;s the scenario?
                    </Text>
                    <TextInput
                      className="rounded-xl border border-gray-300 bg-gray-50 p-2 text-sm md:p-3 md:text-base"
                      value={prompt}
                      onChangeText={setPrompt}
                      placeholder="Describe the conversation you want to have"
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={getMultilineLines()}
                      textAlignVertical="top"
                      style={{ minHeight: getMultilineInputHeight() }}
                    />
                  </Animated.View>

                  <Animated.View
                    style={{
                      marginBottom: getContentSpacing(),
                      opacity: formAnimations.colorPicker,
                      transform: [
                        {
                          translateY: formAnimations.colorPicker.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    }}>
                    <Text className="mb-2 text-sm font-medium md:text-base">Mood</Text>
                    <View className="flex-row flex-wrap justify-between">
                      {MOOD_COLORS.map((mood, index) => {
                        const isSelected = selectedMood === mood;
                        const moodItemStyle = getMoodColorGridStyle();
                        return (
                          <TouchableOpacity
                            key={index}
                            onPress={() => setSelectedMood(mood)}
                            className={`items-center ${moodItemStyle}`}>
                            <Animated.View
                              style={[
                                { alignItems: 'center', justifyContent: 'center' },
                                isSelected && { transform: [{ scale: 1.1 }] },
                              ]}>
                              <LinearGradient
                                colors={mood.colors}
                                style={{
                                  width: getMoodCircleSize(),
                                  height: getMoodCircleSize(),
                                  borderRadius: getMoodCircleSize() / 2,
                                  marginBottom: 2,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.2,
                                  shadowRadius: 3,
                                  elevation: 3,
                                }}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}>
                                <Text className={getEmojiTextSize()}>{mood.emoji}</Text>
                                {isSelected && (
                                  <View
                                    style={{
                                      height: getCheckmarkSize().container,
                                      width: getCheckmarkSize().container,
                                    }}
                                    className="absolute bottom-0 right-0 items-center justify-center rounded-full bg-white/70">
                                    <Ionicons
                                      name="checkmark"
                                      size={getCheckmarkSize().icon}
                                      color={mood.textColor}
                                    />
                                  </View>
                                )}
                              </LinearGradient>
                              <Text
                                className={`mt-1 text-center ${SCREEN_WIDTH < 320 ? 'text-[10px]' : 'text-xs'} font-medium`}>
                                {shouldTruncateMoodName(mood.name)
                                  ? mood.name.substring(0, 6)
                                  : mood.name}
                              </Text>
                            </Animated.View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>

                  <Animated.View
                    style={{
                      opacity: formAnimations.button,
                      transform: [
                        {
                          translateY: formAnimations.button.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                      ...getButtonContainerStyle(),
                    }}>
                    <TouchableOpacity
                      className="overflow-hidden rounded-xl"
                      onPress={handleCreateRoom}>
                      <LinearGradient
                        colors={selectedMood.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className={`items-center justify-center ${getButtonPadding()}`}>
                        <Text
                          className="text-sm font-bold md:text-base"
                          style={{ color: selectedMood.textColor }}>
                          Start Conversation
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </ScrollView>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

export default CreateRoomButton;
