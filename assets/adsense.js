(function () {
    "use strict";

    var defaults = {
        enabled: true,
        client: "ca-pub-2520291262449804",
        testMode: false,
        useAmazonAds: false,
        slots: {
            footer: "4577653803"
        }
    };

    var supplied = window.REAL_ADSENSE || {};
    var config = {
        enabled: supplied.enabled !== false,
        client: supplied.client || defaults.client,
        testMode: supplied.testMode === true || defaults.testMode,
        useAmazonAds: false,
        slots: Object.assign({}, defaults.slots, supplied.slots || {})
    };

    function init() {
        var slots = document.querySelectorAll(".real-adsense-slot");
        if (slots.length === 0) return;

        slots.forEach(function(slot) {
            slot.classList.add("is-disabled");
            slot.style.display = "none";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
