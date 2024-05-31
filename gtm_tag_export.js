//Source: https://growthrunner.com/blog/export-all-tags-from-gtm-csv/

// Paste this script in the Console section of your browser Dev Tools.
gtmData = [];

var button = document.querySelector(".suite.suite-up-button.md-button.md-standard-theme.md-ink-ripple.layout-align-start-center.layout-row");

// Extract the account name
var accountNameElements = button.querySelectorAll(".suite-up-button-text-secondary");
var accountName;
if (accountNameElements.length > 1) {
    accountName = accountNameElements[1].textContent.trim();
} else {
    console.log("Expected more than one .suite-up-button-text-secondary element, found less");
}

// Extract the GTM container name
var gtmContainerNameElement = button.querySelector(".suite-up-text-name");
var gtmContainerName = gtmContainerNameElement.textContent.trim();

// GTM Container ID
var gtmNumber = document.querySelector('.gtm-container-public-id.md-gtm-theme').textContent.trim();

document.querySelectorAll('tr[gtm-table-row]').forEach(n => {
    const td2 = n.querySelector('td:nth-child(2)');
    const td3 = n.querySelector('td:nth-child(3)');
    const td4 = n.querySelector('td:nth-child(4)');
    const td5 = n.querySelector('td:nth-child(6)');

    const triggerName = td2 ? td2.textContent.trim() : '';
    const eventType = td3 ? td3.textContent.trim() : '';
    const firingTriggers = Array.from(n.querySelectorAll('td:nth-child(4) .small-trigger-chip')).map(conditionElement => conditionElement.textContent.trim());
    const lastEdited = td5 ? td5.textContent.trim() : '';


    // To find if Tag is currently paused
    const paused = n.classList.contains('gtm-table-row--paused');

    const tag = {
        Account: accountName,
        Property: gtmContainerName,
        GTM_Container: gtmNumber,
        Name: triggerName,
        Type: eventType,
        Firing_Triggers: firingTriggers,
        Last_Edited: lastEdited,
        Currently_Paused: paused
    }

    gtmData.push(tag);
})

//Output this to your clipboard for Excel or any CSV style program
function jsonToCSV(json) {
    const fields = Object.keys(json[0]);
    const csv = json.map(row => {
        return fields.map(fieldName => {
            // Check if the field value is an array and handle it accordingly
            if (Array.isArray(row[fieldName])) {
                return '"' + row[fieldName].join(';') + '"';  // Join array elements with semicolon and enclose in quotes
            } else {
                return JSON.stringify(row[fieldName], replacer); // Use replacer to handle other data types and escaping
            }
        }).join(",");
    });
    csv.unshift(fields.join(",")); // add header column
    return csv.join("\r\n");

    function replacer(key, value) {
        // Handle escaping of quotes in strings
        if (typeof value === 'string') {
            return value.replace(/"/g, '""');
        }
        return value;
    }
}

// Assuming 'gtmData' is your JSON array
const csvData = jsonToCSV(gtmData);

// Use the console's copy function
copy(csvData);
