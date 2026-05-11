(function preventPullToRefresh() {
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';
    
    let touchStartY = 0;
    let isTouching = false;
    let scrollableElement = null;
    
    function isScrollableElement(element) {
        if (!element || element === document.body || element === document.documentElement) return false;
        const style = window.getComputedStyle(element);
        const overflowY = style.overflowY;
        const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
        return canScroll;
    }
    
    function findScrollableParent(element) {
        let current = element;
        while (current && current !== document.body && current !== document.documentElement) {
            if (isScrollableElement(current)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        isTouching = true;
        scrollableElement = findScrollableParent(e.target);
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        if (!isTouching) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY;
        
        if (scrollableElement) {
            const scrollTop = scrollableElement.scrollTop;
            const scrollHeight = scrollableElement.scrollHeight;
            const clientHeight = scrollableElement.clientHeight;
            
            if (scrollTop === 0 && deltaY > 5) {
                e.preventDefault();
                return false;
            }
            if (scrollTop + clientHeight >= scrollHeight - 5 && deltaY < -5) {
                e.preventDefault();
                return false;
            }
            return true;
        }
        
        if (Math.abs(deltaY) > 5) {
            e.preventDefault();
            return false;
        }
    }, { passive: false });
    
    document.addEventListener('touchend', function() {
        isTouching = false;
        scrollableElement = null;
    });
    
    window.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && (e.key === 'r' || e.key === 'R' || e.key === 'f5')) || 
            (e.key === 'F5') || 
            (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r'))) {
            e.preventDefault();
            return false;
        }
    });
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
})();

let audioContext = null;
let soundEnabled = false;

function unlockAudio() {
    if (soundEnabled) return;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {}
    }
    const audioElements = [menuMusic, shootSound, chestSound, gemSound, flowerSound, shieldSound, dropSound];
    audioElements.forEach(audio => {
        if (audio && audio.paused) {
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
            }).catch(e => console.log("Audio unlock attempt", e));
        }
    });
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    soundEnabled = true;
    console.log("Sound unlocked for Android");
}

document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchend', unlockAudio, { once: true });

function playSound(soundElement) {
    if (!soundElement) return;
    const playAttempt = () => {
        soundElement.currentTime = 0;
        soundElement.play().catch(e => {
            setTimeout(() => {
                soundElement.play().catch(() => {});
            }, 100);
        });
    };
    if (!soundEnabled) {
        unlockAudio();
        setTimeout(playAttempt, 50);
    } else {
        playAttempt();
    }
}

function createDonationModal() {
    const modal = document.createElement('div');
    modal.id = 'donation-modal';
    modal.className = 'modal donation-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-header">
            <h2>❤️ Поддержать проект</h2>
            <button class="close-modal" id="close-donation-btn">X</button>
        </div>
        <div class="modal-body">
            <div class="donation-text">
                <p>Спасибо, что играешь в Brawl Balls! 🎮</p>
                <p>Если хочешь поддержать разработку и помочь игре становиться лучше, ты можешь сделать донат:</p>
            </div>
            <div class="donation-buttons">
                <a href="https://www.donationalerts.com/r/lygoodfr" target="_blank" class="donation-btn donation-alerts">🎯 Donation Alerts</a>
            </div>
            <div class="donation-thanks">
                <p>💖 Любая сумма помогает развитию игры!</p>
                <p>✨ Спасибо за поддержку! ✨</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const style = document.createElement('style');
    style.textContent = `
        .donation-modal { width: 400px; max-width: 90%; background: linear-gradient(135deg, #1a237e, #311b92); border: 3px solid #ff9800; z-index: 10005; }
        .donation-text { text-align: center; margin-bottom: 20px; }
        .donation-text p { margin: 10px 0; color: #ffccbc; }
        .donation-buttons { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .donation-btn { display: block; padding: 12px 20px; text-align: center; text-decoration: none; border-radius: 30px; font-weight: bold; transition: transform 0.2s; color: white; }
        .donation-btn:hover { transform: scale(1.02); }
        .donation-alerts { background: linear-gradient(135deg, #ff6b6b, #ee5a24); }
        .donation-thanks { text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); }
        .donation-thanks p { margin: 5px 0; color: #ffeb3b; }
    `;
    document.head.appendChild(style);
    return modal;
}

