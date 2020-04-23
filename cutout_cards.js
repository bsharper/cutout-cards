var Promise = require("bluebird");
const fs = require('fs')
const fsp = fs.promises;
const path = require('path')
const outputPath = "pages"
const cardPath = "cards"
const Jimp = require('jimp');
var ProgressBar = require('progress');

const FastAverageColor = require('fast-average-color');
const fac = new FastAverageColor();

const includeColorAverage = false;

async function main () {
    var pages = await fsp.readdir(outputPath)
    pages = pages.map(p => path.join(outputPath, p))
    var getnum = (txt) => {
        let r = /[0-9]+/g
        let rv = parseInt(r.exec(txt)[0])
        //console.log(`${txt} = ${rv}`)
        return rv;
    }
    pages.sort((a,b) => {
        if (getnum(a) > getnum(b)) return 1;
        return -1;
    })
    pages = pages.slice(2);
    var total = pages.length * 9;
    var bar = new ProgressBar(':current of :total (:percent) :bar [ :status ] :rate cards per second, :etas remaining', { total: total, width: 40 });
    var curcolor = "";
    for (var pagenum = 0; pagenum < pages.length; pagenum++) {
        var curpage = pages[pagenum];
        var img = await Jimp.read(curpage);
        var cardtype = "";
        var avg = "";
        await img.autocrop()
        for (var t = 0; t<3; t++) {
            for (var i = 0; i<3; i++) {
                var cur = await img.clone();
                await cur.crop(i*540, t*702, 542, 704); // this was far easier than I thought it would be thanks to autocrop (and CAH's consistancy)
                if (i==0 && t==0) {
                    curcolor = fac.getColorFromArray4(cur.bitmap.data);
                    avg = parseInt(curcolor.slice(0,3).reduce((a,b) => { return a+b })/3)
                    if (avg < 100) cardtype = "black";
                    else cardtype = "white";
                }
                let coloravg = `_${avg}`
                let fn = `${cardtype}card_page_${pagenum}_${i+1}x${t+1}${includeColorAverage ? coloravg : ""}.png`
                let cardfn = path.join(cardPath, fn);
                await cur.writeAsync(cardfn)
                bar.tick({
                    'status': `filename: ${curpage}, color average: ${curcolor}`
                });
            }
        }
        
    }
}

(async () => {
    await main()
})()