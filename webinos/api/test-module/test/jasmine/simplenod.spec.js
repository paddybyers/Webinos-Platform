
var simplenod = require("../../lib/simplenod.js");

describe("test.namespaces.Can say hello2", function() {

    it("test.namespaces.can return a string saying hello world!", function() {

        expect(simplenod.testHello()).toEqual("Hello, world!");

    });

    /*it("can't return a string saying hello buddy (should fail)", function() {

        expect(simplenode.testHello()).toEqual("Hello buddy!");

    });*/

});