function showDonationModal() {
    let modal = document.getElementById('donation-modal');
    if (!modal) {
        modal = createDonationModal();
    }
    modal.style.display = 'flex';
    document.getElementById('close-donation-btn')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

let rewardsTutorialShown = false;

function showRewardsTutorial() {
    if (rewardsTutorialShown) return;
    rewardsTutorialShown = true;
    localStorage.setItem('rewards_tutorial_shown', 'true');
    
    const tutorialModal = document.createElement('div');
    tutorialModal.className = 'modal rewards-tutorial-modal';
    tutorialModal.style.zIndex = '10010';
    tutorialModal.innerHTML = `
        <div class="modal-header">
            <h2>🏆 ТЫ ПОЛУЧИЛ ПЕРВЫЕ ТРОФЕИ! 🏆</h2>
            <button class="close-modal rewards-tutorial-close">X</button>
        </div>
        <div class="modal-body">
            <div class="rewards-tutorial-image">
                <img src="https://i.ibb.co/b5ySyn2H/2026-04-18-174938.png" alt="Rewards" style="width: 100%; max-height: 150px; object-fit: contain; border-radius: 12px;">
            </div>
            <div class="rewards-tutorial-text" style="margin-top: 15px;">
                <p style="margin: 10px 0; color: #ffccbc;">🎁 Поздравляю с первыми трофеями!</p>
                <p style="margin: 10px 0; color: #ffccbc;">🏆 Чем больше трофеев - тем круче награды!</p>
                <p style="margin: 10px 0; color: #ffeb3b;">💎 Нажми на <strong style="background: #ff9800; padding: 2px 8px; border-radius: 20px;">🏆 Трофеи</strong> в главном меню, чтобы забрать:</p>
                <ul style="margin: 10px 0 10px 20px; color: #ffccbc;">
                    <li>⚔️ Новых бойцов</li>
                    <li>💎 Нефриты</li>
                    <li>🎁 Эксклюзивные предметы</li>
                </ul>
                <p style="margin: 10px 0; color: #ff9800; font-size: 1.1em;">✨ Не забывай забирать награды! ✨</p>
            </div>
            <button id="rewards-tutorial-ok" style="margin-top: 20px; padding: 12px 30px; background: #4caf50; color: white; border: none; border-radius: 30px; cursor: pointer; width: 100%; font-size: 1.1em; font-weight: bold;">Понятно! 🎮</button>
        </div>
    `;
    document.body.appendChild(tutorialModal);
    
    const style = document.createElement('style');
    style.textContent = `
        .rewards-tutorial-modal { width: 450px; max-width: 90%; background: linear-gradient(135deg, #1a237e, #311b92); border: 3px solid #ff9800; text-align: center; z-index: 10010; }
        .rewards-tutorial-modal .modal-body { text-align: center; }
    `;
    document.head.appendChild(style);
    
    const closeModal = () => tutorialModal.remove();
    tutorialModal.querySelector('.rewards-tutorial-close')?.addEventListener('click', closeModal);
    tutorialModal.querySelector('#rewards-tutorial-ok')?.addEventListener('click', closeModal);
}

function checkAndShowRewardsTutorial() {
    const alreadyShown = localStorage.getItem('rewards_tutorial_shown');
    if (!alreadyShown && userData.trophies >= 10) {
        setTimeout(() => {
            showRewardsTutorial();
        }, 1500);
    }
}

const tutorialData = {
    welcome: {
        title: '✨ Добро пожаловать в Brawl Balls! ✨',
        description: 'Приготовься к эпическим битвам! Выбирай бойцов, собирай трофеи и становись лучшим!',
        image: 'https://i.ibb.co/0R4r6dBv/2026-04-17-231029.png',
        buttonText: 'Начать игру →'
    },
    fighters: {
        title: '⚔️ БОЙЦЫ ⚔️',
        description: 'Выбирай уникальных бойцов! Каждый имеет свои способности и супер-атаку. Открывай новых персонажей за трофеи!',
        image: 'https://i.ibb.co/9H4R3zkW/2026-04-17-231124.png',
        buttonText: 'Далее →'
    },
    modes: {
        title: '🎮 РЕЖИМЫ ИГРЫ 🎮',
        description: '🏆 Одиночный - собирай цветочки и побеждай врагов\n💎 Захват алмазов - собирай 10 алмазов и удерживай 15 секунд\n👊 Нокаут - командные бои до 2 побед\n⭐ Захват звезд - захватывай звезду в центре карты',
        image: 'https://i.ibb.co/hxWQ3XZ3/2026-04-18-180624.png',
        buttonText: 'Далее →'
    },
    controls: {
        title: '🕹️ УПРАВЛЕНИЕ 🕹️',
        description: '🎮 Синий джойстик - движение\n🔴 Красная кнопка - атака\n🟡 Жёлтая кнопка - суператака\n⬅️➡️ Также можно играть с клавиатуры (стрелки + пробел/Shift)',
        image: 'https://i.ibb.co/Z1YMpyk1/2026-04-18-184309.png',
        buttonText: 'Далее →'
    },
    shop: {
        title: '🛒 МАГАЗИН 🛒',
        description: '💎 Нефриты - покупай бустеры и костюмы\n🎫 Жетоны - открывай таинственный ящик\n👕 Костюмы - меняй внешность персонажа (шляпа сверху, костюм снизу)',
        image: 'https://i.ibb.co/hxRg6bd4/2026-04-17-233114.png',
        buttonText: 'Далее →'
    },
    rewards: {
        title: '🏆 НАГРАДЫ 🏆',
        description: 'Собирай трофеи в битвах и получай награды:\n🎁 Новых бойцов\n💎 Нефриты\n⭐ Эксклюзивные предметы\nКликай по трофеям в меню чтобы забрать награды!',
        image: 'https://i.ibb.co/b5ySyn2H/2026-04-18-174938.png',
        buttonText: 'В игру! 🎉'
    }
};

let currentTutorialStep = 0;
let tutorialSteps = ['welcome', 'fighters', 'modes', 'controls', 'shop', 'rewards'];
let tutorialCompleted = false;
let firstTimeInMode = { solo: true, capture: true, knockout: true, starhunt: true };

function createTutorialModal() {
    const modal = document.createElement('div');
    modal.id = 'tutorial-modal';
    modal.className = 'modal tutorial-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="modal-header">
            <h2 id="tutorial-title">Добро пожаловать!</h2>
            <button class="close-modal" id="close-tutorial-btn">X</button>
        </div>
        <div class="modal-body tutorial-body">
            <div class="tutorial-image-container">
                <img id="tutorial-image" class="tutorial-image" src="" alt="Tutorial">
            </div>
            <div class="tutorial-text">
                <p id="tutorial-description"></p>
            </div>
            <div class="tutorial-progress">
                <span id="tutorial-progress-text">Шаг 1 / 6</span>
                <div class="tutorial-progress-bar">
                    <div id="tutorial-progress-fill" class="tutorial-progress-fill"></div>
                </div>
            </div>
            <div class="tutorial-buttons">
                <button id="tutorial-skip-btn" class="tutorial-skip-btn">Пропустить обучение</button>
                <button id="tutorial-next-btn" class="tutorial-next-btn">Далее →</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const style = document.createElement('style');
    style.textContent = `
        .tutorial-modal { width: 500px; max-width: 90%; background: linear-gradient(135deg, #1a237e, #311b92); border: 3px solid #ff9800; z-index: 10000; }
        .tutorial-image-container { text-align: center; margin-bottom: 20px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px; }
        .tutorial-image { width: 100%; max-height: 200px; object-fit: contain; border-radius: 12px; border: 2px solid #ff9800; background: rgba(0,0,0,0.3); }
        .tutorial-text { text-align: center; margin-bottom: 20px; }
        .tutorial-text p { font-size: 1em; line-height: 1.5; color: #ffccbc; white-space: pre-line; }
        .tutorial-progress { margin: 15px 0; }
        .tutorial-progress-text { font-size: 0.8em; color: #ffeb3b; }
        .tutorial-progress-bar { background: rgba(255,255,255,0.2); border-radius: 10px; height: 8px; margin-top: 8px; overflow: hidden; }
        .tutorial-progress-fill { background: linear-gradient(90deg, #ff9800, #ffeb3b); width: 0%; height: 100%; transition: width 0.3s; border-radius: 10px; }
        .tutorial-buttons { display: flex; justify-content: space-between; gap: 15px; margin-top: 15px; }
        .tutorial-skip-btn { padding: 10px 20px; background: rgba(244,67,54,0.8); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9em; }
        .tutorial-next-btn { padding: 10px 30px; background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1em; font-weight: bold; }
        .tutorial-skip-btn:hover, .tutorial-next-btn:hover { transform: scale(1.02); }
        .welcome-modal { width: 400px; max-width: 90%; background: linear-gradient(135deg, #1a237e, #311b92); border: 3px solid #ff9800; z-index: 10001; text-align: center; }
        .welcome-image img { width: 100%; max-height: 180px; object-fit: contain; margin: 20px auto; border-radius: 16px; border: 3px solid #ff9800; background: rgba(0,0,0,0.2); padding: 10px; }
        .welcome-text p { margin: 10px 0; color: #ffccbc; font-size: 1.1em; }
        .welcome-text strong { color: #ffeb3b; }
        .welcome-start-btn { margin: 20px auto; padding: 12px 30px; background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; border: none; border-radius: 30px; cursor: pointer; font-size: 1.2em; font-weight: bold; width: 80%; }
        .welcome-start-btn:hover { transform: scale(1.02); }
        .mode-tip-modal { width: 400px; max-width: 90%; background: linear-gradient(135deg, #1a237e, #311b92); border: 3px solid #ff9800; text-align: center; z-index: 10002; }
        .mode-tip-image { text-align: center; margin: 10px 0; }
        .mode-tip-image img { width: 100%; max-height: 150px; object-fit: contain; border-radius: 12px !important; border: 2px solid #ff9800; background: rgba(0,0,0,0.2); padding: 10px; }
        .modal-body { max-height: 70vh; overflow-y: auto; }
    `;
    document.head.appendChild(style);
    return modal;
}

function showTutorialStep(stepIndex) {
    const step = tutorialSteps[stepIndex];
    const data = tutorialData[step];
    const titleEl = document.getElementById('tutorial-title');
    const descEl = document.getElementById('tutorial-description');
    const imageEl = document.getElementById('tutorial-image');
    const progressText = document.getElementById('tutorial-progress-text');
    const progressFill = document.getElementById('tutorial-progress-fill');
    const nextBtn = document.getElementById('tutorial-next-btn');
    
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.description;
    if (imageEl) imageEl.src = data.image;
    if (progressText) progressText.textContent = `Шаг ${stepIndex + 1} / ${tutorialSteps.length}`;
    if (progressFill) progressFill.style.width = `${((stepIndex + 1) / tutorialSteps.length) * 100}%`;
    if (nextBtn && stepIndex === tutorialSteps.length - 1) nextBtn.textContent = 'В игру! 🎉';
}

function startTutorial() {
    const modal = document.getElementById('tutorial-modal') || createTutorialModal();
    currentTutorialStep = 0;
    showTutorialStep(currentTutorialStep);
    modal.style.display = 'flex';
    
    const closeTutorial = () => {
        const modalEl = document.getElementById('tutorial-modal');
        if (modalEl) modalEl.style.display = 'none';
        tutorialCompleted = true;
        localStorage.setItem('tutorial_completed', 'true');
    };
    
    const nextStep = () => {
        if (currentTutorialStep + 1 < tutorialSteps.length) {
            currentTutorialStep++;
            showTutorialStep(currentTutorialStep);
        } else {
            closeTutorial();
        }
    };
    
    document.getElementById('tutorial-next-btn')?.removeEventListener('click', nextStep);
    document.getElementById('tutorial-next-btn')?.addEventListener('click', nextStep);
    document.getElementById('tutorial-skip-btn')?.removeEventListener('click', closeTutorial);
    document.getElementById('tutorial-skip-btn')?.addEventListener('click', closeTutorial);
    document.getElementById('close-tutorial-btn')?.removeEventListener('click', closeTutorial);
    document.getElementById('close-tutorial-btn')?.addEventListener('click', closeTutorial);
}

function checkAndShowTutorial() {
    const tutorialShown = localStorage.getItem('tutorial_completed');
    if (!tutorialShown) setTimeout(() => startTutorial(), 500);
}

function showWelcomeScreen(username) {
    const welcomeModal = document.createElement('div');
    welcomeModal.id = 'welcome-screen-modal';
    welcomeModal.className = 'modal welcome-modal';
    welcomeModal.innerHTML = `
        <div class="modal-header"><h2>🎉 Добро пожаловать в Brawl Balls! 🎉</h2></div>
        <div class="modal-body welcome-body">
            <div class="welcome-image"><img src="https://i.ibb.co/0R4r6dBv/2026-04-17-231029.png" alt="Brawl Balls Logo"></div>
            <div class="welcome-text"><p>Привет, <strong>${username}</strong>!</p><p>Добро пожаловать в мир эпических битв!</p><p>🐻‍❄️ Выбирай бойцов, сражайся и собирай трофеи! 🏆</p><p>✨ Тебя ждёт увлекательное приключение! ✨</p></div>
            <button id="welcome-start-btn" class="welcome-start-btn">Начать игру →</button>
        </div>
    `;
    document.body.appendChild(welcomeModal);
    document.getElementById('welcome-start-btn')?.addEventListener('click', () => {
        welcomeModal.remove();
        checkAndShowTutorial();
    });
}

function showModeTutorial(mode) {
    const modeTips = {
        solo: { title: '🏆 ОДИНОЧНЫЙ РЕЖИМ 🏆', description: 'Собирай цветочки (🌸) по всей карте!\nУничтожай всех врагов!\nЧем больше цветочков соберёшь - тем больше трофеев получишь!', image: 'https://i.ibb.co/hxWQ3XZ3/2026-04-18-180624.png' },
        capture: { title: '💎 ЗАХВАТ АЛМАЗОВ 💎', description: 'Собирай алмазы (🔷) по карте!\nПервая команда собравшая 10 алмазов запускает таймер победы!\nУдерживайте алмазы 15 секунд, чтобы победить!\nВраги тоже собирают алмазы!', image: 'https://i.ibb.co/Z1YMpyk1/2026-04-18-184309.png' },
        knockout: { title: '👊 НОКАУТ 👊', description: 'Командный бой 3 раунда!\nУничтожьте всех врагов, чтобы выиграть раунд!\nПобедите в 2 раундах из 3!\nУ вас есть союзники-боты!', image: 'https://i.ibb.co/HvFd6Mz/2026-04-18-200244.png' },
        starhunt: { title: '⭐ ЗАХВАТ ЗВЕЗД ⭐', description: 'В центре карты появляется звезда!\nПодберите звезду, чтобы получить очко!\nЗвезда перемещается после захвата!\nПобедите, набрав 15 очков!', image: 'https://i.ibb.co/xS7S0Hrt/2026-04-18-201150.png' }
    };
    const tip = modeTips[mode];
    if (!tip) return;
    const tipModal = document.createElement('div');
    tipModal.className = 'modal mode-tip-modal';
    tipModal.innerHTML = `<div class="modal-header"><h2>${tip.title}</h2><button class="close-modal mode-tip-close">X</button></div><div class="modal-body"><div class="mode-tip-image"><img src="${tip.image}" alt="${mode}" style="width: 100%; max-height: 150px; object-fit: contain; border-radius: 12px; border: 2px solid #ff9800; background: rgba(0,0,0,0.2); padding: 10px;"></div><div class="mode-tip-text"><p style="white-space: pre-line; text-align: center; margin-top: 15px;">${tip.description}</p></div><button class="mode-tip-ok-btn" style="margin-top: 20px; padding: 10px 30px; background: #4caf50; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">Понятно, начинаем бой! ⚔️</button></div>`;
    document.body.appendChild(tipModal);
    const closeModal = () => tipModal.remove();
    tipModal.querySelector('.mode-tip-close')?.addEventListener('click', closeModal);
    tipModal.querySelector('.mode-tip-ok-btn')?.addEventListener('click', closeModal);
}

const splashScreen = document.getElementById('splash-screen');
const loginScreen = document.getElementById('login-screen');
const mainMenu = document.getElementById('main-menu');
const startGameBtn = document.getElementById('start-game-btn');
const gameContainer = document.getElementById('game-container');
const gameCanvas = document.getElementById('game-canvas');
const playerHealthDisplay = document.getElementById('player-health');
const enemiesRemainingDisplay = document.getElementById('enemies-remaining');
const trophyCountDisplay = document.getElementById('trophy-count');
const tokenCountDisplay = document.getElementById('token-count');
const diamondsCountDisplay = document.getElementById('diamonds-count');
const flowersCountDisplay = document.getElementById('flowers-count');
const starScoreDisplay = document.getElementById('star-score');
const roundDisplay = document.getElementById('round-display');
const roundNumberSpan = document.getElementById('round-number');
const shopBtn = document.getElementById('shop-btn');
const fightersBtn = document.getElementById('fighters-btn');
const settingsBtn = document.getElementById('settings-btn');
const newsBtn = document.getElementById('news-btn');
const shopMenu = document.getElementById('shop-menu');
const rewardsMenu = document.getElementById('rewards-menu');
const fightersMenu = document.getElementById('fighters-menu');
const settingsMenu = document.getElementById('settings-menu');
const newsMenu = document.getElementById('news-menu');
const closeShopBtn = document.getElementById('close-shop-btn');
const closeRewardsBtn = document.getElementById('close-rewards-btn');
const closeFightersBtn = document.getElementById('close-fighters-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const closeNewsBtn = document.getElementById('close-news-btn');
const buyHealthBtn = document.getElementById('buy-health-btn');
const buyDamageBtn = document.getElementById('buy-damage-btn');
const chestBtnShop = document.getElementById('chest-btn-shop');
const winScreen = document.getElementById('win-screen');
const loseScreen = document.getElementById('lose-screen');
const playAgainBtnWin = document.getElementById('play-again-btn-win');
const mainMenuBtnWin = document.getElementById('main-menu-btn-win');
const playAgainBtnLose = document.getElementById('play-again-btn-lose');
const mainMenuBtnLose = document.getElementById('main-menu-btn-lose');
const trophiesCountDisplay = document.getElementById('trophies-count');
const jadeCountDisplay = document.getElementById('jade-count');
const tokensCountDisplay = document.getElementById('tokens-count');
const chestNotification = document.getElementById('chest-notification');
const closeNotificationBtn = document.getElementById('close-notification-btn');
const jadeRewardDisplay = document.getElementById('jade-reward');
const soloModeBtn = document.getElementById('solo-mode-btn');
const captureModeBtn = document.getElementById('capture-mode-btn');
const knockoutModeBtn = document.getElementById('knockout-mode-btn');
const starhuntModeBtn = document.getElementById('starhunt-mode-btn');
const currentUserSpan = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');
const selectedFighterImg = document.getElementById('selected-fighter-img');
const selectedFighterName = document.getElementById('selected-fighter-name');
const selectedFighterDesc = document.getElementById('selected-fighter-desc');
const languageSelect = document.getElementById('language-select');
const musicVolumeSlider = document.getElementById('music-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const toggleMusicBtn = document.getElementById('toggle-music');
const toggleSfxBtn = document.getElementById('toggle-sfx');
const resetControlsBtn = document.getElementById('reset-controls');
const joystickSizeSlider = document.getElementById('joystick-size');
const buttonSizeSlider = document.getElementById('button-size');
const saveToEmailBtn = document.getElementById('save-to-email');
const loadFromEmailBtn = document.getElementById('load-from-email');
const backupStatus = document.getElementById('backup-status');
const trophiesClickable = document.getElementById('trophies-clickable');
const currentTrophiesDisplay = document.getElementById('current-trophies-display');
const rewardsProgressBar = document.getElementById('rewards-progress-bar');
const trophiesNotification = document.getElementById('trophies-notification');

const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const regUsername = document.getElementById('reg-username');
const regPassword = document.getElementById('reg-password');
const regConfirm = document.getElementById('reg-confirm');
const registerBtn = document.getElementById('register-btn');
const registerError = document.getElementById('register-error');
const guestBtn = document.getElementById('guest-btn');

const menuMusic = document.getElementById('menu-music');
const shootSound = document.getElementById('shoot-sound');
const chestSound = document.getElementById('chest-sound');
const gemSound = document.getElementById('gem-sound');
const flowerSound = document.getElementById('flower-sound');
const shieldSound = document.getElementById('shield-sound');
const dropSound = document.getElementById('drop-sound');

const ctx = gameCanvas.getContext('2d');

const translations = {
    ru: {
        login_title: 'Вход в игру', login_tab: 'Вход', register_tab: 'Регистрация',
        login_btn: 'Войти', register_btn: 'Зарегистрироваться', guest_btn: 'Продолжить как гость',
        logout_btn: 'Выйти', trophies_label: 'Трофеи', jade_label: 'Нефриты', tokens_label: 'Жетоны',
        mode_title: 'РЕЖИМЫ ИГРЫ', solo_mode: '🏆 Одиночный', capture_mode: '💎 Захват алмазов',
        knockout_mode: '👊 Нокаут', starhunt_mode: '⭐ Захват звезд', play_btn: 'Играть',
        shop_btn: 'Магазин', fighters_btn: 'Бойцы', settings_btn: 'Настройки', news_btn: 'Новости',
        news_title: 'Новости', latest_updates: 'Последние обновления:',
        update1: '✨ Новый боец: Шэгост (Призрак)', update2: '🦋 Летние бабочки', update3: '⭐ Новый режим "Захват Звёзд"',
        settings_title: 'Настройки', language_label: 'Язык / Language', music_label: 'Громкость музыки',
        sfx_label: 'Громкость эффектов', mute_btn: 'Выключить', mute_sfx_btn: 'Выключить',
        controls_label: 'Управление', reset_controls_btn: 'Сбросить', joystick_size_label: 'Размер джойстика:',
        button_size_label: 'Размер кнопок:', save_label: 'Сохранение данных', save_btn: 'Сохранить',
        load_btn: 'Загрузить', shop_title: 'Магазин', chest_btn: 'Открыть ящик',
        health_booster: 'Бустер здоровья', health_desc: 'Увеличивает максимальное здоровье на 500 единиц',
        damage_booster: 'Бустер урона', damage_desc: 'Увеличивает урон на 200 единиц',
        buy_btn: 'Купить', rewards_title: 'Награды', fighters_title: 'Бойцы',
        congrats_title: 'Поздравляем!', received_text: 'Вы получили', jade_text: 'нефритов',
        ok_btn: 'OK', health_label: '❤️ Здоровье', enemies_label: '👾 Врагов',
        diamonds_label: '💎 Алмазы', flowers_label: '🌸 Цветочки', stars_label: '⭐ Звезды',
        round_label: '🥊 Раунд', waiting_label: '⏱️ Ожидание...', our_label: '⚔️ Наша', enemy_label: '👹 Враги',
        win_title: '🏆 ПОБЕДА! 🏆', lose_title: '💀 ПОРАЖЕНИЕ! 💀', trophies_earned: '🏆 Трофеев',
        tokens_earned: '🎫 Жетонов', play_again_btn: '🎮 Играть снова', main_menu_btn: '🏠 В главное меню'
    },
    en: {
        login_title: 'Login', login_tab: 'Login', register_tab: 'Register',
        login_btn: 'Login', register_btn: 'Register', guest_btn: 'Play as Guest',
        logout_btn: 'Logout', trophies_label: 'Trophies', jade_label: 'Jade', tokens_label: 'Tokens',
        mode_title: 'GAME MODES', solo_mode: '🏆 Solo', capture_mode: '💎 Capture',
        knockout_mode: '👊 Knockout', starhunt_mode: '⭐ Star Hunt', play_btn: 'Play',
        shop_btn: 'Shop', fighters_btn: 'Fighters', settings_btn: 'Settings', news_btn: 'News',
        news_title: 'News', latest_updates: 'Latest updates:',
        update1: '✨ New fighter: Shagost (Ghost)', update2: '🦋 Summer butterflies', update3: '⭐ New mode "Star Hunt"',
        settings_title: 'Settings', language_label: 'Language / Язык', music_label: 'Music Volume',
        sfx_label: 'Sound Effects Volume', mute_btn: 'Mute', mute_sfx_btn: 'Mute',
        controls_label: 'Controls', reset_controls_btn: 'Reset', joystick_size_label: 'Joystick size:',
        button_size_label: 'Button size:', save_label: 'Save Data', save_btn: 'Save',
        load_btn: 'Load', shop_title: 'Shop', chest_btn: 'Open Chest',
        health_booster: 'Health Booster', health_desc: 'Increases max health by 500',
        damage_booster: 'Damage Booster', damage_desc: 'Increases damage by 200',
        buy_btn: 'Buy', rewards_title: 'Rewards', fighters_title: 'Fighters',
        congrats_title: 'Congratulations!', received_text: 'You received', jade_text: 'Jade',
        ok_btn: 'OK', health_label: '❤️ Health', enemies_label: '👾 Enemies',
        diamonds_label: '💎 Diamonds', flowers_label: '🌸 Flowers', stars_label: '⭐ Stars',
        round_label: '🥊 Round', waiting_label: '⏱️ Waiting...', our_label: '⚔️ Our', enemy_label: '👹 Enemy',
        win_title: '🏆 VICTORY! 🏆', lose_title: '💀 DEFEAT! 💀', trophies_earned: '🏆 Trophies',
        tokens_earned: '🎫 Tokens', play_again_btn: '🎮 Play Again', main_menu_btn: '🏠 Main Menu'
    }
};

let currentLanguage = 'ru';

function updateLanguage() {
    const t = translations[currentLanguage];
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (t[key]) {
            if (el.tagName === 'INPUT' && el.placeholder !== undefined) el.placeholder = t[key];
            else el.textContent = t[key];
        }
    });
}

languageSelect.addEventListener('change', () => {
    currentLanguage = languageSelect.value;
    updateLanguage();
    localStorage.setItem('language', currentLanguage);
});

let musicMuted = false;
let sfxMuted = false;

function setMusicVolume(value) { 
    menuMusic.volume = value / 100; 
    localStorage.setItem('musicVolume', value); 
}

function setSfxVolume(value) { 
    const v = value / 100; 
    shootSound.volume = v; 
    chestSound.volume = v; 
    gemSound.volume = v; 
    flowerSound.volume = v; 
    shieldSound.volume = v; 
    dropSound.volume = v; 
    localStorage.setItem('sfxVolume', value); 
}

function toggleMusic() { 
    musicMuted = !musicMuted; 
    if (musicMuted) {
        menuMusic.pause();
    } else {
        menuMusic.play().catch(e => console.log("Music play error", e));
    }
    toggleMusicBtn.textContent = musicMuted ? (currentLanguage === 'ru' ? 'Включить' : 'Unmute') : (currentLanguage === 'ru' ? 'Выключить' : 'Mute'); 
    localStorage.setItem('musicMuted', musicMuted); 
}

function toggleSfx() { 
    sfxMuted = !sfxMuted; 
    toggleSfxBtn.textContent = sfxMuted ? (currentLanguage === 'ru' ? 'Включить' : 'Unmute') : (currentLanguage === 'ru' ? 'Выключить' : 'Mute'); 
    localStorage.setItem('sfxMuted', sfxMuted); 
}

function resetControls() { 
    joystickSizeSlider.value = '100'; 
    buttonSizeSlider.value = '70'; 
    if (typeof updateTouchControlsSize === 'function') updateTouchControlsSize(); 
    localStorage.setItem('joystickSize', 100); 
    localStorage.setItem('buttonSize', 70); 
}

function updateTouchControlsSize() {
    const jSize = joystickSizeSlider.value, bSize = buttonSizeSlider.value;
    const jc = document.getElementById('joystick-container'), btns = document.querySelectorAll('.touch-btn'), jt = document.getElementById('joystick-thumb');
    if (jc) { jc.style.width = jSize + 'px'; jc.style.height = jSize + 'px'; }
    if (jt) { jt.style.width = (jSize / 2.5) + 'px'; jt.style.height = (jSize / 2.5) + 'px'; }
    btns.forEach(btn => { btn.style.width = bSize + 'px'; btn.style.height = bSize + 'px'; });
    localStorage.setItem('joystickSize', jSize); localStorage.setItem('buttonSize', bSize);
}

async function saveToEmail() {
    const email = document.getElementById('backup-email').value;
    if (!email) { backupStatus.textContent = currentLanguage === 'ru' ? 'Введите email!' : 'Enter email!'; return; }
    const saveData = { userData, rewardsClaimed, activeHat, activeSuit, date: new Date().toISOString() };
    const dataStr = JSON.stringify(saveData);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brawl_balls_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    backupStatus.textContent = currentLanguage === 'ru' ? 'Данные сохранены! Файл скачан.' : 'Data saved! File downloaded.';
    setTimeout(() => { backupStatus.textContent = ''; }, 3000);
}

async function loadFromEmail() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loadedData = JSON.parse(event.target.result);
                if (loadedData.userData) userData = loadedData.userData;
                if (loadedData.rewardsClaimed) rewardsClaimed = loadedData.rewardsClaimed;
                if (loadedData.activeHat) activeHat = loadedData.activeHat;
                if (loadedData.activeSuit) activeSuit = loadedData.activeSuit;
                saveUserData(); loadUserData();
                backupStatus.textContent = currentLanguage === 'ru' ? 'Данные загружены!' : 'Data loaded!';
                setTimeout(() => { backupStatus.textContent = ''; }, 3000);
            } catch(err) { backupStatus.textContent = currentLanguage === 'ru' ? 'Ошибка загрузки файла!' : 'Error loading file!'; }
        };
        reader.readAsText(file);
    };
    input.click();
}

