'use strict';

import {handleUrl} from '/js/config.js';
import {closeWarningUrl} from '/js/config.js';

import * as helperModule from '/js/helper.js';
import * as windowModule from'/js/window.js';
import * as notificationModule from'/js/notification.js';

/**
 * Setzt alle gespeicherten Variablen zurück.
 */
function setVariablesToNull(){
    chrome.storage.local.set({'PopupTabId': null }, function() {
        console.log('Set property PopupTabId to null.');
    });
    chrome.storage.local.set({'PopupWindowId': null }, function() {
        console.log('Set property PopupWindowId to null.');
    });
}


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
    const width = 1200;
    const height = 750;
    const point = await windowModule.calcCenterWindow(width, height);
    let window = await chrome.windows.create({
        focused: true,
        height: height,
        width: width,
        left: point.left,
        top: point.top,
        type: "popup",
        url: url
    });
    chrome.storage.local.set({'PopupTabId': window.tabs[0].id}, function() {
        console.log(`Save value ${window.tabs[0].id} for property PopupTabId.`);
    });
    chrome.storage.local.set({'PopupWindowId': window.id}, function() {
        console.log(`Save value ${window.id} for property PopupWindowId.`);
    });

    console.log(`A new tab with id was created.`);
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
    const data = await chrome.storage.local.get(['PopupTabId', 'PopupWindowId']);
    const popupTabId = data.PopupTabId;
    const popupWindowId = data.PopupWindowId;

    if (popupTabId != tabId &&
        !helperModule.isEmpty(changeInfo.url) &&
        !helperModule.isEmpty(handleUrl)) {
        console.log(`A new tab with id ${tabId} was detected.`);
        if (tab.url.includes(closeWarningUrl)) {
            notificationModule.showNotification(tabId);
        }
        else if (tab.url.includes(handleUrl)) {
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
    const popupWindowId = (await chrome.storage.local.get(['PopupWindowId'])).PopupWindowId;
    if (closedWindowId == popupWindowId) {
        setVariablesToNull();
    }
}


/**
 * Setzt alle gespeicherten Variablen beim Starten des Browsers zurück.
 */
function onBrowserStart() {
    console.log('Clear storage at startup.');
    setVariablesToNull();
}


chrome.runtime.onStartup.addListener(onBrowserStart);
chrome.tabs.onUpdated.addListener(onTabUpdatedAsync);
chrome.notifications.onButtonClicked.addListener(notificationModule.onButtonClicked);
chrome.windows.onRemoved.addListener(onWindowClosedAsync);