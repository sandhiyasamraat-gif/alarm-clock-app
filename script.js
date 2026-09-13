/* =========================================
   ALARMX - SMART ALARM CLOCK
   ========================================= */


/* ---------- DATA ---------- */

let alarms = JSON.parse(
    localStorage.getItem("alarmXAlarms")
) || [];

let settings = JSON.parse(
    localStorage.getItem("alarmXSettings")
) || {
    darkMode: false,
    format24: false,
    snooze: 5
};

let editingAlarmId = null;
let ringingAlarmId = null;
let ringingTimeout = null;


/* ---------- ELEMENTS ---------- */

const currentTime = document.getElementById("currentTime");
const ampm = document.getElementById("ampm");
const currentDate = document.getElementById("currentDate");

const alarmList = document.getElementById("alarmList");
const homeAlarmList = document.getElementById("homeAlarmList");

const nextAlarmTime = document.getElementById("nextAlarmTime");
const nextAlarmLabel = document.getElementById("nextAlarmLabel");
const nextAlarmCountdown =
    document.getElementById("nextAlarmCountdown");

const modal = document.getElementById("alarmModal");
const alarmForm = document.getElementById("alarmForm");

const alarmTime = document.getElementById("alarmTime");
const alarmLabel = document.getElementById("alarmLabel");
const repeatOption = document.getElementById("repeatOption");
const alarmSnooze = document.getElementById("alarmSnooze");

const modalTitle = document.getElementById("modalTitle");

const ringingOverlay =
    document.getElementById("ringingOverlay");

const ringingTime =
    document.getElementById("ringingTime");

const ringingLabel =
    document.getElementById("ringingLabel");

const snoozeMessage =
    document.getElementById("snoozeMessage");

const alarmSound =
    document.getElementById("alarmSound");


/* ---------- SAVE DATA ---------- */

function saveAlarms() {

    localStorage.setItem(
        "alarmXAlarms",
        JSON.stringify(alarms)
    );

}

function saveSettings() {

    localStorage.setItem(
        "alarmXSettings",
        JSON.stringify(settings)
    );

}


/* ---------- CLOCK ---------- */

function updateClock() {

    const now = new Date();

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    let displayHours = hours;

    if (!settings.format24) {

        displayHours = hours % 12 || 12;

    }

    const h = String(displayHours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    const s = String(seconds).padStart(2, "0");

    currentTime.textContent =
        `${h}:${m}:${s}`;

    if (settings.format24) {

        ampm.textContent = "";

    } else {

        ampm.textContent =
            hours >= 12 ? "PM" : "AM";

    }


    currentDate.textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );


    updateGreeting();

    checkAlarms();

    updateNextAlarm();

}


/* ---------- GREETING ---------- */

function updateGreeting() {

    const hour = new Date().getHours();

    let greeting;

    if (hour < 12) {

        greeting = "Good Morning ☀️";

    } else if (hour < 17) {

        greeting = "Good Afternoon 🌤️";

    } else {

        greeting = "Good Evening 🌙";

    }

    document.getElementById(
        "pageTitle"
    ).textContent = greeting;

}


/* ---------- TIME FORMAT ---------- */

