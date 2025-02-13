import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "components/ThemedText";
import { ThemedView } from "components/ThemedView";

interface Testimonial {
  text: string;
  author: string;
}

const testimonials: Testimonial[] = [
  {
    text: "The practice sessions are incredibly helpful. Highly recommend!",
    author: "James K.",
  },
  {
    text: "Finally, relationship skills explained in a way that makes sense.",
    author: "Alex P.",
  },
  {
    text: "This app completely changed how I approach relationships!",
    author: "Sarah M.",
  },
];

export function TestimonialSection() {
  return (
    <Animated.View
      entering={FadeInUp.delay(800).springify()}
      style={styles.testimonialsSection}
    >
      <ThemedText type="subtitle" style={styles.testimonialTitle}>
        What Users Say
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.testimonialContainer}
        decelerationRate="fast"
        snapToInterval={Platform.OS === "web" ? 344 : 296}
        snapToAlignment="center"
      >
        {testimonials.map((testimonial, index) => (
          <ThemedView key={index} style={styles.testimonialCard}>
            <ThemedText style={styles.testimonialText}>
              "{testimonial.text}"
            </ThemedText>
            <ThemedText style={styles.testimonialAuthor}>
              - {testimonial.author}
            </ThemedText>
          </ThemedView>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  testimonialsSection: {
    marginBottom: Platform.OS === "web" ? 40 : 20,
    marginLeft: 8,
  } as ViewStyle,
  testimonialTitle: {
    textAlign: "center",
    marginBottom: Platform.OS === "web" ? 24 : 16,
    fontSize: Platform.OS === "web" ? 32 : 24,
  } as TextStyle,
  scrollView: {
    marginHorizontal: Platform.OS === "web" ? -40 : -20,
  } as ViewStyle,
  testimonialContainer: {
    paddingHorizontal: Platform.OS === "web" ? 40 : 20,
    paddingBottom: 8,
    flexDirection: "row",
    gap: Platform.OS === "web" ? 10 : 16,
  } as ViewStyle,
  testimonialCard: {
    width: Platform.OS === "web" ? 320 : 280,
    padding: Platform.OS === "web" ? 24 : 20,
    borderRadius: Platform.OS === "web" ? 20 : 16,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }
      : Platform.OS === "android"
      ? { elevation: 3 }
      : {}),
    // add a shadow to the card
    backgroundColor: "rgba(0,0,0,0.2)",
  } as ViewStyle,
  testimonialText: {
    fontSize: Platform.OS === "web" ? 18 : 16,
    lineHeight: Platform.OS === "web" ? 28 : 24,
    marginBottom: Platform.OS === "web" ? 16 : 12,
    fontStyle: "italic",
  } as TextStyle,
  testimonialAuthor: {
    fontSize: Platform.OS === "web" ? 16 : 14,
    opacity: 0.8,
  } as TextStyle,
});
