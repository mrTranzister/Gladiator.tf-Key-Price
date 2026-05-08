// ==UserScript==
// @name         Gladiator.tf Key Price
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Displays the global key price at which Gladiator.tf bots trade on the Backpack.tf.
// @author       Gemini+mrTranzister
// @match        *://*.backpack.tf/*
// @connect      gladiator.tf
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const navbar = document.querySelector('.navbar-collapse');
    if (!navbar) return;

    const widget = document.createElement('div');
    widget.id = 'gladiator-price-fixed';

    widget.style.cssText = `
        position: absolute;
        right: 230px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        line-height: 1;
        font-size: 11px;
        color: #eee;
        background: rgba(0, 0, 0, 0.5);
        padding: 4px 10px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        white-space: nowrap;
        z-index: 1000;
        pointer-events: auto;
    `;

    const topRow = document.createElement('div');
    topRow.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 2px;';

    const gladLogo = document.createElement('img');
    gladLogo.src = 'https://gladiator.tf/favicon.ico';
    gladLogo.style.cssText = 'width: 14px; height: 14px; border-radius: 2px;';

    const priceSpan = document.createElement('span');
    priceSpan.style.fontWeight = 'bold';
    priceSpan.style.color = '#F59E0B';

    const refreshBtn = document.createElement('i');
    refreshBtn.className = 'fa fa-refresh';
    refreshBtn.style.cssText = 'cursor: pointer; color: #888; font-size: 10px; margin-left: 2px;';
    refreshBtn.title = "Update price manually";

    const bottomRow = document.createElement('div');
    bottomRow.style.cssText = 'font-size: 9px; color: #999; text-align: left; padding-left: 20px;';

    topRow.appendChild(gladLogo);
    topRow.appendChild(priceSpan);
    topRow.appendChild(refreshBtn);
    widget.appendChild(topRow);
    widget.appendChild(bottomRow);

    navbar.appendChild(widget);

    function updateTimeAgo(timestamp) {
        if (!timestamp) return;
        const diffMins = Math.floor((Date.now() - timestamp) / 60000);

        if (diffMins < 1) {
            bottomRow.textContent = "just now";
        } else if (diffMins < 60) {
            bottomRow.textContent = `${diffMins} min ago`;
        } else {
            const diffHours = Math.floor(diffMins / 60);
            bottomRow.textContent = `${diffHours} hr ago`;
        }
    }

    function renderPrice(text, timestamp) {
        priceSpan.textContent = text;
        updateTimeAgo(timestamp);
    }

    function fetchPrice(isManual = false) {
        if (refreshBtn.classList.contains('fa-spin')) return;
        refreshBtn.classList.add('fa-spin');
        if (isManual) priceSpan.textContent = "...";

        GM_xmlhttpRequest({
            method: "GET",
            url: "https://gladiator.tf/",
            timeout: 10000,
            onload: function(response) {
                refreshBtn.classList.remove('fa-spin');
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, "text/html");
                    const priceElem = doc.querySelector("#latest-key-price");
                    if (priceElem) {
                        let text = priceElem.innerText.replace(/Buy/gi, 'B:').replace(/Sell/gi, 'S:').replace(/Ref/gi, '').trim();
                        const now = Date.now();
                        GM_setValue('glad_key_price', text);
                        GM_setValue('glad_key_time', now);
                        renderPrice(text, now);
                    }
                } catch(e) { priceSpan.textContent = "Error"; }
            },
            onerror: function() {
                refreshBtn.classList.remove('fa-spin');
                priceSpan.textContent = "Net Error";
            }
        });
    }

    refreshBtn.onclick = () => fetchPrice(true);

    const cachedPrice = GM_getValue('glad_key_price', null);
    const cachedTime = GM_getValue('glad_key_time', null);

    if (cachedPrice && cachedTime) {
        renderPrice(cachedPrice, cachedTime);
        if (Date.now() - cachedTime > 900000) fetchPrice(false);
    } else {
        fetchPrice(false);
    }

    setInterval(() => {
        const time = GM_getValue('glad_key_time', null);
        if (time) updateTimeAgo(time);
    }, 60000);
})();
