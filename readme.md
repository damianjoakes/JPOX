
# Just Another Piece of Cake Storage (JPOX)
###### Reliable, easy-to-use, powerful JSON based storage

###### This markdown may seem long, but it's a case of extensive documentation, not over-complexity.
***

# Installation
`npm install jpox`

```javascript
const { JPOX } = require("JPOX")
const db = new JPOX("/db/db.json", options)
```

***

# JPOX Instance

` var db = new JPOX(json, options)`

The *json* argument passed in must be one of two types. It can either be the path to a JSON file, or it can be raw (stringified) JSON.

The *options* argument must be an object.

JPOX works by creating an array (`JPOX.database`) stores internally. This array can be accessed and written to independently of the JSON file that `JPOX.options.path` points to. The file can be written to automatically, or manually by using `JPOX.apply()`.

***

#### *json*

##### File

If *json* is equal to a file path, JPOX will determine whether the file path is valid, add if the file exists. If the file path is valid but does not exist, then JPOX will create a new file at the path specified. If the file exists, but is empty or does not contain valid JSON, then the file will be cleared and initialized as an empty array.

##### Raw JSON

If *json* is raw JSON, then JPOX will create a new JPOX instance with the parsed JSON data. Note that *JPOX.options.path* will **not** be filled upon creation of the JPOX instance. It will have to be set manually using:

`JPOX.options.path = "path/to/file.json"`

*or*

`var db = new JPOX('[{"useless data": "useless"}]', { path: "path/to/file.json" })`


***

#### *options*

`options = {}`

Below are some valid values for for the *options* object:

* `JPOX.options.path`, a string containing a valid path for the location of the JSON file that the JPOX instance will write to. 
*default: json (if defined) ***or*** null*  
<br>

* `JPOX.options.alwaysUpdateFirst`, a boolean, used specifically for `JPOX.add(callback, options)`. If set to *true*, then JPOX will always try to update the data in the database before trying to add it. 
*default: false*  
<br>

* `JPOX.options.manipulate`, a function that is used when passed into the `JPOX.add(callback, options)` method. This option is used as the function for `JPOX.options.alwaysUpdateFirst` to look at when calling the `JPOX.update(callback, manipulate, options, fallback)` method. If the `alwaysUpdateFirst` option is specified, then ***all*** add methods must have this specified, unless the option is overridden in within the options passed to the method. A default manipulate function can be set within the database, such as the one below:
```javascript
    (data) => {
        data = newObject
        return data  
    }
```
Passing this function into `manipulate`, along with `alwaysUpdateFirst` would automatically make all add functions check to see if the object exists in the JPOX database first, and if it does, then it will use the function above to overwrite the object in the database with `newObject`. 
*default: null*  
<br>


* `JPOX.options.autoapply`, a boolean. If set to *true*, then JPOX will always save to the JSON file after the database has been written to. Setting this to false and programatically applying changes can be beneficial when using a tool like `nodemon`, where the JSON file can be written once after all changes have been applied, and preventing `nodemon` from restarting prematurely.  
*default: false*
<br>

* `JPOX.options.jsonFormatter`, a string value, either `"prettify"`, or `"compress"`. `"prettify"` will format the JSON file, improving readability. If set to `"compress"`, the JSON file will not be formatted.  
*default: "prettify"*  
<br>

The following options can be passed manually into the JPOX database methods, taking precedent over the option specified upon creation of the JPOX instance:
* `autoapply`
* `alwaysUpdateFirst`
* `manipulate`  


***

# `JPOX.Methods()`


#### `JPOX.update(callback, manipulate, options, fallback)`
Updates the database with new informations, specified in `callback`, and `manipulate`. This is the main JPOX method; depending on your use case, you may never need to use `JPOX.add()`. This method operates in the following order:
<br>  

`callback` - Called first. Function used to locate the data in the JPOX database. This function must return a boolean value when evaluated, or must be set to null. Here are two examples of valid functions (with `manipulate` calls):
<br>

```javascript  
    JPOX.update(x => x.val === 45, data => {
        data.val += 1
        return data
    }, ...)
```

