'use strict';

const path = require('path');
const fs = require('fs');

describe('PIXI.extras.BitmapText', function ()
{
    before(function (done)
    {
        this.fontXML = null;
        this.fontImage = null;
        this.font = null;

        const resolveURL = (url) => path.resolve(this.resources, url);
        const loadXML = (url) => new Promise((resolve) =>
            fs.readFile(resolveURL(url), 'utf8', (err, data) =>
            {
                expect(err).to.be.null;
                resolve((new window.DOMParser()).parseFromString(data, 'text/xml'));
            }));

        const loadImage = (url) => new Promise((resolve) =>
        {
            const image = new Image();

            image.onload = () => resolve(image);
            image.src = resolveURL(url);
        });

        this.resources = path.join(__dirname, 'resources');
        Promise.all([
            loadXML('font.fnt'),
            loadImage('font.png'),
        ]).then(([
            fontXML,
            fontImage,
        ]) =>
        {
            this.fontXML = fontXML;
            this.fontImage = fontImage;
            const texture = new PIXI.Texture(new PIXI.BaseTexture(this.fontImage, null, 1));

            this.font = PIXI.extras.BitmapText.registerFont(this.fontXML, texture);
            done();
        });
    });

    describe('text', function ()
    {
        it('should render text even if there are unsupported characters', function ()
        {
            const text = new PIXI.extras.BitmapText('ABCDEFG', {
                font: this.font.font,
            });

            expect(text.children.length).to.equal(4);
        });
        it('should break line on space', function ()
        {
            const bmpText = new PIXI.extras.BitmapText('', {
                font: this.font.font,
                size: 24,
            });

            bmpText.maxWidth = 40;
            bmpText.text = 'A A A A A A A ';
            bmpText.updateText();

            expect(bmpText.textWidth).to.lessThan(bmpText.maxWidth);

            bmpText.maxWidth = 40;
            bmpText.text = 'A A A A A A A';
            bmpText.updateText();

            expect(bmpText.textWidth).to.lessThan(bmpText.maxWidth);
        });
        it('letterSpacing should add extra space between characters', function ()
        {
            const text = 'ABCD zz DCBA';
            const bmpText = new PIXI.extras.BitmapText(text, {
                font: this.font.font,
            });
            const positions = [];
            const renderedChars = bmpText.children.length;

            for (let x = 0; x < renderedChars; ++x)
            {
                positions.push(bmpText.children[x].x);
            }
            for (let space = 1; space < 20; ++space)
            {
                bmpText.letterSpacing = space;
                bmpText.updateText();
                let prevPos = bmpText.children[0].x;

                for (let char = 1; char < renderedChars; ++char)
                {
                    expect(bmpText.children[char].x).to.equal(prevPos + space + positions[char] - positions[char - 1]);
                    prevPos = bmpText.children[char].x;
                }
            }
        });
    });
});
