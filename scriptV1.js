// Global game variables
let tableau = [];
let stock = [];
let waste = [];
let foundations = [[], [], [], []]; // 4 foundation piles
let gameHistory = [];

// 1. Create deck of cards
function createDeck() {
    const deck = [];
    const suits = ["hearts", "diamonds", "spades", "clubs"];
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // 1 is Ace, 11 is Jack, etc.
    
    for (let suit of suits) {
        for (let value of values) {
            const cardName = getCardName(value, suit); // e.g., "ace_of_spades"
            const card = { value: value, suit: suit, image: `images/cards/${cardName}.png`, faceUp: false };
            deck.push(card);
        }
    }
    return deck;
}

// 2. Shuffle the deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1)); // Pick a random index
        [deck[i], deck[randomIndex]] = [deck[randomIndex], deck[i]]; // Swap the cards
    }
    return deck;
}

// 3. Deal cards into tableau and stock
function dealCards(deck) {
    const tableau = [[], [], [], [], [], [], []]; // 7 tableau piles
    let cardIndex = 0;
    for (let i = 0; i < tableau.length; i++) {
        for (let j = 0; j <= i; j++) {
            const card = deck[cardIndex];
            card.faceUp = (j === i); // Only the top card in each pile should be face-up
            tableau[i].push(card);
            cardIndex++;
        }
    }
    const stock = deck.slice(cardIndex); // The remaining cards go to the stock pile
    return { tableau, stock };
}

// Helper function to get card name from value and suit
function getCardName(value, suit) {
    const valueNames = { 1: "ace", 11: "jack", 12: "queen", 13: "king" };
    const cardValue = valueNames[value] || value; // If it's not a face card, return the number
    return `${cardValue}_of_${suit}`;
}

function renderStock(stock) {
    const stockPile = document.getElementById('stock-pile');
    let refreshIcon = document.getElementById('refresh-icon');

    // Log elements for debugging
    console.log("Stock pile element:", stockPile);
    console.log("Refresh icon element:", refreshIcon);

    // If refreshIcon doesn't exist, create it as an image
    if (!refreshIcon) {
        refreshIcon = document.createElement('img');
        refreshIcon.id = 'refresh-icon';
        refreshIcon.src = 'images/cards/reset-icon.png'; // Path to the reset icon image
        refreshIcon.alt = 'Restart Stock';
        refreshIcon.style.display = 'none'; // Initially hidden
        refreshIcon.style.cursor = 'pointer'; // Pointer cursor for click indication
        refreshIcon.style.width = '50px'; // Set an appropriate width for the image
        refreshIcon.style.height = 'auto'; // Auto to maintain the aspect ratio

        // Append the refresh icon to the stock-pile div
        stockPile.appendChild(refreshIcon);
    }

    // Clear only the card display inside the stock pile, not the entire stock pile
    let cardContainer = stockPile.querySelector('.card-container');
    if (!cardContainer) {
        cardContainer = document.createElement('div');
        cardContainer.classList.add('card-container');
        stockPile.insertBefore(cardContainer, refreshIcon); // Ensure refresh icon stays at the bottom
    }
    cardContainer.innerHTML = ''; // Clear any previous card content

    if (stock.length > 0) {
        // Stock is not empty, hide refresh icon and show top card
        refreshIcon.style.display = 'none'; // Hide refresh icon
        stockPile.classList.add('has-card');

        const topCard = stock[stock.length - 1];
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        const imgElement = document.createElement('img');
        imgElement.src = 'images/cards/card_back.png'; // Use the card back image for the stock
        cardElement.appendChild(imgElement);

        cardContainer.appendChild(cardElement); // Add the card to the stock pile
    } else {
        // Stock is empty, show refresh icon
        refreshIcon.style.display = 'inline'; // Display the refresh icon
        stockPile.classList.remove('has-card');
        console.log("Stock is empty, showing refresh icon");
    }
}


console.log("Rendering stock, stock length:", stock.length);