const savedLanguage = localStorage.getItem('language');
if (savedLanguage) { currentLanguage = savedLanguage; languageSelect.value = savedLanguage; updateLanguage(); }
const savedMusicVolume = localStorage.getItem('musicVolume');
if (savedMusicVolume) { musicVolumeSlider.value = savedMusicVolume; setMusicVolume(savedMusicVolume); }
const savedSfxVolume = localStorage.getItem('sfxVolume');
if (savedSfxVolume) { sfxVolumeSlider.value = savedSfxVolume; setSfxVolume(savedSfxVolume); }
const savedMusicMuted = localStorage.getItem('musicMuted');
if (savedMusicMuted === 'true') toggleMusic();
const savedSfxMuted = localStorage.getItem('sfxMuted');
if (savedSfxMuted === 'true') toggleSfx();
const savedJoystickSize = localStorage.getItem('joystickSize');
if (savedJoystickSize) joystickSizeSlider.value = savedJoystickSize;
const savedButtonSize = localStorage.getItem('buttonSize');
if (savedButtonSize) buttonSizeSlider.value = savedButtonSize;

musicVolumeSlider.addEventListener('input', (e) => setMusicVolume(e.target.value));
sfxVolumeSlider.addEventListener('input', (e) => setSfxVolume(e.target.value));
toggleMusicBtn.addEventListener('click', toggleMusic);
toggleSfxBtn.addEventListener('click', toggleSfx);
resetControlsBtn.addEventListener('click', resetControls);
joystickSizeSlider.addEventListener('input', updateTouchControlsSize);
buttonSizeSlider.addEventListener('input', updateTouchControlsSize);
saveToEmailBtn.addEventListener('click', saveToEmail);
loadFromEmailBtn.addEventListener('click', loadFromEmail);

let currentUser = null;
let isGuest = false;
let selectedCharacter = 'shegga';
let gameMode = 'solo';
let gameActive = false;
let animationFrame = null;
let currentRound = 1;
let playerWins = 0;
let enemyWins = 0;
let allies = [];
let enemies = [];
let starCenter = null;
let playerStars = 0;
let enemyStars = 0;
let playerDiamonds = 0;
let enemyDiamonds = 0;
let respawnTimers = [];

let player = {
    x: 100, y: 300, radius: 15, health: 4000, maxHealth: 4000,
    damage: 2000, speed: 3, color: '#c158e8', superActive: false,
    trophies: 0, tokens: 0, ammoType: 'wave', shieldActive: false, shieldDuration: 0, characterType: 'shegga',
    direction: 0, damageReduction: 0, invisibleTimer: 0, heldDiamonds: 0, respawnTimer: 0,
    startX: 100, startY: 300
};

let bullets = [];
let diamonds = [];
let flowers = [];
let collectedFlowers = 0;
let totalDiamondsNeeded = 10;
let totalFlowers = 10;
let captureTimer = 0;
let isTimerRunning = false;
let gameTimer = 120;
let timerInterval = null;
let captureWinTimer = null;

let mapWidth = 900;
let mapHeight = 600;

const obstacles = [
    { x: 150, y: 100, w: 60, h: 60 },
    { x: 400, y: 250, w: 50, h: 80 },
    { x: 600, y: 150, w: 60, h: 60 },
    { x: 200, y: 450, w: 50, h: 50 },
    { x: 550, y: 450, w: 60, h: 60 }
];

function isCollidingWithObstacles(x, y, radius) {
    for (const obs of obstacles) {
        if (x + radius > obs.x && x - radius < obs.x + obs.w && y + radius > obs.y && y - radius < obs.y + obs.h) return true;
    }
    return false;
}

const startPositions = { player: { x: 100, y: 300 }, allies: [{ x: 120, y: 480 }, { x: 190, y: 480 }], enemies: [{ x: 700, y: 120 }, { x: 750, y: 200 }, { x: 680, y: 300 }] };

let rewardsClaimed = { mortak: false, bully: false, scrap: false, clancy: false, rosa: false, brontik: false, shagost: false, jade1: false, jade2: false, jade3: false, jade4: false, jade5: false, jade6: false, jade7: false };

let activeHat = 'none';
let activeSuit = 'none';

const hatImage = new Image();
hatImage.src = 'https://i.ibb.co/hxRg6bd4/2026-04-17-233114.png';
const suitImage = new Image();
suitImage.src = 'https://i.ibb.co/8LBy3k0t/2026-04-17-233130.png';

const hatsList = {
    none: { name: 'Без шляпы', owned: true, price: 0, bonus: { damageReduction: 0 }, img: null, offsetY: -8, size: 0.8 },
    space_hat: { name: 'Космическая шляпа', owned: false, price: 800, bonus: { damageReduction: 7 }, img: hatImage, offsetY: -8, size: 0.8 }
};

const suitsList = {
    none: { name: 'Без скафандра', owned: true, price: 0, bonus: { damagePercent: 0 }, img: null, offsetY: 10, size: 0.8 },
    spacesuit: { name: 'Космический скафандр', owned: false, price: 1000, bonus: { damagePercent: 4 }, img: suitImage, offsetY: 10, size: 0.8 }
};

let userData = { username: '', trophies: 0, jade: 5000, tokens: 0, hats: { none: true, space_hat: false }, suits: { none: true, spacesuit: false }, activeHat: 'none', activeSuit: 'none', healthBoost: 0, damageBoost: 0, rewardsClaimed: {} };

const fighterImages = {
    shegga: 'https://i.ibb.co/0R4r6dBv/2026-04-17-231029.png',
    mortak: 'https://i.ibb.co/9H4R3zkW/2026-04-17-231124.png',
    bully: 'https://i.ibb.co/psCj1H9/2026-04-17-231135.png',
    scrap: 'https://i.ibb.co/nsmZZxM5/2026-04-17-231144.png',
    clancy: 'https://i.ibb.co/MyphmThf/2026-04-17-231151.png',
    rosa: 'https://i.ibb.co/7dr1Sc08/2026-04-17-231201.png',
    brontik: 'https://i.ibb.co/YFGQKFtF/2026-04-17-230857.png',
    shagost: 'https://i.ibb.co/Hfwy3Kwh/2026-04-17-231319.png'
};

const characterStats = {
    shegga: { color: '#c158e8', damage: 1500, speed: 3, ammoType: 'wave', superType: 'circle', name: 'Шегги', desc: 'Магический стрелок', trophies: 0, img: fighterImages.shegga },
    mortak: { color: '#ff5555', damage: 2000, speed: 3, ammoType: 'double', superType: 'speed', name: 'Мортак', desc: 'Огненный воин', trophies: 500, img: fighterImages.mortak },
    bully: { color: '#555555', damage: 1000, speed: 3, ammoType: 'quad', superType: 'circle', name: 'Булли', desc: 'Несокрушимый танк', trophies: 1000, img: fighterImages.bully },
    scrap: { color: '#ff8844', damage: 1250, speed: 3, ammoType: 'triple', superType: 'wave', name: 'Скрэп', desc: 'Взрывной мастер', trophies: 1500, img: fighterImages.scrap },
    clancy: { color: '#ffee44', damage: 1800, speed: 4, ammoType: 'lightning', superType: 'rapid', name: 'Клэнси', desc: 'Легендарный снайпер', trophies: 2000, img: fighterImages.clancy },
    rosa: { color: '#ffaa88', damage: 2200, speed: 3, ammoType: 'big', superType: 'shield', name: 'Роза', desc: 'Шипастая защитница', trophies: 5000, img: fighterImages.rosa },
    brontik: { color: '#4caf50', damage: 1600, speed: 3, ammoType: 'mix', superType: 'burst', name: 'Бронтик', desc: 'Грозный зелёный', trophies: 7000, img: fighterImages.brontik },
    shagost: { color: '#ffffff', damage: 1700, speed: 3, ammoType: 'split', superType: 'invisible', name: 'Шэгост', desc: 'Таинственный призрак', trophies: 4000, img: fighterImages.shagost }
};

const sheggaFace = new Image();
sheggaFace.src = 'https://i.ibb.co/ZRTCCwZP/sheg.png';
const mortakFace = new Image();
mortakFace.src = 'https://i.ibb.co/p645nWZR/mort.png';
const bullyFace = new Image();
bullyFace.src = 'https://i.ibb.co/Wv93T6SQ/2026-04-17-231743.png';
const scrapFace = new Image();
scrapFace.src = 'https://i.ibb.co/XfCVbW9C/scra.png';
const clancyFace = new Image();
clancyFace.src = 'https://i.ibb.co/DPDXmz95/clanc.png';
const rosaFace = new Image();
rosaFace.src = 'https://i.ibb.co/d0DscqWk/ros.png';
const brontikFace = new Image();
brontikFace.src = 'https://i.ibb.co/m5CksBK0/bron.png';
const shagostFace = new Image();
shagostFace.src = 'https://i.ibb.co/FSycq08/shagost.png';

function getFaceImage(characterType) {
    const faces = { shegga: sheggaFace, mortak: mortakFace, bully: bullyFace, scrap: scrapFace, clancy: clancyFace, rosa: rosaFace, brontik: brontikFace, shagost: shagostFace };
    return faces[characterType];
}

