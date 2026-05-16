import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.taskboard.app",
  appName: "Task Board",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
