document.addEventListener('DOMContentLoaded', function () {
    const gameArea = document.getElementById('gameArea');
    const startButton = document.getElementById('startGame');
    const retryButton = document.getElementById('retryGame');

    let scrollSpeed = 2;  // 可以調整這個數值來控制背景滾動的速度
    let enemyScrollSpeed = 18;  // 控制怪物的滾動速度
    let boosterpackSpeed = 4;  // 我假設這裡是你原本的滾動速度，你可以提高此值以加快速度
    startButton.addEventListener('click', startGame);
    retryButton.addEventListener('click', retryGame);
    let backgroundScrollInterval; // 用來存儲背景滾動的 setInterval
    let obstacleMoveInterval; // 用來存儲障礙物移動的 setInterval
    let currentMusicIndex = 0; // 目前播放的音樂索引
    const musicElements = [ // 音樂元素列表
        document.getElementById('bgMusic1'),
        document.getElementById('bgMusic2'),
        document.getElementById('bgMusic3'),
        document.getElementById('bgMusic4')
    ];

    // 定義兩個新的變量來存儲setInterval的引用
    let generateObstacleInterval;
    let generateEnemyInterval;
    let generatePowerUpInterval;
    let enemyMoveInterval; // 用來存儲怪物移動的 setInterval
    const enemies = []; // 儲存當前的怪物
    const startTime = new Date().getTime();  // 紀錄遊戲開始的時間
    function playNextMusic() {
        // 停止目前的音樂
        musicElements[currentMusicIndex].pause();
        musicElements[currentMusicIndex].currentTime = 0;

        // 更新到下一首音樂
        currentMusicIndex = (currentMusicIndex + 1) % musicElements.length;

        // 播放新的音樂
        musicElements[currentMusicIndex].play();
    }

    // 當一首音樂結束時，播放下一首
    musicElements.forEach(musicEl => {
        musicEl.onended = playNextMusic;
    });

    function startGame() {
        startButton.style.display = 'none';
        const bg1 = document.createElement('img');
        const bg2 = document.createElement('img');
        bg1.src = './asset/bg/forest4.png';
        bg2.src = './asset/bg/forest4.png';
        bg1.style.position = 'absolute';
        bg2.style.position = 'absolute';
        bg1.style.top = '0';
        bg1.style.left = '0';
        const gameAreaWidth = gameArea.offsetWidth;  // 獲取gameArea的當前寬度
        bg2.style.top = '0';
        bg2.style.left = `${gameAreaWidth}px`;  // 使用當前寬度來初始化bg2的位置
        gameArea.appendChild(bg1);
        gameArea.appendChild(bg2);
        let playerScore = 0;
        let powerUpCount = 0;
        musicElements[currentMusicIndex].play();

        clearInterval(backgroundScrollInterval);
        backgroundScrollInterval = setInterval(function () {
            const newLeft1 = parseInt(bg1.style.left) - scrollSpeed;
            const newLeft2 = parseInt(bg2.style.left) - scrollSpeed;
            bg1.style.left = `${newLeft1}px`;
            bg2.style.left = `${newLeft2}px`;

            // 重置背景位置，保持滾動連續
            if (newLeft1 <= -gameAreaWidth) {
                bg1.style.left = `${newLeft2 + gameAreaWidth}px`;
            }
            if (newLeft2 <= -gameAreaWidth) {
                bg2.style.left = `${newLeft1 + gameAreaWidth}px`;
            }
        }, 16);

        const playerImage = document.createElement('img');
        playerImage.src = './asset/player/player.png';
        playerImage.style.position = 'absolute';
        playerImage.style.bottom = '40px';
        playerImage.style.left = '10px';
        gameArea.appendChild(playerImage);
        let jumpHeight = 0;
        const jumpSpeed = 4;
        let jumpAnimation;
        let fallAnimation;
        let runningAnimation;
        let isColliding = false; // 新增這行
        let playerAnimationFrame = 1;

        function startRunningAnimation() {
            clearInterval(runningAnimation);  // 確保停止任何現有的跑步動畫
            runningAnimation = setInterval(function () {
                playerAnimationFrame++;
                if (playerAnimationFrame > 3) {
                    playerAnimationFrame = 1;
                }
                playerImage.src = `./asset/player/player.png`;
            }, 150);
        }

        startRunningAnimation();
        const bubbles = []; // 儲存當前的泡泡
        let isAttacking = false;

        // Jump Event Listener
        document.addEventListener('touchstart', function (e) {
            // 若在之前的事件中已被碰撞，則不做任何事
            if (isColliding) return;

            // 播放跳躍音效
            const jumpSound = document.getElementById('jumpSound');
            jumpSound.currentTime = 0; // 確保每次都從頭開始播放
            jumpSound.play();

            playerImage.src = `./asset/player/player.png`; // 開始跳躍時的圖片
            jumpHeight = 100; // 固定跳躍高度為100px

            clearInterval(runningAnimation);
            clearInterval(jumpAnimation);
            clearInterval(fallAnimation);

            jumpAnimation = setInterval(function () {
                playerImage.style.bottom = `${parseInt(playerImage.style.bottom) + jumpSpeed}px`;
                jumpHeight -= jumpSpeed;

                if (jumpHeight <= 70) {
                    playerImage.src = `./asset/player/player.png`; // 跳躍到最高點時的圖片
                }

                if (jumpHeight <= 0) { // 當跳躍高度用完時
                    clearInterval(jumpAnimation);

                    // 開始下降
                    playerImage.src = `./asset/player/player.png`; // 開始下降時的圖片
                    fallAnimation = setInterval(function () {
                        playerImage.style.bottom = `${parseInt(playerImage.style.bottom) - jumpSpeed}px`;

                        if (parseInt(playerImage.style.bottom) <= 40) { // 當回到地面時
                            playerImage.style.bottom = '40px';
                            clearInterval(fallAnimation);
                            playerImage.src = `./asset/player/player.png`; // 玩家回到地面時的圖片
                            startRunningAnimation();
                        }
                    }, 16);
                }
            }, 16);
        });

        let lastTouchTime = 0;  // 保存上一次觸摸的時間

        document.addEventListener('touchend', function (e) {
            let currentTime = new Date().getTime();
            let tapLength = currentTime - lastTouchTime;
            lastTouchTime = currentTime;

            // 如果兩次觸摸的時間間隔小於300ms（可以調整此數值），則視為雙擊
            if (tapLength < 300 && tapLength > 0) {
                if (!isAttacking && !isColliding) {
                    // 播放泡泡音效
                    const bubbleSound = document.getElementById('bubbleSound');
                    bubbleSound.currentTime = 0;
                    bubbleSound.play();

                    // 創建泡泡
                    const bubbleImage = document.createElement('img');
                    bubbleImage.src = './asset/coffee.png';
                    bubbleImage.style.position = 'absolute';
                    const playerHeight = playerImage.getBoundingClientRect().height;
                    bubbleImage.style.bottom = `${parseInt(playerImage.style.bottom) + 25}px`;
                    bubbleImage.style.left = `${parseInt(playerImage.style.left) + 50}px`; // 基於玩家位置
                    gameArea.appendChild(bubbleImage);
                    bubbles.push(bubbleImage);

                    isAttacking = true;
                    clearInterval(runningAnimation);
                    attackAnimationFrame = 1;
                    playerImage.src = `./asset/player/player.png`;

                    attackAnimation = setInterval(function () {
                        attackAnimationFrame++;
                        if (attackAnimationFrame > 3) {
                            attackAnimationFrame = 1;
                            clearInterval(attackAnimation);
                            isAttacking = false;
                            startRunningAnimation();
                            return;
                        }
                        playerImage.src = `./asset/player/player.png`;
                    }, 150);
                }
            }
            // 不需要再有一個單獨的'touchend'監聽器，所以這部分不需要
        });

        setInterval(function () {

            bubbles.forEach((bubble, index) => {
                bubble.style.left = `${parseInt(bubble.style.left) + 5}px`;

                if (parseInt(bubble.style.left) > 1000) {
                    gameArea.removeChild(bubble);
                    bubbles.splice(index, 1);
                }

                // 泡泡和敵人的碰撞偵測
                enemies.forEach((enemy, enemyIndex) => {
                    const bubbleRect = bubble.getBoundingClientRect();
                    const enemyRect = enemy.getBoundingClientRect();

                    if (bubbleRect.left < enemyRect.right &&
                        bubbleRect.right > enemyRect.left &&
                        bubbleRect.top < enemyRect.bottom &&
                        bubbleRect.bottom > enemyRect.top &&
                        enemyRect.right > 0 &&   // 確保怪物在遊戲視窗內
                        enemyRect.left < 945) { // 945 是 gameArea 的寬度
                        // 播放怪物死亡音效
                        const enemyDeathSound = document.getElementById('enemyDeathSound');
                        enemyDeathSound.currentTime = 0; // 確保每次都從頭開始播放
                        enemyDeathSound.play();
                        enemy.src = './asset/obstacle/devil/hurt/enemy_hurt.gif';

                        setTimeout(() => {
                            gameArea.removeChild(enemy);
                            enemies.splice(enemyIndex, 1);
                        }, 1000);

                        gameArea.removeChild(bubble);
                        bubbles.splice(index, 1);
                        playerScore += 1;
                        document.getElementById("playerScore").textContent = playerScore;
                    }
                });

                // 泡泡和補充包的碰撞偵測
                powerUps.forEach((powerUp, powerUpIndex) => {
                    const bubbleRect = bubble.getBoundingClientRect();
                    const powerUpRect = powerUp.getBoundingClientRect();

                    if (bubbleRect.left < powerUpRect.right &&
                        bubbleRect.right > powerUpRect.left &&
                        bubbleRect.top < powerUpRect.bottom &&
                        bubbleRect.bottom > powerUpRect.top &&
                        powerUpRect.right > 0 &&    // 確保補充包在遊戲視窗內
                        powerUpRect.left < 948) {  // 945 是 gameArea 的寬度
                        // 播放回血音效
                        const healthRecoverySound = document.getElementById('healthRecoverySound');
                        healthRecoverySound.currentTime = 0; // 確保每次都從頭開始播放
                        healthRecoverySound.play();
                        gameArea.removeChild(powerUp);
                        powerUps.splice(powerUpIndex, 1);

                        gameArea.removeChild(bubble);
                        bubbles.splice(index, 1);

                        powerUpCount++;
                        document.getElementById("powerUpCounter").textContent = powerUpCount;
                    }
                });
            });
        }, 16);

        const obstacles = []; // 存儲當前的障礙物
        const BUFFER = 10 // 增加或減少此值以調整與障礙物的碰撞緩衝區大小
        const MBUFFER = 70; // 增加或減少此值以調整與怪物的碰撞緩衝區大小
        let runningAnimationTimeout;

        function generateObstacle() {
            const obstacleImage = document.createElement('img');
            obstacleImage.src = './asset/obstacle/rock2.png';
            obstacleImage.style.position = 'absolute';
            obstacleImage.style.bottom = '42px';
            obstacleImage.style.left = '945px'; // 從右側開始
            gameArea.appendChild(obstacleImage);
            obstacles.push(obstacleImage);
            obstacleImage.isHit = false;

            // 隨機調整生成障礙物的間隔時間
            const randomObstacleTime = 6000 + Math.random() * 4000;  // 6秒到10秒之間
            clearInterval(generateObstacleInterval);
            generateObstacleInterval = setInterval(generateObstacle, randomObstacleTime);
        }

        clearInterval(generateObstacleInterval);  // 清除現有的生成障礙物的 setInterval
        generateObstacleInterval = setInterval(generateObstacle, 8000);  // 初始每8秒生成新的障礙物

        clearInterval(obstacleMoveInterval);
        obstacleMoveInterval = setInterval(function () {
            obstacles.forEach((obstacle, index) => {
                obstacle.style.left = `${parseInt(obstacle.style.left) - scrollSpeed}px`;

                // 當障礙物移出畫面，將其從DOM和數組中移除
                if (parseInt(obstacle.style.left) < -50) {
                    gameArea.removeChild(obstacle);
                    obstacles.splice(index, 1);
                    obstacle.isHit = false;  // 重置
                }

                // 障礙物碰撞檢測
                const playerRect = playerImage.getBoundingClientRect();
                const obstacleRect = obstacle.getBoundingClientRect();

                if (!obstacle.isHit &&
                    playerRect.left + BUFFER < obstacleRect.right &&
                    playerRect.right - BUFFER > obstacleRect.left &&
                    playerRect.top + BUFFER < obstacleRect.bottom &&
                    playerRect.bottom - BUFFER > obstacleRect.top) {

                    isColliding = true;
                    playerImage.style.filter = 'brightness(0.5)'; // 讓玩家圖片的顏色變深
                    clearInterval(runningAnimation);
                    clearTimeout(runningAnimationTimeout);
                    hideHeart(); // 隱藏一顆愛心
                    obstacle.isHit = true; // 標記該障礙物已被撞擊

                    setTimeout(() => {
                        playerImage.style.filter = 'brightness(1)'; // 恢復玩家圖片的亮度
                    }, 500);  // 0.5秒後恢復

                    runningAnimationTimeout = setTimeout(() => {
                        isColliding = false;
                        if (!isColliding) {
                            startRunningAnimation();
                        }
                    }, 220);
                }
            });
        }, 16);

        function generateEnemy() {
            const currentTime = new Date().getTime();
            const elapsedTime = (currentTime - startTime) / 1000;  // 當遊戲運行時間，單位：秒
            const enemyImage = document.createElement('img');
            enemyImage.src = './asset/obstacle/devil/walk/enemy_walk.gif';
            enemyImage.style.position = 'absolute';
            enemyImage.style.top = `${Math.random() * (200 - 170 - 60) + 60}px`; // 在60px到200px之間
            enemyImage.style.left = '945px';
            gameArea.appendChild(enemyImage);
            enemies.push(enemyImage);
            let randomEnemyTime;
            enemyImage.isHit = false;

            if (elapsedTime < 5) {
                randomEnemyTime = 8000;  // 8秒
            } else {
                randomEnemyTime = 7000 + Math.random() * 3000;  // 7秒到10秒之间
            }

            clearInterval(generateEnemyInterval);
            generateEnemyInterval = setInterval(generateEnemy, randomEnemyTime);
        }

        clearInterval(generateEnemyInterval);
        generateEnemyInterval = setInterval(generateEnemy, 10000);  // 初始每10秒生成新的怪物

        // 怪物動畫的邏輯
        clearInterval(enemyMoveInterval);
        enemyMoveInterval = setInterval(function () {
            enemies.forEach((enemy, index) => {
                enemy.style.left = `${parseInt(enemy.style.left) - enemyScrollSpeed}px`;
                // 當怪物移出畫面，將其從DOM和陣列中移除
                if (parseInt(enemy.style.left) < -100) {
                    gameArea.removeChild(enemy);
                    enemies.splice(index, 1);
                    enemy.isHit = false;  // 重置
                }
                // 怪物碰撞檢測
                const playerRect = playerImage.getBoundingClientRect();
                const enemyRect = enemy.getBoundingClientRect();

                if (!enemy.isHit &&
                    playerRect.left + MBUFFER < enemyRect.right &&
                    playerRect.right - MBUFFER > enemyRect.left &&
                    playerRect.top + MBUFFER < enemyRect.bottom &&
                    playerRect.bottom - MBUFFER > enemyRect.top) {

                    isColliding = true;
                    playerImage.style.filter = 'brightness(0.5)'; // 讓玩家圖片的顏色變深
                    clearInterval(runningAnimation);
                    clearTimeout(runningAnimationTimeout);
                    hideHeart(); // 隱藏一顆愛心
                    enemy.isHit = true; // 標記該怪物已被撞擊

                    setTimeout(() => {
                        playerImage.style.filter = 'brightness(1)'; // 恢復玩家圖片的亮度
                    }, 500);  // 0.5秒後恢復

                    runningAnimationTimeout = setTimeout(() => {
                        isColliding = false;
                        if (!isColliding) {
                            startRunningAnimation();
                        }
                    }, 1000);
                }
            });
        }, 150); // 更新怪物的動畫

        function hideHeart() {
            const visibleHearts = document.querySelectorAll('.heart:not(.transparent)');
            if (visibleHearts.length > 0) {
                visibleHearts[visibleHearts.length - 1].style.backgroundImage = "url('asset/transparent.png')";
                visibleHearts[visibleHearts.length - 1].classList.add('transparent');
            }

            if (visibleHearts.length === 1) { // 只剩下一顆愛心時
                gameOver();
            }
        }

        const powerUps = []; // 儲存當前的補充包
        let generatePowerUpInterval; // 儲存生成補充包的setInterval的引用

        function generatePowerUp() {
            const powerUpImage = document.createElement('img');
            powerUpImage.src = './asset/buff/bunny.png';  // 改成單張圖片的路徑
            powerUpImage.style.position = 'absolute';
            powerUpImage.style.top = `${Math.random() * (200 - 96 - 30) + 30}px`;  //30~200px
            powerUpImage.style.left = '945px'; // 從右側開始
            gameArea.appendChild(powerUpImage);
            powerUps.push(powerUpImage);

            const randomPowerUpTime = 7000 + Math.random() * 6000;  // 7秒到13秒之間
            clearInterval(generatePowerUpInterval);
            generatePowerUpInterval = setInterval(generatePowerUp, randomPowerUpTime);
        }

        clearInterval(generatePowerUpInterval);
        generatePowerUpInterval = setInterval(generatePowerUp, 10000);  // 初始每10秒生成新的補充包

        setInterval(function () {
            powerUps.forEach((powerUp, index) => {
                powerUp.style.left = `${parseInt(powerUp.style.left) - boosterpackSpeed}px`;
                // 當補充包移出畫面，將其從DOM和陣列中移除
                if (parseInt(powerUp.style.left) < -50) {
                    gameArea.removeChild(powerUp);
                    powerUps.splice(index, 1);
                }
                // 碰撞檢測
                const playerRect = playerImage.getBoundingClientRect();
                const powerUpRect = powerUp.getBoundingClientRect();

                if (playerRect.left + BUFFER < powerUpRect.right &&
                    playerRect.right - BUFFER > powerUpRect.left &&
                    playerRect.top + BUFFER < powerUpRect.bottom &&
                    playerRect.bottom - BUFFER > powerUpRect.top) {

                    // 移除補充包
                    gameArea.removeChild(powerUp);
                    powerUps.splice(index, 1);
                }
            });
        }, 16);
    }

    function retryGame() {
        // 重新開始遊戲邏輯...
        // 清除所有 setInterval 和 setTimeout
        clearInterval(backgroundScrollInterval);
        clearInterval(obstacleMoveInterval);
        clearInterval(runningAnimation);
        clearTimeout(runningAnimationTimeout);
        clearInterval(enemyMoveInterval);
        // 清除生成元素的 setInterval
        clearInterval(generateObstacleInterval);
        clearInterval(generateEnemyInterval);
        clearInterval(generatePowerUpInterval);
    }

    function gameOver() {
        document.querySelector('.gameOver').classList.remove('hidden');
        // 停止所有的動畫和生成障礙物或怪物的計時器
        clearInterval(generateObstacleInterval);
        clearInterval(obstacleMoveInterval);
        clearInterval(generateEnemyInterval);
        clearInterval(enemyMoveInterval);
        clearInterval(runningAnimation);
        clearTimeout(runningAnimationTimeout);
        const gameOverDiv = document.querySelector(".gameOver");
        gameOverDiv.innerHTML = `Game Over`;
    }
});