function drawCharacterWithSkin(ctx, character, characterType, isPlayer = false) {
    const x = character.x, y = character.y, radius = character.radius;
    const isInvisible = (characterType === 'shagost' && character.invisibleTimer > 0);
    if (!isInvisible || !isPlayer) {
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = character.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        const suit = suitsList[activeSuit];
        if (suit && suit.owned && suit.img && suit.img.complete && suit.img.naturalWidth > 0) {
            const suitSize = radius * (suit.size || 0.8), offsetY = suit.offsetY || 10;
            ctx.drawImage(suit.img, x - suitSize/2, y + offsetY - suitSize/2, suitSize, suitSize);
        }
        const faceImage = getFaceImage(characterType);
        if (faceImage && faceImage.complete && faceImage.naturalWidth > 0) {
            const faceSize = radius * 1.2;
            ctx.drawImage(faceImage, x - faceSize/2, y - faceSize/2, faceSize, faceSize);
        }
        const hat = hatsList[activeHat];
        if (hat && hat.owned && hat.img && hat.img.complete && hat.img.naturalWidth > 0) {
            const hatSize = radius * (hat.size || 0.8), offsetY = hat.offsetY || -8;
            ctx.drawImage(hat.img, x - hatSize/2, y + offsetY - hatSize/2, hatSize, hatSize);
        }
    } else {
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    if (isPlayer || gameMode === 'knockout' || gameMode === 'capture') {
        const arrowX = x + Math.cos(character.direction) * 18, arrowY = y + Math.sin(character.direction) * 18;
        ctx.beginPath(); ctx.moveTo(arrowX, arrowY); ctx.lineTo(arrowX - 5, arrowY - 3); ctx.lineTo(arrowX - 5, arrowY + 3); ctx.fillStyle = '#FFF'; ctx.fill();
    }
    if (!isPlayer) {
        const healthPercent = character.health / character.maxHealth;
        ctx.fillStyle = '#FF3333'; ctx.fillRect(x - 15, y - 20, 30, 4);
        ctx.fillStyle = '#33FF33'; ctx.fillRect(x - 15, y - 20, 30 * healthPercent, 4);
    }
}

function getActiveDamageReduction() { const hat = hatsList[activeHat]; return (hat && hat.owned) ? hat.bonus.damageReduction : 0; }
function getActiveDamagePercent() { const suit = suitsList[activeSuit]; return (suit && suit.owned) ? suit.bonus.damagePercent : 0; }

function applySkinBonuses() {
    const damagePercent = getActiveDamagePercent();
    player.damageReduction = getActiveDamageReduction();
    player.maxHealth = 4000 + userData.healthBoost;
    if (player.health > player.maxHealth) player.health = player.maxHealth;
    let baseDamage = characterStats[selectedCharacter]?.damage || 2000;
    player.damage = baseDamage + userData.damageBoost;
    player.damage = Math.floor(player.damage * (1 + damagePercent / 100));
    player.speed = characterStats[selectedCharacter]?.speed || 3;
    updateUI();
}

const allCharacterTypes = ['shegga', 'mortak', 'bully', 'scrap', 'clancy', 'rosa', 'brontik', 'shagost'];
function getRandomCharacterType() { return allCharacterTypes[Math.floor(Math.random() * allCharacterTypes.length)]; }

function createBot(x, y, characterType, isAlly, startPos = null) {
    const stats = characterStats[characterType];
    return {
        x, y, radius: 15, health: 4000, maxHealth: 4000, damage: stats.damage, speed: 1.8, color: stats.color,
        characterType, ammoType: stats.ammoType, superType: stats.superType, superActive: false,
        attackCooldown: 0, superCooldown: 0, isAlly, heldDiamonds: 0, shieldActive: false,
        direction: Math.atan2(y - 300, x - 100), invisibleTimer: 0, respawnTimer: 0,
        startPosition: startPos || { x, y }
    };
}

function loadAllUsers() { const users = localStorage.getItem('brawlBalls_users'); return users ? JSON.parse(users) : {}; }
function saveAllUsers(users) { localStorage.setItem('brawlBalls_users', JSON.stringify(users)); }

function loadUserData() {
    if (!currentUser) return;
    const users = loadAllUsers();
    if (users[currentUser]) {
        userData = users[currentUser];
        if (userData.rewardsClaimed) rewardsClaimed = { ...rewardsClaimed, ...userData.rewardsClaimed };
        if (userData.hats) for (const [hatId, owned] of Object.entries(userData.hats)) if (hatsList[hatId]) hatsList[hatId].owned = owned;
        if (userData.suits) for (const [suitId, owned] of Object.entries(userData.suits)) if (suitsList[suitId]) suitsList[suitId].owned = owned;
        if (userData.activeHat && hatsList[userData.activeHat]) activeHat = userData.activeHat;
        if (userData.activeSuit && suitsList[userData.activeSuit]) activeSuit = userData.activeSuit;
    }
    updateUI(); updateRewardsUI(); updateSkinsUI(); updateSelectedFighter(); updateFightersListModal(); applySkinBonuses();
    updateRewardsProgress();
    checkAvailableRewardsAndNotify();
    checkAndShowRewardsTutorial();
}

function saveUserData() {
    if (!currentUser) return;
    const users = loadAllUsers();
    userData.rewardsClaimed = rewardsClaimed;
    userData.hats = {}; userData.suits = {};
    for (const [hatId, hat] of Object.entries(hatsList)) userData.hats[hatId] = hat.owned;
    for (const [suitId, suit] of Object.entries(suitsList)) userData.suits[suitId] = suit.owned;
    userData.activeHat = activeHat; userData.activeSuit = activeSuit;
    users[currentUser] = userData;
    saveAllUsers(users);
}

function updateSelectedFighter() {
    const stats = characterStats[selectedCharacter];
    selectedFighterImg.src = stats.img;
    selectedFighterName.textContent = stats.name;
    selectedFighterDesc.textContent = stats.desc;
    player.color = stats.color;
    player.ammoType = stats.ammoType;
    player.characterType = selectedCharacter;
    player.startX = startPositions.player.x;
    player.startY = startPositions.player.y;
    applySkinBonuses();
}

function register(username, password) {
    const users = loadAllUsers();
    if (users[username]) return { success: false, error: 'Пользователь существует!' };
    if (password.length < 3) return { success: false, error: 'Пароль минимум 3 символа!' };
    users[username] = { password, username, trophies: 0, jade: 5000, tokens: 0, hats: { none: true, space_hat: false }, suits: { none: true, spacesuit: false }, activeHat: 'none', activeSuit: 'none', healthBoost: 0, damageBoost: 0, rewardsClaimed: {} };
    saveAllUsers(users);
    return { success: true };
}

function login(username, password) {
    const users = loadAllUsers();
    if (!users[username]) return { success: false, error: 'Пользователь не найден!' };
    if (users[username].password !== password) return { success: false, error: 'Неверный пароль!' };
    return { success: true, data: users[username] };
}

function logout() { currentUser = null; isGuest = false; hideScreens(); loginScreen.classList.remove('hidden'); splashScreen.classList.add('hidden'); }

function updateUI() {
    if (currentUser) currentUserSpan.textContent = currentUser + (isGuest ? ' (гость)' : '');
    trophiesCountDisplay.textContent = userData.trophies;
    jadeCountDisplay.textContent = userData.jade;
    tokensCountDisplay.textContent = userData.tokens;
    if (currentTrophiesDisplay) currentTrophiesDisplay.textContent = userData.trophies;
    updateRewardsUI(); updateSkinsUI(); updateFightersListModal();
    updateRewardsProgress();
    checkAvailableRewardsAndNotify();
}

function updateRewardsProgress() {
    if (rewardsProgressBar) {
        const maxTrophies = 20000;
        const percent = Math.min(100, (userData.trophies / maxTrophies) * 100);
        rewardsProgressBar.style.width = percent + '%';
    }
}

function checkAvailableRewardsAndNotify() {
    let hasAvailableReward = false;
    for (const reward of rewardsListData) {
        if (!rewardsClaimed[reward.id] && userData.trophies >= reward.trophies) { hasAvailableReward = true; break; }
    }
    if (hasAvailableReward) { trophiesNotification.classList.remove('hidden'); trophiesClickable.classList.add('trophies-glow'); }
    else { trophiesNotification.classList.add('hidden'); trophiesClickable.classList.remove('trophies-glow'); }
}

const rewardsListData = [
    { id: 'mortak', trophies: 500, name: 'Мортак', type: 'fighter', icon: '⚔️', jade: 0, img: fighterImages.mortak, color: '#ff5555' },
    { id: 'bully', trophies: 1000, name: 'Булли', type: 'fighter', icon: '🛡️', jade: 0, img: fighterImages.bully, color: '#555555' },
    { id: 'scrap', trophies: 1500, name: 'Скрэп', type: 'fighter', icon: '💥', jade: 0, img: fighterImages.scrap, color: '#ff8844' },
    { id: 'clancy', trophies: 2000, name: 'Клэнси', type: 'fighter', icon: '🎯', jade: 0, img: fighterImages.clancy, color: '#ffee44' },
    { id: 'jade1', trophies: 3000, name: '500 нефритов', type: 'jade', icon: '💎', jade: 500, img: null, color: '#00e5ff' },
    { id: 'jade2', trophies: 4000, name: '500 нефритов', type: 'jade', icon: '💎', jade: 500, img: null, color: '#00e5ff' },
    { id: 'shagost', trophies: 4000, name: 'Шэгост', type: 'fighter', icon: '👻', jade: 0, img: fighterImages.shagost, color: '#ffffff' },
    { id: 'rosa', trophies: 5000, name: 'Роза', type: 'fighter', icon: '🌹', jade: 0, img: fighterImages.rosa, color: '#ffaa88' },
    { id: 'jade3', trophies: 6000, name: '500 нефритов', type: 'jade', icon: '💎', jade: 500, img: null, color: '#00e5ff' },
    { id: 'brontik', trophies: 7000, name: 'Бронтик', type: 'fighter', icon: '🦕', jade: 0, img: fighterImages.brontik, color: '#4caf50' },
    { id: 'jade4', trophies: 8000, name: '500 нефритов', type: 'jade', icon: '💎', jade: 500, img: null, color: '#00e5ff' },
    { id: 'jade5', trophies: 10000, name: '1000 нефритов', type: 'jade', icon: '💎', jade: 1000, img: null, color: '#00e5ff' },
    { id: 'jade6', trophies: 15000, name: '2000 нефритов', type: 'jade', icon: '💎', jade: 2000, img: null, color: '#00e5ff' },
    { id: 'jade7', trophies: 20000, name: '5000 нефритов', type: 'jade', icon: '💎', jade: 5000, img: null, color: '#00e5ff' }
];

let animatedRewards = new Set();

function updateRewardsUI() {
    const container = document.getElementById('rewards-list');
    if (!container) return;
    container.innerHTML = '';
    for (const reward of rewardsListData) {
        const claimed = rewardsClaimed[reward.id];
        const available = userData.trophies >= reward.trophies;
        const item = document.createElement('div'); item.className = 'reward-item';
        if (available && !claimed && !animatedRewards.has(reward.id)) {
            animatedRewards.add(reward.id);
            item.classList.add('reward-available-glow');
            setTimeout(() => { if (item) item.classList.remove('reward-available-glow'); }, 2400);
        }
        const iconHtml = reward.img ? `<img class="reward-icon-img" src="${reward.img}" alt="${reward.name}">` : `<span style="font-size:1.3em">${reward.icon}</span>`;
        item.innerHTML = `<div class="reward-name">${iconHtml} ${reward.name}</div><div class="reward-trophies">🏆 ${reward.trophies}</div><div class="reward-status ${claimed ? 'claimed' : (available ? 'available' : 'locked')}">${claimed ? '✓ Получено' : (available ? '🎁 Доступно!' : `🔒 ${reward.trophies - userData.trophies}`)}</div>${!claimed && available ? `<button class="claim-btn" data-reward="${reward.id}">🏆 Забрать</button>` : ''}`;
        container.appendChild(item);
    }
    document.querySelectorAll('.claim-btn').forEach(btn => btn.addEventListener('click', (e) => { const rid = btn.dataset.reward; claimReward(rid); }));
}

function updateSkinsUI() {
    const hatsContainer = document.getElementById('hats-list');
    const suitsContainer = document.getElementById('suits-list');
    if (hatsContainer) {
        hatsContainer.innerHTML = '';
        for (const [hid, hat] of Object.entries(hatsList)) {
            const item = document.createElement('div'); item.className = 'skin-item';
            item.innerHTML = `<div class="skin-preview" style="background-image: url('${hat.img ? hat.img.src : ''}'); background-size: cover; background-position: center;"></div><div class="skin-info"><div class="skin-name">${hat.name}</div><div class="skin-desc">${hat.bonus.damageReduction > 0 ? 'Защита +' + hat.bonus.damageReduction + '%' : 'Без бонуса'}</div>${!hat.owned ? `<div class="skin-price">${hat.price} 💎</div>` : ''}</div><div class="skin-status ${hat.owned ? (activeHat === hid ? 'equipped' : 'owned') : ''}">${hat.owned ? (activeHat === hid ? 'Надето' : 'В наличии') : 'Не куплен'}</div>${!hat.owned ? `<button class="buy-skin-btn" data-skin="${hid}" data-type="hat">Купить</button>` : ''}${hat.owned && activeHat !== hid ? `<button class="equip-skin-btn" data-skin="${hid}" data-type="hat">Надеть</button>` : ''}`;
            hatsContainer.appendChild(item);
        }
    }
    if (suitsContainer) {
        suitsContainer.innerHTML = '';
        for (const [sid, suit] of Object.entries(suitsList)) {
            const item = document.createElement('div'); item.className = 'skin-item';
            item.innerHTML = `<div class="skin-preview" style="background-image: url('${suit.img ? suit.img.src : ''}'); background-size: cover; background-position: center;"></div><div class="skin-info"><div class="skin-name">${suit.name}</div><div class="skin-desc">${suit.bonus.damagePercent > 0 ? 'Урон +' + suit.bonus.damagePercent + '%' : 'Без бонуса'}</div>${!suit.owned ? `<div class="skin-price">${suit.price} 💎</div>` : ''}</div><div class="skin-status ${suit.owned ? (activeSuit === sid ? 'equipped' : 'owned') : ''}">${suit.owned ? (activeSuit === sid ? 'Надето' : 'В наличии') : 'Не куплен'}</div>${!suit.owned ? `<button class="buy-skin-btn" data-skin="${sid}" data-type="suit">Купить</button>` : ''}${suit.owned && activeSuit !== sid ? `<button class="equip-skin-btn" data-skin="${sid}" data-type="suit">Надеть</button>` : ''}`;
            suitsContainer.appendChild(item);
        }
    }
    document.querySelectorAll('.buy-skin-btn').forEach(btn => btn.addEventListener('click', (e) => { const s = btn.dataset.skin; const t = btn.dataset.type; buySkin(s, t); }));
    document.querySelectorAll('.equip-skin-btn').forEach(btn => btn.addEventListener('click', (e) => { const s = btn.dataset.skin; const t = btn.dataset.type; equipSkin(s, t); }));
}

function updateFightersListModal() {
    const container = document.getElementById('fighters-list-modal');
    if (!container) return;
    container.innerHTML = '';
    for (const [fid, stats] of Object.entries(characterStats)) {
        const unlocked = fid === 'shegga' || rewardsClaimed[fid];
        const item = document.createElement('div');
        item.className = `fighter-modal-card ${selectedCharacter === fid ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
        item.dataset.fighter = fid;
        item.innerHTML = `<img class="fighter-modal-img" src="${stats.img}" alt="${stats.name}"><div class="fighter-modal-info"><div class="fighter-modal-name">${stats.name}</div><div class="fighter-modal-desc">${stats.desc}</div></div><div class="fighter-modal-status ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? 'Доступен' : `🏆 ${stats.trophies}`}</div>`;
        if (unlocked) item.addEventListener('click', () => { selectCharacter(fid); document.querySelectorAll('.fighter-modal-card').forEach(c => c.classList.remove('selected')); item.classList.add('selected'); fightersMenu.classList.add('hidden'); });
        container.appendChild(item);
    }
}

function showDropAnimation(rewardName, rewardColor) {
    return new Promise((resolve) => {
        const anim = document.getElementById('drop-animation');
        const ball = document.getElementById('drop-ball');
        const nameEl = document.getElementById('drop-name');
        ball.style.backgroundColor = rewardColor;
        ball.style.boxShadow = `0 0 40px ${rewardColor}`;
        nameEl.textContent = rewardName;
        anim.classList.remove('hidden');
        playSound(dropSound);
        setTimeout(() => { anim.classList.add('hidden'); resolve(); }, 2000);
    });
}

async function claimReward(rewardId) {
    if (rewardsClaimed[rewardId]) return;
    const reward = rewardsListData.find(r => r.id === rewardId);
    if (reward && userData.trophies >= reward.trophies) {
        const color = reward.type === 'fighter' ? reward.color : '#00e5ff';
        await showDropAnimation(reward.name, color);
        rewardsClaimed[rewardId] = true;
        if (reward.type === 'fighter') { updateFightersListModal(); alert(`🎉 Персонаж ${reward.name} теперь доступен в разделе Бойцы!`); }
        if (reward.jade > 0) { userData.jade += reward.jade; alert(`💎 Вы получили ${reward.jade} нефритов!`); }
        saveUserData(); updateRewardsUI(); updateUI();
    }
}

function buySkin(skinId, type) {
    let item = type === 'hat' ? hatsList[skinId] : suitsList[skinId];
    if (!item || item.owned) return;
    if (userData.jade >= item.price) {
        userData.jade -= item.price;
        item.owned = true;
        saveUserData(); updateSkinsUI(); updateUI();
        alert(`${item.name} куплен!`);
    } else alert(`Не хватает нефритов! Нужно ${item.price} 💎`);
}

function equipSkin(skinId, type) {
    if (type === 'hat') { if (!hatsList[skinId] || !hatsList[skinId].owned) return; activeHat = skinId; }
    else { if (!suitsList[skinId] || !suitsList[skinId].owned) return; activeSuit = skinId; }
    applySkinBonuses(); saveUserData(); updateSkinsUI(); updateUI(); alert(`Скин надет!`);
}

function openChest() {
    if (userData.tokens >= 10) {
        userData.tokens -= 10;
        userData.jade += 2500;
        jadeRewardDisplay.textContent = '2500';
        chestNotification.classList.remove('hidden');
        playSound(chestSound);
        updateUI(); saveUserData();
    } else alert('Не хватает жетонов! Нужно 10 🎫');
}

let butterflyInterval = null, butterflies = [], butterflyAnimationFrame = null;

function startButterflyAnimation() {
    stopButterflyAnimation();
    const container = document.getElementById('animation-container');
    if (!container) return;
    container.innerHTML = ''; butterflies = [];
    function createButterfly() {
        const bf = document.createElement('div'); bf.className = 'butterfly'; bf.innerHTML = '🦋';
        bf.style.position = 'fixed'; bf.style.fontSize = (16 + Math.random() * 10) + 'px';
        bf.style.left = Math.random() * 100 + '%'; bf.style.top = Math.random() * 100 + '%';
        bf.style.opacity = '0.5'; bf.style.pointerEvents = 'none'; bf.style.zIndex = '9998'; bf.style.transition = 'none';
        const angle = Math.random() * Math.PI * 2, speed = 0.2 + Math.random() * 0.3;
        bf.dataset.vx = Math.cos(angle) * speed; bf.dataset.vy = Math.sin(angle) * speed; bf.dataset.wingPhase = Math.random() * Math.PI * 2;
        container.appendChild(bf); butterflies.push(bf);
        setTimeout(() => { if (bf.parentNode) bf.remove(); const idx = butterflies.indexOf(bf); if (idx > -1) butterflies.splice(idx, 1); }, 30000);
    }
    function animateButterflies() {
        if (!butterflies.length) { butterflyAnimationFrame = requestAnimationFrame(animateButterflies); return; }
        for (const bf of butterflies) {
            let left = parseFloat(bf.style.left), top = parseFloat(bf.style.top);
            let vx = parseFloat(bf.dataset.vx), vy = parseFloat(bf.dataset.vy), wp = parseFloat(bf.dataset.wingPhase);
            left += vx * 0.4; top += vy * 0.4;
            if (left < -5) { left = -5; vx = -vx; bf.dataset.vx = vx; }
            if (left > 105) { left = 105; vx = -vx; bf.dataset.vx = vx; }
            if (top < -5) { top = -5; vy = -vy; bf.dataset.vy = vy; }
            if (top > 105) { top = 105; vy = -vy; bf.dataset.vy = vy; }
            bf.style.left = left + '%'; bf.style.top = top + '%';
            wp += 0.04; bf.dataset.wingPhase = wp;
            const wingScale = 0.7 + Math.sin(wp) * 0.3, dir = vx > 0 ? 1 : -1;
            bf.style.transform = `scaleX(${dir}) scaleY(${wingScale}) rotate(${Math.sin(wp * 2) * 5}deg)`;
        }
        butterflyAnimationFrame = requestAnimationFrame(animateButterflies);
    }
    for (let i = 0; i < 4; i++) setTimeout(() => createButterfly(), i * 2500);
    butterflyInterval = setInterval(createButterfly, 20000);
    animateButterflies();
}

function stopButterflyAnimation() {
    if (butterflyInterval) { clearInterval(butterflyInterval); butterflyInterval = null; }
    if (butterflyAnimationFrame) { cancelAnimationFrame(butterflyAnimationFrame); butterflyAnimationFrame = null; }
    const container = document.getElementById('animation-container');
    if (container) container.innerHTML = '';
    butterflies = [];
}

const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, ' ': false, Shift: false };
function handleKeyDown(e) { if (keys.hasOwnProperty(e.key)) { e.preventDefault(); keys[e.key] = true; if (e.key === ' ') shoot(); if (e.key === 'Shift') superAttack(); } }
function handleKeyUp(e) { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; }

