const { JPOX } = require("../main.js")
const path = require("path")
const raw = require("./db.json")


const db = new JPOX({
    path: path.join(__dirname, "./test.json")
})

function findInDB(entry, prop, val) {
    return entry[prop] === val
}

function manipulateInDB(data, newValue) {
    return {...data, ...newValue}
}

db.update(x => findInDB(x, "name", "ploomb"), data => manipulateInDB(data, {name: "ave"}))

db.apply()