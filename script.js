/* =====================================================
   SHUBHAM LUDO
   SCRIPT.JS
   ===================================================== */

"use strict";

/* =====================================================
   GAME DATA
   ===================================================== */

const COLORS = ["red", "green", "yellow", "blue"];

const DEFAULT_NAMES = [
    "Player 1",
    "Player 2",
    "Player 3",
    "Player 4"
];

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

let game = {
    mode: "computer",

    players: [],

    currentPlayer: 0,

    dice: 1,

    rolling: false,

    gameStarted: false,

    winner: null,

    moves: 0,

    captures: 0,

    sound: true,

    music: false,

    darkMode: true
};


/* =====================================================
   SAFE DOM HELPERS
   ===================================================== */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [...document.querySelectorAll(selector)];
}

function show(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}

function hide(element) {
    if (element) {
        element.classList.add("hidden");
    }
}

function text(element, value) {
    if (element) {
        element.textContent = value;
    }
}


/* =====================================================
   LOCAL STORAGE
===================================================== */

const STORAGE_KEY = "shubhamLudoData";

function loadSavedData() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return;
        }

        const data =
            JSON.parse(saved);

        if (typeof data.sound === "boolean") {
            game.sound = data.sound;
        }

        if (typeof data.music === "boolean") {
            game.music = data.music;
        }

    } catch (error) {

        console.warn(
            "Saved game data could not be loaded."
        );
    }
}

function saveData() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                sound: game.sound,
                music: game.music
            })
        );

    } catch (error) {

        console.warn(
            "Could not save game data."
        );
    }
}


/* =====================================================
   SOUND ENGINE
   No external audio files required.
===================================================== */

let audioContext = null;

function getAudioContext() {

    if (!game.sound) {
        return null;
    }

    try {

        if (!audioContext) {

            const AudioCtx =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioCtx) {
                return null;
            }

            audioContext =
                new AudioCtx();
        }

        if (
            audioContext.state ===
            "suspended"
        ) {
            audioContext.resume();
        }

        return audioContext;

    } catch (error) {

        return null;
    }
}


function playTone(
    frequency,
    duration = 0.1,
    type = "sine",
    volume = 0.04
) {

    const ctx =
        getAudioContext();

    if (!ctx) {
        return;
    }

    try {

        const oscillator =
            ctx.createOscillator();

        const gain =
            ctx.createGain();

        oscillator.type = type;

        oscillator.frequency.value =
            frequency;

        gain.gain.setValueAtTime(
            volume,
            ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + duration
        );

        oscillator.connect(gain);

        gain.connect(ctx.destination);

        oscillator.start();

        oscillator.stop(
            ctx.currentTime + duration
        );

    } catch (error) {

        // Audio is optional.
    }
}


function playDiceSound() {

    playTone(
        300,
        0.05,
        "square",
        0.025
    );

    setTimeout(() => {

        playTone(
            520,
            0.07,
            "square",
            0.025
        );

    }, 60);
}


function playMoveSound() {

    playTone(
        600,
        0.07,
        "sine",
        0.035
    );
}


function playCaptureSound() {

    playTone(
        180,
        0.12,
        "sawtooth",
        0.035
    );

    setTimeout(() => {

        playTone(
            90,
            0.15,
            "sawtooth",
            0.025
        );

    }, 90);
}


function playWinSound() {

    const notes = [
        523,
        659,
        784,
        1046
    ];

    notes.forEach(
        (note, index) => {

            setTimeout(() => {

                playTone(
                    note,
                    0.18,
                    "sine",
                    0.045
                );

            }, index * 130);
        }
    );
}


/* =====================================================
   PLAYER CREATION
===================================================== */

function createPlayer(
    name,
    color,
    isComputer = false
) {

    return {

        id:
            `${color}-${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}`,

        name:
            name ||
            color.toUpperCase(),

        color,

        isComputer,

        finished: false,

        moves: 0,

        tokens: [
            {
                id: 0,
                position: -1,
                finished: false
            },
            {
                id: 1,
                position: -1,
                finished: false
            },
            {
                id: 2,
                position: -1,
                finished: false
            },
            {
                id: 3,
                position: -1,
                finished: false
            }
        ]
    };
}


/* =====================================================
   GAME MODES
===================================================== */

function setupComputerGame() {

    const playerName =
        getPlayerName(0) ||
        "Player";

    game.players = [

        createPlayer(
            playerName,
            "red",
            false
        ),

        createPlayer(
            "Shubham",
            "green",
            true
        )

    ];
}