let touchControlsCreated = false, joystickActive = false, joystickVector = { x: 0, y: 0 };
let joystickCenterX = 0, joystickCenterY = 0, maxDistance = 40;
let lastShootTime = 0, shootCooldown = 200, lastSuperTime = 0, superCooldown = 1000;

function createTouchControls() {
    if (touchControlsCreated) return;
    touchControlsCreated = true;
    const tc = document.createElement('div');
    tc.id = 'touch-controls';
    tc.innerHTML = `<div id="joystick-container"><div id="joystick-base"></div><div id="joystick-thumb"></div></div><div class="action-buttons"><div class="touch-btn" id="touch-attack"></div><div class="touch-btn" id="touch-super"></div></div>`;
    document.body.appendChild(tc);
    const jc = document.getElementById('joystick-container');
    const jt = document.getElementById('joystick-thumb');
    const tAttack = document.getElementById('touch-attack');
    const tSuper = document.getElementById('touch-super');
    jc.style.backgroundImage = "url('https://i.ibb.co/nsdFrW6K/2026-04-13-223910.png')";
    jc.style.backgroundSize = "cover"; jc.style.backgroundPosition = "center"; jc.style.backgroundColor = "rgba(0,0,0,0.2)"; jc.style.borderRadius = "50%";
    tAttack.style.backgroundImage = "url('https://i.ibb.co/RGCkjTsM/2026-04-13-224015.png')";
    tAttack.style.backgroundColor = "rgba(0,0,0,0.3)"; tAttack.style.backgroundSize = "70%"; tAttack.style.backgroundPosition = "center"; tAttack.style.backgroundRepeat = "no-repeat"; tAttack.style.borderRadius = "50%";
    tSuper.style.backgroundImage = "url('https://i.ibb.co/SZ0Cdmv/2026-04-13-224109.png')";
    tSuper.style.backgroundColor = "rgba(0,0,0,0.3)"; tSuper.style.backgroundSize = "70%"; tSuper.style.backgroundPosition = "center"; tSuper.style.backgroundRepeat = "no-repeat"; tSuper.style.borderRadius = "50%";
    
    function updateSize() {
        let js = parseInt(joystickSizeSlider.value) || 100, bs = parseInt(buttonSizeSlider.value) || 70, ts = js / 2.5;
        jc.style.width = js + 'px'; jc.style.height = js + 'px';
        jt.style.width = ts + 'px'; jt.style.height = ts + 'px';
        tAttack.style.width = bs + 'px'; tAttack.style.height = bs + 'px';
        tSuper.style.width = bs + 'px'; tSuper.style.height = bs + 'px';
        maxDistance = js / 2.5;
        updateRect();
    }
    function updateRect() { const rect = jc.getBoundingClientRect(); joystickCenterX = rect.left + rect.width / 2; joystickCenterY = rect.top + rect.height / 2; }
    function handleStart(e) { e.preventDefault(); joystickActive = true; updateRect(); handleMove(e); }
    function handleMove(e) {
        if (!joystickActive) return; e.preventDefault();
        let cx, cy; if (e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; } else { cx = e.clientX; cy = e.clientY; }
        let dx = cx - joystickCenterX, dy = cy - joystickCenterY, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxDistance) { dx = dx / dist * maxDistance; dy = dy / dist * maxDistance; }
        joystickVector.x = dx / maxDistance; joystickVector.y = dy / maxDistance;
        jt.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
    function handleEnd(e) { e.preventDefault(); joystickActive = false; joystickVector = { x: 0, y: 0 }; jt.style.transform = 'translate(-50%, -50%)'; }
    jc.addEventListener('touchstart', handleStart); jc.addEventListener('touchmove', handleMove); jc.addEventListener('touchend', handleEnd);
    jc.addEventListener('mousedown', handleStart); window.addEventListener('mousemove', (e) => { if (joystickActive) handleMove(e); }); window.addEventListener('mouseup', handleEnd);
    function animatePress(el) { el.style.transform = "scale(0.85)"; el.style.opacity = "0.7"; setTimeout(() => { el.style.transform = "scale(1)"; el.style.opacity = "1"; }, 100); }
    function handleAttack(e) { e.preventDefault(); animatePress(tAttack); const now = Date.now(); if (now - lastShootTime >= shootCooldown && gameActive) { lastShootTime = now; shoot(); } }
    function handleSuper(e) { e.preventDefault(); animatePress(tSuper); const now = Date.now(); if (now - lastSuperTime >= superCooldown && gameActive) { lastSuperTime = now; superAttack(); } }
    tAttack.addEventListener('click', handleAttack); tAttack.addEventListener('touchstart', handleAttack);
    tSuper.addEventListener('click', handleSuper); tSuper.addEventListener('touchstart', handleSuper);
    window.addEventListener('resize', () => { updateSize(); updateRect(); });
    updateSize(); setTimeout(() => { updateRect(); updateSize(); }, 100);
}

function init() {
    loginTab.addEventListener('click', () => { loginTab.classList.add('active'); registerTab.classList.remove('active'); loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); });
    registerTab.addEventListener('click', () => { registerTab.classList.add('active'); loginTab.classList.remove('active'); registerForm.classList.remove('hidden'); loginForm.classList.add('hidden'); });
    
    loginBtn.addEventListener('click', () => {
        const username = loginUsername.value.trim(), password = loginPassword.value;
        if (!username || !password) { loginError.textContent = 'Заполните поля!'; return; }
        const result = login(username, password);
        if (result.success) {
            currentUser = username; isGuest = false; userData = result.data;
            loginScreen.classList.add('hidden'); splashScreen.classList.remove('hidden');
            setTimeout(() => { 
                splashScreen.classList.add('hidden'); 
                mainMenu.classList.remove('hidden'); 
                setTimeout(() => {
                    if (!musicMuted) menuMusic.play().catch(e => console.log("Music play waiting for interaction", e));
                }, 500);
                startButterflyAnimation(); 
                checkAndShowTutorial(); 
            }, 2000);
            loadUserData(); selectCharacter('shegga');
        } else { loginError.textContent = result.error; }
    });
    
    registerBtn.addEventListener('click', () => {
        const username = regUsername.value.trim(), password = regPassword.value, confirm = regConfirm.value;
        if (!username || !password) { registerError.textContent = 'Заполните поля!'; return; }
        if (password !== confirm) { registerError.textContent = 'Пароли не совпадают!'; return; }
        const result = register(username, password);
        if (result.success) {
            registerError.textContent = 'Регистрация успешна! Теперь войдите.';
            registerError.style.color = '#4caf50';
            showWelcomeScreen(username);
            setTimeout(() => { loginTab.click(); loginUsername.value = username; loginPassword.value = password; registerError.textContent = ''; }, 2000);
        } else { registerError.textContent = result.error; }
    });
    
    guestBtn.addEventListener('click', () => {
        currentUser = 'guest_' + Date.now(); isGuest = true;
        userData = { username: currentUser, trophies: 0, jade: 5000, tokens: 0, hats: { none: true, space_hat: false }, suits: { none: true, spacesuit: false }, activeHat: 'none', activeSuit: 'none', healthBoost: 0, damageBoost: 0, rewardsClaimed: {} };
        loginScreen.classList.add('hidden'); splashScreen.classList.remove('hidden');
        setTimeout(() => { 
            splashScreen.classList.add('hidden'); 
            mainMenu.classList.remove('hidden'); 
            setTimeout(() => {
                if (!musicMuted) menuMusic.play().catch(e => console.log("Music play waiting for interaction", e));
            }, 500);
            startButterflyAnimation(); 
            checkAndShowTutorial(); 
        }, 2000);
        loadUserData(); selectCharacter('shegga');
    });
    
    logoutBtn.addEventListener('click', logout);
    startGameBtn.addEventListener('click', startGame);
    shopBtn.addEventListener('click', () => shopMenu.classList.remove('hidden'));
    closeShopBtn.addEventListener('click', () => shopMenu.classList.add('hidden'));
    if (chestBtnShop) chestBtnShop.addEventListener('click', openChest);
    if (trophiesClickable) {
        trophiesClickable.addEventListener('click', () => { updateRewardsUI(); updateRewardsProgress(); rewardsMenu.classList.remove('hidden'); });
    }
    closeRewardsBtn.addEventListener('click', () => rewardsMenu.classList.add('hidden'));
    fightersBtn.addEventListener('click', () => { updateFightersListModal(); fightersMenu.classList.remove('hidden'); });
    closeFightersBtn.addEventListener('click', () => fightersMenu.classList.add('hidden'));
    settingsBtn.addEventListener('click', () => settingsMenu.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsMenu.classList.add('hidden'));
    newsBtn.addEventListener('click', () => newsMenu.classList.remove('hidden'));
    closeNewsBtn.addEventListener('click', () => newsMenu.classList.add('hidden'));
    closeNotificationBtn.addEventListener('click', () => chestNotification.classList.add('hidden'));
    buyHealthBtn.addEventListener('click', () => { if (userData.jade >= 500) { userData.jade -= 500; userData.healthBoost += 500; saveUserData(); updateUI(); alert('Здоровье +500!'); } else alert('Не хватает нефритов!'); });
    buyDamageBtn.addEventListener('click', () => { if (userData.jade >= 800) { userData.jade -= 800; userData.damageBoost += 200; saveUserData(); updateUI(); alert('Урон +200!'); } else alert('Не хватает нефритов!'); });
    
    const supportBtn = document.createElement('button');
    supportBtn.id = 'support-btn';
    supportBtn.textContent = '❤️ Поддержать';
    supportBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a24)';
    supportBtn.style.color = 'white';
    supportBtn.style.padding = '15px 35px';
    supportBtn.style.border = 'none';
    supportBtn.style.borderRadius = '10px';
    supportBtn.style.cursor = 'pointer';
    supportBtn.style.fontSize = '1.2em';
    supportBtn.style.fontWeight = 'bold';
    supportBtn.style.margin = '10px';
    supportBtn.addEventListener('click', showDonationModal);
    
    const menuButtons = document.getElementById('menu-buttons');
    if (menuButtons) {
        menuButtons.appendChild(supportBtn);
    }
    
    soloModeBtn.addEventListener('click', () => { gameMode = 'solo'; soloModeBtn.classList.add('active'); captureModeBtn.classList.remove('active'); knockoutModeBtn.classList.remove('active'); starhuntModeBtn.classList.remove('active'); });
    captureModeBtn.addEventListener('click', () => { gameMode = 'capture'; captureModeBtn.classList.add('active'); soloModeBtn.classList.remove('active'); knockoutModeBtn.classList.remove('active'); starhuntModeBtn.classList.remove('active'); });
    knockoutModeBtn.addEventListener('click', () => { gameMode = 'knockout'; knockoutModeBtn.classList.add('active'); soloModeBtn.classList.remove('active'); captureModeBtn.classList.remove('active'); starhuntModeBtn.classList.remove('active'); });
    starhuntModeBtn.addEventListener('click', () => { gameMode = 'starhunt'; starhuntModeBtn.classList.add('active'); soloModeBtn.classList.remove('active'); captureModeBtn.classList.remove('active'); knockoutModeBtn.classList.remove('active'); });
    playAgainBtnWin.addEventListener('click', startGame); mainMenuBtnWin.addEventListener('click', showMainMenu);
    playAgainBtnLose.addEventListener('click', startGame); mainMenuBtnLose.addEventListener('click', showMainMenu);
    document.addEventListener('keydown', handleKeyDown); document.addEventListener('keyup', handleKeyUp);
    createTouchControls();
}

