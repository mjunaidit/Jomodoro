class PomodoroTimer {
    constructor() {
        // Timer states
        this.workDuration = 25 * 60; // 25 minutes
        this.restDuration = 3;  // 5 minutes
        this.timeLeft = this.workDuration;
        this.timerId = null;
        this.isRunning = false;
        this.isWorkMode = true;

        // DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.modeToggle = document.getElementById('modeToggle');

        // Bind event listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.modeToggle.addEventListener('click', () => this.toggleMode());

        // Initial display
        this.updateDisplay();
        this.updateModeButton();

        // Request notification permission when timer is created
        this.requestNotificationPermission();
    }

    async requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.log("This browser does not support notifications");
            return;
        }

        try {
            // Request permission and store the result
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                // Optionally show a test notification
                new Notification("Pomodoro Timer", {
                    body: "Notifications enabled!",
                    icon: '/favicon.ico'
                });
            }
        } catch (error) {
            console.error("Error requesting notification permission:", error);
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update DOM display
        this.timeDisplay.textContent = timeString;
        
        // Update browser tab title
        const mode = this.isWorkMode ? 'Work' : 'Rest';
        document.title = `(${timeString}) ${mode} - Pomodoro`;
    }

    toggleMode() {
        this.isWorkMode = !this.isWorkMode;
        this.timeLeft = this.isWorkMode ? this.workDuration : this.restDuration;
        this.updateDisplay();
        this.updateModeButton();
        this.pause();
    }

    updateModeButton() {
        // Update toggle button class
        this.modeToggle.className = `mode-toggle ${this.isWorkMode ? 'work-mode' : 'rest-mode'}`;
        this.modeToggle.setAttribute('aria-label', 
            this.isWorkMode ? 'Switch to rest mode' : 'Switch to work mode'
        );
        
        // Update container class
        const container = document.querySelector('.timer-container');
        container.className = `timer-container ${this.isWorkMode ? 'work-mode' : 'rest-mode'}`;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.modeToggle.disabled = true;
            
            this.timerId = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();

                if (this.timeLeft === 0) {
                    this.complete();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.modeToggle.disabled = false;
            clearInterval(this.timerId);
        }
    }

    reset() {
        this.pause();
        this.timeLeft = this.isWorkMode ? this.workDuration : this.restDuration;
        this.updateDisplay();
    }

    complete() {
        this.pause();
        const mode = this.isWorkMode ? 'Work' : 'Rest';
        
        // Show browser notification
        if (Notification.permission === "granted") {
            try {
                const notification = new Notification(`${mode} Timer Complete`, {
                    body: `Time to ${this.isWorkMode ? 'take a break' : 'focus'}!`,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    silent: true, // Set to true because we're playing our own sound
                    requireInteraction: false, // macOS handles notification duration
                    tag: 'pomodoro-notification', // Replace existing notification instead of stacking
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch (error) {
                console.error("Error showing notification:", error);
            }
        }
        
        // Play the sound
        this.playNotificationSound();
        
        // Auto-switch to the other mode
        this.toggleMode();
    }

    playNotificationSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create oscillator for the chime
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        // Connect nodes
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        // Set up the sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        
        // Create the envelope
        gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);
        
        // Play the chime
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 1.5);
        
        // Play a second tone slightly delayed
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6 note
        gain2.gain.setValueAtTime(0, audioContext.currentTime);
        
        gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.2);
        gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.6);
        
        osc2.start(audioContext.currentTime + 0.1);
        osc2.stop(audioContext.currentTime + 1.6);
    }
}

// Initialize the timer when the page loads
const timer = new PomodoroTimer(); 