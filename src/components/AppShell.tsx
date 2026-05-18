"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  notificationsOutline,
  settingsOutline,
} from "ionicons/icons";
import { captureInviteTokenFromUrl, consumeTabFromUrl } from "@/lib/pending-invite";
import { useUnreadNotificationCount } from "@/hooks/queries";
import { useAppNotifications } from "@/hooks/useAppNotifications";
import { ensurePushSubscription } from "@/lib/push";
import { NotificationsPanel } from "./panels/NotificationsPanel";
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
  notifications: "Notifications",
  settings: "Settings",
};

export function AppShell() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [notificationStatus, setNotificationStatus] = useState("default");
  const { requestPermission } = useReminders(true);
  useAppNotifications(true);
  const { data: unread } = useUnreadNotificationCount();

  useEffect(() => {
    captureInviteTokenFromUrl();
    const initialTab = consumeTabFromUrl();
    if (initialTab) setTab(initialTab as Tab);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; tab?: string } | null;
      if (data?.type === "navigate" && data.tab && data.tab in titles) {
        setTab(data.tab as Tab);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  const enableNotifications = useCallback(async () => {
    const pushState = await ensurePushSubscription();
    if (pushState === "unsupported") {
      const result = await requestPermission();
      setNotificationStatus(result);
      return;
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationStatus(Notification.permission);
    }
  }, [requestPermission]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    void ensurePushSubscription();
  }, [user]);

  const navigate = useCallback((next: Tab) => {
    setTab(next);
    void menuController.close();
  }, []);

  const panel = useMemo(() => {
    switch (tab) {
      case "dashboard":
        return <DashboardPanel />;
      case "tasks":
        return <TasksPanel />;
      case "notes":
        return <NotesPanel />;
      case "plans":
        return <PlansPanel />;
      case "events":
        return (
          <EventsPanel
            onEnableNotifications={enableNotifications}
            notificationStatus={notificationStatus}
          />
        );
      case "notifications":
        return <NotificationsPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <DashboardPanel />;
    }
  }, [tab, notificationStatus, enableNotifications]);

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
                <IonButton
                  fill="clear"
                  className="header-notifications-btn"
                  onClick={() => navigate("notifications")}
                  aria-label="Notifications"
                >
                  <IonIcon icon={notificationsOutline} slot="icon-only" />
                  {(unread?.count ?? 0) > 0 && (
                    <span className="header-notifications-badge" aria-hidden>
                      {unread!.count > 9 ? "9+" : unread!.count}
                    </span>
                  )}
                </IonButton>
                <IonButton
                  fill="clear"
                  className="header-settings-btn"
                  onClick={() => navigate("settings")}
                  aria-label="Settings"
                >
                  <IonIcon icon={settingsOutline} slot="icon-only" />
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