function selectCharacter(character) {
    selectedCharacter = character;
    const stats = characterStats[character];
    selectedFighterImg.src = stats.img;
    selectedFighterName.textContent = stats.name;
    selectedFighterDesc.textContent = stats.desc;
    player.color = stats.color;
    player.ammoType = stats.ammoType;
    player.characterType = character;
    player.startX = startPositions.player.x;
    player.startY = startPositions.player.y;
    applySkinBonuses();
}

function startGame() {
    if (!selectedCharacter) { alert('Выберите персонажа!'); return; }
    
    if (firstTimeInMode[gameMode]) {
        firstTimeInMode[gameMode] = false;
        showModeTutorial(gameMode);
        return;
    }
    startGameLogic();
}

function startGameLogic() {
    hideScreens(); menuMusic.pause(); gameContainer.classList.remove('hidden'); gameActive = true;
    stopButterflyAnimation(); respawnTimers = []; if (timerInterval) clearInterval(timerInterval);
    if (captureWinTimer) clearInterval(captureWinTimer);
    gameTimer = 120; captureTimer = 0; isTimerRunning = false;
    if (gameMode === 'knockout') { currentRound = 1; playerWins = 0; enemyWins = 0; startKnockoutRound(); }
    else if (gameMode === 'capture') startCaptureMode();
    else if (gameMode === 'starhunt') startStarHuntMode();
    else startSoloMode();
    if (animationFrame) cancelAnimationFrame(animationFrame);
    gameLoop();
}

function startCaptureMode() {
    playerDiamonds = 0; enemyDiamonds = 0; isTimerRunning = false; captureTimer = 0;
    player.heldDiamonds = 0; player.respawnTimer = 0; player.health = player.maxHealth;
    player.x = startPositions.player.x; player.y = startPositions.player.y; player.invisibleTimer = 0;
    if (timerInterval) clearInterval(timerInterval);
    if (captureWinTimer) clearInterval(captureWinTimer);
    timerInterval = setInterval(() => {
        if (gameActive && gameMode === 'capture') {
            gameTimer--;
            const minutes = Math.floor(gameTimer / 60), seconds = gameTimer % 60;
            const timerEl = document.getElementById('capture-timer');
            if (timerEl && !isTimerRunning) timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (gameTimer <= 0 && !isTimerRunning) {
                clearInterval(timerInterval);
                if (playerDiamonds > enemyDiamonds) winGame();
                else if (enemyDiamonds > playerDiamonds) loseGame();
                else { gameTimer = 60; timerInterval = setInterval(() => { if (gameActive && gameMode === 'capture') { gameTimer--; const mins = Math.floor(gameTimer / 60), secs = gameTimer % 60; const tel = document.getElementById('capture-timer'); if (tel && !isTimerRunning) tel.textContent = `${mins}:${secs.toString().padStart(2, '0')} (овертайм)`; if (gameTimer <= 0) { clearInterval(timerInterval); if (playerDiamonds > enemyDiamonds) winGame(); else loseGame(); } } }, 1000); }
            }
        }
    }, 1000);
    allies = []; enemies = [];
    for (let i = 0; i < startPositions.allies.length; i++) { const pos = startPositions.allies[i]; allies.push(createBot(pos.x, pos.y, getRandomCharacterType(), true, pos)); }
    for (let i = 0; i < startPositions.enemies.length; i++) { const pos = startPositions.enemies[i]; enemies.push(createBot(pos.x, pos.y, getRandomCharacterType(), false, pos)); }
    diamonds = []; let attempts = 0;
    while (diamonds.length < totalDiamondsNeeded && attempts < 200) {
        const x = mapWidth/2 + (Math.random() - 0.5) * 250, y = mapHeight/2 + (Math.random() - 0.5) * 200;
        if (!isCollidingWithObstacles(x, y, 8)) diamonds.push({ x, y });
        attempts++;
    }
    diamondsCountDisplay.classList.remove('hidden'); diamondsCountDisplay.textContent = '💎 Алмазы: 0/' + totalDiamondsNeeded;
    flowersCountDisplay.classList.add('hidden'); roundDisplay.classList.add('hidden'); starScoreDisplay.classList.add('hidden');
    document.getElementById('capture-timer').classList.remove('hidden'); document.getElementById('team-scores').classList.remove('hidden');
    document.getElementById('capture-timer').textContent = '2:00'; document.getElementById('team-scores').innerHTML = '<div>⚔️ Наша: 0</div><div>👹 Враги: 0</div>';
}

function startStarHuntMode() {
    playerStars = 0; enemyStars = 0; gameTimer = 120; player.respawnTimer = 0; player.health = player.maxHealth;
    player.x = startPositions.player.x; player.y = startPositions.player.y; player.invisibleTimer = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameActive && gameMode === 'starhunt') {
            gameTimer--;
            const minutes = Math.floor(gameTimer / 60), seconds = gameTimer % 60;
            document.getElementById('capture-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (gameTimer <= 0) {
                clearInterval(timerInterval);
                if (playerStars > enemyStars) winGame();
                else if (enemyStars > playerStars) loseGame();
                else { gameTimer = 60; timerInterval = setInterval(() => { if (gameActive && gameMode === 'starhunt') { gameTimer--; const mins = Math.floor(gameTimer / 60), secs = gameTimer % 60; document.getElementById('capture-timer').textContent = `${mins}:${secs.toString().padStart(2, '0')} (овертайм)`; if (gameTimer <= 0) { clearInterval(timerInterval); if (playerStars > enemyStars) winGame(); else loseGame(); } } }, 1000); }
            }
        }
    }, 1000);
    allies = []; enemies = [];
    for (let i = 0; i < 5; i++) {
        const x = 650 + Math.random() * 200, y = 100 + Math.random() * 400;
        if (!isCollidingWithObstacles(x, y, 15)) enemies.push(createBot(x, y, getRandomCharacterType(), false, { x, y }));
        else enemies.push(createBot(700 + i * 60, 120 + i * 50, getRandomCharacterType(), false, { x: 700 + i * 60, y: 120 + i * 50 }));
    }
    let starX = mapWidth/2, starY = mapHeight/2;
    if (isCollidingWithObstacles(starX, starY, 12)) { starX = 500; starY = 300; }
    starCenter = { x: starX, y: starY, radius: 12, captured: null };
    diamondsCountDisplay.classList.add('hidden'); flowersCountDisplay.classList.add('hidden'); roundDisplay.classList.add('hidden');
    starScoreDisplay.classList.remove('hidden'); starScoreDisplay.textContent = '⭐ Звезды: 0 - 0';
    document.getElementById('capture-timer').classList.remove('hidden'); document.getElementById('team-scores').classList.add('hidden');
    document.getElementById('capture-timer').textContent = '2:00';
}

function startSoloMode() {
    player.x = startPositions.player.x; player.y = startPositions.player.y; player.health = player.maxHealth;
    player.trophies = 0; player.tokens = 0; player.superActive = false; player.shieldActive = false; player.respawnTimer = 0; player.invisibleTimer = 0;
    enemies = [];
    for (let i = 0; i < 9; i++) {
        let x, y; do { x = Math.random() * (mapWidth - 100) + 50; y = Math.random() * (mapHeight - 100) + 50; } while (isCollidingWithObstacles(x, y, 15));
        enemies.push(createBot(x, y, getRandomCharacterType(), false, { x, y }));
    }
    allies = []; flowers = [];
    for (let i = 0; i < totalFlowers; i++) {
        let x, y; do { x = Math.random() * (mapWidth - 100) + 50; y = Math.random() * (mapHeight - 100) + 50; } while (isCollidingWithObstacles(x, y, 6));
        flowers.push({ x, y });
    }
    collectedFlowers = 0;
    diamondsCountDisplay.classList.add('hidden'); flowersCountDisplay.classList.remove('hidden');
    flowersCountDisplay.textContent = '🌸 Цветочки: 0/' + totalFlowers;
    roundDisplay.classList.add('hidden'); starScoreDisplay.classList.add('hidden');
    document.getElementById('capture-timer').classList.add('hidden'); document.getElementById('team-scores').classList.add('hidden');
}

function startKnockoutRound() {
    player.x = startPositions.player.x; player.y = startPositions.player.y; player.health = player.maxHealth;
    player.superActive = false; player.shieldActive = false; player.respawnTimer = 0; player.invisibleTimer = 0;
    allies = []; enemies = [];
    for (let i = 0; i < startPositions.allies.length; i++) { const pos = startPositions.allies[i]; allies.push(createBot(pos.x, pos.y, getRandomCharacterType(), true, pos)); }
    for (let i = 0; i < startPositions.enemies.length; i++) { const pos = startPositions.enemies[i]; enemies.push(createBot(pos.x, pos.y, getRandomCharacterType(), false, pos)); }
    bullets = [];
    roundDisplay.classList.remove('hidden'); roundNumberSpan.textContent = currentRound;
    playerHealthDisplay.textContent = '❤️ Здоровье: ' + player.health; enemiesRemainingDisplay.textContent = '👾 Врагов: ' + enemies.length;
    trophyCountDisplay.classList.add('hidden'); tokenCountDisplay.classList.add('hidden');
    diamondsCountDisplay.classList.add('hidden'); flowersCountDisplay.classList.add('hidden');
    starScoreDisplay.classList.add('hidden'); document.getElementById('capture-timer').classList.add('hidden');
    document.getElementById('team-scores').classList.add('hidden');
}

function showMainMenu() {
    gameActive = false; if (timerInterval) clearInterval(timerInterval);
    if (captureWinTimer) clearInterval(captureWinTimer);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    hideScreens(); mainMenu.classList.remove('hidden'); 
    if (!musicMuted) menuMusic.play().catch(e => console.log("Music play waiting", e));
    startButterflyAnimation(); updateUI();
}

function gameLoop() {
    if (!gameActive || gameContainer.classList.contains('hidden')) return;
    handleMovement(); updateBots(); updateBullets(); checkCollisions(); draw();
    animationFrame = requestAnimationFrame(gameLoop);
}

