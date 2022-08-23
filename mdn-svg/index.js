const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

let result = {};

(async function main() {
  try {
    const browser = await puppeteer.launch();
    const [page] = await browser.pages();

    await page.goto(
      "https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/",
      { waitUntil: "networkidle0" }
    );
    const data = await page.evaluate(
      () => document.querySelector("*").outerHTML
    );

    // console.log(data);
    const $ = cheerio.load(data);

    // Get all the links to attribute pages
    const links = $("main article section div ul li code a");

    // console.log(links.length)

    // console.log(links.toArray())

    const hrefs = links.toArray().map((link) => link.attribs.href);

    for (let i = 0; i < hrefs.length; i++) {
      const href = hrefs[i];
      // console.log(href)
      try {
        await page.goto("https://developer.mozilla.org" + href, {
          waitUntil: "load",
        });
        const data = await page.evaluate(
          () => document.querySelector("*").outerHTML
        );
        const $ = cheerio.load(data);
        // console.log(data)
        const name = $("main article h1").text();

        const properties = $("section div div table tbody tr td")
          .map(function (i, el) {
            return $(this).text();
          })
          .toArray()
          .map((str) => `${str}`.normalize().replace(/\s+/g, " ").trim());

        const validTags = $("main article div ul li a code")
          .map(function (i, el) {
            return $(this).text();
          })
          .toArray()
          .map((str) => str.replace("<", "").replace(">", ""));

        // console.log(typeof propertiesTableValues)

        // console.log(name, properties)
        result[name] = {
          attribute: name,
          syntax: properties[0],
          defaultValue: properties[1],
          animatable: properties[2],
          tags: validTags,
        };

        console.log(result[name]);
      } catch (err) {
        console.log(err);
      }
    }

    fs.writeFileSync(
      path.join(__dirname, "svg.json"),
      JSON.stringify(result, null, 2)
    );

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
