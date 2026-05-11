(function () {
    'use strict';

    const HOLIDAYS = [];

    function parseQuery(qs) {
        const obj = {};
        qs.replace(/^[^?]*\?/, '').split('&').forEach(p => {
            if (!p) return;
            const [k, v] = p.split('=');
            obj[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
        return obj;
    }

    function getYearMonthFromUrl() {
        const q = parseQuery(location.search);

        // date= がある場合（例：da.2026.4.1）
        if (q.date) {
            const m = q.date.match(/da\.(\d+)\.(\d+)\.(\d+)/);
            if (m) {
                return {
                    year: Number(m[1]),
                    month: Number(m[2])
                };
            }
        }

        // ★ date= が無い場合 → 今日の年月を使う
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1
        };
    }


    function parseTimeToMinutes(str) {
        const m = str.match(/(\d{1,2}):(\d{2})/);
        if (!m) return null;
        return Number(m[1]) * 60 + Number(m[2]);
    }

    function classify(startMin, endMin) {

        // ======== 年次判定（最優先）========

        // A帯：06:00〜08:04（360〜484）
        if (startMin >= 360 && startMin <= 484) {
            if (endMin <= 1004) { // 16:44
                return { type: "年次", ok: true };
            }
        }

        // B帯：08:05〜08:34（485〜514）
        if (startMin >= 485 && startMin <= 514) {
            if (endMin <= 1034) { // 17:14
                return { type: "年次", ok: true };
            }
        }

        // C帯：08:35〜09:04（515〜544）
        if (startMin >= 515 && startMin <= 544) {
            if (endMin <= 1064) { // 17:44
                return { type: "年次", ok: true };
            }
        }

        // ======== 通常判定（年次に該当しなかった場合）========

        // A帯：06:00〜08:04（360〜484）
        if (startMin >= 360 && startMin <= 484) {
            if (endMin <= 1024) { // 17:04
                return { type: "A", ok: true };
            }
            return { type: "A", ok: false };
        }

        // B帯：08:05〜08:34（485〜514）
        if (startMin >= 485 && startMin <= 514) {
            if (endMin <= 1054) { // 17:34
                return { type: "B", ok: true };
            }
            return { type: "B", ok: false };
        }

        // C帯：08:35〜09:04（515〜544）
        if (startMin >= 515 && startMin <= 544) {
            if (endMin <= 1084) { // 18:04
                return { type: "C", ok: true };
            }
            return { type: "C", ok: false };
        }

        // どれにも該当しない
        return { type: "NG or 年次", ok: false };
    }

    function runCheck() {
        const ym = getYearMonthFromUrl();
        if (!ym) {
            alert('URL から年月が取得できませんでした。');
            return;
        }

        const table = document.querySelector('table');
        if (!table) {
            alert('タイムカードの表が見つかりません。');
            return;
        }

        const rows = table.querySelectorAll('tr');
        const results = [];
        results.push(`【${ym.year}年${ym.month}月 出勤・退勤チェック】
勤怠管理のため、NG、超勤有、年次の整合を確認し、修正が必要な場合は、
備考及び修正欄に内容を入力してください。ABC出勤は出勤時間を基に判定しています。
OK判定
A出勤06:00～08:04のとき→退勤16:45～17:04
B出勤08:05～08:34のとき→退勤17:15～17:34
C出勤08:35～09:04のとき→退勤17:45～18:04
年次OK判定
A出勤06:00～08:04のとき→退勤16:44以前
B出勤08:05～08:34のとき→退勤17:14以前
C出勤08:35～09:04のとき→退勤17:44以前
---------------------------------------------`);

        let currentMonth = ym.month; // ← 月省略行に対応

        rows.forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length < 3) return;

            const dateText = tds[0].innerText.trim();

            // ① 月/日 の形式（例：4/1）
            let m = dateText.match(/^(\d{1,2})\/(\d{1,2})/);
            let day;

            if (m) {
                // 月/日 が書いてある行
                currentMonth = Number(m[1]);
                day = Number(m[2]);
            } else {
                // ② 日だけの行（例：2）
                m = dateText.match(/^(\d{1,2})/);
                if (!m) return;
                day = Number(m[1]);
            }

            const dt = new Date(ym.year, currentMonth - 1, day);
            const w = dt.getDay();
            if (w === 0 || w === 6) return;

            const startStr = tds[1].innerText.trim();
            const endStr   = tds[2].innerText.trim();
            if (!startStr || !endStr) return;

            const startMin = parseTimeToMinutes(startStr);
            const endMin   = parseTimeToMinutes(endStr);
            if (startMin == null || endMin == null) return;

            const { type, ok } = classify(startMin, endMin);
            const label = ok ? 'OK' : 'NG or 超勤有';

            results.push(
                `${currentMonth}/${day} (${['日','月','火','水','木','金','土'][w]}) ` +
                `出社:${startStr} 退社:${endStr} 判定:${type} → ${label}`
            );
        });

        showLargeMessage(results.join("\n"));

    }
function showLargeMessage(text) {

    // ★ 画面サイズの 1/3（横）と 2/3（縦）
    const w = Math.floor(window.screen.width * 0.33);  // 横幅 1/3
    const h = Math.floor(window.screen.height * 0.66); // 高さ 2/3

    // ★ 右上やや下に配置
    const left = window.screen.width - w;
    const top = Math.floor(window.screen.height * 0.10);  // ← ここだけ変更


    const win = window.open(
        "",
        "_blank",
        `width=${w},height=${h},left=${left},top=${top}`
    );

    // NG を赤文字に変換
    const htmlText = text
    .split("\n")
    .map(line => {
        if (line.includes("NG")) {
            return `<div style="color:red; font-weight:bold;">${line}</div>`;
        }
        if (line.includes("年次")) {
            return `<div style="color:blue; font-weight:bold;">${line}</div>`;
        }
        return `<div>${line}</div>`;
    })
    .join("");


    win.document.write(`
        <html>
        <head>
            <title>チェック結果</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-size: 14px;
                    line-height: 1.4;
                }
                .container {
                    width: 100%;
                    height: 100%;
                    overflow-y: auto;
                    box-sizing: border-box;
                    padding: 10px;
                    white-space: pre-wrap;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                ${htmlText}
            </div>
        </body>
        </html>
    `);

    win.document.close();
}




    function addButton() {
        if (document.getElementById('timecard-check-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'timecard-check-btn';
        btn.textContent = '月次 平日出勤・退勤チェック';
        btn.style.position = 'fixed';
        btn.style.top = '320px';
        btn.style.right = '20px';
        btn.style.zIndex = 99999;
        btn.style.padding = '6px 10px';
        btn.style.fontSize = '12px';
        btn.style.background = '#4caf50';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';

        btn.addEventListener('click', runCheck);
        document.body.appendChild(btn);
    }

    document.addEventListener('DOMContentLoaded', addButton);
    window.addEventListener('load', addButton);
    setTimeout(addButton, 1500);
    setInterval(addButton, 3000);

})();