function setupTwoPlayerGame() {

    game.players = [

        createPlayer(
            getPlayerName(0) ||
            "Player 1",
            "red"
        ),

        createPlayer(
            getPlayerName(1) ||
            "Player 2",
            "green"
        )
    ];
}


function setupThreePlayerGame() {

    game.players = [

        createPlayer(
            getPlayerName(0) ||
            "Player 1",
            "red"
        ),

        createPlayer(
            getPlayerName(1) ||
            "Player 2",
            "green"
        ),

        createPlayer(
            getPlayerName(2) ||
            "Player 3",
            "yellow"
        )
    ];
}


function setupFourPlayerGame() {

    game.players = [

        createPlayer(
            getPlayerName(0) ||
            "Player 1",
            "red"
        ),

        createPlayer(
            getPlayerName(1) ||
            "Player 2",
            "green"
        ),

        createPlayer(
            getPlayerName(2) ||
            "Player 3",
            "yellow"
        ),

        createPlayer(
            getPlayerName(3) ||
            "Player 4",
            "blue"
        )
    ];
}


function setupTeamGame() {

    game.players = [

        createPlayer(
            getPlayerName(0) ||
            "Team Red",
            "red"
        ),

        createPlayer(
            getPlayerName(1) ||
            "Team Green",
            "green"
        ),

        createPlayer(
            getPlayerName(2) ||
            "Team Red 2",
            "yellow"
        ),

        createPlayer(
            getPlayerName(3) ||
            "Team Green 2",
            "blue"
        )
    ];
}


function getPlayerName(index) {

    const selectors = [
        "#player1Name",
        "#player2Name",
        "#player3Name",
        "#player4Name",

        "[name='player1']",
        "[name='player2']",
        "[name='player3']",
        "[name='player4']"
    ];

    const selector =
        selectors[index];

    const input =
        selector
            ? $(selector)
            : null;

    if (input) {
        return input.value.trim();
    }

    return DEFAULT_NAMES[index];
}


/* =====================================================
   MODE DETECTION
===================================================== */

function startSelectedMode(mode) {

    game.mode =
        mode || "computer";

    switch (game.mode) {

        case "computer":
        case "vs-computer":
        case "ai":
            setupComputerGame();
            break;

        case "2":
        case "two":
        case "2-player":
            setupTwoPlayerGame();
            break;

        case "3":
        case "three":
        case "3-player":
            setupThreePlayerGame();
            break;

        case "4":
        case "four":
        case "4-player":
            setupFourPlayerGame();
            break;

        case "team":
        case "2v2":
            setupTeamGame();
            break;

        default:
            setupComputerGame();
    }

    startGame();
}


/* =====================================================
   START GAME
===================================================== */

function startGame() {

    game.currentPlayer = 0;

    game.dice = 1;

    game.rolling = false;

    game.gameStarted = true;

    game.winner = null;

    game.moves = 0;

    game.captures = 0;

    createBoard();

    updateGameUI();

    showGameScreen();

    playMoveSound();
}


/* =====================================================
   SCREEN MANAGEMENT
===================================================== */

function showGameScreen() {

    const home =
        $("#homeScreen");

    const setup =
        $("#setupScreen");

    const gameScreen =
        $("#gameScreen");

    hide(home);

    hide(setup);

    show(gameScreen);
}


function showHomeScreen() {

    const home =
        $("#homeScreen");

    const setup =
        $("#setupScreen");

    const gameScreen =
        $("#gameScreen");

    show(home);

    hide(setup);

    hide(gameScreen);
}


/* =====================================================
   BOARD
===================================================== */

function createBoard() {

    const board =
        $(".ludo-board");

    if (!board) {
        return;
    }

    let cellLayer =
        board.querySelector(
            ".board-cells"
        );

    if (!cellLayer) {

        cellLayer =
            document.createElement("div");

        cellLayer.className =
            "board-cells";

        board.appendChild(
            cellLayer
        );
    }

    cellLayer.innerHTML = "";

    /*
       Create a decorative playable
       grid. The home areas and center
       are positioned by CSS.
    */

    for (
        let i = 0;
        i < 45;
        i++
    ) {

        const cell =
            document.createElement("div");

        cell.className =
            "board-cell";

        if (
            i % 11 === 0 ||
            i % 17 === 0
        ) {

            cell.classList.add(
                "safe"
            );
        }

        cellLayer.appendChild(
            cell
        );
    }

    createTokenLayer();

    createHomeZones();

    createBoardCenter();
}


/* =====================================================
   HOME ZONES
===================================================== */

