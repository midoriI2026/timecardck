(function() {
    'use strict';

    // ===== ボタン =====
    const clockBtn = document.createElement("button");

    // ===== デザイン =====
    clockBtn.style.position = "fixed";
    clockBtn.style.right = "20px";
    clockBtn.style.top = "380px";
    clockBtn.style.zIndex = "9999";
clockBtn.style.fontSize = "24px";
    clockBtn.style.padding = "12px 18px";

    clockBtn.style.background = "#009688";
    clockBtn.style.color = "#fff";

    clockBtn.style.border = "none";
    clockBtn.style.borderRadius = "10px";

    clockBtn.style.cursor = "pointer";

    clockBtn.style.fontWeight = "bold";
    clockBtn.style.lineHeight = "1.6";

    clockBtn.style.textAlign = "center";

    clockBtn.style.minWidth = "180px";

    // ===== サーバー時刻取得 =====
    async function getServerTime() {

        const res = await fetch(location.href, {
            method: "HEAD",
            credentials: "include",
            cache: "no-store"
        });

        const serverDate = res.headers.get("Date");

        if (!serverDate) {
            throw new Error("Dateヘッダ取得失敗");
        }

        return new Date(serverDate);
    }

    // ===== 基準時間 =====
    let baseServerTime = null;
    let baseClientTime = null;

    // ===== 初期化 =====
    async function initClock() {

        try {

            baseServerTime = await getServerTime();
            baseClientTime = Date.now();

            updateClock();

        } catch(e) {

            console.error(e);

            clockBtn.innerHTML = `
                タイムカードに打刻する<br>
                サイボウズの時間<br>
                取得失敗
            `;
        }
    }

    // ===== 時計更新 =====
    function updateClock() {

        if (!baseServerTime) return;

        const elapsed = Date.now() - baseClientTime;

        const now = new Date(
            baseServerTime.getTime() + elapsed
        );

        const timeText = now.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "Asia/Tokyo"
        });

        clockBtn.innerHTML = `
                タイムカードに打刻する<br>
                サイボウズの時間<br>
            ${timeText}
        `;
    }

    // ===== クリックで再同期 =====
    clockBtn.onclick = async () => {

        clockBtn.innerHTML = `
            タイムカードに打刻する<br>
            サイボウズの時間<br>
            同期中...
        `;

        await initClock();
    };

    // ===== 画面追加 =====
    document.body.appendChild(clockBtn);

    // ===== 起動 =====
    initClock();

    // ===== 1秒更新 =====
    setInterval(updateClock, 1000);

})();
