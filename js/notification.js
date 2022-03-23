/**
 * Zeige eine Benachrichtigung an.
 * @param {number} tabId Bezeichner des Tabs.
 */
 export function showNotification(tabId) {
    const notificationId = `TabsWarningMessage-${Date.now()}`;
    chrome.notifications.create(notificationId,
        {
            type: "basic",
            title: "Dokument noch in Bearbeitung",
            message: "Der aktuelle Bearbeitungsstand geht verloren, wenn Sie die Seite wechseln.",
            iconUrl: "/icons/tabs-128x128.png",
            requireInteraction: true
        });
}
