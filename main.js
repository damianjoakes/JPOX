const fs = require("fs")
const path = require("path")


/*

Database.update(x => x.sku == req.body.sku, data => {
    data.qty -= req.body.qty
    return data
})

*/


// Takes in path to JSON file. Parses the JSON data. 
class JPOX {
    constructor(json, options) {
        // saves options from options object, sets default options if they do not exist
        if (options) {
            this.options = {
                path: options.path ? json : null,
                alwaysUpdateFirst: options.alwaysUpdateFirst ?? false,
                autoapply: options.autoapply ?? false,
                jsonFormatter: options.jsonFormatter ?? "prettify",
                manipulate: options.manipulate ?? null
            }
        } else {
            this.options = {
                path: null,
                alwaysUpdateFirst: false,
                autoapply: false,
                jsonFormatter: "prettify",
                manipulate: null
            }
        }

        // checks to see if json exists. if it does, we'll first check to see if it's JSON data that gets passed 
        // in. if the parse was successful, then the database is created from the JSON data. if it is unsuccessful,
        // then we check to see if json is a path. if both of these are unsuccessful, then the database is initialized
        // with a blank array
        if (json) {
            try {
                var isJSON = JSON.parse(json)
                if (isJSON && typeof isJSON === "object") {
                    this.database = JSON.parse(json)
                } else {
                    this.options.path = path.normalize(path.join(__dirname, "/..", json)).replace(/\\/g, '/')
                    if (fs.existsSync(this.options.path)) {
                        const contents = fs.readFileSync(this.options.path, "utf-8");
    
                        // Check if the file is empty
                        if (contents.trim() === "") {
                            fs.writeFileSync(this.options.path, "[]")
                            console.log("JSON file was empty. File has been initialized as an empty array.")
                        }
                    } else {
                        fs.writeFileSync(this.options.path, "[]")
                        console.log("No JSON file existed. File has been initialized as an empty array.")
                    }
    
    
                    try {
                        this.database = JSON.parse(fs.readFileSync(this.options.path))
                    } catch (err) {
                        console.log(err)
                    }
    
                    this.database = JSON.parse(fs.readFileSync(path.join(__dirname, "\\..", json)))
                    this.options.path = path.normalize(path.join(__dirname, "/..", json)).replace(/\\/g, '/')
                }
            } catch (err) {
                throw new Error(`Error "${err}" encountered when initiating JPOX database.`)
            }
        } else {
            this.database = []
        }
    }

    // updates an element in the database
    update(callback, manipulate, options = {}, fallback = null) {
        const { autoapply, path } = Object.assign({}, options, this.options)
        if (typeof manipulate !== "function") {
            throw new Error("Database.update() is missing a valid function for the argument (manipulate).")
        }
        var data = this.#findObjectByKeyValue(callback).result
        var index = this.#findObjectByKeyValue(callback).index
        if (data == null) {
            if (fallback !== null) {
                var f = fallback
                return f
            }
        } else {
            data = manipulate(data)
            this.database[index] = data
            if (autoapply == true) {
                this.apply({path: path})
            }
            return {
                result: data,
                dbIndex: index
            }
        }
    }

    // locates an item in the database
    get(callback) {
        return {
            result: this.#findObjectByKeyValue(callback).result,
            dbIndex: this.#findObjectByKeyValue(callback).index
        }
    }

    // deletes an item from the database
    delete(callback, options = {}) {
        const { autoapply, path } = Object.assign({}, options, this.options)
        var data = this.#findObjectByKeyValue(callback).result
        var index = this.#findObjectByKeyValue(callback).index

        this.database.splice(index, 1)
        index = this.#findObjectByKeyValue(callback).index
        if (autoapply) {
            this.apply({path: path})
        }
        return {
            result: data,
            dbIndex: `Index checked again. Object at index ${index}.`
        }
    }

    // adds an item to the database
    add(callback, options = {}) {
        const { autoapply, path, manipulate, alwaysUpdateFirst, prop } = Object.assign({}, options, this.options)
        if(alwaysUpdateFirst == true) {
            if(!manipulate) {
                throw new Error(`A manipulate function MUST be passed into "JPOX.add(callback, options)" if "options.alwaysUpdateFirst" is set to true.`)
            }
            if(!prop) {
                this.update(x => x == callback, manipulate(), null, this.add(callback, {autoapply: autoapply, path: path, alwaysUpdateFirst: false}))
            } else if (prop) {
                this.update(function(x) {
                    for(let i = 0 ; i < Object.values(x); i++) {
                        if (Object.values[i] == prop) {
                            return true
                        }
                    }
                }, manipulate(), null, this.add(callback, {autoapply: autoapply, path: path, alwaysUpdateFirst: false}))
            }

        } 
        this.database.push(callback)
        if (autoapply) {
            this.apply({path: path})
        }
        return callback
    }

    // private method, locates an object by using a callback function. if callback is null, then
    // an object with null and index -1 is returned
    #findObjectByKeyValue(callback) {
        if(callback !== null) {
            for (let i = 0; i < this.database.length; i++) {
                if (callback(this.database[i])) {
                    return {
                        result: this.database[i],
                        index: i
                    }
                }
            }
        }
        return {
            result: null,
            index: -1
        };
    }

    // saves all changes made to JPOX instance to the JSON file
    apply(options) {
        const { path } = Object.assign({}, options, this.options)
        if (path == null) {
            console.log("JPOX path is null. No path to a JSON file was specified upon save. Please update your JPOX database using 'JPOX.options.path = \"Path\\to\\your\\File.json\".")
        }
        if (this.options.jsonFormatter == "prettify") {
            fs.writeFile(path, JSON.stringify(this.database, null, 2), err => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        } else if (this.options.jsonFormatter == "compressed") {
            fs.writeFile(path, JSON.stringify(this.database), err => {
                if (err) {
                    console.log(err)
                    return
                }
            })
        }

    }

    // reloads JPOX cache
    reload() {
        delete require.cache[require.resolve(__filename)];
        return require(__filename);
    }
}

module.exports = {
    JPOX
}