"use client";

import { useEffect, useState } from "react";
import {
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonPage,
  IonSplitPane,
  IonTabBar,
  IonTabButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  alarmOutline,
  bookOutline,
  checkmarkCircleOutline,
  gridOutline,
  mapOutline,
  settingsOutline,
} from "ionicons/icons";
import { menuController } from "@ionic/core";
import { useAuth } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { useReminders } from "@/hooks/useReminders";
import type { Tab } from "@/lib/types";
import { ApiStatusBanner } from "./ApiStatusBanner";
import { DashboardPanel } from "./panels/DashboardPanel";
import { EventsPanel } from "./panels/EventsPanel";
import { NotesPanel } from "./panels/NotesPanel";
import { PlansPanel } from "./panels/PlansPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { TasksPanel } from "./panels/TasksPanel";

const mainTabs: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: gridOutline },
  { id: "tasks", label: "Tasks", icon: checkmarkCircleOutline },
  { id: "notes", label: "Notes", icon: bookOutline },
  { id: "plans", label: "Plans", icon: mapOutline },
  { id: "events", label: "Reminders", icon: alarmOutline },
];

const titles: Record<Tab, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  notes: "Notes",
  plans: "Plans",
  events: "Reminders",
  settings: "Settings",
};

export function AppShell() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [notificationStatus, setNotificationStatus] = useState("default");
  const { requestPermission } = useReminders(true);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const enableNotifications = async () => {
    const result = await requestPermission();
    setNotificationStatus(result);
  };

  const navigate = (next: Tab) => {
    setTab(next);
    void menuController.close();
  };

  const panel = (
    <>
      {tab === "dashboard" && <DashboardPanel />}
      {tab === "tasks" && <TasksPanel />}
      {tab === "notes" && <NotesPanel />}
      {tab === "plans" && <PlansPanel />}
      {tab === "events" && (
        <EventsPanel
          onEnableNotifications={enableNotifications}
          notificationStatus={notificationStatus}
        />
      )}
      {tab === "settings" && <SettingsPanel />}
    </>
  );

  return (
    <IonApp>
      <NavigationProvider tab={tab} navigate={navigate}>
      <ApiStatusBanner />
      <IonSplitPane contentId="main-content" when="lg">
        <IonMenu contentId="main-content" type="overlay">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Menu</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="menu-brand">
              Task Board
              <span>Tasks, notes, plans</span>
            </div>
            <IonList>
              {mainTabs.map((t) => (
                <IonItem
                  key={t.id}
                  button
                  detail={false}
                  color={tab === t.id ? "primary" : undefined}
                  onClick={() => navigate(t.id)}
                >
                  <IonIcon icon={t.icon} slot="start" />
                  <IonLabel>{t.label}</IonLabel>
                </IonItem>
              ))}
              <IonItem
                button
                detail={false}
                color={tab === "settings" ? "primary" : undefined}
                onClick={() => navigate("settings")}
              >
                <IonIcon icon={settingsOutline} slot="start" />
                <IonLabel>Settings</IonLabel>
              </IonItem>
            </IonList>
            <p className="menu-user">Signed in as {user?.username}</p>
          </IonContent>
        </IonMenu>

        <IonPage id="main-content">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonMenuButton />
              </IonButtons>
              <IonTitle>{titles[tab]}</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={() => navigate("settings")} aria-label="Settings">
                  <IonIcon icon={settingsOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding main-content" scrollEvents>
            {panel}
          </IonContent>
          <IonTabBar slot="bottom" className="ion-hide-lg-up app-tab-bar">
            {mainTabs.map((t) => (
              <IonTabButton
                key={t.id}
                tab={t.id}
                selected={tab === t.id ? true : undefined}
                onClick={() => navigate(t.id)}
              >
                <IonIcon icon={t.icon} />
                <IonLabel>{t.label}</IonLabel>
              </IonTabButton>
            ))}
          </IonTabBar>
        </IonPage>
      </IonSplitPane>
      </NavigationProvider>
    </IonApp>
  );
}