function handleMovement() {
    let dx = 0, dy = 0;
    if (keys.ArrowUp) dy = -1; if (keys.ArrowDown) dy = 1; if (keys.ArrowLeft) dx = -1; if (keys.ArrowRight) dx = 1;
    if (joystickVector && (Math.abs(joystickVector.x) > 0.05 || Math.abs(joystickVector.y) > 0.05)) { dx = joystickVector.x; dy = joystickVector.y; }
    if (Math.abs(dx) > 1) dx = dx / Math.abs(dx); if (Math.abs(dy) > 1) dy = dy / Math.abs(dy);
    if (dx !== 0 || dy !== 0) player.direction = Math.atan2(dy, dx);
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    let newX = player.x + dx * player.speed, newY = player.y + dy * player.speed;
    if (!isCollidingWithObstacles(newX, player.y, player.radius)) player.x = newX;
    if (!isCollidingWithObstacles(player.x, newY, player.radius)) player.y = newY;
    player.x = Math.max(player.radius, Math.min(mapWidth - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(mapHeight - player.radius, player.y));
}

function shoot() {
    if (!gameActive) return; if (player.respawnTimer > 0) return;
    playSound(shootSound);
    const angle = player.direction;
    switch (player.ammoType) {
        case 'wave': for (let i = -0.4; i <= 0.4; i += 0.2) createBullet(angle + i); break;
        case 'double': createBullet(angle - 0.1); createBullet(angle + 0.1); break;
        case 'quad': createBullet(angle - 0.2); createBullet(angle - 0.1); createBullet(angle + 0.1); createBullet(angle + 0.2); break;
        case 'triple': createBullet(angle); createBullet(angle - 0.12); createBullet(angle + 0.12); break;
        case 'lightning': createBullet(angle - 0.15, 7, 6); createBullet(angle, 7, 6); createBullet(angle + 0.15, 7, 6); break;
        case 'big': createBullet(angle - 0.2, 7, 9); createBullet(angle, 7, 9); createBullet(angle + 0.2, 7, 9); break;
        case 'mix': createBullet(angle - 0.1); createBullet(angle); createBullet(angle + 0.1); break;
        case 'split': createBullet(angle); setTimeout(() => { if (gameActive) { createBullet(angle - 0.2, 5, 4); createBullet(angle + 0.2, 5, 4); } }, 100); break;
        default: createBullet(angle);
    }
}

function createBullet(angle, speed = 6, radius = 5) { bullets.push({ x: player.x, y: player.y, radius, speed, angle, color: player.color, damage: player.damage, isBot: false }); }

function superAttack() {
    if (player.superActive) return; if (player.respawnTimer > 0) return; player.superActive = true;
    switch (selectedCharacter) {
        case 'shegga': for (let i = 0; i < 24; i++) createBullet(player.direction + (Math.PI * 2 * i) / 24); setTimeout(() => player.superActive = false, 1000); break;
        case 'mortak': player.speed = 7; setTimeout(() => { player.speed = characterStats.mortak.speed; player.superActive = false; }, 3000); return;
        case 'bully': for (let i = 0; i < 16; i++) createBullet(player.direction + (Math.PI * 2 * i) / 16); setTimeout(() => player.superActive = false, 1000); break;
        case 'scrap': for (let i = -0.3; i <= 0.3; i += 0.1) createBullet(player.direction + i); setTimeout(() => player.superActive = false, 1000); break;
        case 'clancy': player.speed = 8; let shots = 0; const interval = setInterval(() => { if (gameActive && shots < 3) { createBullet(player.direction - 0.15, 7, 6); createBullet(player.direction, 7, 6); createBullet(player.direction + 0.15, 7, 6); shots++; } if (shots >= 3) { clearInterval(interval); player.speed = characterStats.clancy.speed; player.superActive = false; } }, 200); return;
        case 'rosa': player.shieldActive = true; player.shieldDuration = 300; playSound(shieldSound); setTimeout(() => player.superActive = false, 5000); return;
        case 'brontik': let burstShots = 0; const burstInterval = setInterval(() => { if (gameActive && burstShots < 3) { createBullet(player.direction - 0.1, 7, 6); createBullet(player.direction, 7, 6); createBullet(player.direction + 0.1, 7, 6); burstShots++; } if (burstShots >= 3) { clearInterval(burstInterval); player.superActive = false; } }, 200); return;
        case 'shagost': player.invisibleTimer = 300; setTimeout(() => { player.invisibleTimer = 0; player.superActive = false; }, 5000); return;
        default: setTimeout(() => player.superActive = false, 1000);
    }
}

function winGame() {
    gameActive = false; if (timerInterval) clearInterval(timerInterval);
    if (captureWinTimer) clearInterval(captureWinTimer);
    let trophiesEarned = 0, tokensEarned = 0;
    if (gameMode === 'solo') { trophiesEarned = 500 + collectedFlowers; tokensEarned = 5; }
    else if (gameMode === 'capture') { trophiesEarned = 400; tokensEarned = 8; }
    else if (gameMode === 'knockout') { trophiesEarned = 200; tokensEarned = 4; }
    else if (gameMode === 'starhunt') { trophiesEarned = 350; tokensEarned = 6; }
    userData.trophies += trophiesEarned; userData.tokens += tokensEarned;
    document.getElementById('trophies-earned').textContent = trophiesEarned; document.getElementById('tokens-earned').textContent = tokensEarned;
    saveUserData(); updateUI(); updateRewardsUI(); hideScreens(); winScreen.classList.remove('hidden');
    checkAndShowRewardsTutorial();
}

function loseGame() {
    gameActive = false; if (timerInterval) clearInterval(timerInterval);
    if (captureWinTimer) clearInterval(captureWinTimer);
    const trophiesEarned = Math.floor(player.trophies * 0.2), tokensEarned = Math.floor(player.tokens * 0.5);
    userData.trophies += trophiesEarned; userData.tokens += tokensEarned;
    document.getElementById('trophies-lost').textContent = trophiesEarned; document.getElementById('tokens-lost').textContent = tokensEarned;
    saveUserData(); updateUI(); updateRewardsUI(); hideScreens(); loseScreen.classList.remove('hidden');
    checkAndShowRewardsTutorial();
}

function hideScreens() {
    splashScreen.classList.add('hidden'); mainMenu.classList.add('hidden'); gameContainer.classList.add('hidden');
    winScreen.classList.add('hidden'); loseScreen.classList.add('hidden'); shopMenu.classList.add('hidden');
    rewardsMenu.classList.add('hidden'); fightersMenu.classList.add('hidden');
    settingsMenu.classList.add('hidden'); newsMenu.classList.add('hidden'); chestNotification.classList.add('hidden');
    const dropAnim = document.getElementById('drop-animation'); if (dropAnim) dropAnim.classList.add('hidden');
}

function updateBots() {
    if ((gameMode === 'capture' || gameMode === 'starhunt') && player.respawnTimer > 0) {
        player.respawnTimer--;
        if (player.respawnTimer <= 0) { player.health = player.maxHealth; player.x = startPositions.player.x; player.y = startPositions.player.y; player.heldDiamonds = 0; player.invisibleTimer = 0; }
    }
    for (let i = 0; i < respawnTimers.length; i++) {
        respawnTimers[i].timer--;
        if (respawnTimers[i].timer <= 0) {
            const bot = respawnTimers[i].bot;
            bot.health = bot.maxHealth; bot.x = bot.startPosition.x; bot.y = bot.startPosition.y; bot.heldDiamonds = 0;
            if (bot.isAlly) allies.push(bot); else enemies.push(bot);
            respawnTimers.splice(i, 1); i--;
        }
    }
    
    for (let i = 0; i < allies.length; i++) {
        const ally = allies[i];
        if (ally.health <= 0) {
            if (gameMode === 'capture' && ally.heldDiamonds > 0) { for (let j = 0; j < ally.heldDiamonds; j++) diamonds.push({ x: ally.x, y: ally.y }); ally.heldDiamonds = 0; }
            if (gameMode === 'capture' || gameMode === 'starhunt') respawnTimers.push({ bot: ally, timer: 300 });
            allies.splice(i, 1); i--; continue;
        }
        
        let target = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dist = Math.hypot(ally.x - enemy.x, ally.y - enemy.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        }
        
        if (target && target !== starCenter) {
            const angle = Math.atan2(target.y - ally.y, target.x - ally.x);
            let newX = ally.x + Math.cos(angle) * ally.speed;
            let newY = ally.y + Math.sin(angle) * ally.speed;
            if (!isCollidingWithObstacles(newX, ally.y, ally.radius)) ally.x = newX;
            if (!isCollidingWithObstacles(ally.x, newY, ally.radius)) ally.y = newY;
            ally.direction = angle;
            
            if (ally.attackCooldown <= 0) {
                botShoot(ally, target);
                ally.attackCooldown = 45;
            }
        }
        
        if (ally.attackCooldown > 0) ally.attackCooldown--;
        ally.x = Math.max(ally.radius, Math.min(mapWidth - ally.radius, ally.x));
        ally.y = Math.max(ally.radius, Math.min(mapHeight - ally.radius, ally.y));
    }
    
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.health <= 0) {
            if (gameMode === 'capture' && enemy.heldDiamonds > 0) { for (let j = 0; j < enemy.heldDiamonds; j++) diamonds.push({ x: enemy.x, y: enemy.y }); enemy.heldDiamonds = 0; }
            if (gameMode === 'capture' || gameMode === 'starhunt') respawnTimers.push({ bot: enemy, timer: 300 });
            enemies.splice(i, 1); i--; continue;
        }
        
        let target = null;
        let minDist = Infinity;
        
        const playerVisible = (player.respawnTimer <= 0 && player.invisibleTimer <= 0);
        if (playerVisible) {
            const distToPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (distToPlayer < minDist) {
                minDist = distToPlayer;
                target = player;
            }
        }
        
        for (const ally of allies) {
            const dist = Math.hypot(enemy.x - ally.x, enemy.y - ally.y);
            if (dist < minDist) {
                minDist = dist;
                target = ally;
            }
        }
        
        if (target && target !== starCenter) {
            const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
            let newX = enemy.x + Math.cos(angle) * enemy.speed;
            let newY = enemy.y + Math.sin(angle) * enemy.speed;
            if (!isCollidingWithObstacles(newX, enemy.y, enemy.radius)) enemy.x = newX;
            if (!isCollidingWithObstacles(enemy.x, newY, enemy.radius)) enemy.y = newY;
            enemy.direction = angle;
            
            if (enemy.attackCooldown <= 0) {
                botShoot(enemy, target);
                enemy.attackCooldown = 45;
            }
        }
        
        if (enemy.attackCooldown > 0) enemy.attackCooldown--;
        enemy.x = Math.max(enemy.radius, Math.min(mapWidth - enemy.radius, enemy.x));
        enemy.y = Math.max(enemy.radius, Math.min(mapHeight - enemy.radius, enemy.y));
    }
    
    enemiesRemainingDisplay.textContent = '👾 Врагов: ' + enemies.length;
    trophyCountDisplay.textContent = '🏆 Трофеи: ' + player.trophies;
    tokenCountDisplay.textContent = '🎫 Жетоны: ' + player.tokens;
    if (gameMode === 'capture') { diamondsCountDisplay.textContent = '💎 Алмазы: ' + playerDiamonds + '/' + totalDiamondsNeeded; document.getElementById('team-scores').innerHTML = '<div>⚔️ Наша: ' + playerDiamonds + '</div><div>👹 Враги: ' + enemyDiamonds + '</div>'; }
    if (gameMode === 'starhunt') starScoreDisplay.textContent = '⭐ Звезды: ' + playerStars + ' - ' + enemyStars;
}

function botShoot(bot, target) {
    const angle = Math.atan2(target.y - bot.y, target.x - bot.x);
    const damage = bot.damage / 2;
    switch (bot.ammoType) {
        case 'wave': for (let i = -0.3; i <= 0.3; i += 0.15) bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle + i, color: bot.color, damage: damage, isBot: true, owner: bot }); break;
        case 'double': bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle - 0.1, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle + 0.1, color: bot.color, damage: damage, isBot: true, owner: bot }); break;
        case 'quad': bullets.push({ x: bot.x, y: bot.y, radius: 4, speed: 5, angle: angle - 0.15, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 4, speed: 5, angle: angle - 0.05, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 4, speed: 5, angle: angle + 0.05, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 4, speed: 5, angle: angle + 0.15, color: bot.color, damage: damage, isBot: true, owner: bot }); break;
        case 'triple': bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle - 0.1, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle + 0.1, color: bot.color, damage: damage, isBot: true, owner: bot }); break;
        case 'lightning': bullets.push({ x: bot.x, y: bot.y, radius: 6, speed: 6, angle: angle - 0.12, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 6, speed: 6, angle: angle, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 6, speed: 6, angle: angle + 0.12, color: bot.color, damage: damage, isBot: true, owner: bot }); break;
        case 'mix': bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle - 0.1, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle, color: bot.color, damage: damage, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle + 0.1, color: bot.color, damage: damage, isBot: true, owner: bot }); break;
        case 'split': bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle, color: bot.color, damage: damage, isBot: true, owner: bot }); setTimeout(() => { if (gameActive) { bullets.push({ x: bot.x, y: bot.y, radius: 4, speed: 4, angle: angle - 0.2, color: bot.color, damage: damage * 0.7, isBot: true, owner: bot }); bullets.push({ x: bot.x, y: bot.y, radius: 4, speed: 4, angle: angle + 0.2, color: bot.color, damage: damage * 0.7, isBot: true, owner: bot }); } }, 100); break;
        default: bullets.push({ x: bot.x, y: bot.y, radius: 5, speed: 5, angle: angle, color: bot.color, damage: damage, isBot: true, owner: bot });
    }
}

