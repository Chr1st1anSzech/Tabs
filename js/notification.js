import * as config from '/js/config.js';


/**
 * Zeige eine Benachrichtigung an.
 * @param {number} tabId Bezeichner des Tabs.
 */
 export function showNotification(tabId) {
    const notificationId = `TabsWarningMessage-${Date.now()}`;

    chrome.notifications.create(notificationId,
        {
            type: "basic",
            title: config.notificationTitle,
            message: config.notificationMessage,
            iconUrl: config.notificationIcon,
            requireInteraction: true
        });
}
