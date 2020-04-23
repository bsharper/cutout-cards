const fs = require('fs')

try {
    fs.accessSync('CAH_FamilyEdition_PublicBeta_LargeCards.pdf')
    process.exitCode = 0
} catch (err) {
    console.log(`ERROR: Cards Against Humanity PDF not found.\n\n >>> Go to https://www.cardsagainsthumanityfamilyedition.com/ and download the large version to this directory <<<\n\n`)
    process.exitCode = 1
}