function createHomeZones() {

    const board =
        $(".ludo-board");

    if (!board) {
        return;
    }

    const oldZones =
        board.querySelectorAll(
            ".home-zone"
        );

    oldZones.forEach(
        zone => zone.remove()
    );

    const zones = [
        ["red", "red-zone"],
        ["green", "green-zone"],
        ["blue", "blue-zone"],
        ["yellow", "yellow-zone"]
    ];

    zones.forEach(
        ([color, className]) => {

            const zone =
                document.createElement(
                    "div"
                );

            zone.className =
                `home-zone ${className}`;

            const inner =
                document.createElement(
                    "div"
                );

            inner.className =
                "home-inner";

            for (
                let i = 0;
                i < 4;
                i++
            ) {

                const token =
                    document.createElement(
                        "div"
                    );

                token.className =
                    `home-token ${color}`;

                inner.appendChild(
                    token
                );
            }

            zone.appendChild(
                inner
            );

            board.appendChild(
                zone
            );
        }
    );
}


/* =====================================================
   BOARD CENTER
===================================================== */

function createBoardCenter() {

    const board =
        $(".ludo-board");

    if (!board) {
        return;
    }

    const old =
        board.querySelector(
            ".board-center"
        );

    if (old) {
        old.remove();
    }

    const center =
        document.createElement(
            "div"
        );

    center.className =
        "board-center";

    [
        "red",
        "green",
        "blue",
        "yellow"
    ].forEach(
        color => {

            const triangle =
                document.createElement(
                    "div"
                );

            triangle.className =
                `center-triangle ${color}`;

            center.appendChild(
                triangle
            );
        }
    );

    const star =
        document.createElement(
            "div"
        );

    star.className =
        "center-star";

    star.textContent = "★";

    center.appendChild(
        star
    );

    board.appendChild(
        center
    );
}


/* =====================================================
   TOKEN LAYER
===================================================== */

function createTokenLayer() {

    const board =
        $(".ludo-board");

    if (!board) {
        return;
    }

    let layer =
        board.querySelector(
            ".token-layer"
        );

    if (!layer) {

        layer =
            document.createElement(
                "div"
            );

        layer.className =
            "token-layer";

        board.appendChild(
            layer
        );
    }

    layer.innerHTML = "";

    game.players.forEach(
        player => {

            player.tokens.forEach(
                token => {

                    const element =
                        document.createElement(
                            "div"
                        );

                    element.className =
                        `token ${player.color}`;

                    element.dataset.player =
                        player.id;

                    element.dataset.token =
                        token.id;

                    element.textContent =
                        token.id + 1;

                    element.addEventListener(
                        "click",
                        () => {
                            moveSelectedToken(
                                player.id,
                                token.id
                            );
                        }
                    );

                    layer.appendChild(
                        element
                    );

                    positionToken(
                        element,
                        player,
                        token
                    );
                }
            );
        }
    );
}


/* =====================================================
   TOKEN POSITION
===================================================== */

function positionToken(
    element,
    player,
    token
) {

    if (!element) {
        return;
    }

    /*
       Home positions.
    */

    if (token.position === -1) {

        const homePositions = {

            red: [
                [10, 10],
                [17, 10],
                [10, 17],
                [17, 17]
            ],

            green: [
                [83, 10],
                [90, 10],
                [83, 17],
                [90, 17]
            ],

            blue: [
                [10, 83],
                [17, 83],
                [10, 90],
                [17, 90]
            ],

            yellow: [
                [83, 83],
                [90, 83],
                [83, 90],
                [90, 90]
            ]
        };

        const positions =
            homePositions[
                player.color
            ] ||
            homePositions.red;

        const position =
            positions[token.id] ||
            positions[0];

        element.style.left =
            `${position[0]}%`;

        element.style.top =
            `${position[1]}%`;

        return;
    }


    /*
       Track position.
    */

    const track =
        getTrackPosition(
            token.position
        );

    element.style.left =
        `${track.x}%`;

    element.style.top =
        `${track.y}%`;
}


function getTrackPosition(position) {

    /*
       Approximate 52-cell Ludo path
       around the board.
    */

    const track = [

        [23, 6],
        [30, 6],
        [37, 6],
        [37, 13],
        [37, 20],

        [44, 20],
        [51, 20],
        [58, 20],
        [65, 20],
        [72, 20],
        [79, 20],

        [86, 23],
        [86, 30],
        [86, 37],

        [79, 37],
        [72, 37],
        [65, 37],
        [58, 37],

        [58, 44],
        [58, 51],
        [58, 58],

        [65, 58],
        [72, 58],
        [79, 58],
        [86, 58],

        [86, 65],
        [86, 72],
        [86, 79],

        [79, 86],
        [72, 86],
        [65, 86],
        [58, 86],

        [58, 79],
        [51, 79],
        [44, 79],

        [44, 86],
        [37, 86],
        [30, 86],
        [23, 86],

        [16, 79],
        [16, 72],
        [16, 65],

        [23, 58],
        [30, 58],
        [37, 58],
        [44, 58],

        [44, 51],
        [44, 44],

        [37, 44],
        [30, 44],
        [23, 44],
        [16, 44],

        [16, 37],
        [16, 30],
        [16, 23],

        [23, 23]
    ];

    const safePosition =
        position %
        track.length;

    const point =
        track[safePosition] ||
        track[0];

    return {
        x: point[0],
        y: point[1]
    };
}


