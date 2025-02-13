// app/index.tsx
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  // Redirect to the scenes tab which is our main tab now
  return <Redirect href="/(tabs)" />;
}