// Render the waste pile with three-card draw support
function renderWaste(waste) {
    const wastePile = document.getElementById("waste-pile");
    wastePile.innerHTML = ''; // Clear waste pile

    if (waste.length > 0) {
        wastePile.classList.add("has-card");
        const drawMode = document.querySelector('#draw-mode').value;
        const cardsToDisplay = drawMode === '3' ? 3 : 1;
        const start = Math.max(0, waste.length - cardsToDisplay);

        waste.slice(start).forEach((card, index) => {
            const cardElement = createCardElement(card);
            cardElement.draggable = true;
            cardElement.style.position = "absolute";
            cardElement.style.left = `${index * 30}px`; // Offset each card by 30px
            cardElement.addEventListener("dragstart", (e) => dragStart(e, card, -1));
            wastePile.appendChild(cardElement);
        });
    } else {
        wastePile.classList.remove("has-card");
    }
}

// Draw three cards from the stock to the waste pile
function drawThreeCardsFromStock() {
    const cardsToDraw = Math.min(3, stock.length); // Draw 3 cards or fewer if fewer are available
    for (let i = 0; i < cardsToDraw; i++) {
        const card = stock.pop();
        card.faceUp = true; // Reveal the card
        waste.push(card); // Move the card to the waste pile
    }
    renderWaste(waste); // Re-render the waste pile
    renderStock(stock); // Re-render the stock pile
    console.log("Drawing 3 cards from stock", stock, waste); // Debugging
}

// Refresh stock from waste pile on icon click
document.getElementById("refresh-icon").addEventListener("click", function() {
    if (stock.length === 0) {
        stock = [...waste.reverse()]; // Move all waste cards back to stock, reversing order
        waste = []; // Clear waste pile
        renderStock(stock); // Re-render stock
        renderWaste(waste); // Re-render waste
    }
});

// 5. Render the tableau piles
function renderTableau(tableau) {
    tableau.forEach((pile, index) => {
        const tableauPile = document.getElementById(`tableau-${index + 1}`);
        tableauPile.innerHTML = ''; // Clear the tableau pile before re-rendering

        if (pile.length > 0) {
            tableauPile.classList.add("has-card");
        } else {
            tableauPile.classList.remove("has-card");
        }

        pile.forEach((card, cardIndex) => {
            const cardElement = createCardElement(card);
            cardElement.draggable = true; // Make the card draggable
            cardElement.style.top = `${20 * cardIndex}px`; // Stack cards with 20px offset

            // Add dragstart event listener
            cardElement.addEventListener("dragstart", (e) => dragStart(e, card, index));

            tableauPile.appendChild(cardElement);
        });

        // Add dragover and drop event listeners to the tableau piles
        tableauPile.addEventListener("dragover", allowDrop);
        tableauPile.addEventListener("drop", (e) => drop(e, index));
    });
}

// 6. Render the foundation piles
function renderFoundations(foundations) {
    foundations.forEach((foundation, index) => {
        const foundationPile = document.getElementById(`foundation-${index + 1}`);
        foundationPile.innerHTML = ''; // Clear the foundation pile

        if (foundation.length > 0) {
            foundationPile.classList.add("has-card"); // Add has-card class when the pile has cards
            const topCard = foundation[foundation.length - 1];
            const cardElement = createCardElement(topCard); // Reuse the card rendering function
            foundationPile.appendChild(cardElement);
        } else {
            foundationPile.classList.remove("has-card"); // Remove has-card class when the pile is empty
        }
    });
}

// Helper function to create a card element
function createCardElement(card) {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("data-value", card.value);
    cardElement.setAttribute("data-suit", card.suit);

    const imgElement = document.createElement("img");
    imgElement.src = card.faceUp ? card.image : 'images/cards/card_back.png';
    cardElement.appendChild(imgElement);

    // Add double-click event listener
    cardElement.addEventListener("dblclick", (e) => cardDoubleClick(card));

    return cardElement;
}

// Handle dragstart event for cards
function dragStart(e, card, sourceIndex) {
    e.dataTransfer.setData("card", JSON.stringify(card));
    e.dataTransfer.setData("sourceIndex", sourceIndex);
}

// Allow dropping on tableau or foundation piles
function allowDrop(e) {
    e.preventDefault();
}


// Rules for valid tableau moves (descending order, alternating colors)
function isValidMove(card, targetPile) {
    if (targetPile.length === 0) {
        return card.value === 13; // Only Kings can be placed in empty piles
    }

    const topCard = targetPile[targetPile.length - 1];
    const cardColor = getCardColor(card.suit);
    const topCardColor = getCardColor(topCard.suit);

    return card.value === topCard.value - 1 && cardColor !== topCardColor;
}