function updateBullets() { for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.x += Math.cos(b.angle) * b.speed; b.y += Math.sin(b.angle) * b.speed; if (b.x < -100 || b.x > mapWidth + 100 || b.y < -100 || b.y > mapHeight + 100) bullets.splice(i, 1); } }

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.isBot && bullet.owner?.isAlly === false) {
            if (Math.hypot(bullet.x - player.x, bullet.y - player.y) < bullet.radius + player.radius) {
                if (player.shieldActive) { 
                    const angle = Math.atan2(player.y - bullet.y, player.x - bullet.x); 
                    bullet.angle = angle + Math.PI; 
                    bullet.x += Math.cos(bullet.angle) * 20; 
                    bullet.y += Math.sin(bullet.angle) * 20; 
                } else if (player.respawnTimer <= 0 && player.invisibleTimer <= 0) {
                    let damage = bullet.damage / 10; 
                    damage = damage * (1 - player.damageReduction / 100);
                    player.health -= damage; 
                    bullets.splice(i, 1);
                    playerHealthDisplay.textContent = '❤️ Здоровье: ' + Math.floor(player.health);
                    if (player.health <= 0) {
                        if (gameMode === 'knockout') { 
                            enemyWins++; 
                            if (enemyWins >= 2) loseGame(); 
                            else { currentRound++; startKnockoutRound(); } 
                        } else if (gameMode === 'capture' || gameMode === 'starhunt') { 
                            player.respawnTimer = 300; 
                            player.health = 0; 
                        } else loseGame();
                        return;
                    }
                }
            }
        }
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.isBot || (bullet.isBot && bullet.owner?.isAlly === true)) {
            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < bullet.radius + enemy.radius) {
                    enemy.health -= bullet.damage; 
                    bullets.splice(i, 1);
                    if (enemy.health <= 0) {
                        if (gameMode === 'starhunt') { 
                            playerStars += 3; 
                            if (playerStars >= 15) winGame(); 
                        }
                        if (gameMode === 'capture' && enemy.heldDiamonds > 0) { 
                            for (let k = 0; k < enemy.heldDiamonds; k++) diamonds.push({ x: enemy.x, y: enemy.y }); 
                            enemy.heldDiamonds = 0; 
                        }
                        enemies.splice(j, 1);
                        if (gameMode !== 'knockout' && gameMode !== 'starhunt') { 
                            player.trophies += 50; 
                            player.tokens += 1; 
                            userData.tokens += 1; 
                            if (Math.random() < 0.2) { 
                                userData.jade += Math.floor(Math.random() * 100) + 50; 
                                updateUI(); 
                                updateRewardsUI(); 
                            } 
                        }
                    }
                    break;
                }
            }
        }
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.isBot && bullet.owner?.isAlly === false) {
            for (let j = 0; j < allies.length; j++) {
                const ally = allies[j];
                if (Math.hypot(bullet.x - ally.x, bullet.y - ally.y) < bullet.radius + ally.radius) {
                    ally.health -= bullet.damage;
                    bullets.splice(i, 1);
                    if (ally.health <= 0) {
                        if (gameMode === 'capture' && ally.heldDiamonds > 0) { 
                            for (let k = 0; k < ally.heldDiamonds; k++) diamonds.push({ x: ally.x, y: ally.y }); 
                            ally.heldDiamonds = 0; 
                        }
                        allies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }
    
    for (const enemy of enemies) {
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius) {
            if (player.shieldActive) { 
                enemy.health -= 300; 
                if (enemy.health <= 0) { 
                    if (gameMode === 'starhunt') { 
                        playerStars += 3; 
                        if (playerStars >= 15) winGame(); 
                    } 
                    const idx = enemies.indexOf(enemy); 
                    if (idx > -1) enemies.splice(idx, 1); 
                } 
            } else if (player.respawnTimer <= 0 && player.invisibleTimer <= 0) {
                let damage = 10; 
                damage = damage * (1 - player.damageReduction / 100);
                player.health -= damage; 
                playerHealthDisplay.textContent = '❤️ Здоровье: ' + Math.floor(player.health);
                if (player.health <= 0) {
                    if (gameMode === 'knockout') { 
                        enemyWins++; 
                        if (enemyWins >= 2) loseGame(); 
                        else { currentRound++; startKnockoutRound(); } 
                    } else if (gameMode === 'capture' || gameMode === 'starhunt') { 
                        player.respawnTimer = 300; 
                        player.health = 0; 
                    } else loseGame();
                    return;
                }
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                let newX = player.x + Math.cos(angle) * 12, newY = player.y + Math.sin(angle) * 12;
                if (!isCollidingWithObstacles(newX, player.y, player.radius)) player.x = newX;
                if (!isCollidingWithObstacles(player.x, newY, player.radius)) player.y = newY;
            }
            break;
        }
    }
    
    for (let i = 0; i < allies.length; i++) {
        const ally = allies[i];
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (Math.hypot(ally.x - enemy.x, ally.y - enemy.y) < ally.radius + enemy.radius) {
                const angle = Math.atan2(ally.y - enemy.y, ally.x - enemy.x);
                ally.x += Math.cos(angle) * 3;
                ally.y += Math.sin(angle) * 3;
                enemy.x -= Math.cos(angle) * 3;
                enemy.y -= Math.sin(angle) * 3;
                ally.health -= 20;
                enemy.health -= 20;
                if (ally.health <= 0) {
                    allies.splice(i, 1);
                    i--;
                }
                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    j--;
                }
                break;
            }
        }
    }
    
    if (gameMode === 'starhunt' && starCenter && starCenter.captured === null) {
        if (player.respawnTimer <= 0 && Math.hypot(player.x - starCenter.x, player.y - starCenter.y) < player.radius + starCenter.radius) {
            starCenter.captured = 'player'; playerStars++; starScoreDisplay.textContent = '⭐ Звезды: ' + playerStars + ' - ' + enemyStars;
            if (playerStars >= 15) winGame();
            let newX, newY; do { newX = Math.random() * (mapWidth - 200) + 100; newY = Math.random() * (mapHeight - 200) + 100; } while (isCollidingWithObstacles(newX, newY, 12));
            starCenter.x = newX; starCenter.y = newY; starCenter.captured = null;
        }
        for (const enemy of enemies) {
            if (Math.hypot(enemy.x - starCenter.x, enemy.y - starCenter.y) < enemy.radius + starCenter.radius) {
                starCenter.captured = 'enemy'; enemyStars++; starScoreDisplay.textContent = '⭐ Звезды: ' + playerStars + ' - ' + enemyStars;
                if (enemyStars >= 15) loseGame();
                let newX, newY; do { newX = Math.random() * (mapWidth - 200) + 100; newY = Math.random() * (mapHeight - 200) + 100; } while (isCollidingWithObstacles(newX, newY, 12));
                starCenter.x = newX; starCenter.y = newY; starCenter.captured = null;
                break;
            }
        }
    }
    
    if (gameMode === 'capture') {
        for (let i = diamonds.length - 1; i >= 0; i--) {
            if (player.respawnTimer <= 0 && Math.hypot(player.x - diamonds[i].x, player.y - diamonds[i].y) < player.radius + 8) {
                diamonds.splice(i, 1); playerDiamonds++; player.heldDiamonds++; playSound(gemSound);
                diamondsCountDisplay.textContent = '💎 Алмазы: ' + playerDiamonds + '/' + totalDiamondsNeeded;
                document.getElementById('team-scores').innerHTML = '<div>⚔️ Наша: ' + playerDiamonds + '</div><div>👹 Враги: ' + enemyDiamonds + '</div>';
                if (playerDiamonds >= totalDiamondsNeeded && !isTimerRunning) {
                    isTimerRunning = true;
                    captureTimer = 15;
                    const timerEl = document.getElementById('capture-timer');
                    if (timerEl) timerEl.textContent = '⏱️ До победы: 15 сек';
                    if (captureWinTimer) clearInterval(captureWinTimer);
                    captureWinTimer = setInterval(() => {
                        if (gameActive && gameMode === 'capture' && isTimerRunning) {
                            captureTimer--;
                            const timerEl = document.getElementById('capture-timer');
                            if (timerEl) timerEl.textContent = '⏱️ До победы: ' + captureTimer + ' сек';
                            if (captureTimer <= 0) { clearInterval(captureWinTimer); winGame(); }
                        }
                    }, 1000);
                }
            }
        }
        for (const enemy of enemies) {
            for (let i = diamonds.length - 1; i >= 0; i--) {
                if (Math.hypot(enemy.x - diamonds[i].x, enemy.y - diamonds[i].y) < enemy.radius + 8) {
                    diamonds.splice(i, 1); enemyDiamonds++; enemy.heldDiamonds++;
                    diamondsCountDisplay.textContent = '💎 Алмазы: ' + playerDiamonds + '/' + totalDiamondsNeeded;
                    document.getElementById('team-scores').innerHTML = '<div>⚔️ Наша: ' + playerDiamonds + '</div><div>👹 Враги: ' + enemyDiamonds + '</div>';
                    if (enemyDiamonds >= totalDiamondsNeeded) loseGame();
                }
            }
        }
        for (const ally of allies) {
            for (let i = diamonds.length - 1; i >= 0; i--) {
                if (Math.hypot(ally.x - diamonds[i].x, ally.y - diamonds[i].y) < ally.radius + 8) {
                    diamonds.splice(i, 1); playerDiamonds++; ally.heldDiamonds++;
                    diamondsCountDisplay.textContent = '💎 Алмазы: ' + playerDiamonds + '/' + totalDiamondsNeeded;
                    document.getElementById('team-scores').innerHTML = '<div>⚔️ Наша: ' + playerDiamonds + '</div><div>👹 Враги: ' + enemyDiamonds + '</div>';
                    if (playerDiamonds >= totalDiamondsNeeded && !isTimerRunning) {
                        isTimerRunning = true;
                        captureTimer = 15;
                        const timerEl = document.getElementById('capture-timer');
                        if (timerEl) timerEl.textContent = '⏱️ До победы: 15 сек';
                        if (captureWinTimer) clearInterval(captureWinTimer);
                        captureWinTimer = setInterval(() => {
                            if (gameActive && gameMode === 'capture' && isTimerRunning) {
                                captureTimer--;
                                const timerEl = document.getElementById('capture-timer');
                                if (timerEl) timerEl.textContent = '⏱️ До победы: ' + captureTimer + ' сек';
                                if (captureTimer <= 0) { clearInterval(captureWinTimer); winGame(); }
                            }
                        }, 1000);
                    }
                }
            }
        }
    }
    
    if (gameMode === 'solo') {
        for (let i = flowers.length - 1; i >= 0; i--) {
            if (player.respawnTimer <= 0 && Math.hypot(player.x - flowers[i].x, player.y - flowers[i].y) < player.radius + 6) {
                flowers.splice(i, 1); collectedFlowers++; player.trophies++; userData.trophies++; playSound(flowerSound);
                flowersCountDisplay.textContent = '🌸 Цветочки: ' + collectedFlowers + '/' + totalFlowers;
                updateUI(); updateRewardsUI();
                if (collectedFlowers >= totalFlowers && enemies.length === 0) winGame();
            }
        }
    }
    if (gameMode === 'solo' && enemies.length === 0) winGame();
    if (gameMode === 'knockout' && enemies.length === 0) { playerWins++; if (playerWins >= 2) winGame(); else { currentRound++; startKnockoutRound(); } }
}

function drawProgressBars() {
    if (gameMode === 'capture') {
        const bw = 300, bh = 20, bx = (mapWidth - bw) / 2, by = 10;
        ctx.fillStyle = 'rgba(80,0,0,0.7)'; ctx.fillRect(bx, by, bw, bh);
        const ef = (enemyDiamonds / totalDiamondsNeeded) * bw; ctx.fillStyle = '#ff4444'; ctx.fillRect(bx, by, ef, bh);
        ctx.fillStyle = 'rgba(0,0,80,0.7)'; ctx.fillRect(bx, by + bh + 5, bw, bh);
        const pf = (playerDiamonds / totalDiamondsNeeded) * bw; ctx.fillStyle = '#4444ff'; ctx.fillRect(bx, by + bh + 5, pf, bh);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText('👹 Враги', bx + 5, by + 15); ctx.fillText('⚔️ Игрок', bx + 5, by + bh + 20);
    } else if (gameMode === 'starhunt') {
        const bw = 300, bh = 20, bx = (mapWidth - bw) / 2, by = 10;
        ctx.fillStyle = 'rgba(80,0,0,0.7)'; ctx.fillRect(bx, by, bw, bh);
        const ef = (enemyStars / 15) * bw; ctx.fillStyle = '#ff4444'; ctx.fillRect(bx, by, ef, bh);
        ctx.fillStyle = 'rgba(0,0,80,0.7)'; ctx.fillRect(bx, by + bh + 5, bw, bh);
        const pf = (playerStars / 15) * bw; ctx.fillStyle = '#4444ff'; ctx.fillRect(bx, by + bh + 5, pf, bh);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.fillText('👹 Враги', bx + 5, by + 15); ctx.fillText('⚔️ Игрок', bx + 5, by + bh + 20);
    }
}

function draw() {
    ctx.clearRect(0, 0, mapWidth, mapHeight);
    if (gameMode === 'knockout') {
        const grad = ctx.createLinearGradient(0, 0, 0, mapHeight);
        grad.addColorStop(0, '#87CEEB'); grad.addColorStop(0.6, '#F4A460'); grad.addColorStop(1, '#DEB887');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, mapWidth, mapHeight);
        ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(mapWidth - 80, 80, 40, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8B4513'; ctx.fillRect(50, mapHeight - 120, 20, 120);
        ctx.fillStyle = '#228B22';
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(60, mapHeight - 120); ctx.lineTo(60 + Math.cos(i) * 35, mapHeight - 150 + Math.sin(i) * 20); ctx.lineTo(60 + Math.cos(i + 0.5) * 25, mapHeight - 145 + Math.sin(i + 0.5) * 15); ctx.fill(); }
        ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 3; ctx.setLineDash([10, 20]); ctx.beginPath(); ctx.moveTo(mapWidth/2, 0); ctx.lineTo(mapWidth/2, mapHeight); ctx.stroke(); ctx.setLineDash([]);
    } else if (gameMode === 'capture') {
        ctx.fillStyle = '#228B22'; ctx.fillRect(0, 0, mapWidth, mapHeight);
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 80; i++) { ctx.beginPath(); ctx.ellipse((i * 37) % mapWidth, (i * 23) % mapHeight, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#00BFFF'; ctx.fillRect(mapWidth - 100, 100, 60, mapHeight - 200);
        ctx.fillStyle = '#87CEEB';
        for (let i = 0; i < 25; i++) ctx.fillRect(mapWidth - 95 + i % 10, 100 + i * 20, 5, 12);
        ctx.fillStyle = '#FFD700'; ctx.fillRect(50, mapHeight - 150, 100, 150);
        ctx.fillStyle = '#FF8C00'; ctx.beginPath(); ctx.moveTo(50, mapHeight - 150); ctx.lineTo(100, mapHeight - 200); ctx.lineTo(150, mapHeight - 150); ctx.fill();
    } else if (gameMode === 'starhunt') {
        ctx.fillStyle = '#7CFC00'; ctx.fillRect(0, 0, mapWidth, mapHeight);
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 200; i++) ctx.fillRect((i * 17) % mapWidth, mapHeight - 15, 5, 15);
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc((i * 43) % mapWidth, (i * 27) % (mapHeight - 50) + 25, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc((i * 43) % mapWidth, (i * 27) % (mapHeight - 50) + 25, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FF69B4'; }
        ctx.fillStyle = '#00BFFF'; ctx.fillRect(100, 150, 150, 50); ctx.fillRect(550, 350, 100, 70);
        ctx.fillStyle = '#87CEEB'; ctx.fillRect(105, 155, 140, 40); ctx.fillRect(555, 355, 90, 60);
        if (starCenter) {
            ctx.fillStyle = '#FFD700'; ctx.beginPath();
            for (let i = 0; i < 5; i++) { const angle = (i * 72 - 90) * Math.PI / 180; const x1 = starCenter.x + Math.cos(angle) * starCenter.radius; const y1 = starCenter.y + Math.sin(angle) * starCenter.radius; const x2 = starCenter.x + Math.cos(angle + 36 * Math.PI / 180) * starCenter.radius * 0.5; const y2 = starCenter.y + Math.sin(angle + 36 * Math.PI / 180) * starCenter.radius * 0.5; if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); }
            ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFFACD'; ctx.beginPath(); ctx.arc(starCenter.x, starCenter.y, 4, 0, Math.PI * 2); ctx.fill();
        }
    } else {
        ctx.fillStyle = '#7CFC00'; ctx.fillRect(0, 0, mapWidth, mapHeight);
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 200; i++) ctx.fillRect((i * 17) % mapWidth, mapHeight - 15, 5, 15);
        ctx.fillStyle = '#FF69B4';
        for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc((i * 43) % mapWidth, (i * 27) % (mapHeight - 50) + 25, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc((i * 43) % mapWidth, (i * 27) % (mapHeight - 50) + 25, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FF69B4'; }
        ctx.fillStyle = '#00BFFF'; ctx.fillRect(100, 150, 150, 50); ctx.fillRect(550, 350, 100, 70);
        ctx.fillStyle = '#87CEEB'; ctx.fillRect(105, 155, 140, 40); ctx.fillRect(555, 355, 90, 60);
    }
    ctx.fillStyle = '#8B5A2B';
    for (const obs of obstacles) { ctx.fillRect(obs.x, obs.y, obs.w, obs.h); ctx.fillStyle = '#228B22'; ctx.beginPath(); ctx.arc(obs.x + obs.w/2, obs.y - 10, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8B5A2B'; }
    if (gameMode === 'solo') {
        flowers.forEach(flower => { ctx.fillStyle = '#FF69B4'; ctx.beginPath(); ctx.arc(flower.x, flower.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(flower.x, flower.y, 3, 0, Math.PI * 2); ctx.fill(); });
    }
    diamonds.forEach(diamond => { ctx.fillStyle = '#00FFFF'; ctx.beginPath(); ctx.moveTo(diamond.x, diamond.y - 10); ctx.lineTo(diamond.x + 7, diamond.y - 3); ctx.lineTo(diamond.x + 7, diamond.y + 3); ctx.lineTo(diamond.x, diamond.y + 10); ctx.lineTo(diamond.x - 7, diamond.y + 3); ctx.lineTo(diamond.x - 7, diamond.y - 3); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.moveTo(diamond.x - 2, diamond.y - 2); ctx.lineTo(diamond.x, diamond.y - 6); ctx.lineTo(diamond.x + 2, diamond.y - 2); ctx.fill(); });
    for (const ally of allies) drawCharacterWithSkin(ctx, ally, ally.characterType, false);
    for (const enemy of enemies) drawCharacterWithSkin(ctx, enemy, enemy.characterType, false);
    bullets.forEach(bullet => { ctx.beginPath(); ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2); ctx.fillStyle = bullet.color; ctx.fill(); });
    if (player.shieldActive) { ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2); ctx.strokeStyle = '#FFCCBC'; ctx.lineWidth = 3; ctx.stroke(); }
    if (player.respawnTimer > 0 && (gameMode === 'capture' || gameMode === 'starhunt')) { ctx.globalAlpha = 0.5; drawCharacterWithSkin(ctx, player, selectedCharacter, true); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.fillText('⏱️ Возрождение: ' + Math.ceil(player.respawnTimer / 60), player.x - 50, player.y - 30); }
    else drawCharacterWithSkin(ctx, player, selectedCharacter, true);
    if (selectedCharacter === 'clancy') { ctx.beginPath(); ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2); ctx.strokeStyle = '#FFEE44'; ctx.lineWidth = 2; ctx.stroke(); }
    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = '#FF3333'; ctx.fillRect(player.x - 20, player.y - 25, 40, 5);
    ctx.fillStyle = '#33FF33'; ctx.fillRect(player.x - 20, player.y - 25, 40 * healthPercent, 5);
    drawProgressBars();
}

window.onload = function() { splashScreen.classList.remove('hidden'); loginScreen.classList.remove('hidden'); init(); };