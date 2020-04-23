// Adapted from https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.js

var Promise = require("bluebird");
var pdfjsLib = require("pdfjs-dist");

var Canvas = require("canvas");
var assert = require("assert").strict;
var fs = require("fs");
var fsp = fs.promises;
var path = require('path')

var pdfURL = "CAH_FamilyEdition_PublicBeta_LargeCards.pdf";
var outputPath = "pages"
var cardPath = "cards"

function createPaths(paths) {
  return Promise.map(paths, async v=> {
      try {
          await fsp.mkdir(v)
      } catch (e) {
          try {
              await fsp.access(v)
          } catch (err) {
              var msg = `Error, could not create or access path "${v}"`
              console.error(msg)
          }
      }
  }, {concurrency: 2});
}


function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    var canvas = Canvas.createCanvas(width, height);
    var context = canvas.getContext("2d");
    return {
      canvas: canvas,
      context: context,
    };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, "Canvas is not specified");

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

// Read the PDF file into a typed array so PDF.js can load it.
var rawData = new Uint8Array(fs.readFileSync(pdfURL));


async function writePage(pdfDocument, pageNum, outputFile) {
  if (typeof outputFile == 'undefined') outputFile = `page_${pageNum}.png`;
  outputFile = path.join(outputPath, outputFile);
  var page = await pdfDocument.getPage(pageNum);
  var viewport = page.getViewport({ scale: 3.0 });
  var canvasFactory = new NodeCanvasFactory();
  var canvasAndContext = canvasFactory.create(
    viewport.width,
    viewport.height
  );
  var renderContext = {
    canvasContext: canvasAndContext.context,
    viewport: viewport,
    canvasFactory: canvasFactory,
  };
  await page.render(renderContext).promise;  
  var image = canvasAndContext.canvas.toBuffer();

  try {
    await fsp.writeFile(outputFile, image);
    return `${outputFile} written, ${image.length} bytes`
    //console.log(`Page ${pageNum} written to "${outputFile}"`)
  } catch (err) {
    console.log(err);
  }
}

var ProgressBar = require('progress');

async function main() {
  var pdfDocument = await pdfjsLib.getDocument(rawData).promise;
  console.log(`PDF loaded, ${pdfDocument.numPages} pages`);
  var total = pdfDocument.numPages;
  var bar = new ProgressBar(':current of :total (:percent) :bar [ :lastone ]', { total: total });
  for (var i=1; i<=total; i++) {
  //for (var i=9; i<=11; i++) {
    try {      
      var sz = await writePage(pdfDocument, i)
      bar.tick({
        'lastone': sz
      });
    } catch (err) {
      console.log(err);
      //console.log(`err ${i}`);
    }
  };
  setTimeout(() => {
    console.log('exit');
  }, 1000)
}

(async () => {
  await createPaths([outputPath,cardPath]);
  await main();
})()