```javascript  
    var myObj = {
        "text": "this line was over the length of 10"
    }

    JPOX.update(function(x) {
        if(x.text.split(" ").length > 10) {
            return true
        }
    }, function(data) {
        data.text = myObj.text
        return data
    }, ...)
```

<br>

`manipulate` - Called second. Expects data to be returned from `callback`. This takes the data returned from callback and allows it to be manipulated using a function. An object must be returned here, as this is the object that will be added back into the database. Below are two examples of functions, with the `manipulate` calls emphasized:  
<br>

```javascript
                              // ↓ manipulate function call 
    JPOX.update(x => x.val > 12, data => {
        data.val = 12
        return data
    }, ...)
```

```javascript
    var myVal = 8

    JPOX.update(function(x) {
        if(x.val > 8) {
            return true
        }
    // ↓ manipulate function call
    }, function(data) {
        data.text = "this.val is over 8"
        return data
    }, ...)
```

<br>

`options` - *optional*, `JPOX.options` specified previously.

<br>

`fallback` - *optional*, called last, function that will be executed in the case that the item cannot be found in the database. Below is an example use case of the `fallback` function:

<br>

```javascript
    var loginUser = {
        name: "Sir John Paul Ignacio Ricardo Montega"
    }

    JPOX.update(x => x.name === loginUser.name, data => {
        data.status = "Active"
        return data
    // | null is here to specify no options are specified
    // ↓     ↓ fallback function call
    }, null, () => {
        JPOX.add({
            name: loginUser.name,
            status: "Active"
        })
    })
```

When assigned to a variable, returns an object containing the new data, and the index of the updated object.

<br>

#### `JPOX.get(callback)`

Returns an object stating the value found in the database, as well as the index. Callback must be a function that returns true.

<br>



#### `JPOX.add(callback, options)`

Adds a new object to the JPOX database. `callback` is always an object. If `alwaysUpdateFirst` is set to true in either the JPOX instance's options, or the options passed to the method, then the `manipulate` options ***MUST*** be specified as well. The `prop` option can bes specified to locate the object by a specific property, but if it is not defined, it will go based off of the entire object passed into the `JPOX.add()` method. Below are two examples of the `JPOX.add()` method, one is using a manipulate function, the other is not:

```javascript
    // example without using options
    var myObj = {
        text: "Hello World!",
        val: 12
    }
    JPOX.add(myObj)

    // example with options specified
    JPOX.add(myObj, {
        alwaysUpdateFirst: true, 
        manipulate: function(data) {
            data = myObj
            return data
        },
        prop: myObj.val
    })


    /* 
    returns the object that was passed into it if the call was successful
    */

```

#### `JPOX.delete(callback, options)`

Deletes an object from the database. `callback` is always a function that must return true or false. Valid `options` are: 
* `autoapply`.

```javascript
    JPOX.delete(x => x.title = "DELETEME", {
        autoapply: true
    })

    var deletion = JPOX.delete(x => x.title = "DELETEME", {
        autoapply: true
    })

    console.log(deletion)
    /* 
    returns object 
    {
        result: data,
        dbIndex: `Index checked again. Object at index ${index}.`
    }

    if index is not -1, then the object was not deleted.
    */
```

<br>

#### `JPOX.apply()`

Saves the internally stored database to the JSON file located at `JPOX.options.path`. If `autoapply` was set to false when the JPOX instance was created, then to save anything to the JSON file, this method needs to be called.

<br>

#### `JPOX.reload()`

Refreshes the JPOX cache, granting the ability to dodge any server downtime from a reload. This becomes useful in situations such as when using `forever` or `node` to run a server, instead of calling `process.exit(1)`, calling `JPOX.reload()` will refresh JPOX's cache, allowing JPOX to keep the most up to date information. Would usually be called alongside `JPOX.apply()`, since both `forever` and `node` won't automatically refresh the cache after `JPOX.apply()` is called. This isn't a prominently used feature, just a nice-to-have.

<br>

#### `Array.prototype.methods()`