function formatTime(time) {

    const [hours, minutes] =
        time.split(":").map(Number);

    if (settings.format24) {

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    }

    const suffix = hours >= 12 ? "PM" : "AM";

    const displayHour =
        hours % 12 || 12;

    return `${String(displayHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;

}


/* ---------- OPEN MODAL ---------- */

function openAddAlarm() {

    editingAlarmId = null;

    modalTitle.textContent =
        "Create New Alarm";

    alarmForm.reset();

    alarmSnooze.value =
        settings.snooze;

    modal.classList.add("show");

}


/* ---------- EDIT ALARM ---------- */

function openEditAlarm(id) {

    const alarm = alarms.find(
        a => a.id === id
    );

    if (!alarm) return;

    editingAlarmId = id;

    modalTitle.textContent =
        "Edit Alarm";

    alarmTime.value =
        alarm.time;

    alarmLabel.value =
        alarm.label;

    repeatOption.value =
        alarm.repeat;

    alarmSnooze.value =
        alarm.snooze;

    const tone =
        document.querySelector(
            `input[name="tone"][value="${alarm.tone}"]`
        );

    if (tone) {

        tone.checked = true;

    }

    modal.classList.add("show");

}


/* ---------- CLOSE MODAL ---------- */

function closeModal() {

    modal.classList.remove("show");

    editingAlarmId = null;

}


/* ---------- SAVE ALARM ---------- */

alarmForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const selectedTone =
            document.querySelector(
                'input[name="tone"]:checked'
            );


        const alarmData = {

            id: editingAlarmId ||
                Date.now(),

            time: alarmTime.value,

            label:
                alarmLabel.value.trim() ||
                "Alarm",

            repeat:
                repeatOption.value,

            tone:
                selectedTone
                    ? selectedTone.value
                    : "classic",

            snooze:
                Number(alarmSnooze.value),

            enabled: true,

            lastTriggered: null

        };


        if (editingAlarmId) {

            const index =
                alarms.findIndex(
                    a =>
                        a.id === editingAlarmId
                );

            if (index !== -1) {

                alarms[index] =
                    alarmData;

            }

        } else {

            alarms.push(alarmData);

        }


        saveAlarms();

        closeModal();

        renderAlarms();

        updateNextAlarm();

    }
);


/* ---------- DELETE ---------- */

function deleteAlarm(id) {

    const confirmed =
        confirm(
            "Delete this alarm?"
        );

    if (!confirmed) return;

    alarms =
        alarms.filter(
            alarm =>
                alarm.id !== id
        );

    saveAlarms();

    renderAlarms();

    updateNextAlarm();

}


/* ---------- TOGGLE ---------- */

function toggleAlarm(id) {

    const alarm =
        alarms.find(
            a => a.id === id
        );

    if (!alarm) return;

    alarm.enabled =
        !alarm.enabled;

    saveAlarms();

    renderAlarms();

    updateNextAlarm();

}


/* ---------- REPEAT TEXT ---------- */

function getRepeatText(repeat) {

    const repeatMap = {

        once: "Once",

        daily: "Every day",

        weekdays: "Weekdays",

        weekends: "Weekends"

    };

    return repeatMap[repeat] ||
        "Once";

}


/* ---------- RENDER ALARMS ---------- */

function renderAlarms() {

    renderList(
        alarmList,
        alarms
    );

    renderList(
        homeAlarmList,
        alarms.slice(0, 5)
    );

}


/* ---------- RENDER LIST ---------- */

function renderList(container, list) {

    if (!list.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:40px;margin-bottom:12px;">
                    ⏰
                </div>

                <h3>No alarms yet</h3>

                <p>
                    Create your first alarm to get started.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        list.map(alarm => `

            <div class="alarm-card">

                <div class="alarm-info">

                    <div class="alarm-time">
                        ${formatTime(alarm.time)}
                    </div>

                    <div class="alarm-details">

                        <h3>
                            ${escapeHTML(alarm.label)}
                        </h3>

                        <p>
                            ${getRepeatText(alarm.repeat)}
                            •
                            ${getToneName(alarm.tone)}
                        </p>

                    </div>

                </div>


                <div class="alarm-actions">

                    <button
                        class="edit-btn"
                        onclick="openEditAlarm(${alarm.id})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteAlarm(${alarm.id})"
                        title="Delete"
                    >
                        🗑️
                    </button>

                    <label class="switch">

                        <input
                            type="checkbox"
                            ${alarm.enabled ? "checked" : ""}
                            onchange="toggleAlarm(${alarm.id})"
                        >

                        <span class="slider"></span>

                    </label>

                </div>

            </div>

        `).join("");

}


/* ---------- ESCAPE HTML ---------- */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


/* ---------- TONE NAME ---------- */

function getToneName(tone) {

    const tones = {

        classic: "Classic Alarm",

        digital: "Digital Beep",

        gentle: "Gentle Morning",

        bell: "Soft Bell"

    };

    return tones[tone] ||
        "Classic Alarm";

}


/* ---------- NEXT ALARM ---------- */

function getNextAlarm() {

    const now = new Date();

    const enabled =
        alarms.filter(
            alarm => alarm.enabled
        );

    if (!enabled.length) {

        return null;

    }


    let candidates = [];


    enabled.forEach(alarm => {

        const [hours, minutes] =
            alarm.time
                .split(":")
                .map(Number);

        const date =
            new Date(now);

        date.setHours(
            hours,
            minutes,
            0,
            0
        );


        if (date <= now) {

            date.setDate(
                date.getDate() + 1
            );

        }


        candidates.push({
            alarm,
            date
        });

    });


    candidates.sort(
        (a, b) =>
            a.date - b.date
    );


    return candidates[0];

}


/* ---------- NEXT ALARM DISPLAY ---------- */

function updateNextAlarm() {

    const next =
        getNextAlarm();

    if (!next) {

        nextAlarmTime.textContent =
            "No alarm";

        nextAlarmLabel.textContent =
            "Set an alarm to get started";

        nextAlarmCountdown.textContent =
            "--:--:--";

        return;

    }


    nextAlarmTime.textContent =
        formatTime(next.alarm.time);

    nextAlarmLabel.textContent =
        next.alarm.label;


    const difference =
        next.date -
        new Date();

    if (difference < 0) return;


    const totalSeconds =
        Math.floor(
            difference / 1000
        );

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;


    nextAlarmCountdown.textContent =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;

}


/* ---------- CHECK ALARMS ---------- */

function checkAlarms() {

    const now = new Date();

    const currentHours =
        String(
            now.getHours()
        ).padStart(2, "0");

    const currentMinutes =
        String(
            now.getMinutes()
        ).padStart(2, "0");

    const currentSeconds =
        now.getSeconds();


    /*
       Trigger only when the seconds are 0.
    */

    if (currentSeconds !== 0) {

        return;

    }


    const currentTimeString =
        `${currentHours}:${currentMinutes}`;


    alarms.forEach(alarm => {

        if (!alarm.enabled) {

            return;

        }


        if (
            alarm.time ===
            currentTimeString
        ) {

            const today =
                now.toDateString();


            if (
                alarm.lastTriggered ===
                today
            ) {

                return;

            }


            if (
                !isAlarmScheduledToday(
                    alarm,
                    now
                )
            ) {

                return;

            }


            alarm.lastTriggered =
                today;

            saveAlarms();

            ringAlarm(alarm);

        }

    });

}


/* ---------- CHECK SCHEDULE ---------- */

function isAlarmScheduledToday(
    alarm,
    date
) {

    const day =
        date.getDay();

    /*
       Sunday = 0
       Monday = 1
       ...
       Saturday = 6
    */

    if (alarm.repeat === "daily") {

        return true;

    }

    if (alarm.repeat === "weekdays") {

        return day >= 1 && day <= 5;

    }

    if (alarm.repeat === "weekends") {

        return day === 0 || day === 6;

    }

    return true;

}


/* ---------- RING ALARM ---------- */

function ringAlarm(alarm) {

    ringingAlarmId =
        alarm.id;

    ringingTime.textContent =
        formatTime(alarm.time);

    ringingLabel.textContent =
        alarm.label;

    snoozeMessage.textContent =
        "";


    ringingOverlay.classList.add(
        "show"
    );


    alarmSound.currentTime = 0;

    alarmSound.play()
        .catch(() => {

            console.log(
                "Browser blocked autoplay. User interaction is required."
            );

        });


    /*
       Browser notification
    */

    if (
        Notification.permission ===
        "granted"
    ) {

        new Notification(
            "AlarmX Alarm",
            {
                body:
                    alarm.label
            }
        );

    }

}


/* ---------- STOP SOUND ---------- */

function stopAlarmSound() {

    alarmSound.pause();

    alarmSound.currentTime = 0;

}


/* ---------- DISMISS ---------- */

document.getElementById(
    "dismissBtn"
).addEventListener(
    "click",
    function() {

        stopAlarmSound();

        ringingOverlay.classList.remove(
            "show"
        );

        ringingAlarmId = null;

        snoozeMessage.textContent = "";

        renderAlarms();

    }
);


/* ---------- SNOOZE ---------- */

document.getElementById(
    "snoozeBtn"
).addEventListener(
    "click",
    function() {

        const alarm =
            alarms.find(
                a =>
                    a.id ===
                    ringingAlarmId
            );

        if (!alarm) {

            return;

        }


        stopAlarmSound();


        ringingOverlay.classList.remove(
            "show"
        );


        const snoozeMinutes =
            Number(alarm.snooze) ||
            Number(settings.snooze) ||
            5;


        ringingAlarmId = null;


        clearTimeout(
            ringingTimeout
        );


        ringingTimeout =
            setTimeout(
                function() {

                    ringAlarm(alarm);

                },
                snoozeMinutes *
                60 *
                1000
            );


        alert(
            `Alarm snoozed for ${snoozeMinutes} minutes.`
        );

    }
);


/* ---------- NAVIGATION ---------- */

document.querySelectorAll(
    ".nav-item"
).forEach(button => {

    button.addEventListener(
        "click",
        function() {

            const page =
                this.dataset.page;


            document.querySelectorAll(
                ".page"
            ).forEach(
                p =>
                    p.classList.remove(
                        "active-page"
                    )
            );


            document.getElementById(
                page
            ).classList.add(
                "active-page"
            );


            document.querySelectorAll(
                ".nav-item"
            ).forEach(
                b =>
                    b.classList.remove(
                        "active"
                    )
            );


            this.classList.add(
                "active"
            );

        }
    );

});


/* ---------- ADD BUTTONS ---------- */

document.getElementById(
    "addAlarmBtn"
).addEventListener(
    "click",
    openAddAlarm
);


document.getElementById(
    "quickAddBtn"
).addEventListener(
    "click",
    openAddAlarm
);


document.getElementById(
    "viewAllBtn"
).addEventListener(
    "click",
    function() {

        document.querySelector(
            '[data-page="alarmsPage"]'
        ).click();

    }
);


/* ---------- MODAL BUTTONS ---------- */

document.getElementById(
    "closeModal"
).addEventListener(
    "click",
    closeModal
);


document.getElementById(
    "cancelAlarm"
).addEventListener(
    "click",
    closeModal
);


modal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


/* ---------- DARK MODE ---------- */

function applyTheme() {

    document.body.classList.toggle(
        "dark",
        settings.darkMode
    );

    document.getElementById(
        "darkModeSwitch"
    ).checked =
        settings.darkMode;

    document.getElementById(
        "themeToggle"
    ).textContent =
        settings.darkMode
            ? "☀️"
            : "🌙";

}


document.getElementById(
    "themeToggle"
).addEventListener(
    "click",
    function() {

        settings.darkMode =
            !settings.darkMode;

        saveSettings();

        applyTheme();

    }
);


document.getElementById(
    "darkModeSwitch"
).addEventListener(
    "change",
    function() {

        settings.darkMode =
            this.checked;

        saveSettings();

        applyTheme();

    }
);


/* ---------- 24 HOUR FORMAT ---------- */

document.getElementById(
    "formatSwitch"
).addEventListener(
    "change",
    function() {

        settings.format24 =
            this.checked;

        saveSettings();

        renderAlarms();

        updateClock();

    }
);


/* ---------- SNOOZE SETTING ---------- */

document.getElementById(
    "snoozeSetting"
).addEventListener(
    "change",
    function() {

        settings.snooze =
            Number(this.value);

        saveSettings();

    }
);


/* ---------- NOTIFICATIONS ---------- */

document.getElementById(
    "notificationBtn"
).addEventListener(
    "click",
    async function() {

        if (
            !("Notification" in window)
        ) {

            alert(
                "Browser notifications are not supported."
            );

            return;

        }


        const permission =
            await Notification.requestPermission();


        if (
            permission === "granted"
        ) {

            this.textContent =
                "Enabled";

        }

    }
);


/* ---------- INITIAL SETTINGS ---------- */

function loadSettings() {

    document.getElementById(
        "darkModeSwitch"
    ).checked =
        settings.darkMode;


    document.getElementById(
        "formatSwitch"
    ).checked =
        settings.format24;


    document.getElementById(
        "snoozeSetting"
    ).value =
        settings.snooze;


    applyTheme();

}


/* ---------- INITIALIZE ---------- */

loadSettings();

renderAlarms();

updateClock();


/*
   Update clock every second.
*/

setInterval(
    updateClock,
    1000
);
