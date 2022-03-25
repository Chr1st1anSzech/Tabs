/**
 * Speichert einen Wert persistent.
 * @param {!string} property Name der Konfiguration.
 * @param {?any} value Wert.
 */
 async function saveVariableAsync(property, value = undefined){
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
 async function getVariableAsync(property){
    const data = await chrome.storage.local.get([property]);
    return data[property];
}


/**
 * Fragt einen Wert ab.
 */
 async function setSelectValue(){
    let val = await getVariableAsync('side');
    if (val == null) {
        console.log(`No value saved.`);
        val = 'right';
    }
    select.value = val;
}


setSelectValue();

const select = document.querySelector('#side');
select.addEventListener("change", async (e) => {
    await saveVariableAsync('side', select.value);
});