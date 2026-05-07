// ==UserScript==
// @name         StreetView Location GeoDuels
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Show live StreetView location (lat, lng, city, state, country)
// @match        *://geoduels.io/*
// @grant        none
// @author       ihategeography
// ==/UserScript==

// FOR TAMPERMONKEY ONLY.

(function () {
    'use strict';

    let seen = new Set();
    let lastCoords = "";

    // Create overlay
    const box = document.createElement("div");
    box.style.position = "fixed";
    box.style.bottom = "16px";
    box.style.right = "16px";
    box.style.zIndex = "999999";
    box.style.background = "rgba(40, 40, 40, 0.85)";
    box.style.backdropFilter = "blur(8px)";
    box.style.color = "#fff";
    box.style.padding = "10px 12px";
    box.style.borderRadius = "10px";
    box.style.fontSize = "13px";
    box.style.fontFamily = "system-ui, sans-serif";
    box.style.lineHeight = "1.4";
    box.style.maxWidth = "220px";
    box.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
    box.style.opacity = "0";
    box.style.transform = "translateY(10px)";
    box.style.transition = "all 0.25s ease";
    box.style.cursor = "pointer";
    box.innerHTML = "Waiting for location...";
    document.body.appendChild(box);

    function showBox() {
        box.style.opacity = "1";
        box.style.transform = "translateY(0)";
    }

    function render(lat, lng, city, state, country, copied = false) {
        box.innerHTML = `
            <div style="font-weight:600; margin-bottom:4px;">
                📍 ${city}, ${state}
            </div>
            <div style="font-size:12px; opacity:0.85;">
                ${country}
            </div>
            <div style="margin-top:6px; font-size:11px; opacity:0.7;">
                ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
            ${copied ? `<div style="font-size:11px; margin-top:4px; opacity:0.8;">Copied ✓</div>` : ""}
        `;
    }

    function updateBox(lat, lng, city, state, country) {
        render(lat, lng, city, state, country, false);
        showBox();

        box.onclick = () => {
            navigator.clipboard.writeText(`${lat},${lng}`);
            render(lat, lng, city, state, country, true);
        };
    }

    function reverseGeocode(lat, lng) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
                let addr = data.address || {};
                let city = addr.city || addr.town || addr.village || addr.hamlet || "Unknown";
                let state = addr.state || addr.region || addr.county || "Unknown";
                let country = addr.country || "Unknown";

                updateBox(lat, lng, city, state, country);
            })
            .catch(() => {
                updateBox(lat, lng, "Unknown", "Unknown", "Unknown");
            });
    }

    function checkIframes() {
        const iframes = document.querySelectorAll("iframe");

        for (let iframe of iframes) {
            let src = iframe.src;
            if (!src || seen.has(src)) continue;

            if (src.includes("maps/embed/v1/streetview")) {
                seen.add(src);

                try {
                    let url = new URL(src);
                    let loc = url.searchParams.get("location");
                    if (!loc || loc === lastCoords) return;

                    lastCoords = loc;

                    let [lat, lng] = loc.split(",").map(Number);
                    reverseGeocode(lat, lng);

                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    setInterval(checkIframes, 1000);

})();