/* =====================================================
   DICE
===================================================== */

function rollDice() {

    if (!game.gameStarted) {
        return;
    }

    if (game.rolling) {
        return;
    }

    if (
        game.winner !== null
    ) {
        return;
    }

    const player =
        game.players[
            game.currentPlayer
        ];

    if (!player) {
        return;
    }

    if (player.isComputer) {
        return;
    }

    performDiceRoll();
}


function performDiceRoll() {

    game.rolling = true;

    const dice =
        $(".dice");

    if (dice) {

        dice.classList.add(
            "rolling"
        );
    }

    playDiceSound();

    let count = 0;

    const animation =
        setInterval(
            () => {

                const random =
                    Math.floor(
                        Math.random() * 6
                    );

                game.dice =
                    random + 1;

                updateDice();

                count++;

                if (count >= 8) {

                    clearInterval(
                        animation
                    );

                    finishDiceRoll();
                }

            },
            75
        );
}


function finishDiceRoll() {

    game.rolling = false;

    const dice =
        $(".dice");

    if (dice) {

        setTimeout(
            () => {

                dice.classList.remove(
                    "rolling"
                );

            },
            300
        );
    }

    handleDiceResult();
}


function updateDice() {

    const dice =
        $(".dice");

    if (!dice) {
        return;
    }

    dice.textContent =
        DICE_FACES[
            game.dice - 1
        ] ||
        game.dice;
}


/* =====================================================
   MOVE LOGIC
===================================================== */

function getMovableTokens(
    player,
    dice
) {

    if (!player) {
        return [];
    }

    return player.tokens.filter(
        token => {

            if (
                token.finished
            ) {
                return false;
            }

            /*
               Six can bring a token
               out of home.
            */

            if (
                token.position === -1
            ) {

                return dice === 6;
            }

            return true;
        }
    );
}


function handleDiceResult() {

    const player =
        game.players[
            game.currentPlayer
        ];

    if (!player) {
        return;
    }

    const movable =
        getMovableTokens(
            player,
            game.dice
        );

    if (
        movable.length === 0
    ) {

        setMessage(
            `${player.name} has no valid move.`
        );

        setTimeout(
            () => {
                nextTurn();
            },
            800
        );

        return;
    }

    /*
       Computer player.
    */

    if (player.isComputer) {

        setMessage(
            `${player.name} is thinking...`
        );

        setTimeout(
            () => {

                computerMove(
                    player,
                    movable
                );

            },
            700
        );

        return;
    }

    /*
       Highlight movable tokens.
    */

    highlightMovableTokens(
        movable
    );

    setMessage(
        `${player.name}, choose a token.`
    );
}


/* =====================================================
   HIGHLIGHT TOKENS
===================================================== */

function highlightMovableTokens(
    movable
) {

    $$(".token").forEach(
        element => {

            element.classList.remove(
                "movable"
            );
        }
    );

    movable.forEach(
        token => {

            const player =
                game.players[
                    game.currentPlayer
                ];

            if (!player) {
                return;
            }

            const element =
                document.querySelector(
                    `.token[data-player="${player.id}"][data-token="${token.id}"]`
                );

            if (element) {

                element.classList.add(
                    "movable"
                );
            }
        }
    );
}


/* =====================================================
   TOKEN CLICK
===================================================== */

function moveSelectedToken(
    playerId,
    tokenId
) {

    if (game.rolling) {
        return;
    }

    const player =
        game.players[
            game.currentPlayer
        ];

    if (!player) {
        return;
    }

    if (
        player.id !== playerId
    ) {
        return;
    }

    if (player.isComputer) {
        return;
    }

    const token =
        player.tokens.find(
            item =>
                item.id === tokenId
        );

    if (!token) {
        return;
    }

    const movable =
        getMovableTokens(
            player,
            game.dice
        );

    if (
        !movable.includes(token)
    ) {
        return;
    }

    moveToken(
        player,
        token
    );
}


/* =====================================================
   MOVE TOKEN
===================================================== */

