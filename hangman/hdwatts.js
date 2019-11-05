var word = null
var guessesRemaining = null
var guesses = []
var makingguess = false
var gameover = null
var score = localStorage.getItem("score") || 0

function resetVariables() {
    guessesRemaining = 10
    guesses = []
    gameover = null
    resetContainer(document.querySelector("#new-game"))
    resetContainer(document.querySelector("#gameover"))
    update()
}

function resetContainer(container) {
    container.textContent = ''
    container.innerHtml = ''
}

function newGame(seconds) {
    gameover = true
    document.querySelector("#new-game").textContent = "New game in " + seconds + " seconds."
    if (seconds == 0) {
        loadWord();
    } else {
        setTimeout(()=>newGame(seconds - 1), 1000)
    }
}

function update() {
    setUnderscores();
    document.querySelector("#score").value = score
    document.querySelector("#guesses_num").value = guessesRemaining
    document.querySelector("#guesses").value = guesses.join(", ")
    if (guessesRemaining == 0 ) {
        document.querySelector("#gameover").textContent = "Game over.  You lost! The word was: " + word + "."
        newGame(3);
    }
    var victory = word.split("").filter(b=>!guesses.find(a=> a == b)).length == 0
    if (guessesRemaining > 0 && victory) {
        document.querySelector("#gameover").textContent = "Game over.  You won! The word was: " + word + "."
        score += guessesRemaining
        localStorage.setItem("score", score)
        newGame(3);
    }
    makingguess = false
}

function setUnderscores() {   
    var container = document.querySelector('#word-container')
    resetContainer(container)

    if (word && word.length > 0) {
        for (var a = 0; a < word.length; a++) {
            var node = document.createElement("span");
            node.textContent = guesses.includes(word[a]) ? word[a] : "_"
            node.className = "word " + word[a]
            container.appendChild(node)
        }
    }
}

function setWord(body) {
    var fromApi = body[0]
    // Reset if word contains punctuation
    if (fromApi.match(/[-,'\/\\]/gi)) {
        loadWord()
    } else {
        word = fromApi.toLowerCase()
        resetVariables()
    }
}

function loadWord() {
    fetch("https://random-word.ryanrk.com/api/en/word/random", {method: 'GET'}).then(resp => {
        resp.json().then(setWord)
    })
}

function makeGuess(key) {
    if (!gameover && !makingguess) {
        makingguess = true
        if(!guesses.includes(key)) {
            if (!word.includes(key)) {
                guessesRemaining -= 1
            }
            guesses.push(key);
        }
        update();
    }
}

function handleKeydown(e) {
    var key = e.key
    if (key.length == 1 && key.match(/[abcdefghijklmnopqrstuvwxyz]/gi)) {
        makeGuess(key)
    }
}

function onLoad() {
    loadWord()
    console.log("Hello mikey")
}

window.addEventListener('load', onLoad)
window.addEventListener('keydown', handleKeydown)