// Rules for valid foundation moves (ascending order, same suit)
function isValidFoundationMove(card, foundationPile) {
    if (foundationPile.length === 0) {
        return card.value === 1; // Only Aces can be placed in empty foundation piles
    }

    const topCard = foundationPile[foundationPile.length - 1];
    return card.value === topCard.value + 1 && card.suit === topCard.suit;
}

// Helper function to determine card color
function getCardColor(suit) {
    return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

// Save the current game state
function saveGameState() {
    const currentState = {
        tableau: JSON.parse(JSON.stringify(tableau)),
        stock: JSON.parse(JSON.stringify(stock)),
        waste: JSON.parse(JSON.stringify(waste)),
        foundations: JSON.parse(JSON.stringify(foundations))
    };
    gameHistory.push(currentState); // Add to the history stack
}

// 1. Handle dragstart event for sequences of cards
function dragStart(e, card, sourceIndex) {
    let draggedCards = [];
    if (sourceIndex === -1) {
        // If dragging from waste, only set the single card data
        draggedCards = [card]; // Single card for waste
    } else {
        // If dragging from a tableau, get the sequence of cards starting from the dragged card
        const sourcePile = tableau[sourceIndex];
        const cardIndex = sourcePile.indexOf(card);

        // Get the sequence of cards from the dragged card onward
        draggedCards = sourcePile.slice(cardIndex);
    }

    // Save the sequence of dragged cards and the source index in dataTransfer
    e.dataTransfer.setData('draggedCards', JSON.stringify(draggedCards));
    e.dataTransfer.setData('sourceIndex', sourceIndex);

    console.log("Dragging from source index:", sourceIndex, "Cards:", draggedCards);
}




// 2. Handle drop event for tableau pile and move the sequence of cards
function drop(e, targetIndex) {
    e.preventDefault();

    const draggedCards = JSON.parse(e.dataTransfer.getData('draggedCards')); // Sequence of cards
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'), 10); // Source tableau index

    console.log(`Attempting to move:`, draggedCards.map(card => `${card.value} of ${card.suit}`), `to tableau ${targetIndex}`);

    // Ensure the move is valid
    if (isValidMove(draggedCards[0], tableau[targetIndex])) {
        // Save the game state before making the move
        saveGameState();

        // Remove the dragged cards from the source tableau
        if (sourceIndex !== -1) { // From another tableau
            tableau[sourceIndex] = tableau[sourceIndex].slice(0, tableau[sourceIndex].indexOf(draggedCards[0]));
            console.log(`Updated source tableau ${sourceIndex}:`, tableau[sourceIndex]);

            // Flip the next card in the source tableau pile, if any
            if (tableau[sourceIndex].length > 0) {
                tableau[sourceIndex][tableau[sourceIndex].length - 1].faceUp = true;
            }
        } else {
            // Remove from waste if the source is waste pile
            waste.pop();
        }

        // Add the dragged cards to the target tableau
        tableau[targetIndex] = tableau[targetIndex].concat(draggedCards);
        console.log(`Updated target tableau ${targetIndex}:`, tableau[targetIndex]);

        // Re-render the tableau and waste piles
        renderTableau(tableau);
        renderWaste(waste);

        console.log("Moved sequence of cards successfully.");
    } else {
        console.log("Invalid move from tableau to tableau.");
    }
}







// 3. Save the current game state for undo functionality
function saveGameState() {
    const state = {
        tableau: JSON.parse(JSON.stringify(tableau)),
        waste: JSON.parse(JSON.stringify(waste)),
        stock: JSON.parse(JSON.stringify(stock)),
        foundations: JSON.parse(JSON.stringify(foundations))
    };

    gameHistory.push(state);
    console.log("Game state saved:", state);
}

// 4. Handle undo action
function undoMove() {
    if (gameHistory.length > 0) {
        const previousState = gameHistory.pop();

        tableau = previousState.tableau;
        waste = previousState.waste;
        stock = previousState.stock;
        foundations = previousState.foundations;

        renderTableau(tableau);
        renderWaste(waste);
        renderStock(stock);
        renderFoundations(foundations);

        console.log("Undo performed, current state:", previousState);
    } else {
        console.log("No more moves to undo");
    }
}


// Automatically move a card to the foundation if double-clicked
function cardDoubleClick(card) {
    console.log("Double-clicked card: ", card);

    // Save the current game state before making a move
    saveGameState();

    for (let i = 0; i < foundations.length; i++) {
        if (isValidFoundationMove(card, foundations[i])) {
            foundations[i].push(card);

            const sourceIndex = findCardInTableauOrWaste(card);
            if (sourceIndex !== null) {
                tableau[sourceIndex].pop();
            } else {
                waste.pop();
            }

            if (sourceIndex !== null && tableau[sourceIndex].length > 0) {
                tableau[sourceIndex][tableau[sourceIndex].length - 1].faceUp = true;
            }

            renderTableau(tableau);
            renderWaste(waste);
            renderFoundations(foundations);
            break;
        }
    }
}


// Helper function to find where the card is (tableau or waste)
function findCardInTableauOrWaste(card) {
    console.log("Finding card in tableau or waste: ", card);
    for (let i = 0; i < tableau.length; i++) {
        if (tableau[i].length > 0 && tableau[i][tableau[i].length - 1] === card) {
            return i;
        }
    }
    if (waste.length > 0 && waste[waste.length - 1] === card) {
        return null; // Card is in the waste pile
    }
    return null;
}

// Draw one card from the stock to the waste pile
function drawOneCardFromStock() {
    if (stock.length > 0) {
        const card = stock.pop();
        card.faceUp = true;
        waste.push(card);
        renderWaste(waste);
        renderStock(stock);
        console.log("Draw one card - Stock: ", stock, "Waste: ", waste); // Debugging
    } else {
        console.log("Stock is empty, cannot draw."); // Debugging
    }
}


// Initialize the game
function initializeGame() {
    console.log("Game is initializing...");

    const deck = shuffleDeck(createDeck());
    const { tableau: newTableau, stock: newStock } = dealCards(deck);

    tableau = [...newTableau];
    stock = [...newStock];
    waste = [];
    foundations = [[], [], [], []];

    renderTableau(tableau);
    renderStock(stock);
    renderWaste(waste);
    renderFoundations(foundations);

    const drawMode = document.querySelector("#draw-mode").value;

    if (drawMode === "1") {
        drawOneCardFromStock();
    } else {
        drawThreeCardsFromStock();
    }
}

// Event listeners
document.getElementById("stock-pile").addEventListener("click", function() {
    console.log("Stock pile clicked");
    const drawMode = document.querySelector("#draw-mode").value;
    if (drawMode === '1') {
        drawOneCardFromStock();
    } else {
        drawThreeCardsFromStock();
    }
});

// Event listener for the refresh icon using event delegation
document.addEventListener('click', function(event) {
    const target = event.target;

    // Check if the clicked element is the refresh icon
    if (target && target.id === 'refresh-icon') {
        if (stock.length === 0 && waste.length > 0) {
            console.log("Refreshing stock from waste pile...");

            // Debugging log to check the current waste before the reverse operation
            console.log("Waste pile before reverse:", JSON.stringify(waste));

            // Move all waste cards back to stock, reversing order
            stock = [...waste.reverse()]; 

            // Clear waste pile
            waste = [];

            // Debugging logs to verify the result
            console.log("Stock after refresh:", JSON.stringify(stock));
            console.log("Waste after refresh:", JSON.stringify(waste));

            // Re-render the stock and waste
            renderStock(stock); 
            renderWaste(waste); 

        } else {
            console.log("No cards to refresh in the stock.");
        }
    }
});

// Add undo button event listener
document.getElementById('undo').addEventListener('click', undoMove); // 

// New Game button and draw mode change event listeners
document.getElementById("new-game").addEventListener("click", initializeGame);
document.getElementById("draw-mode").addEventListener("change", initializeGame);

// Save game state before any card move
function handleCardMove(card, sourcePile, targetPile) {
    saveGameState(); // Save the current game state before making the move

    // Handle the logic to move the card
    targetPile.push(card);
    sourcePile.pop();

    // Re-render after the move
    renderTableau(tableau);
    renderWaste(waste);
    renderFoundations(foundations);
}



// New Game button and draw mode change
document.getElementById("new-game").addEventListener("click", initializeGame);
document.getElementById("draw-mode").addEventListener("change", initializeGame);

// Initialize the game on page load
window.onload = initializeGame;