function moveToken(
    player,
    token
) {

    clearMovableHighlights();

    game.moves++;

    player.moves++;

    /*
       Six takes token out of home.
    */

    if (
        token.position === -1
    ) {

        token.position = 0;

    } else {

        token.position +=
            game.dice;
    }

    /*
       Finish token after enough movement.
    */

    if (
        token.position >= 52
    ) {

        token.position = 52;

        token.finished = true;
    }

    playMoveSound();

    updateTokenVisual(
        player,
        token
    );

    setMessage(
        `${player.name} moved ${game.dice} step${game.dice === 1 ? "" : "s"}.`
    );

    /*
       Basic capture system.
    */

    checkCapture(
        player,
        token
    );

    /*
       Check win.
    */

    if (
        checkPlayerWin(player)
    ) {

        endGame(
            player
        );

        return;
    }

    /*
       Six gives another turn.
    */

    if (
        game.dice === 6
    ) {

        setMessage(
            `${player.name} rolled a 6 — play again!`
        );

        updateGameUI();

        if (player.isComputer) {

            setTimeout(
                computerTurn,
                700
            );
        }

        return;
    }

    updateGameUI();

    setTimeout(
        nextTurn,
        650
    );
}


/* =====================================================
   UPDATE TOKEN VISUAL
===================================================== */

function updateTokenVisual(
    player,
    token
) {

    const element =
        document.querySelector(
            `.token[data-player="${player.id}"][data-token="${token.id}"]`
        );

    if (!element) {
        return;
    }

    positionToken(
        element,
        player,
        token
    );
}


/* =====================================================
   CAPTURE
===================================================== */

function checkCapture(
    movingPlayer,
    movingToken
) {

    if (
        movingToken.position <= 0 ||
        movingToken.finished
    ) {
        return;
    }

    game.players.forEach(
        player => {

            if (
                player.id ===
                movingPlayer.id
            ) {
                return;
            }

            player.tokens.forEach(
                token => {

                    if (
                        token.finished
                    ) {
                        return;
                    }

                    if (
                        token.position ===
                        movingToken.position
                    ) {

                        token.position = -1;

                        game.captures++;

                        playCaptureSound();

                        updateTokenVisual(
                            player,
                            token
                        );

                        setMessage(
                            `${movingPlayer.name} captured ${player.name}'s token!`
                        );
                    }
                }
            );
        }
    );
}


/* =====================================================
   WIN CHECK
===================================================== */

function checkPlayerWin(
    player
) {

    const finished =
        player.tokens.filter(
            token =>
                token.finished
        ).length;

    return finished ===
        player.tokens.length;
}


function endGame(
    winner
) {

    game.winner =
        winner.id;

    winner.finished = true;

    playWinSound();

    setMessage(
        `🏆 ${winner.name} wins!`
    );

    updateResultModal(
        winner
    );

    showResultModal();
}


/* =====================================================
   COMPUTER AI — HARD MODE
===================================================== */

function computerTurn() {

    const player =
        game.players[
            game.currentPlayer
        ];

    if (!player) {
        return;
    }

    if (!player.isComputer) {
        return;
    }

    performDiceRoll();
}


function computerMove(
    player,
    movable
) {

    if (
        !movable ||
        movable.length === 0
    ) {
        nextTurn();

        return;
    }

    /*
       HARD AI priority:

       1. Capture opponent.
       2. Finish token.
       3. Bring home token on 6.
       4. Advance furthest token.
    */

    let selected =
        movable[0];

    const captureCandidate =
        findCaptureCandidate(
            player,
            movable
        );

    if (captureCandidate) {

        selected =
            captureCandidate;

    } else {

        const finishCandidate =
            movable.find(
                token =>
                    token.position +
                        game.dice >=
                    52
            );

        if (finishCandidate) {

            selected =
                finishCandidate;

        } else {

            const homeCandidate =
                movable.find(
                    token =>
                        token.position === -1
                );

            if (
                homeCandidate &&
                game.dice === 6
            ) {

                selected =
                    homeCandidate;

            } else {

                selected =
                    [...movable]
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                b.position -
                                a.position
                        )[0];
            }
        }
    }

    moveToken(
        player,
        selected
    );
}


function findCaptureCandidate(
    player,
    movable
) {

    for (
        const token of movable
    ) {

        const targetPosition =
            token.position === -1
                ? 0
                : token.position +
                  game.dice;

        for (
            const opponent
            of game.players
        ) {

            if (
                opponent.id ===
                player.id
            ) {
                continue;
            }

            const match =
                opponent.tokens.find(
                    opponentToken =>
                        !opponentToken.finished &&
                        opponentToken.position ===
                        targetPosition
                );

            if (match) {
                return token;
            }
        }
    }

    return null;
}


