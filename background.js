'use strict';

import * as config from '/js/config.js';

import * as storageModule from '/js/storage.js';
import * as helperModule from '/js/helper.js';
import * as windowModule from'/js/window.js';
import * as notificationModule from'/js/notification.js';

chrome.runtime.onStartup.addListener(onBrowserStartAsync);
chrome.tabs.onUpdated.addListener(onTabUpdatedAsync);
chrome.notifications.onButtonClicked.addListener(notificationModule.onButtonClicked);
chrome.windows.onRemoved.addListener(onWindowClosedAsync);

/**
 * Öffne eine URL entweder im vorhandenen Fenster oder erstelle ein neues Fenster. 
 * @param {string} url Die zu öffnende Adresse.
 * @param {number?} tabId Bezeichner des Tabs, falls vorhanden.
 */
async function openUrlAsync(url, tabId) {
    if (tabId == null) {
        await openNewWindowAsync(url);
    }
    else {
        navigateToUrl(tabId, url);
    }
}


/**
 * Öffnet ein neues, zentriertes Fenster und öffnet eine URL.
 * @param {string} url Adresse der Webseite, die geöffnet werden soll.
 */
async function openNewWindowAsync(url) {
    if (!helperModule.isUrl(url)) {
        return;
    }

    console.log('Create new window and open URL.');
    
    const point = await windowModule.calcCenterWindow(config.newWindowWidth, config.newWindowHeight);
    let window = await chrome.windows.create({
        focused: true,
        height: config.newWindowHeight,
        width: config.newWindowWidth,
        left: point.left,
        top: point.top,
        type: config.newWindowType,
        url: url
    });

    await storageModule.saveVariablesAsync(window.tabs[0].id, window.id);

    console.log(`A new tab with id ${window.tabs[0].id} was created.`);
}


/**
 * Navigiert eine URL im Browser im vorgegebenen Tab an.
 * @param {number} tabId Bezeichner des Tabs, indem die Webseite geöffnet werden soll.
 * @param {string} newUrl Adresse der Webseite, die geöffnet werden soll.
 */
function navigateToUrl(tabId, newUrl) {
    if (!tabId || !helperModule.isUrl(newUrl)) {
        return;
    }
    console.log(`Call the URL in the open tab with id ${tabId}.`);
    chrome.tabs.update(tabId, {
        url: newUrl
    });
}


/**
 * Entfernt einen Tab.
 * @param {number} tabId Bezeichner des Tabs, der entfernt werden soll.
 */
function removeTab(tabId) {
    if (tabId != null) {
        console.log(`Remove tab with id ${tabId}.`);
        chrome.tabs.remove(tabId);
    }
}


/**
 * Listener für Aktualisierung eines Tabs.
 * Zeigt entweder eine Benachrichtigung an oder öffnet die URL in einem separaten Fenster,
 * wenn eines der Muster passt.
 * @param {number} tabId Bezeichner des Tabs, der aktualisiert wurde.
 * @param {object} changeInfo Information über die Veränderungen.
 * @param {Tab} tab Der Tab, der aktualisiert wurde.
 */
async function onTabUpdatedAsync(tabId, changeInfo, tab) {
    const popupTabId = await storageModule.getVariableAsync('PopupTabId');
    const popupWindowId = await storageModule.getVariableAsync('PopupWindowId');

    if (popupTabId != tabId &&
        !helperModule.isEmpty(changeInfo.url) &&
        !helperModule.isEmpty(config.handleUrl)) {
        console.log(`A new tab with id ${tabId} was detected.`);
        if (tab.url.includes(config.closeWarningUrl)) {
            notificationModule.showNotification(tabId);
        }
        else if (tab.url.includes(config.handleUrl)) {
            await openUrlAsync(tab.url, popupTabId);
            windowModule.focusWindow(popupWindowId);
            removeTab(tabId);
        }
    }
}


/**
 * Listener für das Schließen eines Fensters.
 * Setzt alle gespeicherten Variablen zurück, falls das separate Fenster geschlossen wurde.
 * @param {number} closedWindowId Bezeichner des Tabs, der geschlossen wurde.
 */
async function onWindowClosedAsync(closedWindowId) {
    const popupWindowId = await storageModule.getVariableAsync('PopupWindowId');
    if (closedWindowId == popupWindowId) {
        await storageModule.resetVariablesAsync();
    }
}


/**
 * Setzt alle gespeicherten Variablen beim Starten des Browsers zurück.
 */
async function onBrowserStartAsync() {
    console.log('Clear storage at startup.');
    await storageModule.resetVariablesAsync();
}