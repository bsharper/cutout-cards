const fs = require('fs')

try {
    fs.accessSync('CAH_FamilyEdition_PublicBeta_LargeCards.pdf')
} catch (err) {
    console.log(`ERROR: Cards Against Humanity PDF not found.\n\nGo to https://www.cardsagainsthumanityfamilyedition.com/ and download the large version to this directory`)
}