/* =====================================================
   TURN MANAGEMENT
===================================================== */

function nextTurn() {

    clearMovableHighlights();

    if (
        game.winner !== null
    ) {
        return;
    }

    game.currentPlayer =
        (
            game.currentPlayer + 1
        ) %
        game.players.length;

    updateGameUI();

    const player =
        game.players[
            game.currentPlayer
        ];

    if (!player) {
        return;
    }

    setMessage(
        `${player.name}'s turn`
    );

    if (
        player.isComputer
    ) {

        setTimeout(
            computerTurn,
            800
        );
    }
}


/* =====================================================
   UI
===================================================== */

function updateGameUI() {

    const player =
        game.players[
            game.currentPlayer
        ];

    if (!player) {
        return;
    }

    updateDice();

    /*
       Turn name.
    */

    const turnName =
        $("#turnPlayerName") ||
        $(".turn-player strong");

    text(
        turnName,
        player.name
    );

    /*
       Move count.
    */

    text(
        $("#movesCount"),
        game.moves
    );

    /*
       Capture count.
    */

    text(
        $("#captureCount"),
        game.captures
    );

    /*
       Current player score.
    */

    text(
        $("#currentPlayerName"),
        player.name
    );

    /*
       Board player labels.
    */

    updateBoardPlayers();

    /*
       Score bar.
    */

    updateScoreBar();
}


function updateBoardPlayers() {

    const slots = [
        ".top-player",
        ".right-player",
        ".bottom-player",
        ".left-player"
    ];

    game.players.forEach(
        (player, index) => {

            const slot =
                $(slots[index]);

            if (!slot) {
                return;
            }

            const name =
                slot.querySelector(
                    "strong"
                );

            text(
                name,
                player.name
            );

            const dot =
                slot.querySelector(
                    ".player-color-dot"
                );

            if (dot) {

                dot.className =
                    `player-color-dot ${player.color}`;
            }
        }
    );
}


function updateScoreBar() {

    const totalMoves =
        $("#totalMoves");

    const captures =
        $("#totalCaptures");

    const turn =
        $("#currentTurn");

    text(
        totalMoves,
        game.moves
    );

    text(
        captures,
        game.captures
    );

    text(
        turn,
        game.currentPlayer + 1
    );
}


function setMessage(
    message
) {

    const messageBox =
        $("#gameMessage") ||
        $(".game-message");

    text(
        messageBox,
        message
    );
}


/* =====================================================
   RESULT MODAL
===================================================== */

function updateResultModal(
    winner
) {

    text(
        $("#winnerName"),
        winner.name
    );

    text(
        $("#winnerMessage"),
        `${winner.name} won the game!`
    );

    text(
        $("#resultMoves"),
        game.moves
    );

    text(
        $("#resultCaptures"),
        game.captures
    );
}


function showResultModal() {

    const modal =
        $("#resultModal") ||
        $(".result-modal");

    show(modal);
}


function hideResultModal() {

    const modal =
        $("#resultModal") ||
        $(".result-modal");

    hide(modal);
}


/* =====================================================
   SETTINGS MODAL
===================================================== */

function showSettings() {

    const modal =
        $("#settingsModal") ||
        $(".settings-modal");

    show(modal);

    updateSettingsUI();
}


function hideSettings() {

    const modal =
        $("#settingsModal") ||
        $(".settings-modal");

    hide(modal);
}


function updateSettingsUI() {

    const soundButton =
        $("#soundToggle");

    if (soundButton) {

        soundButton.textContent =
            game.sound
                ? "ON"
                : "OFF";

        soundButton.classList.toggle(
            "active",
            game.sound
        );
    }

    const musicButton =
        $("#musicToggle");

    if (musicButton) {

        musicButton.textContent =
            game.music
                ? "ON"
                : "OFF";

        musicButton.classList.toggle(
            "active",
            game.music
        );
    }
}


/* =====================================================
   SOUND / MUSIC TOGGLES
===================================================== */

function toggleSound() {

    game.sound =
        !game.sound;

    saveData();

    updateSettingsUI();

    if (game.sound) {
        playTone(
            700,
            0.08,
            "sine",
            0.035
        );
    }
}


function toggleMusic() {

    game.music =
        !game.music;

    saveData();

    updateSettingsUI();

    /*
       No external music file is required.
       We keep music disabled by default
       to avoid annoying autoplay behavior.
    */
}


/* =====================================================
   THEME
===================================================== */

