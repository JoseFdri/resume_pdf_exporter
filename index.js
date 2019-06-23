const puppeteer = require('puppeteer');
const fs = require('fs-extra');
var express = require('express');
const asyncify = require('express-asyncify')
var app = asyncify(express())

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Web server listening on port ${port}`)
})

// Express Error Handler
app.use((err, req, res, next) => {
    debug(`Error: ${err.message}`)
    if (err.message.match(/not found/)) {
        return res.status(404).send({ error: err.message })
    }
    res.status(500).send({ error: err.message })
})

app.get('/build', async function (req, res) {
    console.log('processing')
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', consoleObj => console.log(consoleObj.text()));
    const viewPort={width:1191, height:937};
    await page.setViewport(viewPort);
    await page.goto('http://localhost/resume/', { waitUntil: 'networkidle2' })

    await page.evaluate(async () => {
        const a4 = {
            height : 1570,
            width: 3508,
        };
        
        function getNodeHtml(element){
            var wrap = document.createElement('div');
            wrap.appendChild(element.cloneNode(true));
            return wrap.innerHTML;
        }

        function getTotalHeight(element) {
            let style = getComputedStyle(element);
            return +(element.offsetHeight) + parseInt(style.marginTop, 10) +
                parseInt(style.marginBottom, 10);
        }

        let header = document.querySelector('.header');
        let separator = document.querySelector('.separator');
        let subContainers = document.querySelectorAll('.sub-container');
        let containerSeparator = document.querySelector('.container-separation');
        let heightCounter = getTotalHeight(header) + getTotalHeight(separator);
        console.log('init heightCounter', heightCounter)

        for (let a = 0; a < subContainers.length; a++) {
            let subContainer = subContainers[a];
            let subContainerId = subContainer.id;
            let sectionTitle = document.querySelector(`#${subContainerId}`).querySelector('.section-title');
            heightCounter += ((a != 0 ? getTotalHeight(containerSeparator) : 0) + getTotalHeight(sectionTitle));
            let html = '';
            if(heightCounter+ 50 >= a4.height){
                html += `<div style="height:${getTotalHeight(sectionTitle)}px"></div>`;
            }else {
                html = getNodeHtml(sectionTitle);
            }
            let items = document.querySelectorAll(`.${subContainerId.split('-')[0]}-section`);
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let itemClasses = item.className;
                let isHalf = itemClasses.includes('w-50');
                let isSecondHalf = isHalf && i%2 != 0;
                heightCounter += isHalf ? (i%2 == 0 ? getTotalHeight(item) : 0) : getTotalHeight(item);
                console.log( 'debug ', a , i, getTotalHeight(item), heightCounter )
                if((heightCounter > a4.height && !isHalf) || (heightCounter > a4.height && isSecondHalf)) {
                    let aditionalMargin = 40;
                    let height = a4.height - (heightCounter - getTotalHeight(item))
                    html += `<div style="height:${height+aditionalMargin}px"></div>`;
                    console.log( 'margin to complete page ', height )
                    html += getNodeHtml(sectionTitle);
                    heightCounter = aditionalMargin + getTotalHeight(sectionTitle) + getTotalHeight(item);
                    console.log( 'break', a , i, getTotalHeight(item), heightCounter)
                }
                html += getNodeHtml(item);
            }
            let SectionWrap = subContainer.querySelector('.col-md-12');
            SectionWrap.innerHTML = html;
        }
    });
    
    await page.pdf({
        path: 'resume.pdf',
        format: 'A4',
        printBackground: true
    });

    await browser.close();
    console.log('end processing')
    res.send('done');
});
