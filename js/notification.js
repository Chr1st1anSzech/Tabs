var notificationTabIds = {}


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
            message: "Möchten Sie die Bearbeitung des Dokuments abbrechen? Der aktuelle Bearbeitungsstand geht verloren.",
            iconUrl: "/icons/tabs-128x128.png",
            requireInteraction: true,
            buttons: [{ title: "OK" }, { title: "Abbrechen" }]
        });
    notificationTabIds[notificationId] = tabId;
}

export function onButtonClicked(notificationId, buttonIndex) {
    
}