The JPOX database is stored internall as an array. This means that all Array methods can be called onto `JPOX.database`. For example, here's a codeblock that sorts the database based on the `val` property, then applies the changes to the JSON file:

```javascript
    console.log(JPOX.database)
    /* Array [
        { id: 1, val: 3 },
        { id: 2, val: 1 },
        { id: 3, val: 9 }
    ] */

    JPOX.database.sort((a, b) => a.val - b.val)
    JPOX.apply()

    console.log(JPOX.database)
    /*
    Array [
        { id: 2, val: 1 },
        { id: 1, val: 3 },
        { id: 3, val: 9 }
    ]
    */

```

# Advanced JPOX Use Cases

*** 

JPOX can be used to easily manage multiple, intertwined databases. Since all  arguments to methods (excluding the `JPOX.add()` method) take in a function, we can update two different databases concomitantly. Below is an example of a (simple) book sale system:

```javascript
    const options = {
        autoapply: false
    }
    const db1 = new JPOX("./db/db1.json", options)
    const db2 = new JPOX("./db/db2.json", options)
    console.log(db1.database)
    /* 
        returns Array [
            { book_title: "The Catcher in the Rye", stock: 10 },
            { book_title: "To Kill a Mockingbird", stock: 12}
        ]
    */

   console.log(db2.database)
   /*
        returns Array [
            { type_of_sale: "purchase", title: "To Kill a Mockingbird" }
        ]
   */

    var sale = {
        title: "The Catcher in the Rye",
        type_of_sale: "return",
        qty: 1
    }
             // ↓ these don't need arguments, as we aren't trying to 
             //   update anything in db2. instead we'll be utilizing the "null"
             //   passed here to call the fallback function at the end
    db2.update(null, () => {
        // procedure if type_of_sale is a purchase. here we will check 
        // if it is in stock, and if not, we will add it into the database
        if(sale.type_of_sale === "purchase") {
            db1.update(y => y.title === sale.title, invData => {
                // removes stock from inventory after purchase of a book that was found in the database
                invData.stock -= sale.qty
                return invData
            }, null, () => {
                // ↓ fallback in case the book does not exist in stock, we will add it now, and remove the purchase quantity from stock
                db1.add({
                    book_title: sale.title,
                    stock: 0 - sale.qty
                })
            })
        // checks if type_of_sale is a return. if it is, we will check if it is
        // in stock, and if not, we will add it into the database 
        } else if (sale.type_of_sale === "return") {
            db1.update(y => y.title === sale.title, invData => {
                // adds stock back into inventory from the return being performed on a book that was found in the database
                invData.stock += sale.qty
                return invData
            }, null, () => {
                db1.add({
                    // ↓ fallback in case the book does not exist in stock, we will add it now, and add the return quantity into stock
                    book_title: sale.title,
                    stock: 0 + sale.qty
                })
            })
        }
           // | here we are making use of the "null" passed into the previous functions
           // ↓ to add a sale into db2
    }, null, () => {
        db2.add({
            type_of_sale: sale.type_of_sale,
            title: sale.title
        })
    })
```

<br>

This is an example use case of multiple databases being updated conditionally depending on a set of source data. This is a much more complex, in depth use case of JPOX, but it shows the complexity that this system can handle. At the same time, JPOX can also create and amend databases incredibly easily, as showcased below:

```javascript
const options = {
    autoapply: true
}

const db = new JPOX("/db/test.json", options)

// simple update with add fallback
db.update(y => y.text === "this is text", data => {
    data.text = "this is new text"
    return data
}, null, db.add({
    text: "this is a brand new text"
}))

// simple update
db.update(y => y.text === "this is text", data => {
    data.text = "some other text"
    return data
})
```

<br>

As stated before, JPOX is capable of using standard Array methods to manage data. Here are some example use cases of managing data:

```javascript

    // remove everything where the "val" property equals 12
    const db = new JPOX("db/test.json")
    db.database = db.database.filter(item => item.val === 12)
    db.apply()

    // (overly) simple queue system with JPOX
    db.database.pop()
    db.apply()
    db.database.push(newUser)
    db.apply()
```

