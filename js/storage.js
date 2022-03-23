/**
 * Setzt alle gespeicherten Variablen zurück.
 */
 export async function resetVariablesAsync(){
    await saveVariableAsync('PopupTabId', null);
    await saveVariableAsync('PopupWindowId', null);
    await saveVariableAsync('CurrentURL', null);
}


/**
 * Speichert alle Variablen persistent.
 * @param {?number} tabId Bezeichner des Tabs.
 * @param {?number} windowId Bezeichner des Fensters.
 * @param {?string} currentURL Aktuelle URL.
 */
 export async function saveVariablesAsync(tabId = undefined, windowId = undefined, currentURL = undefined){
    await saveVariableAsync('PopupTabId', tabId);
    await saveVariableAsync('PopupWindowId', windowId);
    await saveVariableAsync('CurrentURL', currentURL);
}


/**
 * Speichert einen Wert persistent.
 * @param {!string} property Name der Konfiguration.
 * @param {?any} value Wert.
 */
 export async function saveVariableAsync(property, value = undefined){
    if(value !== undefined){
        await chrome.storage.local.set({[property]: value}, function() {
            console.log(`Save value ${value} for property ${property}.`);
        });
    }
}


/**
 * Fragt einen Wert ab.
 * @param {!string} property Name der Konfiguration.
 */
 export async function getVariableAsync(property){
    const data = await chrome.storage.local.get([property]);
    return data[property];
}

