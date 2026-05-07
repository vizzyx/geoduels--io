// ==UserScript==
// @name         GeoDuels Admin Interceptor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  sets isAdmin to true for getting a look at the admin panel
// @author       ihategeography
// @match        *://geoduels.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

// geoduels.io/admin

(function() {
    'use strict';

    // Intercept Fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        // We look for the '/me' endpoint which contains your user data
        if (args[0].includes('/me')) {
            const originalJson = response.json;
            response.json = async () => {
                const data = await originalJson.call(response);
                console.log("Tampermonkey: Admin switch activated for", data.display_name);

                // Modify the data before the website sees it
                data.isAdmin = true;
                data.isModerator = true;

                return data;
            };
        }
        return response;
    };

    console.log("Admin Interceptor Script Loaded.");
})();