function toggleTheme() {

    document.body.classList.toggle(
        "light-theme"
    );

    game.darkMode =
        !document.body.classList.contains(
            "light-theme"
        );
}


/* =====================================================
   HISTORY
===================================================== */

const HISTORY_KEY =
    "shubhamLudoHistory";


function getHistory() {

    try {

        const value =
            localStorage.getItem(
                HISTORY_KEY
            );

        if (!value) {
            return [];
        }

        const history =
            JSON.parse(value);

        return Array.isArray(history)
            ? history
            : [];

    } catch (error) {

        return [];
    }
}


function saveMatchToHistory(
    winner
) {

    const history =
        getHistory();

    history.unshift({

        winner:
            winner.name,

        mode:
            game.mode,

        moves:
            game.moves,

        captures:
            game.captures,

        date:
            new Date()
                .toLocaleString()
    });

    /*
       Keep latest 50 matches.
    */

    history.splice(
        50
    );

    try {

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(history)
        );

    } catch (error) {

        console.warn(
            "History could not be saved."
        );
    }
}


function renderHistory() {

    const container =
        $("#historyList");

    if (!container) {
        return;
    }

    const history =
        getHistory();

    if (
        history.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-history">
                <span>📜</span>
                <p>No matches played yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        history.map(
            item => `

                <div class="history-item">

                    <div class="history-icon">
                        🏆
                    </div>

                    <div class="history-info">

                        <strong>
                            ${escapeHTML(
                                item.winner
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                item.date
                            )}
                        </small>

                    </div>

                    <div class="history-result win">
                        WIN
                    </div>

                </div>

            `
        ).join("");
}


function escapeHTML(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =====================================================
   PROFILE / STATS
===================================================== */

function getStats() {

    const history =
        getHistory();

    return {

        games:
            history.length,

        wins:
            history.length,

        moves:
            history.reduce(
                (
                    total,
                    match
                ) =>
                    total +
                    Number(
                        match.moves ||
                        0
                    ),
                0
            ),

        captures:
            history.reduce(
                (
                    total,
                    match
                ) =>
                    total +
                    Number(
                        match.captures ||
                        0
                    ),
                0
            )
    };
}


function renderStats() {

    const stats =
        getStats();

    text(
        $("#gamesPlayed"),
        stats.games
    );

    text(
        $("#gamesWon"),
        stats.wins
    );

    text(
        $("#profileMoves"),
        stats.moves
    );

    text(
        $("#profileCaptures"),
        stats.captures
    );
}


/* =====================================================
   MODAL HELPERS
===================================================== */

function showHistory() {

    renderHistory();

    const modal =
        $("#historyModal");

    show(modal);
}


function hideHistory() {

    hide(
        $("#historyModal")
    );
}


function showStats() {

    renderStats();

    show(
        $("#statsModal")
    );
}


function hideStats() {

    hide(
        $("#statsModal")
    );
}


function showProfile() {

    renderStats();

    show(
        $("#profileModal")
    );
}


function hideProfile() {

    hide(
        $("#profileModal")
    );
}


/* =====================================================
   NEW GAME
===================================================== */

function newGame() {

    hideResultModal();

    /*
       Keep the same players.
    */

    if (
        game.players.length === 0
    ) {

        setupComputerGame();
    }

    startGame();
}


/* =====================================================
   EXIT GAME
===================================================== */

function exitGame() {

    game.gameStarted =
        false;

    game.winner =
        null;

    clearMovableHighlights();

    showHomeScreen();
}


/* =====================================================
   CLEAR HIGHLIGHTS
===================================================== */

function clearMovableHighlights() {

    $$(".token").forEach(
        element => {

            element.classList.remove(
                "movable"
            );
        }
    );
}


/* =====================================================
   MODE CARD EVENTS
===================================================== */

function setupModeButtons() {

    const cards =
        $$(".mode-card");

    cards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const mode =
                        card.dataset.mode ||
                        card.dataset.players ||
                        card.id;

                    openSetupForMode(
                        mode
                    );
                }
            );
        }
    );
}


/* =====================================================
   SETUP SCREEN
===================================================== */

function openSetupForMode(
    mode
) {

    game.mode =
        mode;

    const home =
        $("#homeScreen");

    const setup =
        $("#setupScreen");

    hide(home);

    show(setup);

    configureSetupInputs(
        mode
    );
}


function configureSetupInputs(
    mode
) {

    const inputs =
        $$(".player-input");

    const count =
        getPlayerCount(
            mode
        );

    inputs.forEach(
        (input, index) => {

            if (
                index < count
            ) {
                input.classList.remove(
                    "hidden"
                );
            } else {
                input.classList.add(
                    "hidden"
                );
            }
        }
    );

    const aiNotice =
        $(".ai-notice");

    if (aiNotice) {

        aiNotice.classList.toggle(
            "hidden",
            !isComputerMode(mode)
        );
    }
}


function getPlayerCount(
    mode
) {

    if (
        isComputerMode(mode)
    ) {
        return 1;
    }

    if (
        String(mode)
            .includes("2v2") ||
        String(mode)
            .includes("team")
    ) {
        return 4;
    }

    if (
        String(mode)
            .includes("4")
    ) {
        return 4;
    }

    if (
        String(mode)
            .includes("3")
    ) {
        return 3;
    }

    return 2;
}


function isComputerMode(
    mode
) {

    const value =
        String(mode)
            .toLowerCase();

    return (
        value.includes(
            "computer"
        ) ||
        value.includes(
            "ai"
        ) ||
        value === "1"
    );
}


/* =====================================================
   START BUTTON
===================================================== */

function setupStartButton() {

    const button =
        $("#startGameButton") ||
        $(".start-button");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            startSelectedMode(
                game.mode
            );
        }
    );
}


/* =====================================================
   BUTTON EVENTS
===================================================== */

function setupGameButtons() {

    const roll =
        $("#rollButton") ||
        $(".roll-button");

    if (roll) {

        roll.addEventListener(
            "click",
            rollDice
        );
    }


    const back =
        $("#backButton") ||
        $(".back-button");

    if (back) {

        back.addEventListener(
            "click",
            exitGame
        );
    }


    const newGameButton =
        $("#newGameButton");

    if (newGameButton) {

        newGameButton.addEventListener(
            "click",
            newGame
        );
    }


    const settings =
        $("#settingsButton");

    if (settings) {

        settings.addEventListener(
            "click",
            showSettings
        );
    }


    const history =
        $("#historyButton");

    if (history) {

        history.addEventListener(
            "click",
            showHistory
        );
    }


    const stats =
        $("#statsButton");

    if (stats) {

        stats.addEventListener(
            "click",
            showStats
        );
    }


    const profile =
        $("#profileButton");

    if (profile) {

        profile.addEventListener(
            "click",
            showProfile
        );
    }


    const sound =
        $("#soundToggle");

    if (sound) {

        sound.addEventListener(
            "click",
            toggleSound
        );
    }


    const music =
        $("#musicToggle");

    if (music) {

        music.addEventListener(
            "click",
            toggleMusic
        );
    }


    const theme =
        $("#themeToggle");

    if (theme) {

        theme.addEventListener(
            "click",
            toggleTheme
        );
    }
}


/* =====================================================
   CLOSE BUTTONS
===================================================== */

function setupCloseButtons() {

    $$("[data-close-modal]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const target =
                            button.dataset
                                .closeModal;

                        hide(
                            $(
                                target
                            )
                        );
                    }
                );
            }
        );


    $$(".modal")
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            hide(
                                modal
                            );
                        }
                    }
                );
            }
        );
}


/* =====================================================
   KEYBOARD CONTROLS
===================================================== */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                " "
            ) {

                event.preventDefault();

                if (
                    game.gameStarted
                ) {
                    rollDice();
                }
            }

            if (
                event.key ===
                "Escape"
            ) {

                $$(".modal")
                    .forEach(
                        modal =>
                            hide(modal)
                    );
            }
        }
    );
}


/* =====================================================
   MOBILE TOUCH SUPPORT
===================================================== */

function setupTouchFeedback() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "button"
                );

            if (!button) {
                return;
            }

            if (
                game.sound
            ) {

                playTone(
                    420,
                    0.025,
                    "sine",
                    0.012
                );
            }
        },
        {
            passive: true
        }
    );
}


/* =====================================================
   APP INITIALIZATION
===================================================== */

function initializeApp() {

    loadSavedData();

    setupModeButtons();

    setupStartButton();

    setupGameButtons();

    setupCloseButtons();

    setupKeyboard();

    setupTouchFeedback();

    updateSettingsUI();

    renderHistory();

    renderStats();

    /*
       If game screen is accidentally
       visible at page load, hide it.
    */

    const gameScreen =
        $("#gameScreen");

    if (
        gameScreen &&
        !game.gameStarted
    ) {

        hide(gameScreen);
    }
}


/* =====================================================
   SAVE HISTORY WHEN GAME ENDS
===================================================== */

const originalEndGame =
    endGame;

endGame = function (
    winner
) {

    saveMatchToHistory(
        winner
    );

    originalEndGame(
        winner
    );

    renderHistory();

    renderStats();
};


/* =====================================================
   DOM READY
===================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();
          }
